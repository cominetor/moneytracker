/**
 * Storico del valore totale: uno snapshot al giorno.
 */
import { loadSnapshots, saveSnapshots } from './storage.js'

export function todayISO(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Aggiunge lo snapshot odierno se non esiste già.
 * @returns {{snapshots: Array, created: boolean}}
 */
export function ensureTodaySnapshot(valoreTotaleEUR, valoreTotaleUSD) {
  const snapshots = loadSnapshots()
  const data = todayISO()
  if (snapshots.some((s) => s.data === data)) {
    return { snapshots, created: false }
  }
  const next = [...snapshots, { data, valoreTotaleEUR, valoreTotaleUSD }].sort((a, b) =>
    a.data.localeCompare(b.data),
  )
  saveSnapshots(next)
  return { snapshots: next, created: true }
}
