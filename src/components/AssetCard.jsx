import { formatEUR, formatQuantity, formatUnitPrice, formatUSD } from '../utils/format.js'

function TypeBadge({ tipo }) {
  const isCrypto = tipo === 'crypto'
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md border border-hairline-light px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-subtle-light dark:border-hairline-dark dark:text-subtle-dark"
      title={isCrypto ? 'Criptovaluta' : 'Azione'}
    >
      {isCrypto ? '₿' : '§'} {isCrypto ? 'crypto' : 'azione'}
    </span>
  )
}

export default function AssetCard({ position, color, onEdit, onDelete }) {
  return (
    <li className="card flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className="h-8 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{position.ticker}</span>
            <TypeBadge tipo={position.tipo} />
            {position.stale && (
              <span
                className="rounded-full border border-warning px-1.5 py-0.5 text-[10px] font-medium"
                title={position.errore || 'Ultimo prezzo noto, non aggiornato'}
              >
                non aggiornato
              </span>
            )}
          </div>
          {position.nome && (
            <p className="truncate text-xs text-subtle-light dark:text-subtle-dark">
              {position.nome}
            </p>
          )}
          <p className="tabular mt-1 text-xs text-subtle-light dark:text-subtle-dark">
            {formatQuantity(position.quantita)} ×{' '}
            {position.prezzoEUR === null ? '—' : formatUnitPrice(position.prezzoEUR, 'EUR')}
          </p>
          {position.errore && (
            <p className="mt-1 text-xs text-muted">{position.errore}</p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <div className="text-right">
          <p className="tabular font-semibold">{formatEUR(position.valoreEUR)}</p>
          <p className="tabular text-xs text-subtle-light dark:text-subtle-dark">
            {formatUSD(position.valoreUSD)}
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <button
            type="button"
            className="rounded-md p-1.5 text-subtle-light hover:bg-page-light dark:text-subtle-dark dark:hover:bg-page-dark"
            onClick={() => onEdit(position)}
            aria-label={`Modifica ${position.ticker}`}
            title="Modifica"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M13.5 3.5l3 3L7 16H4v-3l9.5-9.5z" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            className="rounded-md p-1.5 text-subtle-light hover:bg-page-light dark:text-subtle-dark dark:hover:bg-page-dark"
            onClick={() => onDelete(position)}
            aria-label={`Elimina ${position.ticker}`}
            title="Elimina"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M4 6h12M8 6V4h4v2M6 6l.7 10h6.6L14 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </li>
  )
}
