import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        matcha: {
          50:  '#f5f9f2', // surface-container-low substitute
          100: '#d9e4c5', // secondary-container
          200: '#c0cbad',
          300: '#b6cf8e', // primary-fixed-dim
          400: '#a7c080', // primary-container
          500: '#50652f', // primary
          600: '#3a4e1b', // on-primary-container
          700: '#30503a',
          800: '#294130',
          900: '#1b1c1a', // on-surface
          950: '#121f00',
        },
        cream: {
          50:  '#ffffff', // surface-container-lowest
          100: '#fbf9f5', // surface / background
          200: '#f5f3ef', // surface-container-low
          300: '#efeeea', // surface-container
          400: '#e4e2de', // surface-container-highest
          500: '#dbdad6', // surface-dim
          600: '#c5c8b9', // outline-variant
          700: '#75796c', // outline
        },
      },
      fontFamily: {
        sans: [
          'Outfit',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        admin: [
          'Manrope',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
      },
      borderRadius: {
        '2xl': '1.5rem',
        '3xl': '2rem',
        '4xl': '3rem',
      },
    },
  },
  plugins: [],
} satisfies Config
