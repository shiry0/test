import { CAMP, MAP_SIZE, SCAN_RANGES, SITES, SPECIES } from './marsModel'
import { PERSEVERANCE_PATH } from './marsTraverse.js'

function randomSeed(seed = 2708) {
  return () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 }
}

function contour(ctx, x, y, radius, stretch, seed, fill) {
  ctx.beginPath()
  for (let i = 0; i <= 80; i++) {
    const angle = i / 80 * Math.PI * 2
    const r = radius * (1 + Math.sin(angle * 3 + seed) * 0.07 + Math.cos(angle * 7) * 0.025)
    const px = x + Math.cos(angle) * r
    const py = y + Math.sin(angle) * r * stretch
    if (!i) ctx.moveTo(px, py); else ctx.lineTo(px, py)
  }
  ctx.closePath()
  if (fill) { ctx.fillStyle = fill; ctx.fill() }
  ctx.stroke()
}

export function createTerrain() {
  const canvas = document.createElement('canvas')
  canvas.width = MAP_SIZE.width; canvas.height = MAP_SIZE.height
  const ctx = canvas.getContext('2d')
  const random = randomSeed()
  ctx.fillStyle = '#a46649'; ctx.fillRect(0, 0, canvas.width, canvas.height)
  // A synthetic topographic play area, rather than a geographic basemap.
  for (let y = 0; y < canvas.height; y += 18) for (let x = 0; x < canvas.width; x += 18) {
    const h = Math.sin(x / 280 + Math.sin(y / 330)) + Math.cos(y / 190 + x / 500)
    ctx.fillStyle = h > 1 ? '#ac7050' : h < -1 ? '#9d6045' : '#a56a4a'
    ctx.fillRect(x, y, 18, 18)
  }
  // Dry lake basin and sediment terraces; no modern lake is depicted.
  ctx.lineWidth = 2; ctx.strokeStyle = '#765d4d75'
  contour(ctx, 930, 680, 330, 0.62, 32, '#938475')
  for (let r = 300; r >= 50; r -= 35) contour(ctx, 930, 680, r, 0.62, 32, r === 300 ? '#9e9180' : null)
  ctx.strokeStyle = '#b8ad9460'; ctx.lineWidth = 3
  for (let r = 270; r > 50; r -= 55) contour(ctx, 930, 680, r, 0.62, 32)
  // Branching, fossil channels feed the basin from the northwest.
  ctx.lineCap = 'round'
  for (const offset of [-100, -50, 0, 60, 110]) {
    ctx.beginPath(); ctx.moveTo(370 + offset, 220); ctx.bezierCurveTo(510, 460 + offset, 680 + offset, 380, 910, 650 + offset)
    ctx.strokeStyle = '#776b5c'; ctx.lineWidth = 17; ctx.stroke()
    ctx.strokeStyle = '#b2a18a'; ctx.lineWidth = 7; ctx.stroke()
  }
  // A compressed rim ridge with nested elevation contours.
  ctx.strokeStyle = '#744a38'; ctx.lineWidth = 3
  for (let r = 440; r >= 50; r -= 27) {
    const shade = Math.round(140 + (440 - r) * 0.13)
    contour(ctx, 1790, 380, r, 0.68, 7, `rgb(${shade + 28},${shade - 19},${shade - 52})`)
  }
  ctx.strokeStyle = '#e2bd8940'; ctx.lineWidth = 1.5
  for (let r = 420; r >= 60; r -= 27) contour(ctx, 1790, 377, r, 0.68, 7)
  // Old impact craters, kept shallow enough for a freely walkable prototype.
  for (const [x, y, r] of [[470, 1290, 185], [1930, 1280, 255], [500, 650, 95], [1250, 1520, 85], [2070, 770, 90]]) {
    ctx.strokeStyle = '#6a45354a'; ctx.lineWidth = 13; contour(ctx, x + 8, y + 10, r, 0.72, 3, '#935e45')
    ctx.strokeStyle = '#d2a175'; ctx.lineWidth = 9; contour(ctx, x - 4, y - 4, r, 0.72, 3)
    ctx.strokeStyle = '#80533b'; ctx.lineWidth = 2; contour(ctx, x, y, r * 0.8, 0.72, 3)
  }
  // Wind-carved streaks and scattered surface stones.
  for (let i = 0; i < 950; i++) {
    const x = random() * canvas.width; const y = random() * canvas.height
    ctx.strokeStyle = random() > 0.5 ? '#e8be8f17' : '#50362917'; ctx.lineWidth = 1 + random() * 2
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 10 + random() * 18, y - 3 - random() * 5); ctx.stroke()
  }
  for (let i = 0; i < 230; i++) {
    const x = random() * canvas.width; const y = random() * canvas.height; const r = 3 + random() * 8
    ctx.fillStyle = '#543b2c38'; ctx.beginPath(); ctx.ellipse(x + 4, y + 5, r * 1.4, r * 0.65, 0, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = random() > 0.6 ? '#6d5b52' : '#b58b68'; ctx.beginPath(); ctx.moveTo(x - r, y); ctx.lineTo(x - r * 0.4, y - r); ctx.lineTo(x + r * 0.7, y - r * 0.8); ctx.lineTo(x + r, y + 1); ctx.lineTo(x, y + r * 0.4); ctx.closePath(); ctx.fill()
    ctx.strokeStyle = '#dec29b55'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - r, y); ctx.lineTo(x - r * 0.4, y - r); ctx.lineTo(x + r * 0.7, y - r * 0.8); ctx.stroke()
  }
  ctx.fillStyle = '#432f27'; ctx.font = '600 18px Manrope, sans-serif'; ctx.globalAlpha = 0.45
  ctx.fillText('ILLUSTRATED JEZERO TRAVERSE', 720, 150)
  ctx.font = '12px Manrope, sans-serif'; ctx.fillText('ANCIENT BASIN', 850, 810); ctx.fillText('CRATER HIGHLANDS', 1710, 190); ctx.fillText('SOUTHERN REGOLITH', 1430, 1620)
  ctx.globalAlpha = 1
  return canvas
}

const astronaut = [
  '....WWWW....', '...WLLLLW...', '..WLLVLLLW..', '..WLVVVVLW..', '..WLVVVVLW..', '...WLLLLW...', '....WWWW....', '..WWOOOOHH..', '.WWHWOOWHHH.', '.WWHWWWW.HH.', '.WW.WWWW.HH.', '....WWWW....', '....W..W....', '...WW..WW...', '...DD..DD...',
]
const creatures = {
  dustling: ['....CC....','...CCCC...','..CCLCCC..','.CCCCCCCC.','CCBCCCBCCC','CCBCCCBCCC','.CCCCCCCC.','..CCDDCC..','.CC....CC.','..C....C..'],
  ferrite: ['...DDDD...','..DCCCCD..','.DCLCCCCD.','DCCCCCCCCD','DCCBCCBCCD','.DCCCCCCD.','..DCCCCD..','..DCDCCD..','.DD....DD.'],
  glimmer: ['....L.....','...LCL....','..LCCCL...','.DCCCCCD..','DCCCCCCCD.','.CBCCBCC..','..CCCCCC..','...DCCD...','..DD..DD..'],
}

export function drawSprite(ctx, kind, x, y, scale = 3, moving = false, time = 0) {
  const rows = kind === 'astronaut' ? astronaut : creatures[kind] || creatures.dustling
  const species = SPECIES.find(s => s.id === kind)
  const palette = { W: '#ebe8d9', L: '#e1dec8', V: '#304c61', O: '#dc8c57', H: '#899b9a', D: species?.dark || '#464b4d', C: species?.color || '#d4b682', B: '#253541' }
  if (kind === 'glimmer') palette.L = '#e1f9e5'
  const width = rows[0].length * scale; const height = rows.length * scale
  ctx.fillStyle = '#332b2745'; ctx.beginPath(); ctx.ellipse(x + 3, y + 5, width * 0.48, 5, 0, 0, Math.PI * 2); ctx.fill()
  ctx.imageSmoothingEnabled = false
  rows.forEach((row, iy) => [...row].forEach((pixel, ix) => {
    if (pixel === '.') return
    ctx.fillStyle = palette[pixel]
    const step = kind === 'astronaut' && moving && iy >= 12 ? (ix < 6 ? 1 : -1) * Math.sin(time * 14) * 2 : 0
    ctx.fillRect(Math.round(x - width / 2 + ix * scale), Math.round(y - height + iy * scale + step), scale, scale)
  }))
}

function pin(ctx, site, discovered, nearest, time) {
  const { x, y } = site
  ctx.strokeStyle = discovered ? '#cce3bd' : '#efdbb8'; ctx.lineWidth = 1.5
  ctx.fillStyle = '#372e27'; ctx.beginPath(); ctx.arc(x, y, 17, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
  ctx.strokeStyle = site.color; ctx.lineWidth = 2
  ctx.beginPath()
  if (site.icon === 'mountain') { ctx.moveTo(x - 8, y + 5); ctx.lineTo(x, y - 7); ctx.lineTo(x + 8, y + 5); ctx.closePath() }
  else if (site.icon === 'lake') { for (let i = -1; i <= 1; i++) { ctx.moveTo(x - 7, y + i * 5); ctx.quadraticCurveTo(x - 3, y + i * 5 - 4, x + 1, y + i * 5); ctx.quadraticCurveTo(x + 5, y + i * 5 + 4, x + 8, y + i * 5) } }
  else { ctx.moveTo(x - 7, y + 5); ctx.lineTo(x - 5, y - 4); ctx.lineTo(x + 2, y - 7); ctx.lineTo(x + 8, y + 3); ctx.closePath() }
  ctx.stroke()
  if (nearest) { ctx.strokeStyle = '#fff1d980'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, 23, 0, Math.PI * 2); ctx.stroke() }
  const label = `${discovered ? '✓ ' : ''}${site.name}`
  ctx.font = '600 11px Manrope, sans-serif'; const width = ctx.measureText(label).width
  ctx.fillStyle = '#302b27d9'; ctx.fillRect(x - width / 2 - 10, y + 25, width + 20, 24)
  ctx.textAlign = 'center'; ctx.fillStyle = discovered ? '#d4e6bf' : '#f1e5cd'; ctx.fillText(label, x, y + 41); ctx.textAlign = 'left'
}

function questDiamond(ctx, x, y, radius, time, reducedMotion) {
  ctx.save()
  ctx.translate(x, y)
  if (!reducedMotion) {
    const phase = time % 1.6 / 1.6
    ctx.strokeStyle = `rgba(255,233,189,${(1 - phase) * .7})`
    ctx.lineWidth = 2
    ctx.beginPath(); ctx.arc(0, 0, radius + 5 + phase * 16, 0, Math.PI * 2); ctx.stroke()
  }
  ctx.fillStyle = '#24352fe8'; ctx.strokeStyle = '#fff5df'; ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(0, -radius); ctx.lineTo(radius * .78, 0); ctx.lineTo(0, radius); ctx.lineTo(-radius * .78, 0); ctx.closePath()
  ctx.fill(); ctx.stroke()
  ctx.fillStyle = '#f3b77e'
  ctx.beginPath(); ctx.moveTo(0, -radius * .55); ctx.lineTo(radius * .43, 0); ctx.lineTo(0, radius * .55); ctx.lineTo(-radius * .43, 0); ctx.closePath(); ctx.fill()
  ctx.restore()
}

export function renderMap(ctx, terrain, state, creatures, camera, size, target, time, moving, reducedMotion, wind, showLandingMarker = true, routeOverview = false) {
  const { width, height, scale, dpr } = size
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = '#543a2c'; ctx.fillRect(0, 0, width, height)
  ctx.save(); ctx.translate(width / 2, height / 2); ctx.scale(scale, scale); ctx.translate(-camera.x, -camera.y)
  ctx.drawImage(terrain, 0, 0)
  if (routeOverview) {
    ctx.beginPath()
    PERSEVERANCE_PATH.forEach(({ x, y }, index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y))
    ctx.strokeStyle = '#eed6b980'; ctx.lineWidth = 1.5 / scale
    ctx.setLineDash([3 / scale, 7 / scale]); ctx.stroke(); ctx.setLineDash([])
  }
  if (wind && !reducedMotion) {
    ctx.save()
    ctx.strokeStyle = `rgba(244,216,172,${0.12 + wind.strength * 0.16})`
    ctx.lineWidth = 1
    const drift = time * (23 + wind.strength * 34)
    for (let i = 0; i < 95; i++) {
      const x = (i * 433.17 + drift * wind.x + 10000) % MAP_SIZE.width
      const y = (i * 197.83 + drift * wind.y + 10000) % MAP_SIZE.height
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + wind.x * (9 + wind.strength * 15), y + wind.y * (9 + wind.strength * 15)); ctx.stroke()
    }
    if (wind.dustDevil) {
      const x = 850 + wind.phase * 750, y = 1150 - wind.phase * 360
      ctx.strokeStyle = '#efd5ad77'; ctx.lineWidth = 2
      for (let i = 0; i < 5; i++) {
        const r = 12 + i * 10 + Math.sin(time * 6 + i) * 3
        ctx.beginPath(); ctx.ellipse(x, y - i * 10, r, r * .42, -0.3, i * .2, Math.PI * 1.7 + i * .2); ctx.stroke()
      }
    }
    ctx.restore()
  }
  if (target) {
    ctx.strokeStyle = '#f1dfb6a8'; ctx.lineWidth = 2; ctx.setLineDash([4, 9]); ctx.beginPath(); ctx.moveTo(state.player.x, state.player.y); ctx.lineTo(target.x, target.y); ctx.stroke(); ctx.setLineDash([])
    ctx.strokeStyle = '#f1dfb6'; ctx.beginPath(); ctx.arc(target.x, target.y, 8, 0, Math.PI * 2); ctx.stroke()
  }
  // Scanner range is measured in synthetic game-map units.
  ctx.fillStyle = '#fae1a00b'; ctx.strokeStyle = '#ffe2a13b'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(state.player.x, state.player.y, SCAN_RANGES[state.scannerLevel], 0, Math.PI * 2); ctx.fill(); ctx.stroke()
  for (const site of SITES) pin(ctx, site, state.discoveries.includes(site.id), Math.hypot(site.x - state.player.x, site.y - state.player.y) <= SCAN_RANGES[state.scannerLevel], time)
  ctx.fillStyle = '#363932'; ctx.fillRect(CAMP.x - 27, CAMP.y - 14, 54, 28)
  ctx.fillStyle = state.beacon ? '#bbdcb3' : '#b2b5a3'; ctx.fillRect(CAMP.x - 22, CAMP.y - 26, 44, 22)
  ctx.strokeStyle = '#e9dec0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(CAMP.x, CAMP.y - 26); ctx.lineTo(CAMP.x, CAMP.y - 65); ctx.stroke()
  ctx.fillStyle = state.beacon ? '#bce7b8' : '#e9b27e'; ctx.beginPath(); ctx.arc(CAMP.x, CAMP.y - 68, 5, 0, Math.PI * 2); ctx.fill()
  if (state.beacon) { ctx.strokeStyle = '#d6eebd88'; ctx.lineWidth = 1; for (const r of [15, 25, 35]) { ctx.beginPath(); ctx.arc(CAMP.x, CAMP.y - 68, r, -0.9, 0.9); ctx.stroke() } }
  ctx.font = '600 10px Manrope, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#f3e4c8'
  if (showLandingMarker) ctx.fillText(state.beacon ? 'SURVEY BEACON · ONLINE' : 'LANDING CAMP', CAMP.x, CAMP.y + 34)
  if (showLandingMarker) {
    ctx.strokeStyle = '#fff4df'; ctx.lineWidth = 3
    ctx.fillStyle = '#e99a69'; ctx.beginPath(); ctx.arc(CAMP.x, CAMP.y - 53, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
    ctx.fillStyle = '#26332ee8'; ctx.fillRect(CAMP.x - 67, CAMP.y - 94, 134, 22)
    ctx.fillStyle = '#fff3dd'; ctx.font = '700 10px Manrope, sans-serif'
    ctx.fillText('LANDING SITE', CAMP.x, CAMP.y - 79)
  }
  ctx.textAlign = 'left'
  for (const creature of creatures) {
    const species = SPECIES.find(s => s.id === creature.species)
    const bob = reducedMotion ? 0 : Math.sin(time * 2 + creature.x) * 2
    drawSprite(ctx, creature.species, creature.x, creature.y + bob, 3)
    ctx.fillStyle = '#352d27d9'; ctx.fillRect(creature.x - 33, creature.y + 12, 66, 18)
    ctx.fillStyle = species.color; ctx.font = '600 9px Manrope, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(species.name, creature.x, creature.y + 25); ctx.textAlign = 'left'
  }
  drawSprite(ctx, 'astronaut', state.player.x, state.player.y, 3, moving && !reducedMotion, time)
  ctx.restore()
  const rover = PERSEVERANCE_PATH.at(-1)
  const roverX = width / 2 + (rover.x - camera.x) * scale
  const roverY = height / 2 + (rover.y - camera.y) * scale
  const visible = roverX > 30 && roverX < width - 30 && roverY > 130 && roverY < height - 115
  const playerX = width / 2 + (state.player.x - camera.x) * scale
  const playerY = height / 2 + (state.player.y - camera.y) * scale
  const direction = Math.atan2(roverY - playerY, roverX - playerX)
  const markerX = visible ? roverX : Math.max(35, Math.min(width - 35, playerX + Math.cos(direction) * 82))
  const markerY = visible ? roverY : Math.max(140, Math.min(height - 125, playerY + Math.sin(direction) * 82))
  questDiamond(ctx, markerX, markerY, 12, time, reducedMotion)
  ctx.fillStyle = '#16241fe8'; ctx.fillRect(markerX - 57, markerY + 18, 114, 20)
  ctx.fillStyle = '#fff2d9'; ctx.font = '700 10px Manrope, sans-serif'; ctx.textAlign = 'center'
  ctx.fillText(visible ? 'PERSEVERANCE' : 'ROVER WAYPOINT', markerX, markerY + 32)
  ctx.textAlign = 'left'
  if (!visible) {
    ctx.save(); ctx.translate(markerX + Math.cos(direction) * 28, markerY + Math.sin(direction) * 28); ctx.rotate(direction)
    ctx.fillStyle = '#fff2d9'; ctx.beginPath(); ctx.moveTo(7, 0); ctx.lineTo(-4, -5); ctx.lineTo(-4, 5); ctx.closePath(); ctx.fill(); ctx.restore()
  }
}

export function renderMinimap(canvas, terrain, state, creatures, showLandingMarker = true, time = 0, reducedMotion = false) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const center = canvas.width / 2, radius = center - 5, scale = .2
  const at = point => ({ x: center + (point.x - state.player.x) * scale, y: center + (point.y - state.player.y) * scale })
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.save(); ctx.beginPath(); ctx.arc(center, center, radius, 0, Math.PI * 2); ctx.clip()
  ctx.fillStyle = '#74513e'; ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.save(); ctx.translate(center, center); ctx.scale(scale, scale); ctx.translate(-state.player.x, -state.player.y); ctx.drawImage(terrain, 0, 0); ctx.restore()
  ctx.fillStyle = '#152a2422'; ctx.fillRect(0, 0, canvas.width, canvas.height)
  SITES.forEach(site => { const point = at(site); ctx.fillStyle = state.discoveries.includes(site.id) ? '#cce8b5' : '#f4c99d'; ctx.beginPath(); ctx.arc(point.x, point.y, 3, 0, Math.PI * 2); ctx.fill() })
  creatures.forEach(creature => { const point = at(creature); ctx.fillStyle = '#f1b2ad'; ctx.fillRect(point.x - 2, point.y - 2, 4, 4) })
  if (showLandingMarker) {
    const landing = at(CAMP)
    ctx.fillStyle = '#e99a69'; ctx.strokeStyle = '#fff4df'; ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.arc(landing.x, landing.y, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
  }
  const rover = at(PERSEVERANCE_PATH.at(-1))
  const dx = rover.x - center, dy = rover.y - center, length = Math.hypot(dx, dy)
  const limit = radius - 18
  const marker = length > limit ? { x: center + dx / length * limit, y: center + dy / length * limit } : rover
  questDiamond(ctx, marker.x, marker.y, 8, time, reducedMotion)
  ctx.fillStyle = '#fff9eb'; ctx.beginPath(); ctx.moveTo(center, center - 7); ctx.lineTo(center - 5, center + 6); ctx.lineTo(center + 5, center + 6); ctx.closePath(); ctx.fill()
  ctx.restore()
  ctx.strokeStyle = '#d3e8d2'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(center, center, radius - 1, 0, Math.PI * 2); ctx.stroke()
  ctx.fillStyle = '#f5eddf'; ctx.font = '700 11px Manrope, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('N', center, 17); ctx.textAlign = 'left'
}
