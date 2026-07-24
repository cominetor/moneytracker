/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        page: { light: '#f9f9f7', dark: '#0d0d0d' },
        surface: { light: '#fcfcfb', dark: '#1a1a19' },
        ink: { light: '#0b0b0b', dark: '#ffffff' },
        subtle: { light: '#52514e', dark: '#c3c2b7' },
        muted: '#898781',
        hairline: { light: '#e1e0d9', dark: '#2c2c2a' },
        baseline: { light: '#c3c2b7', dark: '#383835' },
        positive: { light: '#006300', dark: '#0ca30c' },
        negative: { light: '#d03b3b', dark: '#e66767' },
        warning: '#fab219',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
