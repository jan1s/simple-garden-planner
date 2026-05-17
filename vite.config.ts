import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages serves from /simple-garden-planner/
const base =
  process.env.GITHUB_PAGES === 'true' ? '/simple-garden-planner/' : '/'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base,
})
