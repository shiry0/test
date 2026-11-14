import { useEffect, useRef, useState } from 'react'
import * as Cesium from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'
import { SITES } from '../game/marsModel'
import { MARS_LANDMARKS, SCIENCE_LAYERS } from '../data/marsLandmarks'
import { MARS_IMAGERY } from '../data/marsImagery'
import MARS_ROUTES from '../data/marsRoutes.js'
import { SIM3464_BOUNDS, SIM3464_IMAGE } from '../data/sim3464'

export { MARS_LANDMARKS, SCIENCE_LAYERS }

const ION_ASSET_ID = 3644333

export default function CesiumMarsHero({
  activeLandmark = 'global',
  onSelectLandmark,
  scienceLayer = 'natural',
  geologyOpacity = 0.68,
  rotating = true,
  zoom = 0,
  reset = 0,
  reducedMotion = false,
  onTelemetry,
  activeRoute = null,
  routeFocus,
}) {
  const container = useRef(null)
  const viewerRef = useRef(null)
  const isDragging = useRef(false)
  const [ready, setReady] = useState(false)
  const previousZoom = useRef(zoom)
  const previousReset = useRef(reset)
  const geologyOpacityRef = useRef(geologyOpacity)
  geologyOpacityRef.current = geologyOpacity

  // Initialize Cesium Mars Viewer
  useEffect(() => {
    let active = true
    let viewer = null
    const prevEllipsoid = Cesium.Ellipsoid.default
    const prevToken = Cesium.Ion.defaultAccessToken

    const init = async () => {
      try {
        Cesium.Ellipsoid.default = Cesium.Ellipsoid.MARS
        const token = import.meta.env.VITE_CESIUM_ION_TOKEN?.trim()
        if (token) Cesium.Ion.defaultAccessToken = token

        viewer = new Cesium.Viewer(container.current, {
          baseLayer: false,
          baseLayerPicker: false,
          geocoder: false,
          homeButton: false,
          sceneModePicker: false,
          navigationHelpButton: false,
          animation: false,
          timeline: false,
          fullscreenButton: false,
          infoBox: false,
          selectionIndicator: false,
          globe: new Cesium.Globe(Cesium.Ellipsoid.MARS),
          skyBox: Cesium.SkyBox.createEarthSkyBox(),
          skyAtmosphere: new Cesium.SkyAtmosphere(Cesium.Ellipsoid.MARS),
        })
        viewerRef.current = viewer

        // Set Martian surface base color so it is NEVER Earth ocean blue
        viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#955639')

        // Custom Martian atmospheric scattering
        const atmosphere = viewer.scene.skyAtmosphere
        if (atmosphere) {
          atmosphere.atmosphereMieCoefficient = new Cesium.Cartesian3(9e-5, 2e-5, 1e-5)
          atmosphere.atmosphereRayleighCoefficient = new Cesium.Cartesian3(9e-6, 2e-6, 1e-6)
          atmosphere.atmosphereRayleighScaleHeight = 9000
          atmosphere.atmosphereMieScaleHeight = 2700
          atmosphere.saturationShift = -0.1
          atmosphere.perFragmentAtmosphere = true
        }

        // Cinematic post-processing & lighting
        viewer.scene.highDynamicRange = true
        viewer.scene.postProcessStages.exposure = 1.35
        const bloom = viewer.scene.postProcessStages.bloom
        if (bloom) {
          bloom.enabled = true
          bloom.uniforms.brightness = -0.45
          bloom.uniforms.stepSize = 1
          bloom.uniforms.sigma = 2.8
          bloom.uniforms.delta = 1.4
        }

        // Load natural Mars base imagery using modern fromUrl static method
        try {
          const naturalBase = await Cesium.SingleTileImageryProvider.fromUrl('/textures/mars.jpg', {
            rectangle: Cesium.Rectangle.fromDegrees(-180, -90, 180, 90),
            ellipsoid: Cesium.Ellipsoid.MARS,
            credit: 'NASA / JPL / USGS',
          })
          if (!active) return
          viewer.imageryLayers.addImageryProvider(naturalBase)
        } catch (imgErr) {
          console.warn('Could not load /textures/mars.jpg base imagery, fallback to MOLA:', imgErr)
          // Fallback to MOLA global elevation tiles if local texture fails
          try {
            const molaFallback = new Cesium.UrlTemplateImageryProvider({
              url: '/api/mars-tiles/mola/{z}/{y}/{x}',
              tilingScheme: new Cesium.GeographicTilingScheme({ ellipsoid: Cesium.Ellipsoid.MARS }),
              rectangle: Cesium.Rectangle.fromDegrees(-180, -90, 180, 90),
              maximumLevel: 6,
              credit: 'NASA MGS MOLA',
            })
            viewer.imageryLayers.addImageryProvider(molaFallback)
          } catch (molaErr) {
            console.warn('MOLA fallback also unavailable:', molaErr)
          }
        }

        // Keep each marker attached to its Mars location and hide it beyond the horizon.
        const surfaceVisibility = position => {
          const normal = Cesium.Ellipsoid.MARS.geodeticSurfaceNormal(position, new Cesium.Cartesian3())
          const toCamera = new Cesium.Cartesian3()
          return new Cesium.CallbackProperty(() => {
            Cesium.Cartesian3.subtract(viewer.camera.positionWC, position, toCamera)
            return Cesium.Cartesian3.dot(normal, toCamera) > 0
          }, false)
        }

        // Add major landmarks with custom glowing pins
        MARS_LANDMARKS.filter(l => l.id !== 'global').forEach(item => {
          const position = Cesium.Cartesian3.fromDegrees(item.longitude, item.latitude, 200, Cesium.Ellipsoid.MARS)
          const show = surfaceVisibility(position)
          viewer.entities.add({
            id: `landmark-${item.id}`,
            name: item.name,
            position,
            properties: { landmarkId: item.id },
            point: {
              show,
              pixelSize: 11,
              color: Cesium.Color.fromCssColorString('#f2a477'),
              outlineColor: Cesium.Color.WHITE,
              outlineWidth: 2,
              disableDepthTestDistance: 0,
            },
            label: {
              show,
              text: item.name,
              font: '600 13px Manrope, sans-serif',
              fillColor: Cesium.Color.fromCssColorString('#f4ebd9'),
              outlineColor: Cesium.Color.fromCssColorString('#0a0e12'),
              outlineWidth: 3,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              pixelOffset: new Cesium.Cartesian2(0, -20),
              scaleByDistance: new Cesium.NearFarScalar(5e4, 1, 1.5e7, 0.45),
              disableDepthTestDistance: 0,
            },
          })
        })

        // Add Jezero expedition traverse waypoints
        SITES.forEach(site => {
          const position = Cesium.Cartesian3.fromDegrees(site.longitude, site.latitude, site.elevation + 20, Cesium.Ellipsoid.MARS)
          const show = surfaceVisibility(position)
          viewer.entities.add({
            id: `traverse-${site.id}`,
            name: site.name,
            position,
            properties: { siteId: site.id },
            point: {
              show,
              pixelSize: 8,
              color: Cesium.Color.fromCssColorString('#e9b27e'),
              outlineColor: Cesium.Color.fromCssColorString('#24332d'),
              outlineWidth: 1.5,
              scaleByDistance: new Cesium.NearFarScalar(1e3, 1, 5e5, 0),
              disableDepthTestDistance: 0,
            },
            label: {
              show,
              text: site.name,
              font: '500 11px Manrope, sans-serif',
              fillColor: Cesium.Color.fromCssColorString('#ffd8bf'),
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 2,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              pixelOffset: new Cesium.Cartesian2(0, -16),
              scaleByDistance: new Cesium.NearFarScalar(1e3, 1, 3e5, 0),
              disableDepthTestDistance: 0,
            },
          })
        })

        // Entity click handler
        const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
        handler.setInputAction(movement => {
          const picked = viewer.scene.pick(movement.position)
          if (Cesium.defined(picked) && picked.id) {
            const landmarkId = picked.id.properties?.landmarkId?.getValue()
            if (landmarkId) onSelectLandmark?.(landmarkId)
          }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

        // Drag detection for smooth auto-rotation pause
        handler.setInputAction(() => { isDragging.current = true }, Cesium.ScreenSpaceEventType.LEFT_DOWN)
        handler.setInputAction(() => { isDragging.current = false }, Cesium.ScreenSpaceEventType.LEFT_UP)
        handler.setInputAction(() => { isDragging.current = true }, Cesium.ScreenSpaceEventType.MIDDLE_DOWN)
        handler.setInputAction(() => { isDragging.current = false }, Cesium.ScreenSpaceEventType.MIDDLE_UP)
        handler.setInputAction(() => { isDragging.current = true }, Cesium.ScreenSpaceEventType.RIGHT_DOWN)
        handler.setInputAction(() => { isDragging.current = false }, Cesium.ScreenSpaceEventType.RIGHT_UP)

        // Live camera telemetry update
        viewer.camera.changed.addEventListener(() => {
          const carto = viewer.camera.positionCartographic
          if (carto) {
            const lat = Cesium.Math.toDegrees(carto.latitude)
            const lon = Cesium.Math.toDegrees(carto.longitude)
            const heightKm = Math.round(carto.height / 1000)
            onTelemetry?.({
              lat: lat.toFixed(2),
              lon: lon.toFixed(2),
              heightKm: heightKm.toLocaleString(),
            })
          }
        })

        // Try loading Cesium ion 3D Mars terrain
        if (token) {
          Cesium.Cesium3DTileset.fromIonAssetId(ION_ASSET_ID, { enableCollision: true })
            .then(tileset => {
              if (!active) { tileset.destroy(); return }
              viewer.scene.primitives.add(tileset)
            })
            .catch(err => {
              console.warn('Cesium ion Mars 3D terrain unavailable; continuing with Mars ellipsoid:', err)
            })
        }

        // Initial camera positioning
        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(77.5, 18.4, 11500000, Cesium.Ellipsoid.MARS),
          orientation: { heading: 0, pitch: Cesium.Math.toRadians(-90), roll: 0 },
        })

        if (active) setReady(true)
      } catch (err) {
        console.error('Cesium Mars viewer initialization failed:', err)
        if (active) setReady(true) // Ensure loading screen clears even on unexpected error
      }
    }

    init()

    return () => {
      active = false
      setReady(false)
      if (viewer && !viewer.isDestroyed()) {
        viewer.destroy()
      }
      viewerRef.current = null
      Cesium.Ellipsoid.default = prevEllipsoid
      Cesium.Ion.defaultAccessToken = prevToken
    }
  }, [])

  // Auto-rotation around Martian polar axis when idle
  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer || !rotating || reducedMotion) return
    let frame
    const spin = () => {
      if (!isDragging.current && viewer && !viewer.isDestroyed()) {
        viewer.scene.camera.rotate(Cesium.Cartesian3.UNIT_Z, -0.00065)
      }
      frame = requestAnimationFrame(spin)
    }
    frame = requestAnimationFrame(spin)
    return () => cancelAnimationFrame(frame)
  }, [rotating, reducedMotion])

  // Science Imagery Layer Draping
  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer || !ready) return

    // Remove any secondary imagery layer beyond the base
    while (viewer.imageryLayers.length > 1) {
      viewer.imageryLayers.remove(viewer.imageryLayers.get(1))
    }

    if (scienceLayer === 'sim3464') {
      let cancelled = false
      Cesium.SingleTileImageryProvider.fromUrl(SIM3464_IMAGE, {
        rectangle: Cesium.Rectangle.fromDegrees(...SIM3464_BOUNDS),
        ellipsoid: Cesium.Ellipsoid.MARS,
        credit: 'USGS SIM 3464 · Sun and Stack (2020)',
      }).then(provider => {
        if (cancelled || viewer.isDestroyed()) return
        const overlay = viewer.imageryLayers.addImageryProvider(provider)
        overlay.alpha = geologyOpacityRef.current
      }).catch(error => console.warn('USGS geology overlay unavailable:', error))
      return () => { cancelled = true }
    }

    if (scienceLayer === 'mola') {
      viewer.imageryLayers.addImageryProvider(new Cesium.UrlTemplateImageryProvider({
        url: '/api/mars-tiles/mola/{z}/{y}/{x}',
        tilingScheme: new Cesium.GeographicTilingScheme({ ellipsoid: Cesium.Ellipsoid.MARS }),
        rectangle: Cesium.Rectangle.fromDegrees(-180, -90, 180, 90),
        maximumLevel: 6,
        credit: 'NASA MGS MOLA',
      }))
    } else {
      const layer = MARS_IMAGERY[activeLandmark]?.[scienceLayer]
      if (!layer) return
      const [west, south, east, north] = layer.bounds
      viewer.imageryLayers.addImageryProvider(new Cesium.UrlTemplateImageryProvider({
        url: `/api/mars-tiles/${layer.key}/{z}/{y}/{x}`,
        tilingScheme: new Cesium.GeographicTilingScheme({ ellipsoid: Cesium.Ellipsoid.MARS }),
        rectangle: Cesium.Rectangle.fromDegrees(west, south, east, north),
        maximumLevel: layer.maxLevel,
        credit: `NASA MRO ${scienceLayer === 'hirise' ? 'HiRISE' : 'CTX'} · Mars Trek`,
      }))
    }
  }, [scienceLayer, activeLandmark, ready])

  useEffect(() => {
    const viewer = viewerRef.current
    if (scienceLayer === 'sim3464' && viewer && viewer.imageryLayers.length > 1) viewer.imageryLayers.get(1).alpha = geologyOpacity
  }, [geologyOpacity, scienceLayer, ready])

  // Route data from NASA traverse feeds; rover meshes and the fictional
  // Watney journey come from the supplied Cesium Mars sample.
  useEffect(() => {
    const viewer = viewerRef.current
    const route = MARS_ROUTES[activeRoute]
    if (!viewer || !ready || !route) return
    const added = []
    const routeColor = activeRoute === 'watney' ? Cesium.Color.fromCssColorString('#f3c871') : Cesium.Color.fromCssColorString('#f2a477')
    const positions = Cesium.Cartesian3.fromDegreesArray(route.coordinates.flat(), Cesium.Ellipsoid.MARS)
    added.push(viewer.entities.add({
      id: `route-${activeRoute}`,
      name: route.name,
      polyline: { positions, width: activeRoute === 'watney' ? 5 : 4, material: activeRoute === 'watney'
        ? new Cesium.PolylineDashMaterialProperty({ color: routeColor, dashLength: 16 })
        : new Cesium.PolylineOutlineMaterialProperty({ color: routeColor, outlineColor: Cesium.Color.BLACK, outlineWidth: 1.5 }),
        clampToGround: true },
    }))
    if (route.model) {
      const [lon, lat] = route.latest
      added.push(viewer.entities.add({
        id: `rover-${activeRoute}`, name: `${route.name} · Sol ${route.sol}`,
        position: Cesium.Cartesian3.fromDegrees(lon, lat, 0, Cesium.Ellipsoid.MARS),
        model: { uri: route.model, minimumPixelSize: 100, maximumScale: 700, heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 200000) },
        label: { text: `${route.name} · Sol ${route.sol}`, font: '600 13px Manrope, sans-serif', fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK, outlineWidth: 3, style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -75), distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 200000) },
      }))
    } else {
      const stops = [
        { name: 'Ares 3 · Acidalia Planitia', point: route.coordinates[0] },
        { name: 'Mawrth Vallis', point: route.coordinates[10] },
        { name: 'Ares 4 · Schiaparelli', point: route.coordinates.at(-1) },
      ]
      stops.forEach(stop => added.push(viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(stop.point[0], stop.point[1], 100, Cesium.Ellipsoid.MARS),
        point: { pixelSize: 10, color: routeColor, outlineColor: Cesium.Color.WHITE, outlineWidth: 2 },
        label: { text: stop.name, font: '600 14px Manrope, sans-serif', fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK, outlineWidth: 3, style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -20) },
      })))
    }
    return () => { if (!viewer.isDestroyed()) added.forEach(entity => viewer.entities.remove(entity)) }
  }, [activeRoute, ready])

  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer || !ready) return
    SITES.forEach(site => {
      const marker = viewer.entities.getById(`traverse-${site.id}`)
      if (marker) marker.show = !activeRoute
    })
  }, [activeRoute, ready])

  useEffect(() => {
    const viewer = viewerRef.current
    const route = MARS_ROUTES[activeRoute]
    if (!viewer || !ready || !route) return
    if (routeFocus?.mode === 'rover' && route.model) {
      const roverPosition = Cesium.Cartesian3.fromDegrees(route.latest[0], route.latest[1], 0, Cesium.Ellipsoid.MARS)
      viewer.camera.flyToBoundingSphere(new Cesium.BoundingSphere(roverPosition, 100), {
        offset: new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-50), 1100),
        duration: reducedMotion ? 0.01 : 2.2,
      })
    } else {
      const lon = route.coordinates.map(point => point[0]), lat = route.coordinates.map(point => point[1])
      const west = Math.min(...lon), east = Math.max(...lon), south = Math.min(...lat), north = Math.max(...lat)
      const height = Math.max(38000, Math.max(east - west, north - south) * 59275 * (activeRoute === 'watney' ? 1.8 : 3.8))
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees((west + east) / 2, (south + north) / 2, height, Cesium.Ellipsoid.MARS),
        orientation: { heading: 0, pitch: Cesium.Math.toRadians(-90), roll: 0 },
        duration: reducedMotion ? 0.01 : 2.4,
      })
    }
  }, [activeRoute, routeFocus?.mode, routeFocus?.tick, ready, reducedMotion])

  // Fly camera to active landmark
  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer || !ready || activeRoute) return
    const target = MARS_LANDMARKS.find(item => item.id === activeLandmark) || MARS_LANDMARKS[0]
    const detailHeight = scienceLayer === 'hirise' ? 25000 : scienceLayer === 'ctx' ? Math.min(target.height, 150000) : target.height

    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(target.longitude, target.latitude, detailHeight, Cesium.Ellipsoid.MARS),
      orientation: {
        heading: Cesium.Math.toRadians(target.heading),
        pitch: Cesium.Math.toRadians(scienceLayer === 'ctx' || scienceLayer === 'hirise' ? -90 : target.pitch),
        roll: Cesium.Math.toRadians(target.roll),
      },
      duration: reducedMotion ? 0.01 : 2.5,
    })
  }, [activeLandmark, scienceLayer, ready, reducedMotion, activeRoute])

  // Zoom control
  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer || !ready) return
    if (zoom !== previousZoom.current) {
      const delta = zoom - previousZoom.current
      previousZoom.current = zoom
      const distance = viewer.camera.positionCartographic.height
      if (delta > 0) viewer.camera.zoomIn(distance * 0.28)
      else if (delta < 0) viewer.camera.zoomOut(distance * 0.35)
    }
  }, [zoom, ready])

  // Reset camera to global Mars
  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer || !ready) return
    if (reset !== previousReset.current) {
      previousReset.current = reset
      const global = MARS_LANDMARKS[0]
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(global.longitude, global.latitude, global.height, Cesium.Ellipsoid.MARS),
        orientation: { heading: 0, pitch: Cesium.Math.toRadians(-90), roll: 0 },
        duration: reducedMotion ? 0.01 : 2.0,
      })
    }
  }, [reset, ready, reducedMotion])

  return (
    <div className="cesium-mars-hero" aria-label="Interactive 3D Mars globe powered by Cesium">
      <div ref={container} className="cesium-mars-viewport" />
      {!ready && (
        <div className="scene-loading" role="status">
          <span />
          Preparing Cesium 3D Mars globe…
        </div>
      )}
    </div>
  )
}
