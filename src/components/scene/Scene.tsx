import { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Stars, Float, MeshDistortMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { useGameStore } from '@/hooks/useGameStore'

// ─────────────────────────────────────────────
// Starship-style Rocket Mesh
// ─────────────────────────────────────────────
function Starship({ launching }: { launching: boolean }) {
  const groupRef = useRef<THREE.Group>(null)
  const bodyRef = useRef<THREE.Mesh>(null)
  const noseRef = useRef<THREE.Mesh>(null)
  const { launchPhase, hasLaunched } = useGameStore()

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime

    if (launchPhase === 'ignition' || launchPhase === 'launched') {
      // Fly upward
      groupRef.current.position.y += 0.08
      groupRef.current.position.x += Math.sin(t * 3) * 0.002
    } else {
      // Gentle hover
      groupRef.current.position.y = Math.sin(t * 0.8) * 0.3
      groupRef.current.rotation.z = Math.sin(t * 0.5) * 0.02
    }

    // Subtle body shimmer
    if (bodyRef.current) {
      const mat = bodyRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.1 + Math.sin(t * 2) * 0.05
    }
  })

  return (
    <group ref={groupRef} position={[0, -1.5, 0]}>
      {/* Main body */}
      <mesh ref={bodyRef} position={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[0.4, 0.45, 3.2, 24]} />
        <meshStandardMaterial
          color="#d0d8e8"
          metalness={0.95}
          roughness={0.1}
          emissive="#1a2a40"
          emissiveIntensity={0.1}
        />
      </mesh>

      {/* Nose cone */}
      <mesh ref={noseRef} position={[0, 2.4, 0]}>
        <coneGeometry args={[0.4, 1.6, 24]} />
        <meshStandardMaterial
          color="#c8d0e0"
          metalness={0.9}
          roughness={0.15}
          emissive="#0a1a30"
          emissiveIntensity={0.1}
        />
      </mesh>

      {/* Grid fins (4x) */}
      {[0, 90, 180, 270].map((deg, i) => (
        <mesh
          key={i}
          position={[
            Math.sin((deg * Math.PI) / 180) * 0.6,
            0.2,
            Math.cos((deg * Math.PI) / 180) * 0.6,
          ]}
          rotation={[0, (deg * Math.PI) / 180, 0]}
        >
          <boxGeometry args={[0.08, 0.5, 0.4]} />
          <meshStandardMaterial color="#8090a8" metalness={0.9} roughness={0.2} />
        </mesh>
      ))}

      {/* Landing legs */}
      {[0, 120, 240].map((deg, i) => (
        <mesh
          key={i}
          position={[
            Math.sin((deg * Math.PI) / 180) * 0.65,
            -1.8,
            Math.cos((deg * Math.PI) / 180) * 0.65,
          ]}
          rotation={[0, (deg * Math.PI) / 180, Math.PI * 0.08]}
        >
          <cylinderGeometry args={[0.025, 0.04, 0.9, 8]} />
          <meshStandardMaterial color="#6070a0" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}

      {/* Engine bell cluster */}
      {[
        [0, 0],
        [0.22, 0],
        [-0.22, 0],
        [0.11, 0.19],
        [-0.11, 0.19],
        [0.11, -0.19],
        [-0.11, -0.19],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, -1.72, z]}>
          <coneGeometry args={[0.07, 0.18, 12]} />
          <meshStandardMaterial color="#40506a" metalness={0.95} roughness={0.05} />
        </mesh>
      ))}

      {/* Window */}
      <mesh position={[0, 1.2, 0.42]}>
        <circleGeometry args={[0.12, 16]} />
        <meshStandardMaterial
          color="#00D4FF"
          emissive="#00D4FF"
          emissiveIntensity={0.8}
          transparent
          opacity={0.9}
        />
      </mesh>
      <mesh position={[0, 0.6, 0.42]}>
        <circleGeometry args={[0.08, 16]} />
        <meshStandardMaterial
          color="#00FFCC"
          emissive="#00FFCC"
          emissiveIntensity={0.6}
          transparent
          opacity={0.7}
        />
      </mesh>
    </group>
  )
}

// ─────────────────────────────────────────────
// Launch Platform
// ─────────────────────────────────────────────
function LaunchPad() {
  return (
    <group position={[0, -3.5, 0]}>
      {/* Main platform */}
      <mesh receiveShadow>
        <cylinderGeometry args={[2, 2.5, 0.3, 32]} />
        <meshStandardMaterial color="#1a2a40" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Arm structure */}
      <mesh position={[1.5, 0.8, 0]}>
        <boxGeometry args={[0.15, 1.6, 0.15]} />
        <meshStandardMaterial color="#253550" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[-1.5, 0.8, 0]}>
        <boxGeometry args={[0.15, 1.6, 0.15]} />
        <meshStandardMaterial color="#253550" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Arm top bar */}
      <mesh position={[0, 1.6, 0]}>
        <boxGeometry args={[3.2, 0.12, 0.12]} />
        <meshStandardMaterial color="#2a3a60" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Platform ring lights */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
        <mesh
          key={i}
          position={[
            Math.sin((deg * Math.PI) / 180) * 1.8,
            0.18,
            Math.cos((deg * Math.PI) / 180) * 1.8,
          ]}
        >
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial
            color="#FF4D00"
            emissive="#FF4D00"
            emissiveIntensity={2}
          />
        </mesh>
      ))}
    </group>
  )
}

// ─────────────────────────────────────────────
// Engine Fire Particles
// ─────────────────────────────────────────────
function EngineFlame({ active, boosting }: { active: boolean; boosting: boolean }) {
  const particlesRef = useRef<THREE.Points>(null)
  const { launchPhase, energyPercent } = useGameStore()

  const count = 800
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 0.5
      pos[i * 3 + 1] = -Math.random() * 3
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.5
    }
    return pos
  }, [])

  const colors = useMemo(() => {
    const cols = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const t = Math.random()
      // Orange → amber → gold → white core
      cols[i * 3] = 1.0                           // R
      cols[i * 3 + 1] = t < 0.5 ? t * 0.6 : 0.5 + t * 0.5 // G
      cols[i * 3 + 2] = t > 0.8 ? (t - 0.8) * 5 : 0        // B (white core)
    }
    return cols
  }, [])

  const sizes = useMemo(() => {
    const s = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      s[i] = Math.random() * 6 + 1
    }
    return s
  }, [])

  useFrame((state) => {
    if (!particlesRef.current) return
    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array
    const t = state.clock.elapsedTime

    const isActive = launchPhase === 'ignition' || launchPhase === 'launched' || boosting
    const intensity = isActive ? (launchPhase === 'ignition' ? 3 : 1.5) : (energyPercent / 100) * 0.5

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 1] -= 0.08 * intensity * (0.5 + Math.random() * 0.5)
      positions[i * 3] += (Math.random() - 0.5) * 0.03 * intensity
      positions[i * 3 + 2] += (Math.random() - 0.5) * 0.03 * intensity

      if (positions[i * 3 + 1] < -4) {
        positions[i * 3] = (Math.random() - 0.5) * 0.4 * (isActive ? 1.5 : 0.5)
        positions[i * 3 + 1] = -1.9
        positions[i * 3 + 2] = (Math.random() - 0.5) * 0.4 * (isActive ? 1.5 : 0.5)
      }
    }
    particlesRef.current.geometry.attributes.position.needsUpdate = true
  })

  if (energyPercent < 5) return null

  return (
    <group position={[0, -1.5, 0]}>
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
          <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.08}
          vertexColors
          transparent
          opacity={0.85}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  )
}

// ─────────────────────────────────────────────
// Shockwave Ring on Launch
// ─────────────────────────────────────────────
function Shockwave() {
  const materialRef = useRef<THREE.MeshBasicMaterial>(null)
  const { shockwaveActive } = useGameStore()
  const progress = useRef(0)

  useFrame((_, delta) => {
    if (!materialRef.current || !shockwaveActive) return
    progress.current += delta * 0.6
    materialRef.current.opacity = Math.max(0, 1 - progress.current)
  })

  useEffect(() => {
    if (shockwaveActive) progress.current = 0
  }, [shockwaveActive])

  if (!shockwaveActive) return null

  const scale = 1 + progress.current * 8

  return (
    <mesh
      position={[0, -3.5, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      scale={[scale, scale, scale]}
    >
      <ringGeometry args={[0.5, 1, 64]} />
      <meshBasicMaterial
        color="#FF8C00"
        transparent
        opacity={1}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
        ref={materialRef}
      />
    </mesh>
  )
}

// ─────────────────────────────────────────────
// Musk Robot (Simplified HUD Helmet)
// ─────────────────────────────────────────────
function MuskBot() {
  const groupRef = useRef<THREE.Group>(null)
  const { launchPhase } = useGameStore()

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime
    groupRef.current.position.y = -3 + Math.sin(t * 1.2) * 0.1
    groupRef.current.rotation.y = Math.sin(t * 0.4) * 0.3
  })

  return (
    <group ref={groupRef} position={[2.8, -3, 0]}>
      {/* Body */}
      <mesh position={[0, -0.5, 0]}>
        <cylinderGeometry args={[0.3, 0.35, 1.0, 16]} />
        <meshStandardMaterial color="#1a2a40" metalness={0.95} roughness={0.1} />
      </mesh>
      {/* Helmet */}
      <mesh position={[0, 0.3, 0]}>
        <sphereGeometry args={[0.38, 24, 24]} />
        <meshStandardMaterial color="#c0c8d8" metalness={0.95} roughness={0.05} />
      </mesh>
      {/* Visor */}
      <mesh position={[0, 0.3, 0.28]}>
        <sphereGeometry args={[0.28, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
        <meshStandardMaterial
          color="#FF8C00"
          emissive="#FF4D00"
          emissiveIntensity={0.8}
          transparent
          opacity={0.7}
          metalness={0.9}
          roughness={0.0}
        />
      </mesh>
      {/* Chest LED */}
      <mesh position={[0, -0.2, 0.32]}>
        <circleGeometry args={[0.06, 12]} />
        <meshStandardMaterial
          color="#00D4FF"
          emissive="#00D4FF"
          emissiveIntensity={launchPhase === 'ignition' ? 3 : 1}
        />
      </mesh>
      {/* Shoulder pads */}
      {[-0.4, 0.4].map((x, i) => (
        <mesh key={i} position={[x, -0.1, 0]}>
          <sphereGeometry args={[0.15, 12, 12]} />
          <meshStandardMaterial color="#253550" metalness={0.9} roughness={0.2} />
        </mesh>
      ))}
    </group>
  )
}

// ─────────────────────────────────────────────
// Ground Glow / Launch Reflection
// ─────────────────────────────────────────────
function GroundGlow() {
  const meshRef = useRef<THREE.Mesh>(null)
  const { energyPercent, launchPhase } = useGameStore()

  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.elapsedTime
    const mat = meshRef.current.material as THREE.MeshBasicMaterial
    const base = energyPercent / 100
    const pulse = Math.sin(t * 3) * 0.1
    mat.opacity = Math.min(0.6, base * 0.4 + pulse * base + (launchPhase === 'ignition' ? 0.4 : 0))
  })

  return (
    <mesh ref={meshRef} position={[0, -3.65, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[5, 64]} />
      <meshBasicMaterial
        color="#FF4D00"
        transparent
        opacity={0.1}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

// ─────────────────────────────────────────────
// Atmospheric Fog / Nebula Particles
// ─────────────────────────────────────────────
function NebulaDust() {
  const ref = useRef<THREE.Points>(null)
  const count = 300
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20
      pos[i * 3 + 2] = (Math.random() - 0.5) * 15 - 5
    }
    return pos
  }, [])

  useFrame((state) => {
    if (!ref.current) return
    ref.current.rotation.y = state.clock.elapsedTime * 0.01
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#00D4FF"
        transparent
        opacity={0.4}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

// ─────────────────────────────────────────────
// Camera Controller
// ─────────────────────────────────────────────
function CameraRig() {
  const { camera } = useThree()
  const { launchPhase } = useGameStore()

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const isPerspectiveCamera = camera instanceof THREE.PerspectiveCamera

    if (launchPhase === 'ignition' || launchPhase === 'launched') {
      // Camera follows rocket upward and zooms in
      camera.position.y += 0.04
      if (isPerspectiveCamera) {
        camera.fov = THREE.MathUtils.lerp(camera.fov, 40, 0.01)
      }
    } else {
      // Gentle orbital camera movement
      camera.position.x = Math.sin(t * 0.1) * 0.5
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, 2, 0.01)
      if (isPerspectiveCamera) {
        camera.fov = THREE.MathUtils.lerp(camera.fov, 55, 0.01)
      }
    }
    if (isPerspectiveCamera) {
      camera.updateProjectionMatrix()
    }
    camera.lookAt(0, 0, 0)
  })

  return null
}

// ─────────────────────────────────────────────
// Main Scene
// ─────────────────────────────────────────────
export default function Scene() {
  const { launchPhase, boostFlareActive, energyPercent } = useGameStore()
  const isLaunching = launchPhase === 'ignition' || launchPhase === 'launched'

  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 2, 10], fov: 55 }}
        gl={{ antialias: true, alpha: true }}
        shadows
        style={{ background: 'transparent' }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.2} />
        <directionalLight
          position={[5, 10, 5]}
          intensity={0.8}
          color="#c0d0ff"
          castShadow
        />
        {/* Orange ignition light from below */}
        <pointLight
          position={[0, -2, 0]}
          intensity={launchPhase === 'ignition' ? 10 : 2 + (useGameStore.getState().energyPercent / 100) * 3}
          color="#FF6600"
          distance={15}
        />
        {/* Blue ambiance from above */}
        <pointLight position={[0, 8, 0]} intensity={0.5} color="#00D4FF" distance={20} />
        {/* Bot accent light */}
        <pointLight position={[3, -2, 1]} intensity={0.8} color="#00FFCC" distance={8} />

        {/* Background Stars */}
        <Stars
          radius={120}
          depth={60}
          count={6000}
          factor={4}
          saturation={0.5}
          fade
          speed={isLaunching ? 3 : 0.5}
        />

        <NebulaDust />

        {/* Scene objects */}
        <Float
          speed={isLaunching ? 0 : 1.5}
          rotationIntensity={0.05}
          floatIntensity={0.3}
        >
          <Starship launching={isLaunching} />
        </Float>

        <LaunchPad />
        <MuskBot />
        <EngineFlame active={isLaunching} boosting={boostFlareActive} />
        <Shockwave />
        <GroundGlow />
        <CameraRig />

        {/* Fog for depth */}
        <fog attach="fog" args={['#030508', 20, 60]} />
      </Canvas>
    </div>
  )
}
