const LOCALE = 'it-IT'

const eur = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const usd = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatEUR(value) {
  return eur.format(Number.isFinite(value) ? value : 0)
}

export function formatUSD(value) {
  return usd.format(Number.isFinite(value) ? value : 0)
}

/** I prezzi unitari sotto 1 (es. token) richiedono più decimali. */
export function formatUnitPrice(value, currency = 'EUR') {
  if (!Number.isFinite(value)) return '—'
  const decimals = Math.abs(value) >= 1 ? 2 : 6
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export function formatQuantity(value) {
  if (!Number.isFinite(value)) return '—'
  return new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 8 }).format(value)
}

export function formatPercent(value) {
  if (!Number.isFinite(value)) return '—'
  return `${new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 1 }).format(value)}%`
}

export function formatDateTime(timestamp) {
  if (!timestamp) return null
  return new Intl.DateTimeFormat(LOCALE, { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(timestamp),
  )
}

/** "YYYY-MM-DD" → "24 lug" per gli assi dei grafici. */
export function formatShortDate(isoDate) {
  const [y, m, d] = String(isoDate).split('-').map(Number)
  if (!y || !m || !d) return isoDate
  return new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short' }).format(
    new Date(y, m - 1, d),
  )
}

export function formatFullDate(isoDate) {
  const [y, m, d] = String(isoDate).split('-').map(Number)
  if (!y || !m || !d) return isoDate
  return new Intl.DateTimeFormat(LOCALE, { dateStyle: 'medium' }).format(new Date(y, m - 1, d))
}

/** Asse Y compatto: 12.500 → "12,5k" */
export function formatAxisEUR(value) {
  if (!Number.isFinite(value)) return ''
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `${(value / 1_000_000).toLocaleString(LOCALE, { maximumFractionDigits: 1 })} mln`
  if (abs >= 1_000) return `${(value / 1_000).toLocaleString(LOCALE, { maximumFractionDigits: 1 })}k`
  return value.toLocaleString(LOCALE, { maximumFractionDigits: 0 })
}
