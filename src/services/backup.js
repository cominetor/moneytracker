/**
 * Backup: esporta/importa holdings, snapshots e settings in un file .json.
 */
import {
  DEFAULT_SETTINGS,
  loadHoldings,
  loadSettings,
  loadSnapshots,
  saveHoldings,
  saveSettings,
  saveSnapshots,
} from './storage.js'

export const BACKUP_VERSION = 1

export function buildBackup() {
  return {
    version: BACKUP_VERSION,
    esportatoIl: new Date().toISOString(),
    holdings: loadHoldings(),
    snapshots: loadSnapshots(),
    settings: loadSettings(),
  }
}

/** Genera e scarica il file di backup. */
export function downloadBackup() {
  const backup = buildBackup()
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `portfolio-backup-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  return backup
}

/** Legge e valida un file di backup, senza scrivere nulla. */
export async function parseBackupFile(file) {
  const text = await file.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('Il file non è un JSON valido.')
  }
  if (!data || typeof data !== 'object') throw new Error('Formato del backup non riconosciuto.')
  if (!Array.isArray(data.holdings)) throw new Error('Il backup non contiene la lista degli asset.')

  return {
    holdings: data.holdings,
    snapshots: Array.isArray(data.snapshots) ? data.snapshots : [],
    settings: { ...DEFAULT_SETTINGS, ...(data.settings || {}) },
  }
}

/** Sovrascrive i dati correnti con quelli del backup. */
export function applyBackup(backup) {
  saveHoldings(backup.holdings)
  saveSnapshots(backup.snapshots)
  saveSettings(backup.settings)
  return {
    holdings: loadHoldings(),
    snapshots: loadSnapshots(),
    settings: loadSettings(),
  }
}
