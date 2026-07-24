/**
 * Orchestratore dei prezzi: decide cosa prendere dalla cache e cosa chiedere alle API,
 * scrive i risultati in priceCache e restituisce gli errori per singolo ticker.
 *
 * Azioni: si usa Yahoo Finance, che non richiede API key. Alpha Vantage resta come
 * ripiego facoltativo, usato solo se Yahoo fallisce e la key è configurata.
 */
import { fetchCryptoPrices } from './coingecko.js'
import { fetchStockQuote } from './yahooFinance.js'
import { fetchStooqQuote, isStooqSupported } from './stooq.js'
import { fetchStockPriceUSD, RateLimitError } from './alphaVantage.js'
import { getRatesFrom } from './fx.js'
import { getCache, getCachedPrice, isFresh, putPrices, PRICE_TTL_MS } from './priceCache.js'

/**
 * Prova le fonti azionarie in ordine finché una risponde.
 * Se falliscono tutte, l'errore riporta il motivo di ognuna: senza questo
 * dettaglio in interfaccia resterebbe solo un badge "non aggiornato" muto.
 */
async function quoteStock(ticker, settings) {
  const sources = [
    { nome: 'Yahoo Finance', run: () => fetchStockQuote(ticker) },
  ]
  if (isStooqSupported(ticker)) {
    sources.push({ nome: 'Stooq', run: () => fetchStooqQuote(ticker) })
  }
  if (settings.alphaVantageApiKey) {
    sources.push({
      nome: 'Alpha Vantage',
      run: async () => ({
        price: await fetchStockPriceUSD(ticker, settings.alphaVantageApiKey),
        currency: 'USD',
      }),
    })
  }

  const failures = []
  for (const source of sources) {
    try {
      const { price, currency } = await source.run()
      const { rates } = await getRatesFrom(currency)
      return { prezzoUSD: price * rates.USD, prezzoEUR: price * rates.EUR }
    } catch (err) {
      const motivo =
        err instanceof RateLimitError ? 'limite richieste raggiunto' : err.message || 'errore'
      failures.push(`${source.nome}: ${motivo}`)
    }
  }
  throw new Error(failures.join(' · '))
}

/**
 * Aggiorna i prezzi dei ticker richiesti.
 *
 * @param {Array<{tipo:string, ticker:string}>} holdings
 * @param {{alphaVantageApiKey?:string}} settings
 * @param {{force?:boolean}} options  force = ignora la cache (refresh manuale)
 * @returns {Promise<{cache:Object, errors:Object<string,string>, fetched:number}>}
 */
export async function refreshPrices(holdings, settings, { force = false } = {}) {
  const cache = getCache()
  const errors = {}

  const unique = new Map()
  for (const h of holdings) {
    const ticker = String(h.ticker || '').trim().toUpperCase()
    if (ticker) unique.set(ticker, h.tipo)
  }

  const toFetch = [...unique.entries()].filter(
    ([ticker]) => force || !isFresh(getCachedPrice(ticker, cache), PRICE_TTL_MS),
  )
  if (toFetch.length === 0) {
    return { cache, errors, fetched: 0 }
  }

  const cryptoTickers = toFetch.filter(([, tipo]) => tipo === 'crypto').map(([t]) => t)
  const stockTickers = toFetch.filter(([, tipo]) => tipo === 'stock').map(([t]) => t)

  const prices = {}

  if (cryptoTickers.length > 0) {
    const result = await fetchCryptoPrices(cryptoTickers)
    Object.assign(prices, result.prices)
    Object.assign(errors, result.errors)
  }

  if (stockTickers.length > 0) {
    await Promise.all(
      stockTickers.map(async (ticker) => {
        try {
          prices[ticker] = await quoteStock(ticker, settings)
        } catch (err) {
          errors[ticker] = err.message || 'Errore durante il recupero del prezzo'
        }
      }),
    )
  }

  const updatedCache = Object.keys(prices).length > 0 ? putPrices(prices) : cache
  return { cache: updatedCache, errors, fetched: Object.keys(prices).length }
}
