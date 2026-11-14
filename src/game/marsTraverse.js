import routes from '../data/marsRoutes.js'
import { lonLatToGame } from './marsGeo.js'

// Geographic rover waypoints are projected into the illustrated game world.
export const PERSEVERANCE_PATH = routes.perseverance.coordinates.map(([longitude, latitude]) =>
  lonLatToGame({ longitude, latitude }))

export const PERSEVERANCE_BOUNDS = {
  minX: Math.min(...PERSEVERANCE_PATH.map(point => point.x)),
  maxX: Math.max(...PERSEVERANCE_PATH.map(point => point.x)),
  minY: Math.min(...PERSEVERANCE_PATH.map(point => point.y)),
  maxY: Math.max(...PERSEVERANCE_PATH.map(point => point.y)),
}

