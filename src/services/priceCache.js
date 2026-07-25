import { loadPriceCache, savePriceCache } from './storage.js'

/** Un prezzo è considerato "fresco" (e non viene richiesto di nuovo) entro 15 minuti. */
export const PRICE_TTL_MS = 15 * 60 * 1000

/**
 * Soglia oltre la quale il prezzo viene segnalato come "non aggiornato".
 * Più larga del TTL: il feed statico si rigenera ogni 30 minuti e una quotazione
 * di mezz'ora fa non è un dato da marcare come vecchio.
 */
export const STALE_AFTER_MS = 2 * 60 * 60 * 1000

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
  // un'età negativa significa orologio locale indietro rispetto alla fonte:
  // è comunque un prezzo appena rilevato, non uno scaduto
  return Date.now() - entry.timestamp < ttlMs
}

/**
 * Scrive uno o più prezzi in cache.
 * @param {Object<string, {prezzoUSD:number, prezzoEUR:number}>} prices
 * @returns {Object} la cache aggiornata
 */
export function putPrices(prices) {
  const cache = loadPriceCache()
  const now = Date.now()
  for (const [ticker, price] of Object.entries(prices)) {
    if (!price || !Number.isFinite(price.prezzoUSD) || !Number.isFinite(price.prezzoEUR)) continue
    cache[cacheKey(ticker)] = {
      prezzoUSD: price.prezzoUSD,
      prezzoEUR: price.prezzoEUR,
      // il feed statico porta con sé il momento reale della rilevazione
      timestamp: Number.isFinite(price.timestamp) ? price.timestamp : now,
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
