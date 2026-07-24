/**
 * Unico punto di accesso a localStorage.
 * Nessun componente UI legge/scrive direttamente lo storage.
 */

export const STORAGE_KEYS = {
  holdings: 'holdings',
  snapshots: 'snapshots',
  settings: 'settings',
  priceCache: 'priceCache',
  // chiavi ausiliarie (cache tecniche, non fanno parte del backup)
  fxCache: 'fxCache',
  alphaVantageUsage: 'alphaVantageUsage',
}

export const DEFAULT_SETTINGS = {
  alphaVantageApiKey: '',
  refreshIntervalMinutes: 15,
}

function readJSON(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key)
    if (raw === null) return fallback
    const parsed = JSON.parse(raw)
    return parsed === null || parsed === undefined ? fallback : parsed
  } catch {
    return fallback
  }
}

function writeJSON(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage pieno o non disponibile: l'app continua a funzionare in memoria
  }
}

/* ---------------------------------- holdings --------------------------------- */

export function loadHoldings() {
  const list = readJSON(STORAGE_KEYS.holdings, [])
  return Array.isArray(list) ? list.filter(isValidHolding) : []
}

export function saveHoldings(holdings) {
  writeJSON(STORAGE_KEYS.holdings, holdings)
}

function isValidHolding(h) {
  return (
    h &&
    typeof h === 'object' &&
    typeof h.ticker === 'string' &&
    (h.tipo === 'crypto' || h.tipo === 'stock') &&
    Number.isFinite(Number(h.quantita))
  )
}

/* --------------------------------- snapshots --------------------------------- */

export function loadSnapshots() {
  const list = readJSON(STORAGE_KEYS.snapshots, [])
  if (!Array.isArray(list)) return []
  return list
    .filter((s) => s && typeof s.data === 'string')
    .sort((a, b) => a.data.localeCompare(b.data))
}

export function saveSnapshots(snapshots) {
  writeJSON(STORAGE_KEYS.snapshots, snapshots)
}

/* ---------------------------------- settings --------------------------------- */

export function loadSettings() {
  const stored = readJSON(STORAGE_KEYS.settings, {})
  return { ...DEFAULT_SETTINGS, ...(stored && typeof stored === 'object' ? stored : {}) }
}

export function saveSettings(settings) {
  writeJSON(STORAGE_KEYS.settings, { ...DEFAULT_SETTINGS, ...settings })
}

/* -------------------------------- price cache -------------------------------- */

export function loadPriceCache() {
  const cache = readJSON(STORAGE_KEYS.priceCache, {})
  return cache && typeof cache === 'object' && !Array.isArray(cache) ? cache : {}
}

export function savePriceCache(cache) {
  writeJSON(STORAGE_KEYS.priceCache, cache)
}

/* ---------------------------- cache ausiliarie ------------------------------- */

export function loadFxCache() {
  return readJSON(STORAGE_KEYS.fxCache, null)
}

export function saveFxCache(entry) {
  writeJSON(STORAGE_KEYS.fxCache, entry)
}

export function loadAlphaVantageUsage() {
  return readJSON(STORAGE_KEYS.alphaVantageUsage, null)
}

export function saveAlphaVantageUsage(usage) {
  writeJSON(STORAGE_KEYS.alphaVantageUsage, usage)
}
