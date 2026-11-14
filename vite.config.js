import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { serveMarsTile } from './marsTileProxy.js'

export default defineConfig({
  plugins: [react(), { name: 'mars-tile-proxy', configureServer(server) { server.middlewares.use(async (request, response, next) => { if (!await serveMarsTile(request, response)) next() }) } }, viteStaticCopy({ targets: [
    { src: 'node_modules/cesium/Build/Cesium/Workers', dest: 'cesiumStatic', rename: { stripBase: 4 } },
    { src: 'node_modules/cesium/Build/Cesium/ThirdParty', dest: 'cesiumStatic', rename: { stripBase: 4 } },
    { src: 'node_modules/cesium/Build/Cesium/Assets', dest: 'cesiumStatic', rename: { stripBase: 4 } },
    { src: 'node_modules/cesium/Build/Cesium/Widgets', dest: 'cesiumStatic', rename: { stripBase: 4 } },
  ] })],
  define: { CESIUM_BASE_URL: JSON.stringify('/cesiumStatic') },
  server: { port: 5173, strictPort: true },
  build: { rollupOptions: { output: { manualChunks(id) {
    if (id.includes('maplibre-gl')) return 'terrain'
    if (id.includes('three') || id.includes('@react-three')) return 'space'
  } } } },
})
