import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// `base` matches the GitHub Pages project URL path. When running locally
// with `npm run dev`, Vite serves at the same prefix so links resolve
// identically to production.
export default defineConfig({
  plugins: [react()],
  base: '/eckb-tournament-site/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
