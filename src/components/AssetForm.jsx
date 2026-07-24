import { useState } from 'react'
import Modal from './Modal.jsx'

const EMPTY = { tipo: 'crypto', ticker: '', nome: '', quantita: '' }

export default function AssetForm({ holding, onSave, onClose }) {
  const [values, setValues] = useState(() =>
    holding
      ? {
          tipo: holding.tipo,
          ticker: holding.ticker,
          nome: holding.nome || '',
          quantita: String(holding.quantita),
        }
      : EMPTY,
  )
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  function setField(field, value) {
    setValues((prev) => ({ ...prev, [field]: value }))
  }

  function validate() {
    const next = {}
    if (!values.ticker.trim()) next.ticker = 'Il ticker è obbligatorio.'
    const quantita = Number(String(values.quantita).replace(',', '.'))
    if (!Number.isFinite(quantita) || quantita <= 0) {
      next.quantita = 'Inserisci una quantità maggiore di zero.'
    }
    setErrors(next)
    return Object.keys(next).length === 0 ? { ...values, quantita } : null
  }

  async function onSubmit(event) {
    event.preventDefault()
    const payload = validate()
    if (!payload) return
    setSaving(true)
    try {
      await onSave(payload)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={holding ? 'Modifica asset' : 'Aggiungi asset'} onClose={onClose}>
      <form onSubmit={onSubmit} noValidate>
        <div className="space-y-4">
          <div>
            <label className="label" htmlFor="tipo">
              Tipo
            </label>
            <select
              id="tipo"
              className="field"
              value={values.tipo}
              onChange={(event) => setField('tipo', event.target.value)}
            >
              <option value="crypto">Crypto</option>
              <option value="stock">Azione</option>
            </select>
          </div>

          <div>
            <label className="label" htmlFor="ticker">
              Ticker
            </label>
            <input
              id="ticker"
              className="field uppercase"
              value={values.ticker}
              placeholder={values.tipo === 'crypto' ? 'BTC' : 'AAPL'}
              autoComplete="off"
              onChange={(event) => setField('ticker', event.target.value)}
            />
            {errors.ticker && (
              <p className="mt-1 text-xs text-negative-light dark:text-negative-dark">
                {errors.ticker}
              </p>
            )}
          </div>

          <div>
            <label className="label" htmlFor="nome">
              Nome <span className="normal-case text-muted">(facoltativo)</span>
            </label>
            <input
              id="nome"
              className="field"
              value={values.nome}
              placeholder={values.tipo === 'crypto' ? 'Bitcoin' : 'Apple Inc.'}
              autoComplete="off"
              onChange={(event) => setField('nome', event.target.value)}
            />
          </div>

          <div>
            <label className="label" htmlFor="quantita">
              Quantità
            </label>
            <input
              id="quantita"
              className="field tabular"
              inputMode="decimal"
              value={values.quantita}
              placeholder="0,5"
              autoComplete="off"
              onChange={(event) => setField('quantita', event.target.value)}
            />
            {errors.quantita && (
              <p className="mt-1 text-xs text-negative-light dark:text-negative-dark">
                {errors.quantita}
              </p>
            )}
          </div>

          {values.tipo === 'stock' && (
            <p className="text-xs text-subtle-light dark:text-subtle-dark">
              Per le borse non americane aggiungi il suffisso di mercato: ENI.MI (Milano),
              VOD.L (Londra), AIR.PA (Parigi).
            </p>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="btn" onClick={onClose}>
            Annulla
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Salvataggio…' : 'Salva'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
