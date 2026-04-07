import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      /** Prebundled ESM — some environments fail resolving the package root `main`/`module`. */
      'pdf-lib': path.resolve(__dirname, 'node_modules/pdf-lib/dist/pdf-lib.esm.js'),
    },
  },
  optimizeDeps: {
    include: ['pdf-lib'],
  },
})
