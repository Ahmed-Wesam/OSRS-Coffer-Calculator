/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
  },
  server: {
    proxy: {
      '/itemdb': {
        target: 'https://secure.runescape.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/itemdb/, ''),
      },
      '/ge-tracker': {
        target: 'https://www.ge-tracker.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ge-tracker/, ''),
      },
    },
  },
})
