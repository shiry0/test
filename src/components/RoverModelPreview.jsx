import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Bounds, Center, OrbitControls, useGLTF } from '@react-three/drei'

function RoverMesh({ url }) {
  const { scene } = useGLTF(url)
  return <Center><primitive object={scene} /></Center>
}

export default function RoverModelPreview({ url, name }) {
  return <div className="rover-model-preview" aria-label={`Interactive 3D model of ${name}`}>
    <Canvas camera={{ position: [4, 3, 6], fov: 42 }} gl={{ alpha: true, antialias: true }}>
      <ambientLight intensity={2.1} />
      <directionalLight position={[5, 8, 6]} intensity={3.2} />
      <directionalLight position={[-4, 2, -5]} intensity={1.5} />
      <Suspense fallback={null}><Bounds fit clip observe margin={1.35}><RoverMesh url={url} /></Bounds></Suspense>
      <OrbitControls makeDefault enablePan={false} minDistance={2} maxDistance={60} />
    </Canvas>
    <span>Drag to rotate · Scroll to zoom</span>
  </div>
}
