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
  server: {
    watch: {
      ignored: ['**/tmp/**'],
    },
  },
})
