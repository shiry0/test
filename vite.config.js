import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { serveMarsTile } from './marsTileProxy.js'

export default defineConfig({
  plugins: [react(), {
    name: 'mars-tile-proxy',
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        if (!await serveMarsTile(request, response)) next()
      })
    },
  }],
  server: { port: 5173, strictPort: true },
})
