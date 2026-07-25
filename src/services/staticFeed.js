/**
 * Feed statico delle quotazioni azionarie, generato da GitHub Actions e servito
 * dallo stesso dominio dell'app (public/prices.json).
 *
 * È la fonte primaria per le azioni: essendo same-origin non può essere bloccata
 * dalle politiche CORS dei provider, che dal browser rendono inaffidabile la
 * chiamata diretta.
 */

const FEED_TTL_MS = 5 * 60 * 1000

let cached = null
let inflight = null

function feedUrl() {
  return new URL('prices.json', document.baseURI).href
}

/** @returns {Promise<{generatoIl:string, prezzi:Object, errori:Object}>} */
export function loadFeed({ force = false } = {}) {
  if (!force && cached && Date.now() - cached.timestamp < FEED_TTL_MS) {
    return Promise.resolve(cached.data)
  }
  if (inflight) return inflight

  inflight = (async () => {
    try {
      const res = await fetch(feedUrl(), { cache: 'no-store' }).catch(() => {
        throw new Error('feed non raggiungibile')
      })
      if (!res.ok) throw new Error(`feed non disponibile (HTTP ${res.status})`)
      const data = await res.json()
      cached = { data, timestamp: Date.now() }
      return data
    } finally {
      inflight = null
    }
  })()
  return inflight
}

/**
 * Quotazione di un ticker dal feed.
 * @returns {Promise<{prezzoUSD:number, prezzoEUR:number, timestamp:number}>}
 */
export async function fetchFeedQuote(ticker) {
  const symbol = String(ticker || '').trim().toUpperCase()
  const feed = await loadFeed()
  const entry = feed?.prezzi?.[symbol]
  if (!entry || !Number.isFinite(entry.prezzoEUR)) {
    const motivo = feed?.errori?.[symbol]
    throw new Error(motivo || `${symbol} non è nell'elenco del feed (tickers.json)`)
  }
  return {
    prezzoUSD: entry.prezzoUSD,
    prezzoEUR: entry.prezzoEUR,
    timestamp: Number(entry.timestamp) || Date.now(),
  }
}

/** Elenco dei ticker coperti dal feed, per la diagnostica. */
export async function feedCoverage() {
  const feed = await loadFeed({ force: true })
  return {
    generatoIl: feed?.generatoIl || null,
    tickers: Object.keys(feed?.prezzi || {}),
    errori: feed?.errori || {},
  }
}
