// Rebuild the bundled rover-route snapshot from NASA MMGIS GeoJSON and the
// Cesium sample's explicitly fictional The Martian polyline.
import fs from 'node:fs'

const read = file => JSON.parse(fs.readFileSync(file, 'utf8'))
const root = 'scripts/data/rovers/'
const sample = read('public/mars/Mars.czml')
const martian = sample.find(item => item.id === 'TheMartianJourney').polyline.positions.cartographicDegrees

function flatten(features) {
  return features.flatMap(feature => feature.geometry.type === 'MultiLineString'
    ? feature.geometry.coordinates.flat()
    : feature.geometry.coordinates)
}
function perpendicular(point, start, end, cosLat) {
  const x = point[0] * cosLat, y = point[1]
  const ax = start[0] * cosLat, ay = start[1]
  const bx = end[0] * cosLat, by = end[1]
  const dx = bx - ax, dy = by - ay
  const t = dx * dx + dy * dy ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy))) : 0
  return Math.hypot(x - ax - t * dx, y - ay - t * dy) * 59275
}
function simplify(points, metres) {
  const clean = points.filter((point, i) => i === 0 || point[0] !== points[i - 1][0] || point[1] !== points[i - 1][1])
  const keep = new Uint8Array(clean.length)
  keep[0] = keep[clean.length - 1] = 1
  const stack = [[0, clean.length - 1]]
  const cosLat = Math.cos(clean[0][1] * Math.PI / 180)
  while (stack.length) {
    const [a, b] = stack.pop()
    let farthest = 0, index = -1
    for (let i = a + 1; i < b; i++) {
      const distance = perpendicular(clean[i], clean[a], clean[b], cosLat)
      if (distance > farthest) { farthest = distance; index = i }
    }
    if (farthest > metres) { keep[index] = 1; stack.push([a, index], [index, b]) }
  }
  return clean.filter((_, i) => keep[i]).map(([lon, lat]) => [Number(lon.toFixed(7)), Number(lat.toFixed(7))])
}
function rover(id, prefix, name, missionUrl, model) {
  const traverse = read(`${root}${prefix}_traverse.json`)
  const current = read(`${root}${prefix}_waypoints_current.json`).features[0]
  const p = current.properties
  const coordinates = simplify(flatten(traverse.features), 4)
  console.log(name, 'vertices', coordinates.length, 'latest sol', p.sol)
  return { id, name, type: 'observed', coordinates,
    latest: [p.lon, p.lat], sol: p.sol, distanceKm: p.dist_km,
    model, missionUrl, retrieved: '2026-11-14',
    sourceUrl: `https://mars.nasa.gov/mmgis-maps/${prefix}/Layers/json/${prefix}_traverse.json`,
  }
}
const routes = {
  perseverance: rover('perseverance', 'M20', 'Perseverance', 'https://science.nasa.gov/mission/mars-2020-perseverance/location-map/', '/mars/models/Mars/Perseverance.glb'),
  curiosity: rover('curiosity', 'MSL', 'Curiosity', 'https://science.nasa.gov/mission/msl-curiosity/location-map/', '/mars/models/Mars/Curiosity.glb'),
  watney: {
    id: 'watney', name: 'Mark Watney’s journey', type: 'fictional',
    coordinates: Array.from({ length: martian.length / 3 }, (_, i) => [martian[i * 3], martian[i * 3 + 1]]),
    missionUrl: 'https://www.jpl.nasa.gov/images/pia21555-the-entrance-to-mawrth-vallis/',
    sourceUrl: 'public/mars/Mars.czml', retrieved: '2026-11-14',
  },
}
fs.writeFileSync('src/data/marsRoutes.json', JSON.stringify(routes))
