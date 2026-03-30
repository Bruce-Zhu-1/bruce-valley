import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'

function FloatingParticles() {
  const groupRef = useRef()
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.02
    }
  })
  
  return (
    <group ref={groupRef}>
      <Sparkles
        count={150}
        scale={[20, 12, 20]}
        size={3}
        speed={0.3}
        opacity={0.6}
        color="#FFD700"
      />
      <Sparkles
        count={80}
        scale={[18, 10, 18]}
        size={2}
        speed={0.2}
        opacity={0.5}
        color="#FF69B4"
      />
      <Sparkles
        count={50}
        scale={[15, 8, 15]}
        size={4}
        speed={0.15}
        opacity={0.4}
        color="#FFFFFF"
      />
    </group>
  )
}

function HomeCanvas() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 0,
      pointerEvents: 'none',
    }}>
      <Canvas
        camera={{ position: [0, 5, 15], fov: 60 }}
        gl={{ antialias: false, alpha: true }}
        dpr={[1, 1.5]}
      >
        <FloatingParticles />
      </Canvas>
    </div>
  )
}

export default HomeCanvas
