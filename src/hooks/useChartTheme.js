import { useEffect, useState } from 'react'
import { DARK, LIGHT } from '../theme/palette.js'

/** Segue la preferenza di sistema (dark mode) per i colori dei grafici. */
export function useChartTheme() {
  const [isDark, setIsDark] = useState(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches,
  )

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!mq) return undefined
    const onChange = (event) => setIsDark(event.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return isDark ? DARK : LIGHT
}
