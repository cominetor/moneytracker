import { useMemo, useState } from 'react'
import Dashboard from './components/Dashboard.jsx'
import AssetForm from './components/AssetForm.jsx'
import Settings from './components/Settings.jsx'
import Modal from './components/Modal.jsx'
import { usePortfolio } from './hooks/usePortfolio.js'
import { useChartTheme } from './hooks/useChartTheme.js'
import { buildColorMap } from './utils/seriesColors.js'

export default function App() {
  const portfolio = usePortfolio()
  const palette = useChartTheme()
  const [formState, setFormState] = useState(null) // { holding } | { holding: null } | null
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [toDelete, setToDelete] = useState(null)

  const colorMap = useMemo(
    () => buildColorMap(portfolio.holdings, palette),
    [portfolio.holdings, palette],
  )

  async function saveAsset(values) {
    if (formState?.holding) {
      await portfolio.updateHolding(formState.holding.id, values)
    } else {
      await portfolio.addHolding(values)
    }
  }

  return (
    <main className="min-h-screen">
      <Dashboard
        portfolio={portfolio}
        colorMap={colorMap}
        onAdd={() => setFormState({ holding: null })}
        onEdit={(position) => setFormState({ holding: position })}
        onDelete={(position) => setToDelete(position)}
        onOpenSettings={() => setSettingsOpen(true)}
        onRestored={portfolio.applyRestored}
      />

      {formState && (
        <AssetForm
          holding={formState.holding}
          onSave={saveAsset}
          onClose={() => setFormState(null)}
        />
      )}

      {settingsOpen && (
        <Settings
          settings={portfolio.settings}
          rateLimit={portfolio.rateLimit}
          onSave={portfolio.updateSettings}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {toDelete && (
        <Modal title="Eliminare l'asset?" onClose={() => setToDelete(null)}>
          <p className="text-sm text-subtle-light dark:text-subtle-dark">
            <strong className="text-ink-light dark:text-ink-dark">{toDelete.ticker}</strong> verrà
            rimosso dal portafoglio. Gli snapshot storici già registrati restano invariati.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" className="btn" onClick={() => setToDelete(null)}>
              Annulla
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                portfolio.removeHolding(toDelete.id)
                setToDelete(null)
              }}
            >
              Elimina
            </button>
          </div>
        </Modal>
      )}
    </main>
  )
}
