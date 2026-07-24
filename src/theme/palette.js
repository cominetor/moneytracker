/**
 * Token cromatici usati dai grafici (Recharts richiede colori espliciti, non classi CSS).
 * Le due colonne sono la stessa palette "steppata" per le due superfici,
 * validate su banda di luminosità, separazione CVD e contrasto.
 */

export const LIGHT = {
  surface: '#fcfcfb',
  page: '#f9f9f7',
  ink: '#0b0b0b',
  subtle: '#52514e',
  muted: '#898781',
  grid: '#e1e0d9',
  axis: '#c3c2b7',
  other: '#898781',
  // ordine fisso degli slot categoriali: mai rimescolato, mai ciclato
  series: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948'],
}

export const DARK = {
  surface: '#1a1a19',
  page: '#0d0d0d',
  ink: '#ffffff',
  subtle: '#c3c2b7',
  muted: '#898781',
  grid: '#2c2c2a',
  axis: '#383835',
  other: '#898781',
  series: ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767'],
}

/** Oltre 8 asset le quote residue confluiscono in "Altri": nessun colore generato. */
export const MAX_SERIES = LIGHT.series.length
