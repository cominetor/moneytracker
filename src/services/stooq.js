/**
 * Stooq — quotazioni azionarie senza API key, in CSV.
 * Usato come seconda fonte diretta se Yahoo non risponde.
 * Copre i titoli USA (suffisso .us), gli unici per cui la valuta è deducibile
 * senza ambiguità (USD).
 */

const BASE_URL = 'https://stooq.com/q/l/'

/** Stooq è utilizzabile solo per i ticker senza suffisso di borsa (listini USA). */
export function isStooqSupported(ticker) {
  return !String(ticker || '').includes('.')
}

/**
 * @returns {Promise<{price:number, currency:string}>}
 */
export async function fetchStooqQuote(ticker) {
  const symbol = `${String(ticker || '').trim().toLowerCase()}.us`

  let res
  try {
    res = await fetch(`${BASE_URL}?s=${encodeURIComponent(symbol)}&f=sd2t2ohlcv&h&e=csv`)
  } catch {
    throw new Error('Stooq non raggiungibile')
  }
  if (!res.ok) throw new Error(`Stooq ha risposto ${res.status}`)

  // Symbol,Date,Time,Open,High,Low,Close,Volume
  const [, row] = (await res.text()).trim().split('\n')
  const close = Number(row?.split(',')[6])
  if (!Number.isFinite(close) || close <= 0) {
    throw new Error(`Stooq non ha quotazioni per ${symbol}`)
  }
  return { price: close, currency: 'USD' }
}
