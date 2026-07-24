export default function EmptyState({ onAdd }) {
  return (
    <div className="card flex flex-col items-center gap-3 py-12 text-center">
      <div className="rounded-full border border-hairline-light p-3 text-muted dark:border-hairline-dark">
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 7h18v12H3zM3 7l2-3h14l2 3M9 12h6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div>
        <p className="font-semibold">Il portafoglio è vuoto</p>
        <p className="mt-1 text-sm text-subtle-light dark:text-subtle-dark">
          Aggiungi la tua prima crypto o azione per vedere valore, allocazione e storico.
        </p>
      </div>
      <button type="button" className="btn-primary" onClick={onAdd}>
        Aggiungi asset
      </button>
    </div>
  )
}
