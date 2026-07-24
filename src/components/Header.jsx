import { formatDateTime, formatEUR, formatUSD } from '../utils/format.js'

function RefreshIcon({ spinning }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={`h-4 w-4 ${spinning ? 'animate-spin' : ''}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path d="M16.5 10a6.5 6.5 0 1 1-1.9-4.6" strokeLinecap="round" />
      <path d="M16.5 3v3.5H13" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M2.5 6.5h8M14.5 6.5h3M2.5 13.5h3M9.5 13.5h8" strokeLinecap="round" />
      <circle cx="12.5" cy="6.5" r="2" />
      <circle cx="7.5" cy="13.5" r="2" />
    </svg>
  )
}

export default function Header({
  totals,
  updatedAt,
  hasStalePrices,
  refreshing,
  refreshError,
  rateLimit,
  onRefresh,
  onOpenSettings,
  children,
}) {
  const refreshDisabled = refreshing || rateLimit.exhausted
  const updatedLabel = updatedAt ? formatDateTime(updatedAt) : null

  return (
    <header className="card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-subtle-light dark:text-subtle-dark">
            Valore totale
          </p>
          <p className="mt-1 truncate text-4xl font-semibold sm:text-5xl">
            {formatEUR(totals.valoreTotaleEUR)}
          </p>
          <p className="tabular mt-1 text-sm text-subtle-light dark:text-subtle-dark">
            {formatUSD(totals.valoreTotaleUSD)}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            className="btn px-2.5"
            onClick={() => onRefresh({ force: true })}
            disabled={refreshDisabled}
            title={
              rateLimit.exhausted
                ? 'Limite giornaliero Alpha Vantage raggiunto: riprova domani'
                : 'Aggiorna prezzi'
            }
            aria-label="Aggiorna prezzi"
          >
            <RefreshIcon spinning={refreshing} />
          </button>
          <button
            type="button"
            className="btn px-2.5"
            onClick={onOpenSettings}
            aria-label="Impostazioni"
            title="Impostazioni"
          >
            <SettingsIcon />
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-subtle-light dark:text-subtle-dark">
        <span>
          {refreshing
            ? 'Aggiornamento prezzi in corso…'
            : updatedLabel
              ? `Prezzi aggiornati il ${updatedLabel}`
              : 'Prezzi non ancora disponibili'}
        </span>
        {hasStalePrices && !refreshing && updatedAt && (
          <span className="rounded-full border border-warning px-2 py-0.5 font-medium text-ink-light dark:text-ink-dark">
            alcuni prezzi non aggiornati
          </span>
        )}
        {rateLimit.exhausted && (
          <span className="rounded-full border border-hairline-light px-2 py-0.5 dark:border-hairline-dark">
            quota Alpha Vantage esaurita ({rateLimit.usedToday}/25 oggi)
          </span>
        )}
      </div>

      {refreshError && (
        <p className="mt-2 text-xs text-negative-light dark:text-negative-dark">{refreshError}</p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">{children}</div>
    </header>
  )
}
