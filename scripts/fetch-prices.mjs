/**
 * Genera public/prices.json con le quotazioni dei titoli elencati in tickers.json.
 *
 * Gira su GitHub Actions, non nel browser: niente CORS, niente API key.
 * L'app poi legge il file dal proprio dominio (stessa origine), quindi il
 * recupero dei prezzi azionari non dipende più da cosa il browser riesce a
 * contattare.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUTPUT = resolve(ROOT, 'public/prices.json')

async function getJSON(url) {
  const res = await fetch(url, { headers: { accept: 'application/json' } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

/** Stooq: CSV senza chiave, molto affidabile per i listini USA. */
async function fromStooq(ticker) {
  const symbol = `${ticker.toLowerCase()}.us`
  const res = await fetch(`https://stooq.com/q/l/?s=${encodeURIComponent(symbol)}&f=sd2t2ohlcv&h&e=csv`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const [, row] = (await res.text()).trim().split('\n')
  const close = Number(row?.split(',')[6])
  if (!Number.isFinite(close) || close <= 0) throw new Error('nessuna quotazione')
  return { price: close, currency: 'USD', fonte: 'Stooq' }
}

/** Yahoo: copre anche le borse non americane e restituisce la valuta. */
async function fromYahoo(ticker) {
  const data = await getJSON(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`,
  )
  const meta = data?.chart?.result?.[0]?.meta
  const price = Number(meta?.regularMarketPrice)
  if (!Number.isFinite(price) || price <= 0) throw new Error('nessuna quotazione')
  const raw = String(meta?.currency || 'USD')
  return raw === 'GBp'
    ? { price: price / 100, currency: 'GBP', fonte: 'Yahoo Finance' }
    : { price, currency: raw.toUpperCase(), fonte: 'Yahoo Finance' }
}

/**
 * Ultima spiaggia, attiva solo se il repository definisce il secret
 * ALPHAVANTAGE_API_KEY. La chiave non compare mai nel codice né nel sito
 * generato: resta nei secret di GitHub e vive solo dentro il runner.
 */
async function fromAlphaVantage(ticker) {
  const key = process.env.ALPHAVANTAGE_API_KEY
  if (!key) throw new Error('secret ALPHAVANTAGE_API_KEY non configurato')
  const data = await getJSON(
    'https://www.alphavantage.co/query?function=GLOBAL_QUOTE' +
      `&symbol=${encodeURIComponent(ticker)}&apikey=${encodeURIComponent(key)}`,
  )
  const price = Number(data?.['Global Quote']?.['05. price'])
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error(data?.Note || data?.Information || 'nessuna quotazione')
  }
  return { price, currency: 'USD', fonte: 'Alpha Vantage' }
}

const rateCache = new Map()

async function ratesFrom(base) {
  if (rateCache.has(base)) return rateCache.get(base)
  const targets = ['EUR', 'USD'].filter((c) => c !== base)
  const data = await getJSON(`https://api.frankfurter.app/latest?from=${base}&to=${targets.join(',')}`)
  const rates = { [base]: 1 }
  for (const target of targets) {
    const rate = data?.rates?.[target]
    if (!Number.isFinite(rate)) throw new Error(`cambio ${base}/${target} non disponibile`)
    rates[target] = rate
  }
  rateCache.set(base, rates)
  return rates
}

async function quote(ticker) {
  // Yahoo conosce la valuta di quotazione ed è affidabile dal runner;
  // Stooq (solo listini USA) e Alpha Vantage restano come rincalzi
  const sources = [
    { nome: 'Yahoo', run: fromYahoo },
    ...(ticker.includes('.') ? [] : [{ nome: 'Stooq', run: fromStooq }]),
    { nome: 'Alpha Vantage', run: fromAlphaVantage },
  ]
  const failures = []
  for (const source of sources) {
    try {
      const { price, currency, fonte } = await source.run(ticker)
      const rates = await ratesFrom(currency)
      return {
        prezzoUSD: price * rates.USD,
        prezzoEUR: price * rates.EUR,
        timestamp: Date.now(),
        fonte,
      }
    } catch (err) {
      failures.push(`${source.nome}: ${err.message}`)
    }
  }
  throw new Error(failures.join(' · '))
}

const config = JSON.parse(await readFile(resolve(ROOT, 'tickers.json'), 'utf8'))
const tickers = [...new Set((config.stocks || []).map((t) => String(t).trim().toUpperCase()))]

const prezzi = {}
const errori = {}
for (const ticker of tickers) {
  try {
    prezzi[ticker] = await quote(ticker)
    console.log(`ok   ${ticker.padEnd(10)} ${prezzi[ticker].prezzoEUR.toFixed(2)} EUR (${prezzi[ticker].fonte})`)
  } catch (err) {
    errori[ticker] = err.message
    console.log(`FAIL ${ticker.padEnd(10)} ${err.message}`)
  }
}

await mkdir(dirname(OUTPUT), { recursive: true })
await writeFile(OUTPUT, JSON.stringify({ generatoIl: new Date().toISOString(), prezzi, errori }, null, 2))
console.log(`\n${Object.keys(prezzi).length}/${tickers.length} quotazioni scritte in public/prices.json`)

// il feed non deve bloccare il deploy: se una fonte è giù, l'app usa gli altri
// canali e l'ultimo prezzo in cache
