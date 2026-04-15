import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        matcha: {
          50:  '#f2f7f4',
          100: '#e0ece4',
          200: '#c1d9c9',
          300: '#97bfa6',
          400: '#679f7e',
          500: '#4a7c59', // primary — muted earthy matcha green
          600: '#3b6448',
          700: '#30503a',
          800: '#294130',
          900: '#233629',
          950: '#111e16',
        },
        cream: {
          50:  '#faf6f0', // page background
          100: '#f4ede0',
          200: '#e8d9c0',
          300: '#d8c09a',
          400: '#c5a070',
          500: '#b08050',
        },
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
} satisfies Config
