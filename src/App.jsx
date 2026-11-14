import { Component, Suspense, lazy, useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowRight, ArrowUpRight, CircleHelp, Compass, Expand, Globe2, Layers3, Orbit, Pause, Play, Plus, Minus, RotateCcw, Rocket, Volume2, VolumeX, X } from 'lucide-react'
import { MARS_LANDMARKS, SCIENCE_LAYERS } from './data/marsLandmarks'
import { MARS_IMAGERY } from './data/marsImagery'
import MARS_ROUTES from './data/marsRoutes.js'
import { JEZERO_FORMATION, JEZERO_NAME_ORIGIN, JEZERO_NAMING_SOURCE } from './data/jezeroStory'
import './components/cesiumMarsHero.css'

const CesiumMarsHero = lazy(() => import('./components/CesiumMarsHero'))
const DescentScene = lazy(() => import('./components/SpaceScene').then(m => ({ default: m.DescentScene })))
const MarsGame = lazy(() => import('./game/MarsGame'))
const JezeroMap = lazy(() => import('./components/JezeroMap'))
const RoverModelPreview = lazy(() => import('./components/RoverModelPreview'))

class SceneBoundary extends Component {
  state = { error: false }
  static getDerivedStateFromError() { return { error: true } }
  render() {
    if (this.state.error) {
      return (
        <div className="scene-error">
          <Globe2 size={32} />
          <h3>The 3D Mars view couldn’t start.</h3>
          <p>Check that WebGL and hardware acceleration are enabled, then try again.</p>
          <button className="secondary-button" onClick={() => this.setState({ error: false })}>
            <RotateCcw size={15} /> Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

class RoverPreviewBoundary extends Component {
  state = { error: false }
  static getDerivedStateFromError() { return { error: true } }
  render() { return this.state.error ? <div className="rover-preview-fallback">3D preview unavailable. Use “Fly to rover on Mars” to view its location.</div> : this.props.children }
}

function Brand() {
  return (
    <span className="brand">
      <svg viewBox="0 0 40 40" aria-hidden="true">
        <circle cx="20" cy="20" r="10" />
        <ellipse cx="20" cy="20" rx="19" ry="6.5" transform="rotate(-35 20 20)" />
      </svg>
      orbital<span className="brand-dot">.</span>
    </span>
  )
}

function Descent({ onComplete, reducedMotion }) {
  const [progress, setProgress] = useState(0)
  const done = useRef(onComplete)
  const skip = useRef()

  useEffect(() => {
    const previous = document.activeElement
    skip.current?.focus({ preventScroll: true })
    return () => { if (previous?.isConnected) previous.focus({ preventScroll: true }) }
  }, [])

  useEffect(() => { done.current = onComplete }, [onComplete])

  useEffect(() => {
    const started = performance.now()
    let frame
    const update = now => {
      const next = Math.min((now - started) / 7400, 1)
      setProgress(next)
      if (next < 1) frame = requestAnimationFrame(update)
      else done.current()
    }
    frame = requestAnimationFrame(update)
    return () => cancelAnimationFrame(frame)
  }, [])

  const altitude = Math.round(408 * (1 - progress) ** 2)

  const handleIntroKey = e => {
    if (e.key === 'Escape') onComplete()
    if (e.key !== 'Tab') return
    const controls = Array.from(e.currentTarget.querySelectorAll('button:not([disabled]), a[href], [tabindex="0"]')).filter(element => element.offsetParent !== null)
    const first = controls[0]
    const last = controls[controls.length - 1]
    if (e.shiftKey && (document.activeElement === first || !e.currentTarget.contains(document.activeElement))) {
      e.preventDefault(); last?.focus()
    } else if (!e.shiftKey && (document.activeElement === last || !e.currentTarget.contains(document.activeElement))) {
      e.preventDefault(); first?.focus()
    }
  }

  return (
    <div className="descent" role="dialog" aria-modal="true" aria-label="Simulated rocket descent to Mars" onKeyDown={handleIntroKey}>
      <header className="intro-header">
        <Brand />
        <span className="simulation-tag"><span />SIMULATED DESCENT</span>
        <button ref={skip} className="text-button" onClick={onComplete}>Skip intro <ArrowRight size={16} /></button>
      </header>
      <div className="descent-canvas">
        <SceneBoundary>
          <Suspense fallback={null}>
            <DescentScene reducedMotion={reducedMotion} progress={progress} world="mars" />
          </Suspense>
        </SceneBoundary>
      </div>
      <div className="descent-copy">
        <h1>From the stars.<br />To the red planet.</h1>
        <p>Your first expedition is waiting. Let curiosity lead the way.</p>
      </div>
      <div className="descent-telemetry">
        <span>ALTITUDE</span>
        <strong>{altitude}<small> km</small></strong>
        <div className="altitude-track"><i style={{ height: `${100 - progress * 100}%` }} /></div>
        <span>{progress < 0.45 ? 'ORBITAL APPROACH' : progress < 0.85 ? 'CONTROLLED DESCENT' : 'TOUCHDOWN IMMINENT'}</span>
      </div>
      <div className="descent-bottom">
        <span>{progress < 0.33 ? 'LEAVING ORBIT' : progress < 0.7 ? 'APPROACHING JEZERO' : 'WELCOME TO MARS'}</span>
        <div className="intro-progress"><i style={{ width: `${progress * 100}%` }} /></div>
        <span>{String(Math.round(progress * 100)).padStart(2, '0')}%</span>
      </div>
    </div>
  )
}

function InfoPanel({ panel, onClose, onStartExpedition }) {
  const ref = useRef()
  useEffect(() => {
    ref.current?.showModal()
    return () => ref.current?.close()
  }, [])

  return (
    <dialog ref={ref} className="info-dialog" aria-labelledby="panel-title" onCancel={onClose} onClick={e => { if (e.target === ref.current) onClose() }}>
      <div className="dialog-content">
        <button className="icon-button close-panel" onClick={onClose} aria-label="Close panel"><X size={20} /></button>
        {panel === 'mission' ? (
          <>
            <span className="panel-symbol"><Orbit size={30} /></span>
            <h2 id="panel-title">A different<br />perspective.</h2>
            <p>Orbital is a Martian exploration concept for NASA Space Apps. Powered by Cesium 3D planetary mapping and real NASA Mars Trek imagery.</p>
            <div className="feature-list">
              <div><Globe2 /><span><strong>Cesium 3D Mars Globe</strong><small>Interactive Martian globe with custom atmospheric scattering and 3D terrain.</small></span></div>
              <div><Layers3 /><span><strong>NASA Science Layers</strong><small>Drape Jezero CTX (6m/px), HiRISE (25cm/px), and global MOLA elevation maps.</small></span></div>
              <div><Rocket /><span><strong>Playable Expedition</strong><small>Seamless 2D field expedition across mapped Jezero traverse waypoints.</small></span></div>
            </div>
            <p className="small-note">Independent concept demo. NASA science data: Mars Trek API (CTX, HiRISE, MOLA), Cesium ion Mars terrain asset 3644333, and Perseverance rover CZML traverse.</p>
          </>
        ) : panel === 'notes' ? (
          <>
            <span className="panel-symbol"><Compass size={30} /></span>
            <h2 id="panel-title">Mars Field<br />Knowledge.</h2>
            <p>Mars is a cold, desert world with a very thin carbon dioxide atmosphere. Its surface preserves ancient river deltas, dry lake basins, and colossal volcanic structures.</p>
            <dl className="note-facts">
              <div><dt>Planet</dt><dd>Mars</dd></div>
              <div><dt>Classification</dt><dd>Terrestrial planet</dd></div>
              <div><dt>Mean Diameter</dt><dd>6,779 km</dd></div>
              <div><dt>Surface Gravity</dt><dd>3.71 m/s²</dd></div>
              <div><dt>Solar Day (Sol)</dt><dd>24h 39m 35s</dd></div>
            </dl>
            <h3>Keep exploring</h3>
            <a className="source-link" href="https://science.nasa.gov/mars/" target="_blank" rel="noreferrer">NASA Mars Exploration Program <ArrowUpRight size={16} /></a>
            <button className="primary-button panel-action" onClick={() => { onClose(); onStartExpedition() }}>
              Launch expedition <ArrowRight size={17} />
            </button>
          </>
        ) : (
          <>
            <span className="panel-symbol"><CircleHelp size={30} /></span>
            <h2 id="panel-title">Explore Mars<br />in 3D & 2D.</h2>
            <div className="help-list">
              <p><strong>Rotate & Orbit</strong><span>Click and drag to rotate the Martian globe. Pinch or scroll to zoom in/out. Right-click drag to tilt perspective.</span></p>
              <p><strong>Points of interest</strong><span>Choose a location from the dropdown or click a visible marker to see its image, description, and NASA source.</span></p>
              <p><strong>NASA Science Layers</strong><span>Switch between Natural Surface, global MOLA elevation, and regional CTX or HiRISE mosaics where coverage is available.</span></p>
              <p><strong>Start Expedition</strong><span>Enter the illustrated Jezero on-foot game with scanner upgrades and science field notes.</span></p>
            </div>
          </>
        )}
      </div>
    </dialog>
  )
}

function LandmarkPanel({ landmark, onClose, onOpenJezeroMap }) {
  const ref = useRef()
  const [imageFailed, setImageFailed] = useState(false)
  const hasPhoto = Boolean(landmark.image && !imageFailed)
  useEffect(() => {
    setImageFailed(false)
    if (window.matchMedia('(max-width: 800px)').matches) ref.current?.scrollIntoView({ block: 'start' })
  }, [landmark.id])

  return (
    <aside ref={ref} className="landmark-side-panel" aria-labelledby="landmark-panel-title">
      <div className="dialog-content">
        <button className="icon-button close-panel" onClick={onClose} aria-label="Close point of interest"><X size={20} /></button>
        <span className="landmark-panel-type">{landmark.tag} · {landmark.coordinates}</span>
        <h2 id="landmark-panel-title">{landmark.name}</h2>
        <figure className="landmark-panel-image">
          <img src={hasPhoto ? landmark.image : '/textures/mars.jpg'} onError={() => setImageFailed(true)} alt={hasPhoto ? `NASA image of ${landmark.name}` : 'Global Mars surface texture'} />
          <figcaption>{hasPhoto ? landmark.imageCredit : 'Solar System Scope · Global Mars texture'}</figcaption>
        </figure>
        <h3>{landmark.subtitle}</h3>
        <p>{landmark.description}</p>
        {landmark.id === 'jezero' && <div className="jezero-origin-note">
          <h3>How Jezero came to be</h3>
          <p>{JEZERO_FORMATION}</p>
          <p>{JEZERO_NAME_ORIGIN}</p>
          <a href={JEZERO_NAMING_SOURCE} target="_blank" rel="noopener noreferrer">Jezero name origin · USGS <ArrowUpRight size={14} /></a>
        </div>}
        {landmark.id === 'jezero' && <button className="jezero-map-cta" onClick={onOpenJezeroMap}>Open detailed 2D terrain map <ArrowRight size={17} /></button>}
        <a className="source-link" href={landmark.source} target="_blank" rel="noreferrer">Read about {landmark.name} at NASA <ArrowUpRight size={16} /></a>
      </div>
    </aside>
  )
}

function RoutePanel({ route, onClose, onFit, onInspect, onOpenJezeroMap, onSelectRoute }) {
  const fiction = route.type === 'fictional'
  return <aside className="landmark-side-panel route-side-panel" aria-labelledby="route-panel-title">
    <div className="dialog-content">
      <button className="icon-button close-panel" onClick={onClose} aria-label="Close journey"><X size={20} /></button>
      <div className="route-switcher" aria-label="Choose journey">
        <button className={route.id === 'perseverance' ? 'active' : ''} onClick={() => onSelectRoute('perseverance')}>Perseverance</button>
        <button className={route.id === 'curiosity' ? 'active' : ''} onClick={() => onSelectRoute('curiosity')}>Curiosity</button>
        <button className={route.id === 'watney' ? 'active' : ''} onClick={() => onSelectRoute('watney')}>The Martian</button>
      </div>
      <span className="landmark-panel-type">{fiction ? 'POP CULTURE REFERENCE · THE MARTIAN MOVIE' : `NASA ROVER TRAVERSE · SOL ${route.sol}`}</span>
      <h2 id="route-panel-title">{route.name}</h2>
      {!fiction && <RoverPreviewBoundary key={route.id}><Suspense fallback={<div className="rover-preview-fallback">Loading 3D rover model…</div>}><RoverModelPreview url={route.model} name={route.name} /></Suspense></RoverPreviewBoundary>}
      {!fiction && <button className="jezero-map-cta" onClick={onInspect}>Fly to rover on Mars <ArrowRight size={17} /></button>}
      <p>{fiction
        ? 'This is a pop culture reference to the movie The Martian. Follow Mark Watney’s fictional journey from Ares 3 in Acidalia Planitia, through Mawrth Vallis, to Ares 4 at Schiaparelli. It is a story route, not a real NASA expedition.'
        : `Follow the rover’s driven path to its last published waypoint in this map snapshot. ${route.distanceKm.toFixed(1)} km recorded through sol ${route.sol}.`}</p>
      {fiction && <div className="watney-stops"><span>Ares 3<small>Acidalia Planitia</small></span><span>Mawrth Vallis</span><span>Ares 4<small>Schiaparelli</small></span></div>}
      {!fiction && <p className="route-data-date">NASA traverse snapshot downloaded 14 Nov 2026. Open NASA’s live map for newer drives.</p>}
      {fiction ? <button className="jezero-map-cta" onClick={onFit}>Show Watney’s full journey <ArrowRight size={17} /></button>
        : <button className="route-secondary-action" onClick={onFit}>Fit full rover route <ArrowUpRight size={16} /></button>}
      {route.id === 'perseverance' && <button className="route-secondary-action" onClick={onOpenJezeroMap}>See route on 2D Jezero map <ArrowUpRight size={16} /></button>}
      <a className="source-link" href={route.missionUrl} target="_blank" rel="noreferrer">{fiction ? 'The Martian route at NASA JPL' : 'Open NASA’s live rover map'} <ArrowUpRight size={16} /></a>
      {route.id === 'curiosity' && <a className="source-link" href="https://science.nasa.gov/resource/curiositys-proposed-path-up-mount-sharp/" target="_blank" rel="noreferrer">See NASA’s 2019 proposed Mount Sharp path <ArrowUpRight size={16} /></a>}
    </div>
  </aside>
}

export default function App() {
  const [mode, setMode] = useState('orbit')
  const [activeLandmark, setActiveLandmark] = useState('global')
  const [scienceLayer, setScienceLayer] = useState('natural')
  const [geologyOpacity, setGeologyOpacity] = useState(0.68)
  const [rotating, setRotating] = useState(true)
  const [zoom, setZoom] = useState(0)
  const [reset, setReset] = useState(0)
  const [panel, setPanel] = useState(null)
  const [poiOpen, setPoiOpen] = useState(false)
  const [routeMode, setRouteMode] = useState(null)
  const [routeFocus, setRouteFocus] = useState({ mode: 'full', tick: 0 })
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [intro, setIntro] = useState(false)
  const [sound, setSound] = useState(false)
  const [telemetry, setTelemetry] = useState({ lat: '18.38', lon: '77.45', heightKm: '11,500' })
  const audio = useRef(null)
  const audioMaster = useRef(null)
  const root = useRef()
  const [fullScreen, setFullScreen] = useState(false)
  const [notice, setNotice] = useState('')

  const landmark = MARS_LANDMARKS.find(l => l.id === activeLandmark) || MARS_LANDMARKS[0]
  const regionalImagery = MARS_IMAGERY[activeLandmark]
  const selectLandmark = id => {
    setRouteMode(null)
    setActiveLandmark(id)
    if (id !== 'global') setRotating(false)
    const imagery = MARS_IMAGERY[id]
    setScienceLayer(imagery?.hirise ? 'hirise' : imagery?.ctx ? 'ctx' : 'natural')
    setPoiOpen(id !== 'global')
  }
  const selectRoute = (id, focus = 'full') => {
    setRouteMode(id || null)
    if (!id) return
    setMode('orbit')
    setPoiOpen(false)
    setRotating(false)
    const destination = id === 'perseverance' ? 'jezero' : id === 'curiosity' ? 'gale' : 'global'
    setActiveLandmark(destination)
    setScienceLayer(id === 'watney' ? 'natural' : 'hirise')
    setRouteFocus(current => ({ mode: focus, tick: current.tick + 1 }))
  }

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = e => setReducedMotion(e.matches)
    media.addEventListener('change', update)
    const full = () => setFullScreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', full)
    return () => {
      media.removeEventListener('change', update)
      document.removeEventListener('fullscreenchange', full)
      audio.current?.close()
    }
  }, [])

  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(''), 4200)
    return () => clearTimeout(timer)
  }, [notice])

  const descend = () => { setIntro(true) }
  const finishIntro = () => { setIntro(false); setMode('mars') }

  const toggleSound = async () => {
    try {
      if (!audio.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext
        const context = new AudioContext()
        const gain = context.createGain()
        gain.gain.value = 0
        gain.connect(context.destination)
        ;[55, 82.41, 110.15].forEach((frequency, i) => {
          const oscillator = context.createOscillator()
          oscillator.type = 'sine'; oscillator.frequency.value = frequency; oscillator.detune.value = i * 3
          const level = context.createGain(); level.gain.value = 0.12 / (i + 1)
          oscillator.connect(level); level.connect(gain); oscillator.start()
        })
        audio.current = context; audioMaster.current = gain
      }
      await audio.current.resume()
      audioMaster.current.gain.setTargetAtTime(sound ? 0 : 0.3, audio.current.currentTime, 0.5)
      setSound(!sound)
    } catch { setNotice('Your browser could not start ambient audio.') }
  }

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await root.current.requestFullscreen()
    } catch { setNotice('Fullscreen is unavailable in this browser. Try F11.') }
  }

  return (
    <div className="app mars-landing-app" ref={root} style={{ '--world-color': '#eda179' }}>
      <div className="experience" inert={intro}>
        <a className="skip-link" href="#explorer">Skip to explorer</a>
        <header className="site-header">
          <button className="brand-button" aria-label="Orbital home" onClick={() => { setMode('orbit'); selectLandmark('global'); setReset(n => n + 1) }}>
            <Brand />
          </button>
          <nav aria-label="Main navigation">
            <button className={!panel && !routeMode ? 'nav-active' : ''} onClick={() => { setPanel(null); selectLandmark('global') }}>Explore Mars</button>
            <button className={routeMode ? 'nav-active' : ''} onClick={() => selectRoute('perseverance', 'rover')}>Rovers & stories <ArrowUpRight size={12} /></button>
            <button className={panel === 'mission' ? 'nav-active' : ''} onClick={() => setPanel('mission')}>The mission <ArrowUpRight size={12} /></button>
            <button className={panel === 'notes' ? 'nav-active' : ''} onClick={() => setPanel('notes')}>Field notes <ArrowUpRight size={12} /></button>
          </nav>
          <button className="space-apps" onClick={() => setPanel('mission')}>
            <span className="space-apps-mark">SPACE<br /><b>APPS</b></span>
            <span>NASA Space Apps Concept<small>CESIUM MARS MAP</small></span>
          </button>
        </header>

        {mode === 'mars' ? (
          <SceneBoundary>
            <Suspense fallback={<main className="mars-loading">Preparing your Mars expedition…</main>}>
              <MarsGame onExit={() => setMode('orbit')} reducedMotion={reducedMotion} pausedExternally={Boolean(panel) || intro} />
            </Suspense>
          </SceneBoundary>
        ) : mode === 'jezero-map' ? (
          <Suspense fallback={<main id="explorer" className="mars-loading">Preparing Jezero terrain map…</main>}>
            <JezeroMap onBack={() => { setMode('orbit'); setPoiOpen(!routeMode) }} />
          </Suspense>
        ) : (
          <>
            <div className={`explorer-shell ${(poiOpen && activeLandmark !== 'global') || routeMode ? 'poi-open' : ''} ${routeMode ? 'route-open' : ''}`}>
            <main id="explorer" className="explorer" tabIndex={-1}>
              <div className="topline">
                <span><span className="status-dot" />CESIUM 3D MARS MAP <span className="topline-divider">/</span> NASA SCIENCE</span>
                <button onClick={() => setPanel('help')}>Map guide <CircleHelp size={14} /></button>
              </div>

              {!intro && (
                <div className="scene-container" aria-label="Interactive 3D Mars globe powered by Cesium">
                  <SceneBoundary>
                    <Suspense fallback={<div className="scene-loading"><span />Initializing Cesium 3D Mars…</div>}>
                      <CesiumMarsHero
                        activeLandmark={activeLandmark}
                        onSelectLandmark={selectLandmark}
                        scienceLayer={scienceLayer}
                        geologyOpacity={geologyOpacity}
                        rotating={rotating && activeLandmark === 'global' && !routeMode}
                        zoom={zoom}
                        reset={reset}
                        reducedMotion={reducedMotion}
                        onTelemetry={setTelemetry}
                        activeRoute={routeMode}
                        routeFocus={routeFocus}
                      />
                    </Suspense>
                  </SceneBoundary>
                </div>
              )}

              <div className="scene-vignette" aria-hidden="true" />
              <div className="world-watermark" aria-hidden="true">MARS</div>

              <section className={`world-story ${activeLandmark !== 'global' ? 'poi-story' : ''}`} key={activeLandmark}>
                {activeLandmark === 'global' ? <>
                  <div className="world-position"><span className="position-line" /><span>{landmark.tag}</span></div>
                  <h1>Mars.</h1>
                  <h2>{landmark.subtitle}</h2>
                  <p>{landmark.description}</p>
                </> : <>
                  <h1 className="poi-nav-heading">Explore further.</h1>
                  <p className="poi-nav-copy">{poiOpen ? 'Start an expedition or return to the planetary view.' : 'Open the location guide or choose where to go next.'}</p>
                  {!poiOpen && <button className="story-link poi-information-link" onClick={() => setPoiOpen(true)}>View location details <ArrowUpRight size={13} /></button>}
                </>}
                {activeLandmark === 'jezero' && !poiOpen && <button className="story-link poi-information-link" onClick={() => setMode('jezero-map')}>Open detailed 2D terrain map <ArrowRight size={13} /></button>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '22px' }}>
                  <button className="primary-button" onClick={() => setMode('mars')}>
                    Start expedition <ArrowRight size={18} />
                  </button>
                  <button className="mars-direct-link" onClick={descend}>
                    <Rocket size={13} /> Watch landing sequence
                  </button>
                </div>
                {activeLandmark !== 'global' && (
                  <button className="story-link" onClick={() => { selectLandmark('global'); setReset(n => n + 1) }}>
                    <RotateCcw size={12} /> Return to planetary view
                  </button>
                )}
              </section>

              <div className="coordinate-stamp">
                <Compass size={16} />
                <span>{landmark.id !== 'global' ? `${landmark.coordinates} · ${landmark.name.toUpperCase()}` : `${telemetry.lat}° N · ${telemetry.lon}° E · ${telemetry.heightKm} KM ALTITUDE`}</span>
              </div>

              <div className="viewer-tools" aria-label="View controls">
                <button className={`icon-button ${!rotating ? 'is-toggled' : ''}`} onClick={() => setRotating(!rotating)} disabled={activeLandmark !== 'global' || Boolean(routeMode)} aria-label={activeLandmark !== 'global' || routeMode ? 'Rotation available in planetary view' : rotating ? 'Pause rotation' : 'Resume rotation'} title={activeLandmark !== 'global' || routeMode ? 'Close the journey to rotate Mars' : rotating ? 'Pause rotation' : 'Resume rotation'}>
                  {rotating ? <Pause size={16} /> : <Play size={16} />}
                </button>
                <span className="tool-separator" />
                <button className="icon-button" onClick={() => setZoom(n => n + 1)} aria-label="Zoom in" title="Zoom in"><Plus size={18} /></button>
                <button className="icon-button" onClick={() => setZoom(n => n - 1)} aria-label="Zoom out" title="Zoom out"><Minus size={18} /></button>
                <button className="icon-button" onClick={() => { selectLandmark('global'); setReset(n => n + 1) }} aria-label="Reset camera" title="Reset camera"><RotateCcw size={15} /></button>
                <span className="tool-separator" />
                <button className="icon-button fullscreen-button" onClick={toggleFullscreen} aria-label={fullScreen ? 'Exit fullscreen' : 'Enter fullscreen'} title={fullScreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
                  <Expand size={16} />
                </button>
              </div>

              <div className="drag-hint">
                <span className="mouse-outline"><i /></span>
                DRAG TO ROTATE GLOBE · SCROLL TO ZOOM · RIGHT-DRAG TO TILT
              </div>

              {activeLandmark === 'global' && <dl className="world-facts">
                <div><dt>MEAN DIAMETER</dt><dd>6,779<small>km</small></dd></div>
                <div><dt>SURFACE GRAVITY</dt><dd>3.71<small>m/s²</small></dd></div>
                <div><dt>SOL LENGTH</dt><dd>24.6<small>hours</small></dd></div>
                <div><dt>SURFACE TEMP</dt><dd>−65<small>°C</small></dd></div>
              </dl>}
            </main>
            {routeMode && <RoutePanel route={MARS_ROUTES[routeMode]} onClose={() => selectLandmark('global')} onFit={() => setRouteFocus(current => ({ mode: 'full', tick: current.tick + 1 }))} onInspect={() => setRouteFocus(current => ({ mode: 'rover', tick: current.tick + 1 }))} onOpenJezeroMap={() => setMode('jezero-map')} onSelectRoute={selectRoute} />}
            {!routeMode && poiOpen && activeLandmark !== 'global' && <LandmarkPanel landmark={landmark} onClose={() => setPoiOpen(false)} onOpenJezeroMap={() => setMode('jezero-map')} />}
            </div>

            <section className="mars-exploration-dock" aria-label="Choose a Martian landmark and science imagery layer">
              <div className="mars-landmark-selector">
                <label htmlFor="mars-poi-select">POINT OF INTEREST</label>
                <select id="mars-poi-select" value={activeLandmark} onChange={event => selectLandmark(event.target.value)}>
                  {MARS_LANDMARKS.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </div>

              <div className="mars-science-picker">
                <label htmlFor="mars-imagery-select">SCIENCE MAP LAYERS</label>
                <select id="mars-imagery-select" value={scienceLayer} onChange={event => setScienceLayer(event.target.value)}>
                  {SCIENCE_LAYERS.filter(layer => layer.id === 'natural' || layer.id === 'mola' || layer.id === 'sim3464' || regionalImagery?.[layer.id]).map(layer => <option key={layer.id} value={layer.id}>{regionalImagery?.[layer.id]?.detail || layer.name}</option>)}
                </select>
                {scienceLayer === 'sim3464' && <label className="mars-geology-opacity">Geology opacity <input type="range" min="0.2" max="1" step="0.05" value={geologyOpacity} onChange={event => setGeologyOpacity(Number(event.target.value))} /><span>{Math.round(geologyOpacity * 100)}%</span></label>}
                {scienceLayer === 'sim3464' && <small className="mars-imagery-note">USGS 1:75,000 geology; boundaries may be offset 100–200 m from rover imagery.</small>}
                {activeLandmark === 'syrtis' && <small className="mars-imagery-note">No verified regional CTX or HiRISE mosaic for this site in Mars Trek.</small>}
              </div>
              <div className="mars-route-picker">
                <label htmlFor="mars-route-select">ROVERS & STORIES</label>
                <select id="mars-route-select" value={routeMode || ''} onChange={event => selectRoute(event.target.value)}>
                  <option value="">Choose a journey</option>
                  <option value="perseverance">Perseverance · driven path</option>
                  <option value="curiosity">Curiosity · driven path</option>
                  <option value="watney">Mark Watney · fictional journey</option>
                </select>
              </div>
            </section>
          </>
        )}

        <footer className="site-footer">
          <p>Built on curiosity.<span> Dedicated to Mars Exploration.</span></p>
          <div>
            <button onClick={descend}><Rocket size={13} />Replay landing sequence</button>
            <button className={sound ? 'sound-on' : ''} onClick={toggleSound} aria-pressed={sound}>
              {sound ? <Volume2 size={14} /> : <VolumeX size={14} />}
              <span>Ambient sound {sound ? 'on' : 'off'}</span>
            </button>
            <button onClick={() => setPanel('mission')}>About this demo <ArrowUpRight size={12} /></button>
          </div>
          <span className="demo-label"><i />CESIUM 3D MARS · NASA MARS TREK</span>
        </footer>
      </div>

      {intro && <Descent onComplete={finishIntro} reducedMotion={reducedMotion} />}
      {panel && <InfoPanel panel={panel} onClose={() => setPanel(null)} onStartExpedition={() => setMode('mars')} />}
      {notice && <div role="status" className="toast">{notice}</div>}
    </div>
  )
}
