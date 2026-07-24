/**
 * Cambio USD → EUR tramite Frankfurter (gratuito, senza API key).
 * Il tasso viene messo in cache: se la rete non è disponibile si usa
 * l'ultimo tasso noto, così i valori restano visibili anche offline.
 */
import { loadFxCache, saveFxCache } from './storage.js'

const FX_URL = 'https://api.frankfurter.app/latest?from=USD&to=EUR'
const FX_TTL_MS = 12 * 60 * 60 * 1000 // il cambio giornaliero non richiede refresh frequenti

/**
 * @returns {Promise<{rate:number, timestamp:number, stale:boolean}>}
 */
export async function getUsdToEurRate() {
  const cached = loadFxCache()
  const isFresh =
    cached && Number.isFinite(cached.rate) && Date.now() - cached.timestamp < FX_TTL_MS
  if (isFresh) return { rate: cached.rate, timestamp: cached.timestamp, stale: false }

  try {
    const res = await fetch(FX_URL, { headers: { accept: 'application/json' } }).catch(() => {
      throw new Error('Servizio di cambio non raggiungibile')
    })
    if (!res.ok) throw new Error(`Frankfurter ha risposto ${res.status}`)
    const data = await res.json()
    const rate = data?.rates?.EUR
    if (!Number.isFinite(rate)) throw new Error('Tasso di cambio non disponibile')
    const entry = { rate, timestamp: Date.now() }
    saveFxCache(entry)
    return { ...entry, stale: false }
  } catch (err) {
    if (cached && Number.isFinite(cached.rate)) {
      return { rate: cached.rate, timestamp: cached.timestamp, stale: true }
    }
    throw err
  }
}
