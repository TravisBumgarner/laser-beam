import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

// Production-only CSP; the dev server needs inline scripts for React refresh.
const csp: Plugin = {
  name: 'csp',
  apply: 'build',
  transformIndexHtml: (html) =>
    html.replace(
      '<head>',
      `<head>\n    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'" />`,
    ),
}

export default defineConfig({
  plugins: [react(), csp],
  root: './src/renderer',
  build: { outDir: '../../.vite/renderer/main_window' },
  server: { port: 5174 },
})
