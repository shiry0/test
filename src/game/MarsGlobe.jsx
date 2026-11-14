import { useEffect, useRef, useState } from 'react'
import { Globe2, X } from 'lucide-react'
import * as Cesium from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'
import './marsGlobe.css'
import { SITES } from './marsModel'
import { SIM3464_BOUNDS, SIM3464_IMAGE } from '../data/sim3464'

const ION_ASSET_ID = 3644333
const secondsPerSol = 24 * 60 * 60 + 39 * 60 + 35
const scienceLayers = {
  none: null,
  ctx: { name: 'CTX · Jezero · 6 m/px', bounds: [77.1604655, 18.2110274, 77.6991776, 18.7211945], maxLevel: 13 },
  hirise: { name: 'HiRISE · Jezero · 25 cm/px', bounds: [77.2229331, 18.3067994, 77.583964, 18.669315], maxLevel: 17 },
  mola: { name: 'MOLA · elevation colours', bounds: [-180, -90, 180, 90], maxLevel: 6 },
  sim3464: { name: 'USGS SIM 3464 · geologic units', bounds: SIM3464_BOUNDS },
}

function safeDescription(properties) {
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])
  const url = /^https:\/\//.test(properties.sourceURL) ? properties.sourceURL : ''
  return `<p>${escape(properties.description)}</p>${url ? `<p>Source: <a href="${escape(url)}" target="_blank" rel="noopener noreferrer">${escape(properties.source)}</a></p>` : ''}`
}

export default function MarsGlobe({ onClose, onSelectSite }) {
  const dialog = useRef(null)
  const container = useRef(null)
  const viewerRef = useRef(null)
  const tilesetRef = useRef(null)
  const roverRef = useRef({})
  const landmarkRef = useRef({})
  const [status, setStatus] = useState('loading')
  const [rovers, setRovers] = useState([])
  const [landmarks, setLandmarks] = useState([])
  const [token, setToken] = useState(() => import.meta.env.VITE_CESIUM_ION_TOKEN?.trim() || '')
  const [tokenInput, setTokenInput] = useState('')
  const [scienceLayer, setScienceLayer] = useState('ctx')
  const [geologyOpacity, setGeologyOpacity] = useState(0.68)
  const geologyOpacityRef = useRef(geologyOpacity)
  geologyOpacityRef.current = geologyOpacity
  const [selectedWaypoint, setSelectedWaypoint] = useState('')

  useEffect(() => {
    const element = dialog.current
    element.showModal()
    return () => element.close()
  }, [])

  useEffect(() => {
    if (!token) { setStatus('token'); return }
    let active = true
    let viewer
    const previousEllipsoid = Cesium.Ellipsoid.default
    const previousToken = Cesium.Ion.defaultAccessToken
    const start = async () => {
      try {
        Cesium.Ellipsoid.default = Cesium.Ellipsoid.MARS
        Cesium.Ion.defaultAccessToken = token
        viewer = new Cesium.Viewer(container.current, {
          baseLayer: false,
          baseLayerPicker: false,
          geocoder: false,
          homeButton: false,
          sceneModePicker: false,
          animation: true,
          timeline: true,
          shadows: false,
          globe: new Cesium.Globe(Cesium.Ellipsoid.MARS),
          skyBox: Cesium.SkyBox.createEarthSkyBox(),
          skyAtmosphere: new Cesium.SkyAtmosphere(Cesium.Ellipsoid.MARS),
        })
        viewerRef.current = viewer
        viewer.scene.globe.show = false
        const atmosphere = viewer.scene.skyAtmosphere
        atmosphere.atmosphereMieCoefficient = new Cesium.Cartesian3(9e-5, 2e-5, 1e-5)
        atmosphere.atmosphereRayleighCoefficient = new Cesium.Cartesian3(9e-6, 2e-6, 1e-6)
        atmosphere.atmosphereRayleighScaleHeight = 9000
        atmosphere.atmosphereMieScaleHeight = 2700
        atmosphere.saturationShift = -0.1
        atmosphere.perFragmentAtmosphere = true
        const bloom = viewer.scene.postProcessStages.bloom
        bloom.enabled = true
        bloom.uniforms.brightness = -0.5
        bloom.uniforms.stepSize = 1
        bloom.uniforms.sigma = 3
        bloom.uniforms.delta = 1.5
        viewer.scene.highDynamicRange = true
        viewer.scene.postProcessStages.exposure = 1.5

        const tileset = await Cesium.Cesium3DTileset.fromIonAssetId(ION_ASSET_ID, { enableCollision: true })
        if (!active) { tileset.destroy(); return }
        viewer.scene.primitives.add(tileset)
        tilesetRef.current = tileset
        await viewer.zoomTo(tileset)
        for (const site of SITES) {
          viewer.entities.add({
            id: `game-${site.id}`,
            name: site.name,
            position: Cesium.Cartesian3.fromDegrees(site.longitude, site.latitude, site.elevation + 12, Cesium.Ellipsoid.MARS),
            point: { pixelSize: 10, color: Cesium.Color.ORANGE, outlineColor: Cesium.Color.WHITE, outlineWidth: 2, disableDepthTestDistance: Number.POSITIVE_INFINITY },
            label: { text: site.name, font: '14px sans-serif', pixelOffset: new Cesium.Cartesian2(0, -20), fillColor: Cesium.Color.WHITE, outlineColor: Cesium.Color.BLACK, outlineWidth: 2, style: Cesium.LabelStyle.FILL_AND_OUTLINE, disableDepthTestDistance: Number.POSITIVE_INFINITY },
            description: `<p>Educational waypoint on Perseverance's mapped traverse. ${site.locationNote}</p><p>${site.latitude.toFixed(6)}° N, ${site.longitude.toFixed(6)}° E</p>`,
          })
        }
        const czml = await Cesium.CzmlDataSource.load('/mars/Mars.czml')
        if (!active) return
        viewer.dataSources.add(czml)
        const roverNames = ['Curiosity', 'Perseverance', 'Ingenuity', 'TheMartianJourney']
        roverRef.current = Object.fromEntries(roverNames.map(name => [name, czml.entities.getById(name)]).filter(([, entity]) => entity))
        for (const [name, startSol] of [['Curiosity', 3], ['Perseverance', 13]]) {
          const rover = roverRef.current[name]
          if (!rover?.availability) continue
          const beginning = rover.availability.start
          rover.label.text = new Cesium.CallbackProperty(time => `Sol ${Math.floor(Cesium.JulianDate.secondsDifference(time, beginning) / secondsPerSol) + startSol}`, false)
          const path = czml.entities.getById(`${name}Path`)
          if (path?.polyline) path.polyline.width = new Cesium.CallbackProperty(() => {
            const height = viewer.camera.positionCartographic.height
            return Cesium.Math.lerp(15, 0, Cesium.Math.clamp(height / 1e5, 0, 1))
          }, false)
        }
        setRovers(Object.keys(roverRef.current))

        const placesResponse = await fetch('/mars/MarsPointsOfInterest.geojson')
        if (!placesResponse.ok) throw new Error(`Landmarks returned ${placesResponse.status}`)
        const places = await placesResponse.json()
        if (!active) return
        landmarkRef.current = Object.fromEntries(places.features.map(feature => {
          const properties = feature.properties
          const name = properties?.text
          if (!name) return null
          const [longitude, latitude] = feature.geometry.coordinates
          const entity = viewer.entities.add({
            name,
            position: Cesium.Cartesian3.fromDegrees(longitude, latitude, 0, Cesium.Ellipsoid.MARS),
            properties: { destination: properties.destination, orientation: properties.orientation },
            description: safeDescription(properties),
            label: new Cesium.LabelGraphics({ text: name, font: '16px sans-serif', fillColor: Cesium.Color.WHITE, outlineColor: Cesium.Color.DARKSLATEGREY, outlineWidth: 2, style: Cesium.LabelStyle.FILL_AND_OUTLINE, pixelOffset: new Cesium.Cartesian2(0, -20), scaleByDistance: new Cesium.NearFarScalar(1.5e2, 1, 1.5e7, 0.5), disableDepthTestDistance: Number.POSITIVE_INFINITY }),
            point: new Cesium.PointGraphics({ pixelSize: 9, color: Cesium.Color.fromBytes(243, 242, 99), outlineColor: Cesium.Color.fromBytes(80, 70, 45), outlineWidth: 2, scaleByDistance: new Cesium.NearFarScalar(1.5e3, 1, 4e7, 0.1), disableDepthTestDistance: Number.POSITIVE_INFINITY }),
          })
          return [name, entity]
        }).filter(Boolean))
        setLandmarks(Object.keys(landmarkRef.current))
        if (active) setStatus('ready')
      } catch (error) {
        if (active) {
          console.error('Could not load Mars tileset', error)
          setStatus('error')
        }
      }
    }
    start()
    return () => {
      active = false
      viewerRef.current = null
      tilesetRef.current = null
      roverRef.current = {}; landmarkRef.current = {}
      if (viewer && !viewer.isDestroyed()) viewer.destroy()
      Cesium.Ellipsoid.default = previousEllipsoid
      Cesium.Ion.defaultAccessToken = previousToken
    }
  }, [token])

  useEffect(() => {
    if (status !== 'ready' || !tilesetRef.current) return
    const layers = tilesetRef.current.imageryLayers
    layers.removeAll()
    const selected = scienceLayers[scienceLayer]
    if (!selected) return
    if (scienceLayer === 'sim3464') {
      let cancelled = false
      Cesium.SingleTileImageryProvider.fromUrl(SIM3464_IMAGE, {
        rectangle: Cesium.Rectangle.fromDegrees(...SIM3464_BOUNDS),
        ellipsoid: Cesium.Ellipsoid.MARS,
        credit: 'USGS SIM 3464 · Sun and Stack (2020)',
      }).then(provider => {
        if (cancelled || viewer.isDestroyed()) return
        const overlay = layers.addImageryProvider(provider)
        overlay.alpha = geologyOpacityRef.current
      }).catch(error => console.warn('USGS geology overlay unavailable:', error))
      return () => { cancelled = true }
    }
    const [west, south, east, north] = selected.bounds
    layers.addImageryProvider(new Cesium.UrlTemplateImageryProvider({
      url: `/api/mars-tiles/${scienceLayer}/{z}/{y}/{x}`,
      tilingScheme: new Cesium.GeographicTilingScheme({ ellipsoid: Cesium.Ellipsoid.MARS }),
      rectangle: Cesium.Rectangle.fromDegrees(west, south, east, north),
      maximumLevel: selected.maxLevel,
      credit: 'NASA Mars Trek · MRO / MGS',
    }))
  }, [scienceLayer, status])

  useEffect(() => {
    const layers = tilesetRef.current?.imageryLayers
    if (scienceLayer === 'sim3464' && layers?.length) layers.get(0).alpha = geologyOpacity
  }, [geologyOpacity, scienceLayer, status])

  const flyToWaypoint = id => {
    setSelectedWaypoint(id)
    const site = SITES.find(item => item.id === id)
    const viewer = viewerRef.current
    if (!site || !viewer) return
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(site.longitude, site.latitude, site.elevation + 3500, Cesium.Ellipsoid.MARS),
      orientation: { heading: 0, pitch: Cesium.Math.toRadians(-75), roll: 0 },
      duration: 2,
    })
    viewer.selectedEntity = viewer.entities.getById(`game-${id}`)
  }

  const flyToRover = name => {
    const viewer = viewerRef.current, rover = roverRef.current[name]
    if (!viewer || !rover) return
    viewer.trackedEntity = undefined
    viewer.selectedEntity = rover
    if (name === 'TheMartianJourney' || !rover.availability) { viewer.zoomTo(rover); return }
    const start = rover.properties?.animationStartTime?.getValue(Cesium.JulianDate.now())
    viewer.clock.currentTime = start ? Cesium.JulianDate.fromIso8601(start) : rover.availability.start
    viewer.clock.multiplier = 604800
    viewer.clock.shouldAnimate = false
    viewer.timeline.zoomTo(rover.availability.start, rover.availability.stop)
    viewer.zoomTo(rover, new Cesium.HeadingPitchRange(4.9791, -0.5294, 5000))
  }

  const flyToLandmark = name => {
    const viewer = viewerRef.current, entity = landmarkRef.current[name]
    if (!viewer || !entity) return
    const destination = entity.properties.destination?.getValue()
    const orientation = entity.properties.orientation?.getValue()
    if (!destination || !orientation) return
    viewer.trackedEntity = undefined
    viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromArray(destination), orientation: { heading: orientation[0], pitch: orientation[1], roll: orientation[2] }, duration: 3, complete: () => { viewer.selectedEntity = entity } })
  }

  return <dialog ref={dialog} className="mars-globe-dialog" aria-labelledby="mars-globe-title" onCancel={event => { event.preventDefault(); onClose() }}>
    <div className="mars-globe-header"><div><Globe2 size={18} /><div><h2 id="mars-globe-title">Mars from orbit</h2><p>Compare NASA imagery, then send one mapped waypoint to the expedition.</p></div></div><button onClick={onClose} aria-label="Return to expedition"><X size={20} /></button></div>
    <div className="mars-globe-viewport" ref={container} aria-label="Interactive 3D Mars map" />
    {status === 'ready' && <div className="mars-globe-controls"><div className="mars-globe-primary-controls"><label>Science imagery<select value={scienceLayer} onChange={event => setScienceLayer(event.target.value)}>{Object.entries(scienceLayers).map(([id, layer]) => <option value={id} key={id}>{layer?.name || 'Cesium surface only'}</option>)}</select></label>{scienceLayer === 'sim3464' && <label className="mars-globe-opacity">Opacity <input type="range" min="0.2" max="1" step="0.05" value={geologyOpacity} onChange={event => setGeologyOpacity(Number(event.target.value))} /><span>{Math.round(geologyOpacity * 100)}%</span></label>}<label>Game destination<select value={selectedWaypoint} onChange={event => flyToWaypoint(event.target.value)}><option value="">Choose a waypoint</option>{SITES.map(site => <option value={site.id} key={site.id}>{site.name}</option>)}</select></label>{selectedWaypoint && <button type="button" className="mars-globe-destination" onClick={() => { onSelectSite?.(selectedWaypoint); onClose() }}>Use in 2D game</button>}</div><details><summary>Historic routes and landmarks</summary><div><label>Rover or journey<select defaultValue="" onChange={event => flyToRover(event.target.value)}><option value="" disabled>Choose a route</option>{rovers.map(name => <option value={name} key={name}>{name === 'TheMartianJourney' ? 'The Martian journey' : name}</option>)}</select></label><label>Landmark<select defaultValue="" onChange={event => flyToLandmark(event.target.value)}><option value="" disabled>Choose a landmark</option>{landmarks.map(name => <option value={name} key={name}>{name}</option>)}</select></label></div></details></div>}
    {status !== 'ready' && <div className="mars-globe-status" role="status">{status === 'loading' ? <span>Loading Mars tiles…</span> : <><strong>{status === 'token' ? 'Cesium ion token needed' : 'Mars tiles could not load'}</strong><span>{status === 'token' ? <>Enter a token with access to asset {ION_ASSET_ID}, or set <code>VITE_CESIUM_ION_TOKEN</code> in <code>.env.local</code> and restart the app.</> : <>Check your internet connection and the token’s access to asset {ION_ASSET_ID}. You can try another token below.</>}</span><form onSubmit={event => { event.preventDefault(); if (tokenInput.trim()) { setStatus('loading'); setToken(tokenInput.trim()) } }}><input type="password" autoComplete="off" aria-label="Cesium ion access token" placeholder="Cesium ion access token" value={tokenInput} onChange={event => setTokenInput(event.target.value)} /><button type="submit" disabled={!tokenInput.trim()}>Load map</button></form></>}</div>}
    <div className="mars-globe-footer">Terrain: Cesium ion · imagery: NASA Mars Trek / USGS SIM 3464 · geology may be offset 100–200 m · EVA estimates are illustrative</div>
  </dialog>
}
