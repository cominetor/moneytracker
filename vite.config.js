import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // percorsi relativi: la build funziona sia in locale sia servita da una
  // sottocartella (es. GitHub Pages su /moneytracker/)
  base: './',
})
