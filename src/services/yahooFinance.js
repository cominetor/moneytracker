/**
 * Yahoo Finance — quotazioni azionarie senza API key.
 * L'endpoint /v8/finance/chart restituisce il prezzo corrente e la valuta di
 * quotazione, quindi funziona anche per i titoli non americani (es. ENI.MI).
 */

const BASE_URL = 'https://query1.finance.yahoo.com/v8/finance/chart/'

/**
 * @returns {Promise<{price:number, currency:string}>} prezzo nella valuta di quotazione
 */
export async function fetchStockQuote(ticker) {
  const symbol = String(ticker || '').trim().toUpperCase()
  if (!symbol) throw new Error('Ticker mancante')

  let res
  try {
    res = await fetch(`${BASE_URL}${encodeURIComponent(symbol)}?interval=1d&range=1d`, {
      headers: { accept: 'application/json' },
    })
  } catch {
    throw new Error('Yahoo Finance non raggiungibile')
  }
  if (!res.ok) {
    throw new Error(
      res.status === 404
        ? `Simbolo ${symbol} non trovato su Yahoo Finance`
        : `Yahoo Finance ha risposto ${res.status}`,
    )
  }

  const data = await res.json()
  const meta = data?.chart?.result?.[0]?.meta
  const price = Number(meta?.regularMarketPrice)
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error(`Quotazione non disponibile per ${symbol}`)
  }

  // le borse di Londra quotano in penny (GBp): riportiamo tutto alla valuta piena
  const rawCurrency = String(meta?.currency || 'USD')
  if (rawCurrency === 'GBp') return { price: price / 100, currency: 'GBP' }
  return { price, currency: rawCurrency.toUpperCase() }
}
