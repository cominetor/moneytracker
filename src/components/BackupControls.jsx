import { useRef, useState } from 'react'
import Modal from './Modal.jsx'
import { applyBackup, downloadBackup, parseBackupFile } from '../services/backup.js'

export default function BackupControls({ onRestored }) {
  const inputRef = useRef(null)
  const [pending, setPending] = useState(null)
  const [error, setError] = useState(null)

  async function onFileSelected(event) {
    const file = event.target.files?.[0]
    event.target.value = '' // permette di riselezionare lo stesso file
    if (!file) return
    setError(null)
    try {
      setPending(await parseBackupFile(file))
    } catch (err) {
      setError(err.message || 'Impossibile leggere il file di backup.')
    }
  }

  function confirmImport() {
    const restored = applyBackup(pending)
    setPending(null)
    onRestored(restored)
  }

  return (
    <>
      <button type="button" className="btn" onClick={() => downloadBackup()}>
        Esporta backup
      </button>
      <button type="button" className="btn" onClick={() => inputRef.current?.click()}>
        Importa backup
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={onFileSelected}
      />

      {error && (
        <p className="w-full text-xs text-negative-light dark:text-negative-dark">{error}</p>
      )}

      {pending && (
        <Modal title="Confermi l'importazione?" onClose={() => setPending(null)}>
          <p className="text-sm text-subtle-light dark:text-subtle-dark">
            I dati attuali verranno <strong>sovrascritti</strong> con il contenuto del backup:
          </p>
          <ul className="mt-3 list-inside list-disc text-sm text-subtle-light dark:text-subtle-dark">
            <li>{pending.holdings.length} asset</li>
            <li>{pending.snapshots.length} snapshot storici</li>
            <li>
              impostazioni {pending.settings.alphaVantageApiKey ? 'con' : 'senza'} API key Alpha
              Vantage
            </li>
          </ul>
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" className="btn" onClick={() => setPending(null)}>
              Annulla
            </button>
            <button type="button" className="btn-primary" onClick={confirmImport}>
              Sovrascrivi dati
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}
