import { createServer } from 'node:http'
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'
import { serveMarsTile } from './marsTileProxy.js'

const root = resolve('dist')
const port = Number(process.env.PORT) || 3000
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.czml': 'application/json; charset=utf-8', '.geojson': 'application/geo+json; charset=utf-8', '.glb': 'model/gltf-binary',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.webp': 'image/webp', '.ktx2': 'image/ktx2',
  '.wasm': 'application/wasm', '.ttf': 'font/ttf', '.woff2': 'font/woff2',
}

createServer(async (request, response) => {
  if (await serveMarsTile(request, response)) return
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end()
    return
  }
  let pathname
  try { pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname) }
  catch { response.writeHead(400).end(); return }
  const file = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`)
  if (file !== root && !file.startsWith(root + sep)) {
    response.writeHead(403).end()
    return
  }
  let target = file
  let details
  try { details = await stat(target) } catch { /* Try a client route below. */ }
  if (!details?.isFile() && !extname(pathname) && request.headers.accept?.includes('text/html')) {
    target = resolve(root, 'index.html')
    try { details = await stat(target) } catch { /* Build has not run yet. */ }
  }
  if (!details?.isFile()) { response.writeHead(404).end('Not found'); return }
  response.writeHead(200, {
    'Content-Type': types[extname(target).toLowerCase()] || 'application/octet-stream',
    'Content-Length': details.size,
    'Cache-Control': target.includes(`${sep}assets${sep}`) ? 'public, max-age=31536000, immutable' : 'no-cache',
    'X-Content-Type-Options': 'nosniff',
  })
  if (request.method === 'HEAD') response.end()
  else createReadStream(target).pipe(response)
}).listen(port, () => console.log(`Mars maps are serving on http://localhost:${port}`))
