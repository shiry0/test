import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { worlds } from '../data'
import { nextCameraDistance } from '../camera'

// Load through HTMLImageElement and keep a drawable fallback if a browser rejects
// a texture. The drei image-bitmap path can reject and stop the entire Canvas.
function useSafeTexture(url, fallbackColor) {
  const fallback = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 2
    const context = canvas.getContext('2d')
    context.fillStyle = fallbackColor
    context.fillRect(0, 0, 2, 2)
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    return texture
  }, [fallbackColor])
  const [texture, setTexture] = useState(fallback)
  useEffect(() => {
    let active = true
    let loaded
    setTexture(fallback)
    new THREE.TextureLoader().load(url, result => {
      if (!active) { result.dispose(); return }
      result.colorSpace = THREE.SRGBColorSpace
      loaded = result
      setTexture(result)
    }, undefined, error => console.warn(`Texture unavailable: ${url}`, error))
    return () => { active = false; loaded?.dispose() }
  }, [url, fallback])
  useEffect(() => () => fallback.dispose(), [fallback])
  return texture
}

function StarField() {
  const positions = useMemo(() => {
    let seed = 431
    const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 }
    const data = new Float32Array(1600 * 3)
    for (let i = 0; i < 1600; i++) {
      const theta = random() * Math.PI * 2
      const z = random() * 2 - 1
      const r = 30 + random() * 40
      data.set([r * Math.sqrt(1 - z * z) * Math.cos(theta), r * z, r * Math.sqrt(1 - z * z) * Math.sin(theta)], i * 3)
    }
    return data
  }, [])
  return <points><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry><pointsMaterial size={0.035} color="#c5cbd2" transparent opacity={0.65} sizeAttenuation depthWrite={false} /></points>
}

function Atmosphere({ color }) {
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { glowColor: { value: new THREE.Color(color) } },
    vertexShader: `varying vec3 vNormal; varying vec3 vPosition; void main(){vNormal=normalize(normalMatrix*normal); vec4 p=modelViewMatrix*vec4(position,1.0); vPosition=p.xyz; gl_Position=projectionMatrix*p;}`,
    fragmentShader: `varying vec3 vNormal; varying vec3 vPosition; uniform vec3 glowColor; void main(){float rim=1.0-abs(dot(normalize(vNormal),normalize(-vPosition))); float alpha=pow(rim,4.0)*0.42; gl_FragColor=vec4(glowColor,alpha);}`,
    side: THREE.FrontSide, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
  }), [color])
  useEffect(() => () => material.dispose(), [material])
  return <mesh scale={1.025} material={material}><sphereGeometry args={[2, 80, 80]} /></mesh>
}

function Planet({ world, rotating, wireframe }) {
  const group = useRef()
  const clouds = useRef()
  const data = worlds[world]
  const texture = useSafeTexture(data.texture, data.color)
  const cloudMap = useSafeTexture('/textures/clouds.png', '#ffffff00')
  useEffect(() => { if (group.current) group.current.rotation.y = world === 'earth' ? 3.8 : 0.8 }, [world])
  useFrame((_, delta) => {
    if (rotating && group.current) group.current.rotation.y += Math.min(delta, 0.05) * 0.035
    if (clouds.current && rotating) clouds.current.rotation.y += Math.min(delta, 0.05) * 0.008
  })
  return <group rotation={[0.08, 0, -0.13]}>
    <group ref={group}>
      <mesh><sphereGeometry args={[2, 96, 80]} /><meshStandardMaterial map={texture} roughness={0.94} metalness={0.02} /></mesh>
      {world === 'earth' && <mesh ref={clouds} scale={1.007}><sphereGeometry args={[2, 72, 64]} /><meshStandardMaterial map={cloudMap} transparent opacity={0.36} depthWrite={false} /></mesh>}
      {wireframe && <mesh scale={1.003}><sphereGeometry args={[2, 32, 24]} /><meshBasicMaterial color="#f5b78b" wireframe transparent opacity={0.18} /></mesh>}
    </group>
    {data.atmosphere && <Atmosphere color={data.atmosphere} />}
  </group>
}

function OrbitPath({ radius, rotation, opacity = 0.15 }) {
  const points = useMemo(() => {
    const positions = []
    for (let i = 0; i <= 180; i++) { const a = i / 180 * Math.PI * 2; positions.push(Math.cos(a) * radius, 0, Math.sin(a) * radius) }
    return new Float32Array(positions)
  }, [radius])
  return <group rotation={rotation}><lineLoop><bufferGeometry><bufferAttribute attach="attributes-position" args={[points, 3]} /></bufferGeometry><lineBasicMaterial color="#8599ab" transparent opacity={opacity} /></lineLoop></group>
}

export function Rocket({ animated = false, motion = true, scale = 1 }) {
  const group = useRef()
  const flame = useRef()
  useFrame(({ clock }) => {
    if (group.current && animated) group.current.position.y = 0.25 + Math.sin(clock.elapsedTime * 0.7) * 0.1
    if (flame.current && motion) flame.current.scale.y = 0.85 + Math.sin(clock.elapsedTime * 37) * 0.13
  })
  return <group ref={group} scale={scale} rotation={[0, 0, animated ? -0.13 : -0.24]}>
    <mesh><cylinderGeometry args={[0.145, 0.145, 1.35, 32]} /><meshStandardMaterial color="#efeee5" metalness={0.5} roughness={0.3} /></mesh>
    <mesh position={[0, 0.85, 0]}><coneGeometry args={[0.145, 0.36, 32]} /><meshStandardMaterial color="#f7f5eb" metalness={0.4} roughness={0.3} /></mesh>
    <mesh position={[0, 0.38, 0.145]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.067, 0.067, 0.015, 24]} /><meshStandardMaterial color="#1c455d" metalness={0.8} roughness={0.18} /></mesh>
    <mesh position={[0, -0.4, 0]}><cylinderGeometry args={[0.15, 0.15, 0.12, 32]} /><meshStandardMaterial color="#d07750" /></mesh>
    {[0, Math.PI * 2 / 3, Math.PI * 4 / 3].map((a, i) => <group key={i} rotation={[0, a, 0]}><mesh position={[0.18, -0.58, 0]} rotation={[0, 0, -0.3]}><boxGeometry args={[0.065, 0.38, 0.18]} /><meshStandardMaterial color="#c8c7c0" metalness={0.65} /></mesh><mesh position={[0.22, -0.79, 0]}><sphereGeometry args={[0.055, 10, 10]} /><meshStandardMaterial color="#343d42" /></mesh></group>)}
    <mesh position={[0, -0.75, 0]}><cylinderGeometry args={[0.08, 0.12, 0.17, 24]} /><meshStandardMaterial color="#53606a" metalness={0.8} /></mesh>
    <group ref={flame} position={[0, -1.08, 0]}>
      <mesh rotation={[Math.PI, 0, 0]}><coneGeometry args={[0.10, 0.6, 24]} /><meshBasicMaterial color="#ee9760" transparent opacity={0.75} /></mesh>
      <mesh rotation={[Math.PI, 0, 0]} position={[0, 0.10, 0]}><coneGeometry args={[0.055, 0.38, 24]} /><meshBasicMaterial color="#fff0c2" /></mesh>
      <pointLight color="#edb37d" intensity={2} distance={2} />
    </group>
  </group>
}

function OrbitalRocket({ rotating }) {
  const ref = useRef()
  useFrame((_, delta) => { if (rotating) ref.current.rotation.y += delta * 0.18 })
  return <group ref={ref} rotation={[0.4, 0, 0.6]}><group position={[2.9, 0, 0]} rotation={[0, 0, 0.6]}><Rocket scale={0.27} motion={rotating} /></group></group>
}

function CameraRig({ zoom, reset, controlsRef }) {
  const { camera } = useThree()
  const previous = useRef({ zoom, reset })
  useEffect(() => {
    if (reset !== previous.current.reset) {
      camera.position.set(0, 0, 7.8)
      controlsRef.current?.target.set(0, 0, 0)
    } else if (zoom !== previous.current.zoom) {
      camera.position.setLength(nextCameraDistance(camera.position.length(), zoom - previous.current.zoom))
    }
    previous.current = { zoom, reset }
    camera.updateProjectionMatrix()
    controlsRef.current?.update()
  }, [zoom, reset, camera, controlsRef])
  return null
}

export default function SpaceScene({ world, rotating, zoom, reset, demo, reducedMotion }) {
  const controls = useRef()
  return <Canvas camera={{ position: [0, 0, 7.8], fov: 38 }} dpr={[1, 1.6]} gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }} fallback={<div className="webgl-fallback">Your browser could not start 3D. Enable hardware acceleration and reload.</div>}>
    <ambientLight intensity={0.56} />
    <directionalLight position={[-5, 3, 5]} intensity={2.6} color="#fff2dd" />
    <directionalLight position={[4, -1, -4]} intensity={0.35} color="#4d7aa0" />
    <StarField />
    <Suspense fallback={null}><Planet world={world} rotating={rotating && !reducedMotion} wireframe={demo} /></Suspense>
    <OrbitPath radius={2.85} rotation={[0.4, 0.1, 0.38]} />
    <OrbitPath radius={3.2} rotation={[1.1, 0.4, -0.45]} opacity={0.08} />
    {demo && <OrbitalRocket rotating={rotating && !reducedMotion} />}
    <OrbitControls ref={controls} enablePan={false} minDistance={4.8} maxDistance={12} enableDamping dampingFactor={0.07} rotateSpeed={0.4} zoomSpeed={0.6} />
    <CameraRig zoom={zoom} reset={reset} controlsRef={controls} />
  </Canvas>
}

export function DescentScene({ reducedMotion, progress = 0, world = 'earth' }) {
  return <Canvas camera={{ position: [0, 0, 6], fov: 42 }} dpr={[1, 1.5]} gl={{ alpha: true }}>
    <ambientLight intensity={1.6} /><directionalLight position={[-3, 4, 6]} intensity={3} />
    <StarField />
    <group position={[0, reducedMotion ? 0 : 1.4 - progress * 1.9, 0]}><Rocket animated={!reducedMotion} motion={!reducedMotion} scale={1.3} /></group>
    <mesh position={[0, -8.7, -3]}><sphereGeometry args={[7, 64, 64]} /><meshStandardMaterial color={world === 'mars' ? '#a86345' : '#27485b'} roughness={1} /></mesh>
  </Canvas>
}
