import { GAME_METERS_PER_UNIT, gameToLonLat, lonLatToGame, straightLineMetres, TRAVERSE_WAYPOINTS } from './marsGeo.js'
import { getGeologyAt } from '../data/sim3464.js'

export const MAP_SIZE = { width: 2400, height: 1800 }
export const CAMP = { x: 2220, y: 1050 }
export const START = { x: 2100, y: 1050 }
export const SAVE_KEY = 'orbital-mars-expedition-v1'
export const SCAN_RANGES = [0, 100, 155, 215]

const siteStories = [
  { id: 'basalt', name: 'Basalt outcrop', type: 'Rock formation', icon: 'rock', x: 1400, y: 930, color: '#e1ac7e', sample: 'Volcanic rock', fact: 'Some rocks studied by Perseverance in Jezero Crater formed from cooling molten rock. Studying their minerals helps scientists reconstruct the crater’s volcanic history.', source: 'https://www.jpl.nasa.gov/news/nasas-perseverance-makes-new-discoveries-in-mars-jezero-crater/' },
  { id: 'lake', name: 'Ancient lakebed', type: 'Water history', icon: 'lake', x: 1030, y: 720, color: '#acc6bf', sample: 'Lakebed sediment', fact: 'Jezero Crater once contained a lake. Layers of sediment and an ancient river delta preserve clues to the water that shaped this landscape billions of years ago. This site is dry today.', source: 'https://www.nasa.gov/missions/mars-2020-perseverance/perseverance-rover/nasas-perseverance-rover-deciphers-ancient-history-of-martian-lake/' },
  { id: 'rim', name: 'Crater rim ridge', type: 'Mountain terrain', icon: 'mountain', x: 1680, y: 460, color: '#e4c69c', sample: 'Rim rock', fact: 'An impact excavated Jezero Crater and exposed rocks in its raised rim. Those rocks can reveal parts of Mars’ history that are older than the sediments on the crater floor.', source: 'https://science.nasa.gov/resource/mars-2020-target-jezero-crater/' },
  { id: 'delta', name: 'Fossil river delta', type: 'Water history', icon: 'lake', x: 720, y: 480, color: '#acc6bf', sample: 'Delta sediment', fact: 'When a river entered Jezero’s ancient lake, it deposited a fan of sand, mud, and rock. Scientists study these sedimentary layers for evidence of past environments that could have supported microbial life.', source: 'https://science.nasa.gov/photojournal/detailed-panorama-of-mars-jezero-crater-delta/' },
  { id: 'dust', name: 'Red regolith field', type: 'Surface material', icon: 'rock', x: 800, y: 1080, color: '#e4a18a', sample: 'Iron-rich dust', fact: 'Iron minerals in Martian soil oxidize, or rust, giving much of the surface its reddish color. Loose dust and broken rock form a surface layer called regolith.', source: 'https://science.nasa.gov/mars/facts/' },
  { id: 'volcanic', name: 'Volcanic stone garden', type: 'Rock formation', icon: 'rock', x: 1540, y: 1390, color: '#c5b8d0', sample: 'Mineral specimen', fact: 'Igneous rocks record how molten material cooled. Their minerals, together with signs of later water alteration, help scientists piece together more than one chapter of Martian history.', source: 'https://www.jpl.nasa.gov/news/nasas-perseverance-makes-new-discoveries-in-mars-jezero-crater/' },
]

const stationNames = {
  basalt: 'Volcanic geology', lake: 'Ancient lake history', rim: 'Crater formation',
  delta: 'River delta history', dust: 'Martian regolith', volcanic: 'Igneous rocks',
}

export const SITES = siteStories.map(site => ({
  ...site,
  name: stationNames[site.id],
  type: 'Educational rover traverse waypoint',
  sample: 'Science note',
  ...lonLatToGame(TRAVERSE_WAYPOINTS[site.id]),
  ...TRAVERSE_WAYPOINTS[site.id],
  locationNote: 'Placed at a mapped Perseverance traverse waypoint. The science note describes Jezero generally; it does not identify this exact rock or sample.',
  coordinateSource: 'Cesium SampleData Mars.czml / PerseverancePath',
}))

// Illustrative EVA budget. Walking time uses straight-line distance because a
// validated local DEM and traversability grid have not been loaded yet.
export function planMarswalk(from, destination, returnTo = from) {
  const oneWayMetres = straightLineMetres(from, destination)
  const returnMetres = straightLineMetres(destination, returnTo)
  const walkingHours = (oneWayMetres + returnMetres) / 2500
  const activityHours = 0.25
  const reserveHours = 1
  const capacityHours = 4
  const requiredHours = walkingHours + activityHours + reserveHours
  return {
    oneWayMetres,
    roundTripMetres: oneWayMetres + returnMetres,
    walkingHours,
    activityHours,
    reserveHours,
    capacityHours,
    requiredHours,
    withinBudget: requiredHours <= capacityHours,
    oxygenPercent: Math.min(100, Math.round(requiredHours / capacityHours * 100)),
    routeType: 'Straight-line estimate; terrain obstacles and slope not evaluated',
    gameMetresPerUnit: GAME_METERS_PER_UNIT,
  }
}

export const SPECIES = [
  { id: 'dustling', name: 'Dustling', kind: 'Dust wanderer', color: '#d4b682', dark: '#796343', hp: 40, attack: 9, reward: 12, weakness: 'A careful scan exposes its dust core.', description: 'A curious little dust spirit, invented for this game. It drifts between the rocks and guards sparkling research fragments.' },
  { id: 'ferrite', name: 'Ferrite', kind: 'Stone guardian', color: '#c6a0a3', dark: '#7f5e73', hp: 52, attack: 11, reward: 16, weakness: 'Its mineral armor opens after a scan.', description: 'A fictional, rocky guardian with a surprisingly shy personality. Its shell is inspired by the colors of iron-rich minerals.' },
  { id: 'glimmer', name: 'Glimmer', kind: 'Crystal rover', color: '#a5d8c9', dark: '#568e8a', hp: 44, attack: 10, reward: 14, weakness: 'Scan the brightest crystal before pulsing.', description: 'An imagined crystal creature that flickers across the lakebed. Real Mars has no confirmed creatures like this.' },
]

export function newProgress() {
  return { mapVersion: 2, player: { ...START }, discoveries: [], scannedUnits: {}, research: 0, defeated: 0, scannerLevel: 1, suitPower: 100, beacon: false, encountered: [], destinationId: null }
}

export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)

export function movePlayer(player, direction, seconds, wind = null, suitPower = 100) {
  const length = Math.hypot(direction.x, direction.y)
  if (!length) return player
  const alignment = wind ? (direction.x * wind.x + direction.y * wind.y) / length : 0
  const factor = (wind ? Math.max(0.82, Math.min(1.12, 1 + alignment * wind.strength * 0.16)) : 1) * (suitPower < 5 ? 0.65 : 1)
  const amount = 165 * factor * Math.max(0, Math.min(seconds, 0.05)) / length
  return {
    x: Math.max(45, Math.min(MAP_SIZE.width - 45, player.x + direction.x * amount)),
    y: Math.max(45, Math.min(MAP_SIZE.height - 45, player.y + direction.y * amount)),
  }
}

export function suitPowerAfter(suitPower, player, direction, wind, seconds) {
  if (!direction.x && !direction.y) return distance(player, CAMP) < 65 ? Math.min(100, suitPower + seconds * 1.5) : suitPower
  const length = Math.hypot(direction.x, direction.y)
  const headwind = wind ? Math.max(0, -(direction.x * wind.x + direction.y * wind.y) / length) * wind.strength : 0
  return Math.max(0, suitPower - seconds * (0.26 + headwind * 0.16))
}

export function spawnCreature(player, random = Math.random, id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`) {
  const angle = random() * Math.PI * 2
  const radius = 160 + random() * 180
  const species = SPECIES[Math.min(SPECIES.length - 1, Math.floor(random() * SPECIES.length))]
  return { id, species: species.id, x: Math.max(65, Math.min(MAP_SIZE.width - 65, player.x + Math.cos(angle) * radius)), y: Math.max(65, Math.min(MAP_SIZE.height - 65, player.y + Math.sin(angle) * radius)), age: 0 }
}

export function scanSite(progress, id) {
  const site = SITES.find(item => item.id === id)
  if (!site || progress.discoveries.includes(id) || distance(progress.player, site) > SCAN_RANGES[progress.scannerLevel]) return progress
  const { longitude, latitude } = gameToLonLat(progress.player)
  const unit = getGeologyAt(longitude, latitude)
  return { ...progress, discoveries: [...progress.discoveries, id], research: progress.research + 10,
    scannedUnits: { ...progress.scannedUnits, [id]: unit ? { ...unit, longitude, latitude } : { longitude, latitude, name: 'Unmapped at this position', symbol: '—', description: 'The SIM 3464 polygon layer has no unit at this scan coordinate.' } } }
}

export function startBattle(creature) {
  const species = SPECIES.find(item => item.id === creature.species) || SPECIES[0]
  return { creature, species, enemyHp: species.hp, hp: 100, analyzed: false, turns: 0, result: null, message: 'Scan for a weak point, then use your pulse tool.' }
}

export function battleTurn(battle, action) {
  if (battle.result || !['scan', 'pulse', 'shield'].includes(action)) return battle
  let { enemyHp, hp, analyzed } = battle
  let message
  if (action === 'scan') {
    analyzed = true
    message = `Weak point found. Your next pulse does extra damage. ${battle.species.weakness}`
  } else if (action === 'pulse') {
    const damage = analyzed ? 30 : 16
    enemyHp = Math.max(0, enemyHp - damage)
    message = `Your pulse dealt ${damage} damage.${analyzed ? ' Weak point bonus!' : ' Try scanning for a stronger pulse.'}`
    analyzed = false
  } else {
    hp = Math.min(100, hp + 15)
    message = 'Shield raised. Suit integrity restored; the next hit is reduced.'
  }
  if (enemyHp === 0) return { ...battle, enemyHp, hp, analyzed, result: 'won', turns: battle.turns + 1, message: `${battle.species.name} defeated. Research fragments recovered!` }
  const hit = action === 'shield' ? 3 : battle.species.attack
  hp = Math.max(0, hp - hit)
  return { ...battle, enemyHp, hp, analyzed, turns: battle.turns + 1, result: hp === 0 ? 'lost' : null, message: hp === 0 ? 'Your safety system returned you to camp. Your discoveries are safe.' : `${message} ${battle.species.name} dealt ${hit} damage.` }
}

export function restoreProgress(value) {
  const clean = newProgress()
  if (!value || typeof value !== 'object') return clean
  const integer = (v, max = 100000) => Number.isInteger(v) && v >= 0 && v <= max
  if (Number.isFinite(value.player?.x) && Number.isFinite(value.player?.y)) {
    const player = value.mapVersion === 2 ? value.player : {
      x: CAMP.x + (value.player.x - 1200) * 2 / GAME_METERS_PER_UNIT,
      y: CAMP.y + (value.player.y - 1100) * 2 / GAME_METERS_PER_UNIT,
    }
    clean.player = { x: Math.max(45, Math.min(MAP_SIZE.width - 45, player.x)), y: Math.max(45, Math.min(MAP_SIZE.height - 45, player.y)) }
  }
  clean.discoveries = [...new Set(Array.isArray(value.discoveries) ? value.discoveries.filter(id => SITES.some(site => site.id === id)) : [])]
  if (value.scannedUnits && typeof value.scannedUnits === 'object') {
    for (const id of clean.discoveries) {
      const unit = value.scannedUnits[id]
      if (unit && typeof unit.name === 'string' && typeof unit.symbol === 'string' && Number.isFinite(unit.latitude) && Number.isFinite(unit.longitude)) clean.scannedUnits[id] = unit
    }
  }
  if (integer(value.research)) clean.research = value.research
  if (Number.isFinite(value.suitPower)) clean.suitPower = Math.max(0, Math.min(100, value.suitPower))
  if (integer(value.defeated)) clean.defeated = value.defeated
  if ([1, 2, 3].includes(value.scannerLevel)) clean.scannerLevel = value.scannerLevel
  clean.beacon = value.beacon === true && clean.discoveries.length >= 3 && clean.defeated >= 1
  clean.encountered = [...new Set(Array.isArray(value.encountered) ? value.encountered.filter(id => SPECIES.some(species => species.id === id)) : [])]
  clean.destinationId = SITES.some(site => site.id === value.destinationId) ? value.destinationId : null
  return clean
}
