// The illustrated game map spans Perseverance's bundled traverse. Coordinates
// are planetocentric latitude and east longitude on the Mars 2000 sphere.
export const MARS_RADIUS_M = 3396190
export const LANDING = { longitude: 77.45088572, latitude: 18.44462715 }
export const GAME_METERS_PER_UNIT = 6.5
export const GAME_ORIGIN = { x: 2220, y: 1050 }
const metresPerDegree = 2 * Math.PI * MARS_RADIUS_M / 360
const longitudeMetresPerDegree = metresPerDegree * Math.cos(LANDING.latitude * Math.PI / 180)

export function gameToLonLat({ x, y }) {
  return {
    longitude: LANDING.longitude + (x - GAME_ORIGIN.x) * GAME_METERS_PER_UNIT / longitudeMetresPerDegree,
    latitude: LANDING.latitude - (y - GAME_ORIGIN.y) * GAME_METERS_PER_UNIT / metresPerDegree,
  }
}

export function lonLatToGame({ longitude, latitude }) {
  return {
    x: GAME_ORIGIN.x + (longitude - LANDING.longitude) * longitudeMetresPerDegree / GAME_METERS_PER_UNIT,
    y: GAME_ORIGIN.y - (latitude - LANDING.latitude) * metresPerDegree / GAME_METERS_PER_UNIT,
  }
}

export function straightLineMetres(a, b) {
  const dx = (a.x - b.x) * GAME_METERS_PER_UNIT
  const dy = (a.y - b.y) * GAME_METERS_PER_UNIT
  return Math.hypot(dx, dy)
}

// The coordinate source is the bundled Cesium SampleData PerseverancePath
// CZML. These are traverse waypoints, not verified sample or outcrop positions.
export const TRAVERSE_WAYPOINTS = {
  basalt: { longitude: 77.45258735, latitude: 18.44412598, elevation: -2568.81 },
  lake: { longitude: 77.45031774, latitude: 18.4417782, elevation: -2568.672852 },
  rim: { longitude: 77.44941141, latitude: 18.43957131, elevation: -2568.958984 },
  delta: { longitude: 77.45214885, latitude: 18.4311366, elevation: -2580.235 },
  dust: { longitude: 77.44332408, latitude: 18.4312302, elevation: -2574.186 },
  volcanic: { longitude: 77.45432473, latitude: 18.44899614, elevation: -2569.756 },
}
