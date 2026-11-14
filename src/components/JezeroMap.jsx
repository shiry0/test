import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ArrowUpRight, Compass, Minus, Plus, RotateCcw, X } from 'lucide-react'
import { MARS_IMAGERY } from '../data/marsImagery'
import metadata from '../data/jezeroDem.json'
import MARS_ROUTES from '../data/marsRoutes.js'
import { SIM3464_BOUNDS, SIM3464_IMAGE, SIM3464_SOURCE } from '../data/sim3464'
import './jezeroMap.css'

const RADIUS = 3396190
const INITIAL = { lon: 77.58, lat: 18.55, zoom: 8.6 }
const LANDMARKS = [
  { name: 'Jezero crater', lon: 77.69, lat: 18.41, kind: 'Crater', detail: 'An ancient lake basin explored by Perseverance.', url: 'https://science.nasa.gov/mission/mars-2020-perseverance/' },
  { name: 'Neretva Vallis', lon: 77.2, lat: 18.55, kind: 'Inlet valley', detail: 'The western inlet channel leading into Jezero.', url: 'https://planetarynames.wr.usgs.gov/Feature/15879' },
  { name: 'Sava Vallis', lon: 77.13, lat: 19.09, kind: 'Inlet valley', detail: 'The northern valley system near Jezero.', url: 'https://planetarynames.wr.usgs.gov/Feature/15904' },
  { name: 'Pliva Vallis', lon: 78.35, lat: 18.67, kind: 'Outlet valley', detail: 'The eastern outlet valley from Jezero.', url: 'https://planetarynames.wr.usgs.gov/Feature/15903' },
  { name: 'Nili Planum', lon: 77.1, lat: 18.6, kind: 'Plain', detail: 'The highland plain west of Jezero.', url: 'https://planetarynames.wr.usgs.gov/Feature/15880' },
  { name: 'Belva crater', lon: 77.38, lat: 18.48, kind: 'Crater', detail: 'A small named crater near the western delta.', url: 'https://planetarynames.wr.usgs.gov/Feature/15872' },
  { name: 'Hartwell crater', lon: 77.72, lat: 18.53, kind: 'Crater', detail: 'A named crater on the northern Jezero floor.', url: 'https://planetarynames.wr.usgs.gov/Feature/15871' },
  { name: 'Dacono crater', lon: 77.95, lat: 18.34, kind: 'Crater', detail: 'A named crater on the eastern Jezero floor.', url: 'https://planetarynames.wr.usgs.gov/Feature/15877' },
]
const ppd = zoom => 512 * 2 ** zoom / 360
const metresPerPixel = (zoom, lat) => 2 * Math.PI * RADIUS * Math.cos(lat * Math.PI / 180) / (512 * 2 ** zoom)
const clamp = (value, low, high) => Math.max(low, Math.min(high, value))
const intersects = (a, b) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1]

export default function JezeroMap({ onBack }) {
  const viewportRef = useRef(null)
  const dragRef = useRef(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [view, setView] = useState(INITIAL)
  const [cursor, setCursor] = useState(null)
  const [selected, setSelected] = useState(null)
  const [imagery, setImagery] = useState('imagery')
  const [geologyOpacity, setGeologyOpacity] = useState(0.7)
  const [showTraverse, setShowTraverse] = useState(true)
  const [tileError, setTileError] = useState(false)
  const resolution = metresPerPixel(view.zoom, view.lat)
  const hiriseBounds = MARS_IMAGERY.jezero.hirise.bounds
  const inHiriseBounds = view.lon >= hiriseBounds[0] && view.lon <= hiriseBounds[2] && view.lat >= hiriseBounds[1] && view.lat <= hiriseBounds[3]

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }))
    observer.observe(viewportRef.current)
    return () => observer.disconnect()
  }, [])

  const screenPoint = useCallback((lon, lat) => ({
    x: size.width / 2 + (lon - view.lon) * ppd(view.zoom),
    y: size.height / 2 + (view.lat - lat) * ppd(view.zoom),
  }), [size, view])

  const zoomAt = useCallback((nextZoom, x = size.width / 2, y = size.height / 2) => {
    setView(current => {
      const next = clamp(nextZoom, 7.5, 17)
      const lon = current.lon + (x - size.width / 2) / ppd(current.zoom)
      const lat = current.lat - (y - size.height / 2) / ppd(current.zoom)
      return { zoom: next, lon: lon - (x - size.width / 2) / ppd(next), lat: lat + (y - size.height / 2) / ppd(next) }
    })
  }, [size])

  const mapPoint = event => {
    const box = viewportRef.current.getBoundingClientRect()
    return { x: event.clientX - box.left, y: event.clientY - box.top }
  }
  const onPointerDown = event => {
    if (event.button !== 0 || event.target.closest('button,a,.jezero-feature')) return
    dragRef.current = { id: event.pointerId, point: mapPoint(event), view }
    viewportRef.current.setPointerCapture(event.pointerId)
  }
  const onPointerMove = event => {
    const point = mapPoint(event)
    if (dragRef.current?.id === event.pointerId) {
      const { point: start, view: origin } = dragRef.current
      setView({ ...origin, lon: origin.lon - (point.x - start.x) / ppd(origin.zoom), lat: origin.lat + (point.y - start.y) / ppd(origin.zoom) })
    }
    setCursor({ lon: view.lon + (point.x - size.width / 2) / ppd(view.zoom), lat: view.lat - (point.y - size.height / 2) / ppd(view.zoom) })
  }
  const onPointerUp = event => { if (dragRef.current?.id === event.pointerId) dragRef.current = null }
  useEffect(() => {
    const viewport = viewportRef.current
    const wheel = event => {
      event.preventDefault()
      const box = viewport.getBoundingClientRect()
      zoomAt(view.zoom - event.deltaY * .002, event.clientX - box.left, event.clientY - box.top)
    }
    viewport.addEventListener('wheel', wheel, { passive: false })
    return () => viewport.removeEventListener('wheel', wheel)
  }, [view.zoom, zoomAt])
  const onKeyDown = event => {
    const move = { ArrowLeft: [-100, 0], ArrowRight: [100, 0], ArrowUp: [0, 100], ArrowDown: [0, -100] }[event.key]
    if (move) { event.preventDefault(); setView(current => ({ ...current, lon: current.lon + move[0] / ppd(current.zoom), lat: current.lat + move[1] / ppd(current.zoom) })) }
    else if (event.key === '+' || event.key === '=') zoomAt(view.zoom + .6)
    else if (event.key === '-') zoomAt(view.zoom - .6)
  }

  const tileLayers = useMemo(() => {
    if (!size.width || !size.height) return []
    const specs = [
      { key: 'mola', maxLevel: 6, bounds: [-180, -90, 180, 90], className: 'base' },
      ...(imagery !== 'relief' ? [
        { ...MARS_IMAGERY.jezero.wide, className: 'wide' },
        { ...MARS_IMAGERY.jezero.ctx, className: 'ctx' },
        { ...MARS_IMAGERY.jezero.hirise, className: 'hirise' },
      ] : []),
    ]
    return specs.map(layer => {
      if (layer.key === 'mola' && view.zoom > 10.5) return { name: 'base', tiles: [] }
      const z = Math.min(layer.key === 'mola' ? Math.floor(view.zoom) : Math.ceil(view.zoom), layer.maxLevel)
      const step = 360 / 2 ** (z + 1)
      const left = view.lon - size.width / 2 / ppd(view.zoom)
      const right = view.lon + size.width / 2 / ppd(view.zoom)
      const top = view.lat + size.height / 2 / ppd(view.zoom)
      const bottom = view.lat - size.height / 2 / ppd(view.zoom)
      const minX = clamp(Math.floor((left + 180) / step), 0, 2 ** (z + 1) - 1)
      const maxX = clamp(Math.floor((right + 180) / step), 0, 2 ** (z + 1) - 1)
      const minY = clamp(Math.floor((90 - top) / step), 0, 2 ** z - 1)
      const maxY = clamp(Math.floor((90 - bottom) / step), 0, 2 ** z - 1)
      const tiles = []
      for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
        const bounds = [-180 + x * step, 90 - (y + 1) * step, -180 + (x + 1) * step, 90 - y * step]
        if (!intersects(bounds, layer.bounds)) continue
        const pos = screenPoint(bounds[0], bounds[3])
        const tileSize = step * ppd(view.zoom)
        tiles.push({ key: `${layer.key}/${z}/${y}/${x}`, url: `/api/mars-tiles/${layer.key}/${z}/${y}/${x}`, x: pos.x, y: pos.y, size: tileSize })
      }
      return { name: layer.className, tiles }
    })
  }, [imagery, screenPoint, size, view])

  const reliefTopLeft = screenPoint(metadata.northWest[0], metadata.northWest[1])
  const reliefBottomRight = screenPoint(metadata.southEast[0], metadata.southEast[1])
  const geologyTopLeft = screenPoint(SIM3464_BOUNDS[0], SIM3464_BOUNDS[3])
  const geologyBottomRight = screenPoint(SIM3464_BOUNDS[2], SIM3464_BOUNDS[1])
  const scaleKm = [1, 2, 5, 10, 20, 50].find(km => km * 1000 / resolution > 90) || 50
  const visibleLandmarks = LANDMARKS.filter(item => { const p = screenPoint(item.lon, item.lat); return p.x > -120 && p.x < size.width + 120 && p.y > -40 && p.y < size.height + 40 })
  const perseverance = MARS_ROUTES.perseverance
  const roverPoint = screenPoint(...perseverance.latest)
  const roverFeature = { name: 'Perseverance rover', kind: `Sol ${perseverance.sol} · route snapshot`, detail: 'NASA’s recorded traverse through this map snapshot. Open the live mission map for the newest drive.', url: perseverance.missionUrl }

  return <main id="explorer" className="jezero-map-page">
    <div className="jezero-map-heading">
      <div><button className="jezero-map-back" onClick={onBack}><ArrowLeft size={17} /> Open game map</button><h1>Jezero region</h1><p>Follow the valleys, crater rim, and nearby named terrain. Drag to explore the wider map.</p></div>
      <div className="jezero-map-source"><span>2D MARS MAP</span><strong>{resolution < 2 ? resolution.toFixed(1) : Math.round(resolution)} m / screen pixel</strong><small>{imagery === 'relief' ? '20 m CTX elevation source' : inHiriseBounds ? 'HiRISE mosaic available here' : 'Outside HiRISE coverage · CTX imagery'}</small></div>
    </div>
    <div className="jezero-map-toolbar">
      <div className="jezero-layer-switch" aria-label="Map layer"><button className={imagery === 'imagery' ? 'active' : ''} onClick={() => setImagery('imagery')}>Orbital imagery</button><button className={imagery === 'relief' ? 'active' : ''} onClick={() => setImagery('relief')}>Elevation relief</button><button className={imagery === 'geology' ? 'active' : ''} onClick={() => setImagery('geology')}>USGS geology</button></div>
      {imagery === 'geology' && <label className="jezero-geology-opacity">Opacity <input type="range" min="0.2" max="1" step="0.05" value={geologyOpacity} onChange={event => setGeologyOpacity(Number(event.target.value))} /><span>{Math.round(geologyOpacity * 100)}%</span></label>}
      <div className="jezero-map-jump"><label htmlFor="jezero-landmark-jump">Jump to</label><select id="jezero-landmark-jump" value={LANDMARKS.some(item => item.name === selected?.name) ? selected.name : ''} onChange={event => { const item = LANDMARKS.find(feature => feature.name === event.target.value); if (item) { setSelected(item); setView(current => ({ ...current, lon: item.lon, lat: item.lat, zoom: Math.max(current.zoom, 10.2) })) } }}><option value="">Choose landmark</option>{LANDMARKS.map(item => <option key={item.name} value={item.name}>{item.name}</option>)}</select></div>
      <label className="jezero-traverse-toggle"><input type="checkbox" checked={showTraverse} onChange={event => setShowTraverse(event.target.checked)} /> Perseverance path</label>
      <button className="jezero-detail-button" onClick={() => { setImagery('imagery'); setView({ lon: 77.38, lat: 18.48, zoom: 15.4 }); setSelected(LANDMARKS[5]) }}>Go to 1 m detail <Plus size={16} /></button>
    </div>
    <div className="jezero-map-frame">
      <div ref={viewportRef} className="jezero-map-viewport" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onPointerLeave={() => setCursor(null)} onKeyDown={onKeyDown} tabIndex={0} role="region" aria-label="Jezero regional map. Drag or use arrow keys to pan, scroll or use controls to zoom.">
        {tileLayers[0]?.tiles.map(tile => <img className="jezero-tile base" key={tile.key} src={tile.url} alt="" draggable="false" style={{ left: tile.x, top: tile.y, width: tile.size, height: tile.size }} onError={event => { event.currentTarget.style.display = 'none'; setTileError(true) }} />)}
        <img className="jezero-relief-image" src={metadata.image} alt="" draggable="false" style={{ left: reliefTopLeft.x, top: reliefTopLeft.y, width: reliefBottomRight.x - reliefTopLeft.x, height: reliefBottomRight.y - reliefTopLeft.y }} />
        {tileLayers.slice(1).map(layer => layer.tiles.map(tile => <img className={`jezero-tile ${layer.name}`} key={tile.key} src={tile.url} alt="" draggable="false" style={{ left: tile.x, top: tile.y, width: tile.size, height: tile.size }} onError={event => { event.currentTarget.style.display = 'none' }} />))}
        {imagery === 'geology' && <img className="jezero-geology-image" src={SIM3464_IMAGE} alt="" draggable="false" style={{ left: geologyTopLeft.x, top: geologyTopLeft.y, width: geologyBottomRight.x - geologyTopLeft.x, height: geologyBottomRight.y - geologyTopLeft.y, opacity: geologyOpacity }} />}
        {showTraverse && <svg className="jezero-rover-route" width={size.width} height={size.height} aria-hidden="true"><polyline points={perseverance.coordinates.map(([lon, lat]) => { const p = screenPoint(lon, lat); return `${p.x.toFixed(1)},${p.y.toFixed(1)}` }).join(' ')} /></svg>}
        {showTraverse && roverPoint.x > -80 && roverPoint.x < size.width + 80 && roverPoint.y > -30 && roverPoint.y < size.height + 30 && <button className="jezero-landmark jezero-rover-marker" style={{ left: roverPoint.x, top: roverPoint.y }} onClick={() => setSelected(roverFeature)}><span className="jezero-landmark-dot" /><span>Perseverance · Sol {perseverance.sol}</span></button>}
        {visibleLandmarks.map(item => { const p = screenPoint(item.lon, item.lat); return <button key={item.name} className={`jezero-landmark ${selected?.name === item.name ? 'selected' : ''}`} style={{ left: p.x, top: p.y }} onClick={() => setSelected(item)}><span className="jezero-landmark-dot" /><span>{item.name}</span></button> })}
        {selected && <div className="jezero-feature" role="status"><button className="jezero-feature-close" onClick={() => setSelected(null)} aria-label="Close landmark information"><X size={16} /></button><small>{selected.kind}</small><strong>{selected.name}</strong><p>{selected.detail}</p><a href={selected.url} target="_blank" rel="noreferrer">Read source <ArrowUpRight size={13} /></a></div>}
        <div className="jezero-map-compass" aria-hidden="true"><Compass size={18} /><span>N</span></div>
        <div className="jezero-map-controls" aria-label="Map controls"><button onClick={() => zoomAt(view.zoom + .7)} aria-label="Zoom in"><Plus size={19} /></button><button onClick={() => zoomAt(view.zoom - .7)} aria-label="Zoom out"><Minus size={19} /></button><button onClick={() => { setView(INITIAL); setSelected(null) }} aria-label="Reset regional map"><RotateCcw size={17} /></button></div>
        <div className="jezero-map-scale" aria-hidden="true"><span style={{ width: `${scaleKm * 1000 / resolution}px` }} />{scaleKm} km</div>
        <div className="jezero-map-coordinate">{cursor ? `${cursor.lat.toFixed(4)}° N · ${cursor.lon.toFixed(4)}° E` : `${view.lat.toFixed(4)}° N · ${view.lon.toFixed(4)}° E`}</div>
      </div>
      <div className="jezero-map-legend"><strong>{imagery === 'relief' ? 'Elevation relief' : imagery === 'geology' ? 'USGS SIM 3464' : 'Mars orbital imagery'}</strong><span>{imagery === 'relief' ? '20 m CTX DEM in mapped area' : imagery === 'geology' ? 'Mapped units · 1:75,000 · approximate alignment' : 'HiRISE 25 cm · CTX 6 m · MOLA context'}</span><small>{imagery === 'geology' ? 'USGS notes a 100–200 m offset from the rover operations mosaic.' : tileError ? 'Live tiles unavailable; local relief remains visible.' : 'High detail is limited to mapped coverage.'}</small><a href={imagery === 'geology' ? SIM3464_SOURCE : perseverance.missionUrl} target="_blank" rel="noreferrer">{imagery === 'geology' ? 'USGS map ↗' : 'NASA live rover map ↗'}</a></div>
    </div>
  </main>
}
