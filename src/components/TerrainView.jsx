import { useEffect, useRef, useState } from 'react'
import { Map as MapLibreMap } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { RefreshCw, Mountain } from 'lucide-react'
import { destinations } from '../data'

export default function TerrainView({ destination, exaggeration, zoom, reset, reducedMotion }) {
  const host = useRef()
  const mapRef = useRef()
  const previousCamera = useRef({ zoom, reset, destination })
  const [status, setStatus] = useState('loading')
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    setStatus('loading')
    const place = destinations[destination]
    const map = new MapLibreMap({
      container: host.current,
      center: place.center, zoom: place.zoom, pitch: place.pitch, bearing: place.bearing,
      maxPitch: 85, maxZoom: 16, attributionControl: { compact: true },
      canvasContextAttributes: { antialias: true },
      style: { version: 8, sources: {
        satellite: { type: 'raster', tiles: ['https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'], tileSize: 256, attribution: 'Imagery © Esri, Maxar, Earthstar Geographics, and the GIS User Community', maxzoom: 18 },
        elevation: { type: 'raster-dem', tiles: ['https://tiles.mapterhorn.com/{z}/{x}/{y}.webp'], encoding: 'terrarium', tileSize: 512, maxzoom: 12, attribution: '<a href="https://mapterhorn.com/attribution" target="_blank" rel="noreferrer">© Mapterhorn</a>' },
      }, layers: [{ id: 'satellite', type: 'raster', source: 'satellite', paint: { 'raster-saturation': -0.25, 'raster-contrast': 0.1 } }],
      terrain: { source: 'elevation', exaggeration },
      sky: { 'sky-color': '#121e2b', 'horizon-color': '#7d919d', 'fog-color': '#71848c', 'fog-ground-blend': 0.2, 'horizon-fog-blend': 0.4 },
      },
    })
    mapRef.current = map
    const observer = new ResizeObserver(() => map.resize())
    observer.observe(host.current)
    let ready = false
    map.on('idle', () => { ready = true; setStatus('ready') })
    const timeout = setTimeout(() => { if (!ready) setStatus('slow') }, 18000)
    map.on('error', (event) => { if (/WebGL|Failed to initialize/i.test(event.error?.message || '')) setStatus('error') })
    return () => { clearTimeout(timeout); observer.disconnect(); map.remove(); mapRef.current = null }
  }, [retry])
  useEffect(() => {
    const place = destinations[destination]
    const previous = previousCamera.current
    const map = mapRef.current
    if (map && (destination !== previous.destination || reset !== previous.reset)) {
      map.flyTo({ center: place.center, zoom: place.zoom, pitch: place.pitch, bearing: place.bearing, duration: reducedMotion ? 0 : 2400, essential: false })
    } else if (map && zoom !== previous.zoom) {
      map.zoomTo(map.getZoom() + (zoom - previous.zoom) * 0.5, { duration: reducedMotion ? 0 : 350 })
    }
    previousCamera.current = { zoom, reset, destination }
  }, [destination, reset, reducedMotion, zoom])
  useEffect(() => {
    const map = mapRef.current
    if (map?.isStyleLoaded()) map.setTerrain({ source: 'elevation', exaggeration })
    else map?.once('load', () => map.setTerrain({ source: 'elevation', exaggeration }))
  }, [exaggeration])
  return <>
    <div className="terrain-canvas" ref={host} aria-label={`Interactive 3D terrain map of ${destinations[destination].name}`} />
    {status === 'loading' && <div className="map-status"><Mountain size={16} /><span>Mapping the mountains…</span></div>}
    {(status === 'slow' || status === 'error') && <div className="map-status map-error" role="status"><span>Terrain tiles couldn’t load. Check your internet connection.</span><button onClick={() => setRetry(n => n + 1)}><RefreshCw size={14} /> Retry</button></div>}
  </>
}
