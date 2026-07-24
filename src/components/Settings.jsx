import { useState } from 'react'
import Modal from './Modal.jsx'
import { MAX_PER_DAY } from '../services/rateLimiter.js'
import { runDiagnostics } from '../services/diagnostics.js'

export default function Settings({ settings, rateLimit, onSave, onClose }) {
  const [apiKey, setApiKey] = useState(settings.alphaVantageApiKey || '')
  const [interval, setInterval] = useState(String(settings.refreshIntervalMinutes ?? 15))
  const [showKey, setShowKey] = useState(false)
  const [saving, setSaving] = useState(false)
  const [diagnostics, setDiagnostics] = useState(null)
  const [checking, setChecking] = useState(false)

  async function checkSources() {
    setChecking(true)
    try {
      setDiagnostics(await runDiagnostics({ alphaVantageApiKey: apiKey.trim() }))
    } finally {
      setChecking(false)
    }
  }

  async function onSubmit(event) {
    event.preventDefault()
    const minutes = Number(String(interval).replace(',', '.'))
    setSaving(true)
    try {
      await onSave({
        alphaVantageApiKey: apiKey.trim(),
        refreshIntervalMinutes: Number.isFinite(minutes) && minutes >= 1 ? Math.round(minutes) : 15,
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Impostazioni" onClose={onClose}>
      <form onSubmit={onSubmit}>
        <div className="space-y-4">
          <div>
            <label className="label" htmlFor="apiKey">
              Alpha Vantage API key <span className="normal-case text-muted">(facoltativa)</span>
            </label>
            <div className="flex gap-2">
              <input
                id="apiKey"
                className="field"
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                placeholder="La tua API key gratuita"
                autoComplete="off"
                spellCheck="false"
                onChange={(event) => setApiKey(event.target.value)}
              />
              <button type="button" className="btn shrink-0" onClick={() => setShowKey((v) => !v)}>
                {showKey ? 'Nascondi' : 'Mostra'}
              </button>
            </div>
            <p className="mt-1 text-xs text-subtle-light dark:text-subtle-dark">
              Non serve per l'uso normale: le azioni arrivano da Yahoo Finance e le crypto da
              CoinGecko, entrambi senza key. Compila questo campo solo se vuoi un ripiego
              automatico quando Yahoo non risponde —{' '}
              <a
                className="underline underline-offset-2"
                href="https://www.alphavantage.co/support/#api-key"
                target="_blank"
                rel="noreferrer"
              >
                la key gratuita si ottiene qui
              </a>
              .
            </p>
          </div>

          <div>
            <label className="label" htmlFor="interval">
              Intervallo di aggiornamento prezzi (minuti)
            </label>
            <input
              id="interval"
              className="field tabular"
              inputMode="numeric"
              value={interval}
              onChange={(event) => setInterval(event.target.value)}
            />
            <p className="mt-1 text-xs text-subtle-light dark:text-subtle-dark">
              Predefinito 15 minuti. I prezzi in cache da meno di 15 minuti non vengono richiesti di
              nuovo.
            </p>
          </div>

          {apiKey.trim() && (
            <div className="rounded-lg border border-hairline-light p-3 text-xs text-subtle-light dark:border-hairline-dark dark:text-subtle-dark">
              <p className="font-medium text-ink-light dark:text-ink-dark">Quota Alpha Vantage</p>
              <p className="tabular mt-1">
                {rateLimit.usedToday}/{MAX_PER_DAY} richieste usate oggi ·{' '}
                {rateLimit.remainingThisMinute}/5 disponibili in questo minuto
              </p>
            </div>
          )}

          <div className="rounded-lg border border-hairline-light p-3 dark:border-hairline-dark">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-medium">Fonti dei prezzi</p>
              <button type="button" className="btn py-1 text-xs" onClick={checkSources} disabled={checking}>
                {checking ? 'Verifica…' : 'Verifica ora'}
              </button>
            </div>
            {diagnostics && (
              <ul className="mt-2 space-y-1 text-xs">
                {diagnostics.map((r) => (
                  <li key={r.nome} className="flex gap-2">
                    <span className={r.ok ? 'text-positive-light dark:text-positive-dark' : 'text-negative-light dark:text-negative-dark'}>
                      {r.ok ? '✓' : '✕'}
                    </span>
                    <span className="min-w-0">
                      <span className="font-medium">{r.nome}</span>{' '}
                      <span className="break-words text-subtle-light dark:text-subtle-dark">
                        — {r.dettaglio}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {!diagnostics && (
              <p className="mt-1 text-xs text-subtle-light dark:text-subtle-dark">
                Controlla quali servizi risponde il tuo browser, utile se un asset resta senza
                prezzo.
              </p>
            )}
          </div>

          <p className="text-xs text-muted">
            Tutti i dati restano su questo dispositivo, nel localStorage del browser. Usa il backup
            per non perderli.
          </p>
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
