import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  base: process.env.BASE_PATH || '/',
  css: {
    postcss: {
      plugins: [],
    },
  },
  // MapLibre v6 worker is an ES module; Vite's default IIFE worker build
  // fails under MapLibre's `new Worker(url, { type: 'module' })`.
  worker: {
    format: 'es',
  },
  optimizeDeps: {
    // Prebundling can drop/misplace the sibling worker+shared modules.
    exclude: ['maplibre-gl'],
  },
  server: {
    watch: {
      ignored: ['**/tmp/**'],
    },
  },
})
