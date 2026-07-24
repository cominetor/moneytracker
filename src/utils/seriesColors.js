import { MAX_SERIES } from '../theme/palette.js'

/**
 * Il colore segue l'asset, non la sua posizione in classifica: la mappa è
 * costruita sull'ordine di inserimento, così aggiungere o riordinare per valore
 * non ricolora gli asset già presenti.
 * Oltre agli 8 slot categoriali non si generano nuovi colori: gli asset
 * eccedenti confluiscono in "Altri".
 */
export function buildColorMap(holdings, palette) {
  const map = new Map()
  holdings.forEach((h, index) => {
    map.set(h.id, index < MAX_SERIES ? palette.series[index] : palette.other)
  })
  return map
}

export function isOverflowAsset(holdings, id) {
  const index = holdings.findIndex((h) => h.id === id)
  return index >= MAX_SERIES
}
