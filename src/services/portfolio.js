/**
 * Calcolo delle posizioni e dei totali di portafoglio a partire da
 * holdings + priceCache. Nessuna dipendenza dalla UI.
 */
import { cacheKey, isFresh, PRICE_TTL_MS } from './priceCache.js'

/**
 * @returns {Array} posizioni arricchite con prezzo, valore e stato della quotazione
 */
export function buildPositions(holdings, priceCache, errors = {}) {
  return holdings.map((h) => {
    const ticker = cacheKey(h.ticker)
    const price = priceCache[ticker] || null
    const quantita = Number(h.quantita) || 0
    return {
      ...h,
      ticker,
      quantita,
      prezzoUSD: price?.prezzoUSD ?? null,
      prezzoEUR: price?.prezzoEUR ?? null,
      aggiornatoIl: price?.timestamp ?? null,
      valoreUSD: price ? price.prezzoUSD * quantita : 0,
      valoreEUR: price ? price.prezzoEUR * quantita : 0,
      // "non aggiornato": prezzo assente, più vecchio del TTL, o ultimo fetch fallito
      stale: !price || !isFresh(price, PRICE_TTL_MS) || Boolean(errors[ticker]),
      errore: errors[ticker] || null,
    }
  })
}

export function totalsOf(positions) {
  return positions.reduce(
    (acc, p) => ({
      valoreTotaleEUR: acc.valoreTotaleEUR + p.valoreEUR,
      valoreTotaleUSD: acc.valoreTotaleUSD + p.valoreUSD,
    }),
    { valoreTotaleEUR: 0, valoreTotaleUSD: 0 },
  )
}

/** Timestamp dell'aggiornamento prezzi più vecchio fra le posizioni valorizzate. */
export function lastPriceUpdate(positions) {
  const stamps = positions.map((p) => p.aggiornatoIl).filter((t) => typeof t === 'number')
  return stamps.length ? Math.min(...stamps) : null
}

/** Dati per il pie chart: quota percentuale di ogni asset sul totale. */
export function allocationOf(positions, totalEUR) {
  if (!totalEUR) return []
  return positions
    .filter((p) => p.valoreEUR > 0)
    .map((p) => ({
      id: p.id,
      ticker: p.ticker,
      nome: p.nome || p.ticker,
      tipo: p.tipo,
      valoreEUR: p.valoreEUR,
      percentuale: (p.valoreEUR / totalEUR) * 100,
    }))
    .sort((a, b) => b.valoreEUR - a.valoreEUR)
}
