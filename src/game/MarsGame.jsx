import { useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ArrowUpRight, BookOpen, Check, ChevronRight, Compass, Gem, HelpCircle, Home, MapPin, Mountain, Orbit, Pause, Play, Radio, RotateCcw, ScanLine, Shield, Sparkles, Waves, X, Zap } from 'lucide-react'
import { battleTurn, CAMP, distance, MAP_SIZE, movePlayer, newProgress, planMarswalk, restoreProgress, SAVE_KEY, SCAN_RANGES, scanRangeFor, scanSite, SITES, spawnCreature, SPECIES, startBattle, suitPowerAfter } from './marsModel'
import { createTerrain, drawSprite, renderMap, renderMinimap } from './marsRenderer'
import { SIM3464_SOURCE } from '../data/sim3464'
import { windAt } from './marsWeather'
import { GAME_METERS_PER_UNIT } from './marsGeo'
import { PERSEVERANCE_BOUNDS } from './marsTraverse'
import './mars.css'
import './marsOverlays.css'
import './marsScience.css'

const siteIcons = { rock: Gem, lake: Waves, mountain: Mountain }
const movementKeys = new Set(['w', 'a', 's', 'd', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright'])
let sessionProgress = null
let sessionOnly = false

function loadProgress() {
  let saved
  try { saved = localStorage.getItem(SAVE_KEY) }
  catch { return { progress: restoreProgress(sessionProgress), available: false } }
  if (sessionProgress) return { progress: restoreProgress(sessionProgress), available: !sessionOnly }
  try { return { progress: restoreProgress(JSON.parse(saved)), available: !sessionOnly } }
  catch { return { progress: newProgress(), available: !sessionOnly } }
}

function interactionFor(progress, creatures) {
  if (!progress.beacon && progress.discoveries.length >= 3 && progress.defeated >= 1 && distance(progress.player, CAMP) < 95) return { type: 'camp', item: CAMP, distance: distance(progress.player, CAMP) }
  const options = [
    ...SITES.map(item => ({ type: 'site', item, distance: distance(progress.player, item), range: scanRangeFor(item, progress.scannerLevel) })),
    ...creatures.map(item => ({ type: 'creature', item, distance: distance(progress.player, item), range: 95 })),
  ]
  const priority = option => {
    if (option.type === 'creature') return 2
    const recorded = progress.discoveries.includes(option.item.id)
    if (recorded) return option.item.isSampleSite ? 4 : 5
    if (option.item.isSampleSite) return option.item.id === progress.destinationId ? -1 : 0
    return 3
  }
  return options.filter(item => item.distance <= item.range).sort((a, b) => priority(a) - priority(b) || a.distance - b.distance)[0] || null
}

function Sprite({ species, className = '' }) {
  const ref = useRef()
  useEffect(() => {
    const ctx = ref.current.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, 140, 130)
    drawSprite(ctx, species, 70, 111, species === 'astronaut' ? 6 : 8)
  }, [species])
  return <canvas ref={ref} width="140" height="130" className={`mars-sprite ${className}`} role="img" aria-label={species === 'astronaut' ? 'Explorer in a space suit' : `Original ${species} game creature`} />
}

function Encounter({ battle, onAction, onFinish }) {
  const dialog = useRef()
  useEffect(() => {
    const element = dialog.current
    element.showModal()
    return () => element.close()
  }, [])
  return <dialog ref={dialog} className="mars-encounter" aria-labelledby="encounter-title" aria-describedby="encounter-description" onCancel={event => { event.preventDefault(); onFinish() }}>
    <button className="icon-button mars-encounter-close" onClick={onFinish} aria-label={battle.result ? 'Close encounter and continue' : 'Retreat from encounter'}><X size={19} /></button>
    <h2 id="encounter-title">{battle.result === 'won' ? 'A little victory.' : battle.result === 'lost' ? 'Time to regroup.' : `Meet ${battle.species.name}.`}</h2>
    <p id="encounter-description">{battle.species.kind} <span>·</span> Fictional game creature</p>
    <div className="mars-battle-arena"><div><Sprite species="astronaut" /><span>Your explorer</span></div><span className="mars-battle-vs">VS</span><div className={battle.result === 'won' ? 'mars-defeated' : ''}><Sprite species={battle.species.id} /><span>{battle.species.name}</span></div></div>
    <div className="mars-battle-bars"><div><label htmlFor="suit-hp">Suit integrity <span>{battle.hp}/100</span></label><progress id="suit-hp" max="100" value={battle.hp} /></div><div><label htmlFor="creature-hp">Creature energy <span>{battle.enemyHp}/{battle.species.hp}</span></label><progress id="creature-hp" max={battle.species.hp} value={battle.enemyHp} /></div></div>
    <p className="mars-battle-message" role="status">{battle.message}</p>
    {battle.result ? <button className="primary-button mars-collect" onClick={onFinish}>{battle.result === 'won' ? `Collect +${battle.species.reward} research` : 'Return to landing camp'}{battle.result === 'won' ? <Gem size={17} /> : <Home size={17} />}</button> : <>
      <div className="mars-battle-actions"><button onClick={() => onAction('scan')} disabled={battle.analyzed}><ScanLine size={19} /><strong>Scan</strong><small>{battle.analyzed ? 'Weak point found' : 'Find a weak point'}</small></button><button onClick={() => onAction('pulse')} className={battle.analyzed ? 'mars-powered' : ''}><Zap size={19} /><strong>Pulse</strong><small>{battle.analyzed ? '30 damage' : '16 damage'}</small></button><button onClick={() => onAction('shield')}><Shield size={19} /><strong>Shield</strong><small>Repair & defend</small></button></div>
      <button className="mars-retreat" onClick={onFinish}>Retreat safely <ArrowRight size={13} /></button>
    </>}
  </dialog>
}

function GameOverlay({ kind, onClose }) {
  const dialog = useRef()
  useEffect(() => {
    const element = dialog.current
    element.showModal()
    return () => element.close()
  }, [])
  return <dialog ref={dialog} className={`mars-game-overlay ${kind === 'pause' ? 'mars-pause-dialog' : ''}`} aria-labelledby="mars-overlay-title" onCancel={event => { event.preventDefault(); onClose() }}>
    {kind === 'pause' ? <><Pause size={24} /><h2 id="mars-overlay-title">Take a breather.</h2><p>Your expedition is paused.</p><button className="primary-button" onClick={onClose}>Resume exploring <Play size={15} /></button></> : <>
      <button className="icon-button mars-overlay-close" aria-label="Close game help" onClick={onClose}><X size={18} /></button><h2 id="mars-overlay-title">A small step. A new discovery.</h2><p>Click the map, hold the direction buttons, or use WASD / arrow keys to walk. Your scanner ring shows your discovery range.</p><p>Approach a landmark or creature and press <kbd>E</kbd>, or use the action button below. Scan landmarks to unlock real science notes.</p><p>Wind changes walking speed. A headwind uses more suit power; rest at camp to recharge. Dust devils are visual weather events.</p><p>In an encounter, <strong>Scan → Pulse</strong> is stronger than pulsing alone. Shield repairs your suit. Research rewards buy scanner upgrades.</p><p>Scan 3 landmarks, defeat a creature, then return to camp and activate the beacon. Progress saves automatically on this device when storage is available.</p><small>This is a fictional, compressed map inspired by Mars. Wind, terrain, creatures and combat are game simulations. The USGS map and NASA facts link to their sources.</small>
    </>}
  </dialog>
}

export default function MarsGame({ onExit, reducedMotion, pausedExternally = false }) {
  const [loaded] = useState(loadProgress)
  const [snapshot, setSnapshot] = useState(loaded.progress)
  const game = useRef(loaded.progress)
  const [storageAvailable, setStorageAvailable] = useState(loaded.available)
  const [paused, setPaused] = useState(false)
  const [journalOpen, setJournalOpen] = useState(false)
  const [routeOverview, setRouteOverview] = useState(false)
  const routeOverviewRef = useRef(false)
  const [showLandingMarker, setShowLandingMarker] = useState(true)
  const showLandingMarkerRef = useRef(true)
  const [journalTab, setJournalTab] = useState('sites')
  const [selectedSite, setSelectedSite] = useState(loaded.progress.destinationId || 'sample-sid')
  const [showHelp, setShowHelp] = useState(false)
  const [battle, setBattle] = useState(null)
  const battleRef = useRef(null)
  const [toast, setToast] = useState('Touchdown. Click the map to walk, or use WASD / arrow keys.')
  const canvas = useRef()
  const minimap = useRef()
  const journal = useRef()
  const host = useRef()
  const keys = useRef(new Set())
  const walkTarget = useRef(null)
  const camera = useRef({ ...loaded.progress.player })
  const wind = useRef(windAt(0))
  const blocked = useRef(false)
  const interact = useRef(null)
  const creatures = useRef(null)
  if (!creatures.current) creatures.current = [
    { id: 'landing-dustling', species: 'dustling', x: Math.min(MAP_SIZE.width - 70, game.current.player.x + 140), y: game.current.player.y + 50, age: 0 },
    spawnCreature(game.current.player), spawnCreature(game.current.player),
  ]
  const size = useRef({ width: 1000, height: 650, scale: 1, dpr: 1 })
  blocked.current = paused || Boolean(battle) || pausedExternally || showHelp
  const commit = next => { game.current = next; sessionProgress = next; setSnapshot({ ...next, player: { ...next.player } }) }

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 6500)
    return () => clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    const save = () => {
      sessionProgress = game.current
      try { localStorage.setItem(SAVE_KEY, JSON.stringify(game.current)) }
      catch { sessionOnly = true; setStorageAvailable(false) }
    }
    const timer = setInterval(save, 2000)
    window.addEventListener('pagehide', save)
    return () => { clearInterval(timer); window.removeEventListener('pagehide', save); save() }
  }, [])

  useEffect(() => {
    if (paused || battle || pausedExternally || showHelp) keys.current.clear()
  }, [paused, battle, pausedExternally, showHelp])

  useEffect(() => {
    const down = event => {
      if (event.ctrlKey || event.metaKey || event.altKey || ['INPUT', 'SELECT', 'TEXTAREA'].includes(event.target.tagName) || blocked.current) return
      const key = event.key.toLowerCase()
      if (movementKeys.has(key)) { event.preventDefault(); keys.current.add(key); walkTarget.current = null }
      if (key === 'e' && !event.repeat) { event.preventDefault(); interact.current?.() }
    }
    const up = event => keys.current.delete(event.key.toLowerCase())
    const clear = () => { keys.current.clear(); walkTarget.current = null }
    document.addEventListener('keydown', down); document.addEventListener('keyup', up); window.addEventListener('blur', clear)
    return () => { document.removeEventListener('keydown', down); document.removeEventListener('keyup', up); window.removeEventListener('blur', clear) }
  }, [])

  useEffect(() => {
    const element = canvas.current
    const context = element.getContext('2d')
    if (!context) return
    const terrain = createTerrain()
    const resize = new ResizeObserver(() => {
      const width = host.current.clientWidth, height = host.current.clientHeight
      const dpr = Math.min(window.devicePixelRatio || 1, 1.6)
      element.width = Math.round(width * dpr); element.height = Math.round(height * dpr)
      size.current = { width, height, dpr, scale: width < 650 ? 0.86 : 1 }
    })
    resize.observe(host.current)
    let previous = performance.now(), lastHud = 0, spawnClock = 0, frame
    const update = now => {
      const dt = Math.min((now - previous) / 1000, 0.05)
      previous = now
      wind.current = windAt(now / 1000)
      let moving = false
      if (!blocked.current && !document.hidden) {
        const held = keys.current
        let direction = { x: Number(held.has('d') || held.has('arrowright')) - Number(held.has('a') || held.has('arrowleft')), y: Number(held.has('s') || held.has('arrowdown')) - Number(held.has('w') || held.has('arrowup')) }
        if (!direction.x && !direction.y && walkTarget.current) {
          const dx = walkTarget.current.x - game.current.player.x, dy = walkTarget.current.y - game.current.player.y
          if (Math.hypot(dx, dy) > 6) direction = { x: dx, y: dy }; else walkTarget.current = null
        }
        moving = Boolean(direction.x || direction.y)
        const suitPower = suitPowerAfter(game.current.suitPower, game.current.player, direction, wind.current, dt)
        game.current = { ...game.current, suitPower, player: moving ? movePlayer(game.current.player, direction, dt, wind.current, suitPower) : game.current.player }
        spawnClock += dt
        creatures.current = creatures.current.map(c => ({ ...c, age: c.age + dt })).filter(c => c.age < 100)
        if (spawnClock >= 12) { spawnClock = 0; if (creatures.current.length < 6) creatures.current.push(spawnCreature(game.current.player)) }
      }
      const { width, height } = size.current
      const scale = routeOverviewRef.current
        ? Math.min(1, width / (PERSEVERANCE_BOUNDS.maxX - PERSEVERANCE_BOUNDS.minX + 500), height / (PERSEVERANCE_BOUNDS.maxY - PERSEVERANCE_BOUNDS.minY + 420))
        : width < 650 ? 1.8 : 2.3
      size.current.scale = scale
      const desiredX = routeOverviewRef.current ? (PERSEVERANCE_BOUNDS.minX + PERSEVERANCE_BOUNDS.maxX) / 2 : Math.max(width / scale / 2, Math.min(MAP_SIZE.width - width / scale / 2, game.current.player.x))
      const desiredY = routeOverviewRef.current ? (PERSEVERANCE_BOUNDS.minY + PERSEVERANCE_BOUNDS.maxY) / 2 : Math.max(height / scale / 2, Math.min(MAP_SIZE.height - height / scale / 2, game.current.player.y))
      const lerp = reducedMotion ? 1 : 1 - Math.exp(-dt * 7)
      camera.current.x += (desiredX - camera.current.x) * lerp; camera.current.y += (desiredY - camera.current.y) * lerp
      renderMap(context, terrain, game.current, creatures.current, camera.current, size.current, walkTarget.current, now / 1000, moving, reducedMotion || blocked.current, wind.current, showLandingMarkerRef.current, routeOverviewRef.current)
      if (now - lastHud > 120) {
        lastHud = now; setSnapshot({ ...game.current, player: { ...game.current.player } })
        if (minimap.current) renderMinimap(minimap.current, terrain, game.current, creatures.current, showLandingMarkerRef.current, now / 1000, reducedMotion || blocked.current)
      }
      frame = requestAnimationFrame(update)
    }
    frame = requestAnimationFrame(update)
    return () => { cancelAnimationFrame(frame); resize.disconnect(); terrain.width = 0; terrain.height = 0 }
  }, [reducedMotion])

  const setRoute = item => {
    if (blocked.current) return
    if (routeOverviewRef.current) { routeOverviewRef.current = false; setRouteOverview(false) }
    if (item.id) {
      setSelectedSite(item.id)
      commit({ ...game.current, destinationId: item.id })
    }
    walkTarget.current = { x: item.x, y: item.y }
    requestAnimationFrame(() => journal.current?.scrollTo(0, 0))
    if (window.innerWidth <= 760) setJournalOpen(false)
    canvas.current?.focus({ preventScroll: true })
  }
  const inspectSite = id => {
    if (blocked.current) return
    const current = game.current
    const next = scanSite(current, id)
    setSelectedSite(id); setJournalTab('sites'); setJournalOpen(true)
    requestAnimationFrame(() => journal.current?.scrollTo(0, 0))
    if (next !== current) { commit({ ...next, destinationId: id }); setToast(`${SITES.find(s => s.id === id).name} recorded. +10 research. ${SITES.find(s => s.id === id).isSampleSite ? 'NASA sample record unlocked.' : 'New field note unlocked.'}`) }
    else if (current.destinationId !== id) commit({ ...current, destinationId: id })
  }
  const beginBattle = creature => {
    if (blocked.current) return
    const next = startBattle(creature)
    walkTarget.current = null; keys.current.clear(); battleRef.current = next; setBattle(next)
  }
  const takeTurn = action => {
    if (!battleRef.current) return
    const next = battleTurn(battleRef.current, action)
    battleRef.current = next; setBattle(next)
  }
  const finishBattle = () => {
    const current = battleRef.current
    if (!current) return
    battleRef.current = null
    creatures.current = creatures.current.filter(c => c.id !== current.creature.id)
    const next = { ...game.current, encountered: [...new Set([...game.current.encountered, current.species.id])] }
    if (current.result === 'won') { next.research += current.species.reward; next.defeated++; setToast(`${current.species.name} defeated. +${current.species.reward} research. Upgrade your scanner or continue exploring.`) }
    else if (current.result === 'lost') { next.player = { ...CAMP }; setToast('Returned to camp safely. Your discoveries and research are intact.') }
    else setToast('You retreated safely. Keep exploring; new creatures will appear.')
    commit(next); setBattle(null); canvas.current?.focus({ preventScroll: true })
  }
  const activateBeacon = () => {
    if (blocked.current) return
    const current = game.current
    if (current.beacon || current.discoveries.length < 3 || current.defeated < 1 || distance(current.player, CAMP) >= 95) return
    commit({ ...current, beacon: true, research: current.research + 30 })
    setToast('Survey beacon online! First expedition complete. +30 research. Keep exploring to finish your field journal.')
  }
  interact.current = () => {
    if (blocked.current) return
    const nearest = interactionFor(game.current, creatures.current)
    if (nearest?.type === 'site') inspectSite(nearest.item.id)
    else if (nearest?.type === 'creature') beginBattle(nearest.item)
    else if (nearest?.type === 'camp') activateBeacon()
  }
  const upgrade = () => {
    if (blocked.current) return
    const current = game.current, cost = current.scannerLevel === 1 ? 12 : 20
    if (current.scannerLevel >= 3 || current.research < cost) return
    commit({ ...current, research: current.research - cost, scannerLevel: current.scannerLevel + 1 })
    setToast('Scanner upgraded. You can now scan landmarks from farther away.')
  }
  const restart = () => {
    if (blocked.current) return
    if (!window.confirm('Start a new expedition? This replaces your saved Mars progress on this device.')) return
    const fresh = newProgress(); commit(fresh)
    creatures.current = [spawnCreature(fresh.player), spawnCreature(fresh.player), spawnCreature(fresh.player)]
    walkTarget.current = null; routeOverviewRef.current = false; setRouteOverview(false); setSelectedSite('basalt'); setToast('A new expedition begins. Your landing camp is ready.')
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(fresh)) } catch { sessionOnly = true; setStorageAvailable(false) }
  }
  const pointerWalk = event => {
    if (blocked.current || event.button !== 0) return
    const rect = event.currentTarget.getBoundingClientRect(), view = size.current
    const point = { x: Math.max(45, Math.min(MAP_SIZE.width - 45, (event.clientX - rect.left - view.width / 2) / view.scale + camera.current.x)), y: Math.max(45, Math.min(MAP_SIZE.height - 45, (event.clientY - rect.top - view.height / 2) / view.scale + camera.current.y)) }
    const rock = SITES.find(site => site.isSampleSite && distance(site, point) < 10)
    if (rock && distance(game.current.player, rock) <= scanRangeFor(rock, game.current.scannerLevel)) inspectSite(rock.id)
    else setRoute(rock || point)
  }
  const pressDirection = (event, key) => {
    if (blocked.current) return
    event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); keys.current.add(key); walkTarget.current = null
  }
  const nearest = interactionFor(snapshot, creatures.current)
  const selected = SITES.find(s => s.id === selectedSite)
  const foundSelected = snapshot.discoveries.includes(selectedSite)
  const upgradeCost = snapshot.scannerLevel === 1 ? 12 : 20
  const beaconReady = snapshot.discoveries.length >= 3 && snapshot.defeated >= 1
  const marswalkPlan = planMarswalk(snapshot.player, selected, CAMP)

  return <main id="explorer" tabIndex={-1} ref={host} className={`mars-game ${paused ? 'mars-is-paused' : ''}`} aria-label="Mars expedition game">
    <canvas ref={canvas} className="mars-map" tabIndex={0} role="application" aria-label="Mars game map. Use W A S D or arrow keys to walk, or click to walk to a point. Press E near a site or creature to interact. Journal buttons also navigate to sites." aria-keyshortcuts="W A S D ArrowUp ArrowLeft ArrowDown ArrowRight E" onPointerDown={pointerWalk}>Use the field journal to select a destination, then scan nearby sites. This game needs a browser with Canvas 2D support.</canvas>
    <div className="mars-map-shade" aria-hidden="true" />

    <header className="mars-game-header"><div><h1>Mars, on foot<span>.</span></h1><p>Mapped Jezero traverse <span>·</span> Stylized expedition</p></div><div className="mars-game-header-actions"><button onClick={() => setPaused(value => !value)} aria-label={paused ? 'Resume expedition' : 'Pause expedition'} title={paused ? 'Resume' : 'Pause'}>{paused ? <Play size={17} /> : <Pause size={17} />}</button><button onClick={() => setShowHelp(value => !value)} aria-label="How to play"><HelpCircle size={18} /></button><button className="mars-return" onClick={onExit}><Orbit size={16} /><span>Return to orbit</span></button></div></header>

    <div className="mars-status-bar"><span><Gem size={15} /><strong>{snapshot.research}</strong> research</span><span><BookOpen size={14} /><strong>{snapshot.discoveries.length}/{SITES.length}</strong> discoveries</span><span><ScanLine size={14} />Scanner <strong>Lv. {snapshot.scannerLevel}</strong></span><span>Suit <strong>{Math.round(snapshot.suitPower)}%</strong></span><span className="mars-wind-status">Wind <strong>{wind.current.strength > .7 ? 'gusting' : 'steady'}</strong> ↖</span><span className="mars-save-state">{storageAvailable ? 'Saved on this device' : 'Session progress only'}</span></div>

    <aside className={`mars-objective ${snapshot.beacon ? 'is-complete' : ''}`} aria-label="Expedition objectives"><div className="mars-objective-heading"><Radio size={17} /><h2>{snapshot.beacon ? 'Beacon online.' : 'Bring the sector online.'}</h2></div><p>{snapshot.beacon ? 'First expedition complete. There’s still a whole landscape to discover.' : 'Study the landscape, collect research, then activate your survey beacon at camp.'}</p><ul><li className={snapshot.discoveries.length >= 3 ? 'done' : ''}><Check size={13} />Scan 3 landmarks <span>{Math.min(3, snapshot.discoveries.length)}/3</span></li><li className={snapshot.defeated >= 1 ? 'done' : ''}><Check size={13} />Defeat a creature <span>{Math.min(1, snapshot.defeated)}/1</span></li><li className={snapshot.beacon ? 'done' : ''}><Check size={13} />Activate the beacon <span>{snapshot.beacon ? '1/1' : '0/1'}</span></li></ul><button onClick={() => setRoute(CAMP)}><Home size={13} />{beaconReady && !snapshot.beacon ? 'Walk to beacon' : 'Walk to camp'}<ChevronRight size={13} /></button></aside>

    <button className={`mars-journal-toggle ${journalOpen ? 'active' : ''}`} onClick={() => setJournalOpen(value => !value)} aria-expanded={journalOpen} aria-controls="mars-field-journal"><BookOpen size={17} /><span>Field journal</span>{journalOpen ? <X size={14} /> : <ChevronRight size={14} />}</button>
    {journalOpen && <aside ref={journal} className="mars-journal" id="mars-field-journal" aria-label="Field journal"><div className="mars-journal-tabs" role="group" aria-label="Journal category"><button className={journalTab === 'sites' ? 'active' : ''} onClick={() => setJournalTab('sites')}>Sites <span>{snapshot.discoveries.length}/{SITES.length}</span></button><button className={journalTab === 'creatures' ? 'active' : ''} onClick={() => setJournalTab('creatures')}>Creatures <span>{snapshot.encountered.length}/3</span></button></div>
      {journalTab === 'sites' ? <>
        <section className="mars-site-detail" aria-label="Selected landmark">
          <h3>{selected.name}{selected.isSampleSite ? ' sampling area' : ''}</h3>
          {foundSelected ? <>
            <span className="mars-sample"><Check size={12} />{selected.isSampleSite ? 'NASA sample record viewed' : `${selected.sample} recorded`}</span>
            {selected.isSampleSite && <div className="mars-sample-record"><strong>Samples collected here</strong><ul>{selected.samples.map(sample => <li key={sample}>{sample}</li>)}</ul><small>Reported collection location: {selected.latitude.toFixed(6)}° N, {selected.longitude.toFixed(6)}° E. This scan reads NASA’s published record; it does not collect or move a tube.</small></div>}
            {!selected.isSampleSite && snapshot.scannedUnits?.[selected.id] && <div className="mars-geology-result"><strong>USGS SIM 3464 · {snapshot.scannedUnits[selected.id].symbol}</strong><span>{snapshot.scannedUnits[selected.id].name}</span><p>{snapshot.scannedUnits[selected.id].description}</p><small>Unit at your scan position. Regional map scale 1:75,000; alignment may differ by 100–200 m from rover operations imagery. Mineralogy, age and core sample are not established by this polygon alone.</small><a href={SIM3464_SOURCE} target="_blank" rel="noreferrer">Read the geologic map <ArrowUpRight size={13} /></a></div>}
            <p>{selected.fact}</p><p className="mars-location-note">{selected.locationNote}</p>
            <a href={selected.source} target="_blank" rel="noreferrer">{selected.isSampleSite ? 'Read the NASA PDS sample report' : 'Read the NASA science'} <ArrowUpRight size={13} /></a>
            {selected.catalogSource && <a href={selected.catalogSource} target="_blank" rel="noreferrer">Browse NASA’s sample catalog <ArrowUpRight size={13} /></a>}
          </> : <>
            <p>{selected.isSampleSite ? `Walk within ${Math.round(scanRangeFor(selected, snapshot.scannerLevel) * GAME_METERS_PER_UNIT)} m to scan this reported sampling area and view its NASA record.` : 'Walk within scanner range to uncover this waypoint’s science story and earn 10 research.'}</p>
            <button className="mars-detail-action" disabled={distance(snapshot.player, selected) > scanRangeFor(selected, snapshot.scannerLevel)} onClick={() => inspectSite(selected.id)}><ScanLine size={14} />{distance(snapshot.player, selected) <= scanRangeFor(selected, snapshot.scannerLevel) ? selected.isSampleSite ? 'Scan sample site +10' : 'Scan waypoint +10' : `Get within ${Math.round(scanRangeFor(selected, snapshot.scannerLevel) * GAME_METERS_PER_UNIT)} m`}</button>
          </>}
        </section>
        <div className="mars-site-list">{SITES.slice().sort((a, b) => Number(b.isSampleSite) - Number(a.isSampleSite)).map(site => { const Icon = siteIcons[site.icon], discovered = snapshot.discoveries.includes(site.id); return <button key={site.id} className={selectedSite === site.id ? 'selected' : ''} onClick={() => setRoute(site)} aria-label={`${site.name}, ${discovered ? 'recorded, select destination and read field note' : `walk here, ${Math.round(distance(snapshot.player, site) * GAME_METERS_PER_UNIT)} meters away`}`}><Icon size={17} /><span>{site.name}<small>{site.type}</small></span>{discovered ? <Check size={14} className="mars-recorded" /> : <small>{Math.round(distance(snapshot.player, site) * GAME_METERS_PER_UNIT)} m</small>}</button> })}</div></> : <div className="mars-creature-journal"><p>Original game creatures. No living creatures like these have been confirmed on Mars.</p>{SPECIES.map(species => <div key={species.id}><Sprite species={species.id} /><div><h3>{species.name}</h3><span>{species.kind}</span><p>{snapshot.encountered.includes(species.id) ? species.description : 'Encounter this creature to add its field note.'}</p></div></div>)}<div className="mars-nearby"><strong>Nearby creatures</strong>{creatures.current.map(creature => <button key={creature.id} onClick={() => setRoute(creature)}>{SPECIES.find(s => s.id === creature.species).name}<span>{Math.round(distance(snapshot.player, creature) * GAME_METERS_PER_UNIT)} m <ChevronRight size={12} /></span></button>)}</div></div>}
      <section className="mars-route-plan" aria-label="Selected Marswalk destination"><div><MapPin size={13} /><span>Selected destination</span></div><strong>{selected.name}</strong><span>{selected.latitude.toFixed(6)}° N · {selected.longitude.toFixed(6)}° E</span><dl><div><dt>Distance</dt><dd>{Math.round(marswalkPlan.oneWayMetres)} m</dd></div><div><dt>Via camp</dt><dd>{Math.round(marswalkPlan.roundTripMetres)} m</dd></div><div><dt>Budget</dt><dd>{marswalkPlan.oxygenPercent}%</dd></div></dl><small>Illustrative 4 h EVA budget with 15 min science time and a 1 h reserve. Straight-line route; slope and obstacles are not evaluated.</small><button onClick={() => setRoute(selected)}><Compass size={13} />Walk toward destination<ChevronRight size={13} /></button></section>
      <div className="mars-upgrade"><div><ScanLine size={17} /><span>Scanner level {snapshot.scannerLevel}<small>{SCAN_RANGES[snapshot.scannerLevel] * GAME_METERS_PER_UNIT} m scan range</small></span></div><button onClick={upgrade} disabled={snapshot.scannerLevel >= 3 || snapshot.research < upgradeCost}>{snapshot.scannerLevel >= 3 ? 'Max level' : `Upgrade · ${upgradeCost}`}<Gem size={12} /></button></div>
    </aside>}

    <div className="mars-minimap">
      <div><Compass size={12} /><span>ROVER RADAR</span><span>PERSEVERANCE</span></div>
      <canvas ref={minimap} width="180" height="180" role="img" aria-label="Circular local minimap centered on your explorer. The pulsing diamond points toward Perseverance. The orange dot is the landing site when enabled." />
      <div className="mars-map-switches">
        <button className={routeOverview ? 'active' : ''} aria-label={routeOverview ? 'Follow explorer on map' : 'Show full Perseverance traverse overview'} aria-pressed={routeOverview} onClick={() => { const next = !routeOverview; routeOverviewRef.current = next; setRouteOverview(next); if (next) setJournalOpen(false); canvas.current?.focus() }}>{routeOverview ? 'Follow me' : 'Overview'}</button>
        <button className={showLandingMarker ? 'active' : ''} aria-label="Show landing site waypoint marker" aria-pressed={showLandingMarker} onClick={() => { const next = !showLandingMarker; showLandingMarkerRef.current = next; setShowLandingMarker(next) }}>Landing {showLandingMarker ? 'on' : 'off'}</button>
      </div>
    </div>

    <div className="mars-dpad" role="group" aria-label="Movement controls">{[['w', ArrowUp, 'Walk north'], ['a', ArrowLeft, 'Walk west'], ['s', ArrowDown, 'Walk south'], ['d', ArrowRight, 'Walk east']].map(([key, Icon, label]) => <button key={key} className={`mars-key-${key}`} aria-label={label} onPointerDown={event => pressDirection(event, key)} onPointerUp={() => keys.current.delete(key)} onPointerCancel={() => keys.current.delete(key)} onLostPointerCapture={() => keys.current.delete(key)} onKeyDown={event => { if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); if (!blocked.current) { keys.current.add(key); walkTarget.current = null } } }} onKeyUp={() => keys.current.delete(key)} onBlur={() => keys.current.delete(key)}><Icon size={18} /></button>)}<span>WASD / ARROWS</span></div>

    <div className="mars-interaction"><div className="mars-interaction-copy">{nearest ? <><span>{nearest.type === 'site' ? nearest.item.isSampleSite ? 'NASA SAMPLE SITE IN RANGE' : 'LANDMARK IN RANGE' : nearest.type === 'camp' ? 'SURVEY OBJECTIVE READY' : 'CREATURE IN RANGE'}</span><strong>{nearest.type === 'site' ? nearest.item.name : nearest.type === 'camp' ? 'Bring the beacon online' : SPECIES.find(s => s.id === nearest.item.species).name}</strong></> : <><span>FOLLOW YOUR CURIOSITY</span><strong>Click to walk. Explore what’s nearby.</strong></>}</div>{nearest ? <button onClick={() => interact.current?.()}>{nearest.type === 'site' ? <ScanLine size={17} /> : nearest.type === 'camp' ? <Radio size={17} /> : <Zap size={17} />}{nearest.type === 'site' ? snapshot.discoveries.includes(nearest.item.id) ? 'View scan' : 'Scan' : nearest.type === 'camp' ? 'Activate' : 'Encounter'}<kbd>E</kbd></button> : <button onClick={() => setRoute(SITES.find(site => !snapshot.discoveries.includes(site.id)) || CAMP)}><Compass size={16} />{snapshot.discoveries.length === SITES.length ? 'Walk to camp' : 'Find a site'}</button>}</div>

    <div className="mars-map-footnote"><span>NASA Perseverance traverse · Illustrative terrain and wind · Fictional creatures</span><button onClick={restart}><RotateCcw size={11} />New expedition</button></div>
    {toast && <div className="mars-notice" role="status"><Sparkles size={15} /><span>{toast}</span></div>}
    {(paused || showHelp) && <GameOverlay kind={paused ? 'pause' : 'help'} onClose={() => { setPaused(false); setShowHelp(false) }} />}
    {battle && <Encounter battle={battle} onAction={takeTurn} onFinish={finishBattle} />}
  </main>
}
