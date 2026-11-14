import { MARS_TILE_LAYERS } from './src/data/marsImagery.js'

const layers = Object.freeze({
  ...Object.fromEntries(Object.entries(MARS_TILE_LAYERS).map(([key, layer]) => [key, { id: layer.id, extension: 'png', maxZoom: layer.maxLevel }])),
  mola: { id: 'Mars_MGS_MOLA_ClrShade_merge_global_463m', extension: 'jpg', maxZoom: 6 },
})
const cache = new Map()
const maxCacheEntries = 200

export async function serveMarsTile(request, response) {
  const path = new URL(request.url, 'http://localhost').pathname
  if (!path.startsWith('/api/mars-tiles/')) return false
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end()
    return true
  }
  const match = /^\/api\/mars-tiles\/([a-z0-9-]+)\/(\d{1,2})\/(\d{1,7})\/(\d{1,7})$/.exec(path)
  if (!match) { response.writeHead(404).end(); return true }
  const [, key, zoomText, rowText, columnText] = match
  const layer = layers[key]
  if (!layer) { response.writeHead(404).end(); return true }
  const z = Number(zoomText), y = Number(rowText), x = Number(columnText)
  if (z > layer.maxZoom || y >= 2 ** z || x >= 2 ** (z + 1)) {
    response.writeHead(404).end()
    return true
  }
  const cacheKey = `${key}/${z}/${y}/${x}`
  let tile = cache.get(cacheKey)
  if (!tile) {
    const url = `https://trek.nasa.gov/tiles/Mars/EQ/${layer.id}/1.0.0/default/default028mm/${z}/${y}/${x}.${layer.extension}`
    try {
      const upstream = await fetch(url, { signal: AbortSignal.timeout(12000) })
      if (!upstream.ok) { response.writeHead(upstream.status === 404 ? 404 : 502).end(); return true }
      const bytes = Buffer.from(await upstream.arrayBuffer())
      const png = bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      const jpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
      if (!png && !jpeg) { response.writeHead(502).end('Mars Trek returned an invalid image'); return true }
      tile = { bytes, type: png ? 'image/png' : 'image/jpeg' }
      cache.set(cacheKey, tile)
      if (cache.size > maxCacheEntries) cache.delete(cache.keys().next().value)
    } catch {
      response.writeHead(502).end('Mars Trek is unavailable')
      return true
    }
  }
  response.writeHead(200, {
    'Content-Type': tile.type,
    'Content-Length': tile.bytes.length,
    'Cache-Control': 'public, max-age=86400',
    'X-Content-Type-Options': 'nosniff',
  })
  response.end(request.method === 'HEAD' ? undefined : tile.bytes)
  return true
}
