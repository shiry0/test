import test from 'node:test'
import assert from 'node:assert/strict'
import { battleTurn, CAMP, distance, MAP_SIZE, movePlayer, newProgress, planMarswalk, restoreProgress, SCAN_RANGES, scanSite, SITES, spawnCreature, startBattle, suitPowerAfter } from '../src/game/marsModel.js'
import { gameToLonLat } from '../src/game/marsGeo.js'
import { getGeologyAt } from '../src/data/sim3464.js'
import { windAt } from '../src/game/marsWeather.js'
import { PERSEVERANCE_PATH } from '../src/game/marsTraverse.js'

test('official geologic polygon lookup identifies the Jezero landing area', () => {
  const unit = getGeologyAt(77.45088572, 18.44462715)
  assert.equal(unit?.symbol, 'Njf')
  assert.equal(unit?.name, 'Jezero floor unit')
  assert.equal(getGeologyAt(0, 0), null)
})

test('wind changes walking pace and headwind costs more suit power', () => {
  const wind = windAt(10)
  const start = { x: 1200, y: 900 }
  const tailwind = movePlayer(start, { x: wind.x, y: wind.y }, .05, wind)
  const headwind = movePlayer(start, { x: -wind.x, y: -wind.y }, .05, wind)
  assert.ok(distance(start, tailwind) > distance(start, headwind))
  assert.ok(suitPowerAfter(100, start, { x: -wind.x, y: -wind.y }, wind, 1) < suitPowerAfter(100, start, { x: wind.x, y: wind.y }, wind, 1))
  assert.ok(suitPowerAfter(50, CAMP, { x: 0, y: 0 }, wind, 1) > 50)
})

test('mapped traverse waypoints round trip between Mars and game coordinates', () => {
  for (const site of SITES) {
    assert.ok(site.x >= 45 && site.x <= MAP_SIZE.width - 45)
    assert.ok(site.y >= 45 && site.y <= MAP_SIZE.height - 45)
    const geographic = gameToLonLat(site)
    assert.ok(Math.abs(geographic.longitude - site.longitude) < 1e-10)
    assert.ok(Math.abs(geographic.latitude - site.latitude) < 1e-10)
  }
})

test('Perseverance traverse and rover destination fit the game map', () => {
  const xs = PERSEVERANCE_PATH.map(point => point.x)
  const ys = PERSEVERANCE_PATH.map(point => point.y)
  assert.ok(Math.min(...xs) >= 45 && Math.max(...xs) <= MAP_SIZE.width - 45)
  assert.ok(Math.min(...ys) >= 45 && Math.max(...ys) <= MAP_SIZE.height - 45)
  assert.ok(Math.max(...xs) - Math.min(...xs) > MAP_SIZE.width * .8)
})

test('saved explorer position migrates to the wider traverse map', () => {
  const old = { ...newProgress(), mapVersion: undefined, player: { x: 1200, y: 1100 } }
  assert.deepEqual(restoreProgress(old).player, CAMP)
})

test('EVA planning includes the destination, camp return, activity, and reserve', () => {
  const plan = planMarswalk({ x: CAMP.x, y: CAMP.y - 100 }, SITES[0], CAMP)
  assert.ok(plan.oneWayMetres > 0)
  assert.ok(plan.roundTripMetres > plan.oneWayMetres)
  assert.equal(plan.activityHours, 0.25)
  assert.equal(plan.reserveHours, 1)
  assert.equal(plan.withinBudget, plan.requiredHours <= plan.capacityHours)
})

test('walking is consistent diagonally and stays within map bounds', () => {
  const start = { x: 1000, y: 1000 }
  assert.ok(Math.abs(distance(start, movePlayer(start, { x: 1, y: 1 }, 0.03)) - distance(start, movePlayer(start, { x: 1, y: 0 }, 0.03))) < 1e-8)
  assert.deepEqual(movePlayer({ x: 45, y: 45 }, { x: -1, y: -1 }, 0.05), { x: 45, y: 45 })
  assert.deepEqual(movePlayer({ x: MAP_SIZE.width - 45, y: MAP_SIZE.height - 45 }, { x: 1, y: 1 }, 0.05), { x: MAP_SIZE.width - 45, y: MAP_SIZE.height - 45 })
  assert.deepEqual(movePlayer(start, { x: 0, y: 0 }, 0.05), start)
})

test('a landmark requires proximity and rewards a discovery only once', () => {
  const fresh = newProgress(), site = SITES[0]
  assert.equal(scanSite(fresh, site.id), fresh)
  const nearby = { ...fresh, player: { x: site.x - SCAN_RANGES[1], y: site.y } }
  const scanned = scanSite(nearby, site.id)
  assert.equal(scanned.research, 10)
  assert.deepEqual(scanned.discoveries, [site.id])
  assert.equal(scanSite(scanned, site.id), scanned)
  assert.equal(scanSite(scanned, 'invalid-site'), scanned)
})

test('scanner upgrades extend usable discovery range', () => {
  const site = SITES[0]
  const progress = { ...newProgress(), player: { x: site.x - 180, y: site.y } }
  assert.equal(scanSite(progress, site.id), progress)
  assert.equal(scanSite({ ...progress, scannerLevel: 3 }, site.id).discoveries.length, 1)
})

test('random creature spawns stay in the playable area and select valid species', () => {
  let n = 1
  const random = () => { n = (n * 16807) % 2147483647; return n / 2147483647 }
  for (const player of [{ x: 45, y: 45 }, { x: 2355, y: 1755 }, { x: 1200, y: 900 }]) for (let i = 0; i < 30; i++) {
    const creature = spawnCreature(player, random, `test-${i}`)
    assert.ok(creature.x >= 65 && creature.x <= MAP_SIZE.width - 65)
    assert.ok(creature.y >= 65 && creature.y <= MAP_SIZE.height - 65)
    assert.ok(['dustling', 'ferrite', 'glimmer'].includes(creature.species))
  }
})

test('scan boosts a pulse and completed encounters cannot take more turns', () => {
  const initial = startBattle({ id: 'test', species: 'dustling', x: 0, y: 0 })
  const plain = battleTurn(initial, 'pulse')
  const scanned = battleTurn(initial, 'scan')
  const boosted = battleTurn(scanned, 'pulse')
  assert.equal(initial.enemyHp - plain.enemyHp, 16)
  assert.equal(initial.enemyHp - boosted.enemyHp, 30)
  assert.equal(boosted.analyzed, false)
  const win = battleTurn(boosted, 'pulse')
  assert.equal(win.result, 'won')
  assert.equal(win.enemyHp, 0)
  assert.equal(battleTurn(win, 'pulse'), win)
})

test('shield restores integrity without exceeding maximum and defeats are recoverable', () => {
  const initial = startBattle({ id: 'test', species: 'ferrite' })
  assert.equal(battleTurn(initial, 'shield').hp, 97)
  assert.ok(battleTurn({ ...initial, hp: 30 }, 'shield').hp > 30)
  const lost = battleTurn({ ...initial, hp: 1 }, 'pulse')
  assert.equal(lost.result, 'lost')
  assert.equal(lost.hp, 0)
  assert.equal(battleTurn(lost, 'shield'), lost)
})

test('saved progress round trips and invalid values are sanitized', () => {
  const saved = { ...newProgress(), discoveries: ['basalt', 'lake', 'rim'], research: 42, defeated: 2, scannerLevel: 2, beacon: true, encountered: ['dustling'], destinationId: 'lake' }
  assert.deepEqual(restoreProgress(JSON.parse(JSON.stringify(saved))), saved)
  const bad = restoreProgress({ player: { x: Infinity, y: NaN }, discoveries: ['bad', 'basalt', 'basalt'], research: -50, defeated: '1', scannerLevel: 99, beacon: true, encountered: ['bad'] })
  assert.deepEqual(bad.discoveries, ['basalt'])
  assert.equal(bad.research, 0)
  assert.equal(bad.beacon, false)
  assert.equal(bad.scannerLevel, 1)
  assert.deepEqual(restoreProgress(null), newProgress())
})
