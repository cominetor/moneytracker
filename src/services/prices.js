/**
 * Orchestratore dei prezzi: decide cosa prendere dalla cache e cosa chiedere alle API,
 * scrive i risultati in priceCache e restituisce gli errori per singolo ticker.
 */
import { fetchCryptoPrices } from './coingecko.js'
import { fetchStockPriceUSD, RateLimitError } from './alphaVantage.js'
import { getUsdToEurRate } from './fx.js'
import { getCache, getCachedPrice, isFresh, putPrices, PRICE_TTL_MS } from './priceCache.js'

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
    if (!settings.alphaVantageApiKey) {
      for (const ticker of stockTickers) {
        errors[ticker] = 'Inserisci la API key Alpha Vantage nelle impostazioni'
      }
    } else {
      let usdToEur = null
      try {
        usdToEur = (await getUsdToEurRate()).rate
      } catch {
        for (const ticker of stockTickers) {
          errors[ticker] = 'Tasso di cambio USD/EUR non disponibile'
        }
      }

      if (usdToEur) {
        // le chiamate sono comunque serializzate dalla coda throttled
        await Promise.all(
          stockTickers.map(async (ticker) => {
            try {
              const prezzoUSD = await fetchStockPriceUSD(ticker, settings.alphaVantageApiKey)
              prices[ticker] = { prezzoUSD, prezzoEUR: prezzoUSD * usdToEur }
            } catch (err) {
              errors[ticker] =
                err instanceof RateLimitError
                  ? 'Limite richieste Alpha Vantage raggiunto'
                  : err.message || 'Errore durante il recupero del prezzo'
            }
          }),
        )
      }
    }
  }

  const updatedCache = Object.keys(prices).length > 0 ? putPrices(prices) : cache
  return { cache: updatedCache, errors, fetched: Object.keys(prices).length }
}
