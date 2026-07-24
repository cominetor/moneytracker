import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  loadHoldings,
  loadSettings,
  loadSnapshots,
  saveHoldings,
  saveSettings as persistSettings,
} from '../services/storage.js'
import { getCache } from '../services/priceCache.js'
import { refreshPrices } from '../services/prices.js'
import { getRateLimitStatus } from '../services/rateLimiter.js'
import { allocationOf, buildPositions, lastPriceUpdate, totalsOf } from '../services/portfolio.js'
import { ensureTodaySnapshot, todayISO } from '../services/snapshots.js'

function newId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `a-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/**
 * Stato applicativo del portafoglio: dati persistiti, prezzi, totali e azioni.
 * Tutta la logica di rete/cache vive nei servizi; qui si orchestra soltanto.
 */
export function usePortfolio() {
  const [holdings, setHoldings] = useState(() => loadHoldings())
  const [snapshots, setSnapshots] = useState(() => loadSnapshots())
  const [settings, setSettings] = useState(() => loadSettings())
  const [priceCache, setPriceCache] = useState(() => getCache())
  const [priceErrors, setPriceErrors] = useState({})
  const [refreshing, setRefreshing] = useState(false)
  const [refreshError, setRefreshError] = useState(null)
  const [rateLimit, setRateLimit] = useState(() => getRateLimitStatus())

  const snapshotDoneFor = useRef(null)
  const holdingsRef = useRef(holdings)
  const settingsRef = useRef(settings)
  holdingsRef.current = holdings
  settingsRef.current = settings

  const refresh = useCallback(async ({ force = false } = {}) => {
    const current = holdingsRef.current
    if (current.length === 0) {
      setPriceErrors({})
      return
    }
    setRefreshing(true)
    try {
      const { cache, errors } = await refreshPrices(current, settingsRef.current, { force })
      setPriceCache({ ...cache })
      setPriceErrors(errors)
      setRefreshError(null)
    } catch (err) {
      // restano validi i prezzi già in cache, ma il motivo va mostrato
      setRefreshError(err.message || 'Aggiornamento dei prezzi non riuscito')
    } finally {
      setRefreshing(false)
      setRateLimit(getRateLimitStatus())
    }
  }, [])

  /* Primo caricamento: usa la cache e richiede solo i prezzi scaduti. */
  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* Refresh automatico all'intervallo configurato. */
  useEffect(() => {
    const minutes = Number(settings.refreshIntervalMinutes) || 15
    const id = window.setInterval(() => refresh(), Math.max(1, minutes) * 60 * 1000)
    return () => window.clearInterval(id)
  }, [settings.refreshIntervalMinutes, refresh])

  /* Stato del rate limit Alpha Vantage: si aggiorna da solo per riabilitare il refresh. */
  useEffect(() => {
    const id = window.setInterval(() => setRateLimit(getRateLimitStatus()), 5000)
    return () => window.clearInterval(id)
  }, [])

  const positions = useMemo(
    () => buildPositions(holdings, priceCache, priceErrors),
    [holdings, priceCache, priceErrors],
  )
  const totals = useMemo(() => totalsOf(positions), [positions])
  const allocation = useMemo(
    () => allocationOf(positions, totals.valoreTotaleEUR),
    [positions, totals.valoreTotaleEUR],
  )
  const updatedAt = useMemo(() => lastPriceUpdate(positions), [positions])
  const hasStalePrices = useMemo(() => positions.some((p) => p.stale), [positions])

  /* Snapshot giornaliero: creato una volta al giorno, appena il valore è calcolabile. */
  useEffect(() => {
    if (refreshing || holdings.length === 0) return
    if (totals.valoreTotaleEUR <= 0) return
    const day = todayISO()
    if (snapshotDoneFor.current === day) return
    snapshotDoneFor.current = day
    const { snapshots: next, created } = ensureTodaySnapshot(
      totals.valoreTotaleEUR,
      totals.valoreTotaleUSD,
    )
    if (created) setSnapshots(next)
  }, [refreshing, holdings.length, totals.valoreTotaleEUR, totals.valoreTotaleUSD])

  const commitHoldings = useCallback((next) => {
    saveHoldings(next)
    setHoldings(next)
    return next
  }, [])

  const addHolding = useCallback(
    async (data) => {
      const holding = {
        id: newId(),
        tipo: data.tipo,
        ticker: String(data.ticker).trim().toUpperCase(),
        nome: String(data.nome || '').trim(),
        quantita: Number(data.quantita),
      }
      const next = commitHoldings([...holdingsRef.current, holding])
      holdingsRef.current = next
      await refresh()
    },
    [commitHoldings, refresh],
  )

  const updateHolding = useCallback(
    async (id, data) => {
      const next = commitHoldings(
        holdingsRef.current.map((h) =>
          h.id === id
            ? {
                ...h,
                tipo: data.tipo,
                ticker: String(data.ticker).trim().toUpperCase(),
                nome: String(data.nome || '').trim(),
                quantita: Number(data.quantita),
              }
            : h,
        ),
      )
      holdingsRef.current = next
      await refresh()
    },
    [commitHoldings, refresh],
  )

  const removeHolding = useCallback(
    (id) => {
      const next = commitHoldings(holdingsRef.current.filter((h) => h.id !== id))
      holdingsRef.current = next
    },
    [commitHoldings],
  )

  const updateSettings = useCallback(
    async (next) => {
      const merged = { ...settingsRef.current, ...next }
      persistSettings(merged)
      settingsRef.current = merged
      setSettings(merged)
      await refresh()
    },
    [refresh],
  )

  /** Rimpiazza lo stato con i dati di un backup già applicato allo storage. */
  const applyRestored = useCallback(
    async (restored) => {
      setHoldings(restored.holdings)
      holdingsRef.current = restored.holdings
      setSnapshots(restored.snapshots)
      setSettings(restored.settings)
      settingsRef.current = restored.settings
      snapshotDoneFor.current = null
      await refresh()
    },
    [refresh],
  )

  return {
    holdings,
    snapshots,
    settings,
    positions,
    allocation,
    totals,
    updatedAt,
    hasStalePrices,
    priceErrors,
    refreshing,
    refreshError,
    rateLimit,
    refresh,
    addHolding,
    updateHolding,
    removeHolding,
    updateSettings,
    applyRestored,
  }
}
