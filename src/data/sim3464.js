import units from './sim3464Units.json' with { type: 'json' }

export const SIM3464_SOURCE = 'https://pubs.usgs.gov/publication/sim3464'
export const SIM3464_BOUNDS = units.bounds
export const SIM3464_IMAGE = '/jezero/sim3464-geology.png'

const descriptions = {
  Njf: 'Rugged, moderately to heavily cratered Jezero floor. The map describes its surface form and contacts; it does not identify a rock specimen here.',
  NHjf1: 'Light-toned, sparsely cratered fan deposit on the northwest crater floor, with local meter-scale stratification.',
  NHjf2: 'Stratified western fan deposit at the mouth of Neretva Vallis, with scarps and overlapping lobes.',
  Nle: 'Rugged lower etched terrain with long northeast–southwest ridges adjacent to the Jezero floor.',
  Nue: 'Upper etched terrain mapped around the crater floor.',
  Aeb: 'Eolian bedforms: surface deposits shaped by wind.',
}

function inRing(point, ring) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j]
    if ((yi > point[1]) !== (yj > point[1]) && point[0] < (xj - xi) * (point[1] - yi) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

function inPolygon(point, polygon) {
  return inRing(point, polygon[0]) && !polygon.slice(1).some(hole => inRing(point, hole))
}

export function getGeologyAt(longitude, latitude) {
  const point = [longitude, latitude]
  const match = units.features.find(feature => {
    const { type, coordinates } = feature.geometry
    return (type === 'Polygon' ? [coordinates] : coordinates).some(polygon => inPolygon(point, polygon))
  })
  if (!match) return null
  return { ...match.properties, description: descriptions[match.properties.symbol] || 'Mapped geologic unit in the Jezero and Nili Planum region.' }
}
