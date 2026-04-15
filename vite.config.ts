import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Root base for user pages site (havynsmatcha.github.io — no subpath)
  base: '/',
})
