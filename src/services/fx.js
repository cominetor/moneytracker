/**
 * Tassi di cambio tramite Frankfurter (gratuito, senza API key).
 * I tassi vengono messi in cache per valuta: se la rete non è disponibile si usa
 * l'ultimo tasso noto, così i valori restano visibili anche offline.
 */
import { loadFxCache, saveFxCache } from './storage.js'

const FX_URL = 'https://api.frankfurter.app/latest'
const FX_TTL_MS = 12 * 60 * 60 * 1000 // il cambio giornaliero non richiede refresh frequenti

function readCache() {
  const cache = loadFxCache()
  return cache && typeof cache === 'object' && cache.byBase ? cache.byBase : {}
}

function writeCache(base, rates) {
  const byBase = { ...readCache(), [base]: { rates, timestamp: Date.now() } }
  saveFxCache({ byBase })
  return byBase[base]
}

/**
 * Tassi da `base` verso EUR e USD.
 * @returns {Promise<{rates:{EUR:number, USD:number}, timestamp:number, stale:boolean}>}
 */
export async function getRatesFrom(base) {
  const from = String(base || 'USD').toUpperCase()
  const cached = readCache()[from]
  const isFresh = cached?.rates && Date.now() - cached.timestamp < FX_TTL_MS
  if (isFresh) return { ...cached, stale: false }

  const targets = ['EUR', 'USD'].filter((c) => c !== from)
  try {
    const res = await fetch(`${FX_URL}?from=${from}&to=${targets.join(',')}`, {
      headers: { accept: 'application/json' },
    }).catch(() => {
      throw new Error('Servizio di cambio non raggiungibile')
    })
    if (!res.ok) throw new Error(`Frankfurter ha risposto ${res.status}`)
    const data = await res.json()

    const rates = { [from]: 1 }
    for (const target of targets) {
      const rate = data?.rates?.[target]
      if (!Number.isFinite(rate)) throw new Error(`Cambio ${from}/${target} non disponibile`)
      rates[target] = rate
    }
    const entry = writeCache(from, rates)
    return { ...entry, stale: false }
  } catch (err) {
    if (cached?.rates) return { ...cached, stale: true }
    throw err
  }
}

/** Scorciatoia usata dal percorso Alpha Vantage, che quota sempre in USD. */
export async function getUsdToEurRate() {
  const { rates, timestamp, stale } = await getRatesFrom('USD')
  return { rate: rates.EUR, timestamp, stale }
}
