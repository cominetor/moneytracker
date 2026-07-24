/**
 * Alpha Vantage — prezzi azionari (endpoint GLOBAL_QUOTE, richiede API key gratuita).
 * Ogni chiamata passa dalla coda throttled in rateLimiter.js.
 */
import {
  RateLimitError,
  markDailyLimitReached,
  scheduleAlphaVantageCall,
} from './rateLimiter.js'

const BASE_URL = 'https://www.alphavantage.co/query'

/**
 * Prezzo in USD di un singolo simbolo.
 * @returns {Promise<number>} prezzo in USD
 */
export function fetchStockPriceUSD(symbol, apiKey) {
  const ticker = String(symbol || '').trim().toUpperCase()
  if (!apiKey) throw new Error('API key Alpha Vantage mancante')

  return scheduleAlphaVantageCall(async () => {
    const url =
      `${BASE_URL}?function=GLOBAL_QUOTE` +
      `&symbol=${encodeURIComponent(ticker)}` +
      `&apikey=${encodeURIComponent(apiKey)}`
    let res
    try {
      res = await fetch(url, { headers: { accept: 'application/json' } })
    } catch {
      throw new Error('Alpha Vantage non raggiungibile (connessione assente?)')
    }
    if (!res.ok) throw new Error(`Alpha Vantage ha risposto ${res.status}`)
    const data = await res.json()

    // Alpha Vantage segnala il rate limit con "Note" / "Information" e HTTP 200
    const notice = data?.Note || data?.Information || data?.['Error Message']
    if (notice && !data?.['Global Quote']) {
      if (/limit|frequency|premium/i.test(notice)) {
        markDailyLimitReached()
        throw new RateLimitError('Limite di richieste Alpha Vantage raggiunto.')
      }
      throw new Error(notice)
    }

    const price = Number(data?.['Global Quote']?.['05. price'])
    if (!Number.isFinite(price) || price <= 0) {
      throw new Error(`Nessuna quotazione disponibile per ${ticker}`)
    }
    return price
  })
}

export { RateLimitError }
