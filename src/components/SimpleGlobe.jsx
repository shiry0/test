import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { worlds } from '../data'
import { nextCameraDistance } from '../camera'

export default function SimpleGlobe({ world, rotating, zoom, reset, reducedMotion }) {
  const host = useRef()
  const state = useRef({ rotating, zoom })
  const previous = useRef({ zoom, reset, world })
  useEffect(() => { state.current.rotating = rotating && !reducedMotion }, [rotating, reducedMotion])
  useEffect(() => {
    if (!host.current) return
    const container = host.current
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100)
    camera.position.set(0, 0, 7.8)
    let renderer
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }) }
    catch { container.textContent = '3D is unavailable. Enable hardware acceleration and reload.'; return }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6))
    container.appendChild(renderer.domElement)
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enablePan = false
    controls.enableDamping = true
    controls.minDistance = 4.8
    controls.maxDistance = 12
    scene.add(new THREE.AmbientLight('#ffffff', 0.7))
    const sun = new THREE.DirectionalLight('#fff2dd', 2.8)
    sun.position.set(-5, 3, 5)
    scene.add(sun)
    const geometry = new THREE.SphereGeometry(2, 64, 64)
    const material = new THREE.MeshStandardMaterial({ color: worlds[world].color, roughness: 1 })
    let active = true
    const texture = new THREE.TextureLoader().load(worlds[world].texture, imageTexture => {
      if (!active) return
      material.map = imageTexture
      material.color.set('#ffffff')
      material.needsUpdate = true
    }, undefined, error => {
      if (!active) return
      console.warn(`Texture unavailable: ${worlds[world].texture}`, error)
      material.map = null
      material.color.set(worlds[world].color)
      material.needsUpdate = true
    })
    texture.colorSpace = THREE.SRGBColorSpace
    const globe = new THREE.Mesh(geometry, material)
    globe.rotation.set(0.08, world === 'earth' ? 3.8 : 0.8, -0.13)
    scene.add(globe)
    const resize = new ResizeObserver(() => {
      camera.aspect = container.clientWidth / Math.max(container.clientHeight, 1)
      camera.updateProjectionMatrix()
      renderer.setSize(container.clientWidth, container.clientHeight)
    })
    resize.observe(container)
    state.current.camera = camera
    state.current.controls = controls
    const timer = new THREE.Timer()
    renderer.setAnimationLoop(() => {
      timer.update()
      if (state.current.rotating) globe.rotation.y += Math.min(timer.getDelta(), 0.05) * 0.035
      controls.update()
      renderer.render(scene, camera)
    })
    return () => {
      active = false
      renderer.setAnimationLoop(null); resize.disconnect(); controls.dispose()
      geometry.dispose(); material.dispose(); texture.dispose(); renderer.dispose(); timer.dispose()
      renderer.domElement.remove(); state.current.camera = null
    }
  }, [world])
  useEffect(() => {
    const camera = state.current.camera
    if (camera) {
      if (previous.current.reset !== reset || previous.current.world !== world) camera.position.set(0, 0, 7.8)
      else if (previous.current.zoom !== zoom) camera.position.setLength(nextCameraDistance(camera.position.length(), zoom - previous.current.zoom))
      state.current.controls?.update()
    }
    previous.current = { zoom, reset, world }
  }, [zoom, world, reset])
  return <div ref={host} className="simple-canvas" aria-label={`Interactive Three.js ${worlds[world].name} globe. Drag to rotate and scroll to zoom.`} />
}
