import { loadPriceCache, savePriceCache } from './storage.js'

/** Un prezzo è considerato "fresco" se più recente di 15 minuti. */
export const PRICE_TTL_MS = 15 * 60 * 1000

export function cacheKey(ticker) {
  return String(ticker || '').trim().toUpperCase()
}

export function getCache() {
  return loadPriceCache()
}

export function getCachedPrice(ticker, cache = loadPriceCache()) {
  return cache[cacheKey(ticker)] || null
}

export function isFresh(entry, ttlMs = PRICE_TTL_MS) {
  if (!entry || typeof entry.timestamp !== 'number') return false
  const age = Date.now() - entry.timestamp
  return age >= 0 && age < ttlMs
}

/**
 * Scrive uno o più prezzi in cache.
 * @param {Object<string, {prezzoUSD:number, prezzoEUR:number}>} prices
 * @returns {Object} la cache aggiornata
 */
export function putPrices(prices) {
  const cache = loadPriceCache()
  const timestamp = Date.now()
  for (const [ticker, price] of Object.entries(prices)) {
    if (!price || !Number.isFinite(price.prezzoUSD) || !Number.isFinite(price.prezzoEUR)) continue
    cache[cacheKey(ticker)] = {
      prezzoUSD: price.prezzoUSD,
      prezzoEUR: price.prezzoEUR,
      timestamp,
    }
  }
  savePriceCache(cache)
  return cache
}

/** Timestamp del prezzo più vecchio fra quelli richiesti (o null). */
export function oldestTimestamp(tickers, cache = loadPriceCache()) {
  const stamps = tickers
    .map((t) => cache[cacheKey(t)]?.timestamp)
    .filter((ts) => typeof ts === 'number')
  return stamps.length ? Math.min(...stamps) : null
}
