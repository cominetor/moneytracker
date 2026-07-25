/**
 * Verifica delle fonti prezzi: interroga ogni servizio con un valore noto e
 * riporta l'esito. Serve a capire dal browser dell'utente quale fonte è
 * raggiungibile, senza dover leggere la console.
 */
import { fetchCryptoPrices } from './coingecko.js'
import { feedCoverage } from './staticFeed.js'
import { fetchStockQuote } from './yahooFinance.js'
import { fetchStooqQuote } from './stooq.js'
import { fetchStockPriceUSD } from './alphaVantage.js'
import { getRatesFrom } from './fx.js'

async function check(nome, run) {
  try {
    return { nome, ok: true, dettaglio: await run() }
  } catch (err) {
    return { nome, ok: false, dettaglio: err.message || 'errore sconosciuto' }
  }
}

/**
 * @returns {Promise<Array<{nome:string, ok:boolean, dettaglio:string}>>}
 */
export async function runDiagnostics(settings) {
  const checks = [
    check('Feed del sito (azioni)', async () => {
      const { generatoIl, tickers, errori } = await feedCoverage()
      if (tickers.length === 0) throw new Error('nessuna quotazione nel feed')
      const quando = generatoIl ? new Date(generatoIl).toLocaleString('it-IT') : 'data ignota'
      const falliti = Object.keys(errori)
      return (
        `${tickers.join(', ')} — generato il ${quando}` +
        (falliti.length ? ` (senza quotazione: ${falliti.join(', ')})` : '')
      )
    }),
    check('CoinGecko (crypto)', async () => {
      const { prices, errors } = await fetchCryptoPrices(['BTC'])
      if (!prices.BTC) throw new Error(errors.BTC || 'nessun prezzo restituito')
      return `BTC ${prices.BTC.prezzoEUR.toFixed(2)} EUR`
    }),
    check('Yahoo Finance (azioni)', async () => {
      const { price, currency } = await fetchStockQuote('AAPL')
      return `AAPL ${price.toFixed(2)} ${currency}`
    }),
    check('Stooq (azioni USA)', async () => {
      const { price } = await fetchStooqQuote('AAPL')
      return `AAPL ${price.toFixed(2)} USD`
    }),
    check('Frankfurter (cambi)', async () => {
      const { rates } = await getRatesFrom('USD')
      return `USD/EUR ${rates.EUR.toFixed(4)}`
    }),
  ]

  if (settings.alphaVantageApiKey) {
    checks.push(
      check('Alpha Vantage (ripiego)', async () => {
        const price = await fetchStockPriceUSD('AAPL', settings.alphaVantageApiKey)
        return `AAPL ${price.toFixed(2)} USD`
      }),
    )
  }

  return Promise.all(checks)
}
