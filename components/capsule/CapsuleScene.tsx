'use client'

import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import {
  Float,
  Sparkles,
  Environment,
  ContactShadows,
  MeshReflectorMaterial,
} from '@react-three/drei'
import * as THREE from 'three'

function toward(current: number, target: number, lambda: number, dt: number) {
  return THREE.MathUtils.lerp(current, target, 1 - Math.exp(-lambda * dt))
}

export type CapsulePhase = 'locked' | 'idle' | 'opening' | 'open'

const R = 0.26
const L = 0.5

/** Real pill: barrel + hemispheres, seam at y = 0 (waist). */
function PillHalf({
  part,
  locked,
  phase,
  palette,
}: {
  part: 'top' | 'bottom'
  locked: boolean
  phase: CapsulePhase
  palette: { top: string; bottom: string; emissive: string }
}) {
  const opening = phase === 'opening' || phase === 'open'
  const emissiveTop =
    phase === 'opening' ? 0.42 : locked ? 0.04 : phase === 'open' ? 0.1 : 0.12
  const emissiveBot =
    phase === 'opening' ? 0.32 : locked ? 0.035 : phase === 'open' ? 0.08 : 0.07

  if (part === 'top') {
    return (
      <group>
        <mesh castShadow receiveShadow position={[0, L / 4, 0]}>
          <cylinderGeometry args={[R, R, L / 2, 48, 1, false]} />
          <meshPhysicalMaterial
            color={locked ? '#c4a23a' : palette.top}
            metalness={locked ? 0.82 : 0.72}
            roughness={locked ? 0.32 : 0.18}
            clearcoat={1}
            clearcoatRoughness={locked ? 0.35 : 0.12}
            transmission={locked ? 0.06 : 0.14}
            thickness={0.35}
            ior={1.45}
            emissive={palette.emissive}
            emissiveIntensity={emissiveTop}
            envMapIntensity={locked ? 0.72 : 1.25}
            attenuationColor="#f5ce53"
            attenuationDistance={0.85}
          />
        </mesh>
        <mesh castShadow receiveShadow position={[0, L / 2, 0]}>
          <sphereGeometry args={[R, 48, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshPhysicalMaterial
            color={locked ? '#c4a23a' : palette.top}
            metalness={locked ? 0.82 : 0.72}
            roughness={locked ? 0.32 : 0.18}
            clearcoat={1}
            clearcoatRoughness={locked ? 0.35 : 0.12}
            transmission={locked ? 0.06 : 0.18}
            thickness={0.45}
            ior={1.45}
            emissive={palette.emissive}
            emissiveIntensity={opening ? emissiveTop + 0.08 : emissiveTop}
            envMapIntensity={locked ? 0.72 : 1.35}
            attenuationColor="#f5ce53"
            attenuationDistance={0.85}
          />
        </mesh>
      </group>
    )
  }

  return (
    <group>
      <mesh castShadow receiveShadow position={[0, -L / 4, 0]}>
        <cylinderGeometry args={[R, R, L / 2, 48, 1, false]} />
        <meshPhysicalMaterial
          color={locked ? '#cfa894' : palette.bottom}
          metalness={locked ? 0.55 : 0.38}
          roughness={locked ? 0.45 : 0.28}
          clearcoat={0.85}
          clearcoatRoughness={locked ? 0.42 : 0.22}
          transmission={locked ? 0.1 : 0.22}
          thickness={0.55}
          ior={1.4}
          emissive={palette.emissive}
          emissiveIntensity={emissiveBot}
          envMapIntensity={locked ? 0.62 : 1.05}
          attenuationColor="#ffc5a6"
          attenuationDistance={1.1}
        />
      </mesh>
      <mesh castShadow receiveShadow position={[0, -L / 2, 0]}>
        <sphereGeometry args={[R, 48, 32, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
        <meshPhysicalMaterial
          color={locked ? '#cfa894' : palette.bottom}
          metalness={locked ? 0.55 : 0.38}
          roughness={locked ? 0.45 : 0.28}
          clearcoat={0.85}
          clearcoatRoughness={locked ? 0.42 : 0.22}
          transmission={locked ? 0.1 : 0.26}
          thickness={0.55}
          ior={1.4}
          emissive={palette.emissive}
          emissiveIntensity={opening ? emissiveBot + 0.06 : emissiveBot}
          envMapIntensity={locked ? 0.62 : 1.08}
          attenuationColor="#ffc5a6"
          attenuationDistance={1.1}
        />
      </mesh>
    </group>
  )
}

function DreamOrbs({ locked }: { locked: boolean }) {
  const g = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (!g.current) return
    g.current.children.forEach((ch, i) => {
      const o = ch as THREE.Mesh
      const k = i + 1
      o.position.y = Math.sin(t * 0.35 + k * 1.7) * 0.12
      o.position.x = Math.cos(t * 0.22 + k) * 0.06
    })
  })

  const orbs = useMemo(
    () => [
      { pos: [-1.35, 0.15, -0.95] as const, s: 0.38 },
      { pos: [1.2, -0.05, -1.1] as const, s: 0.32 },
      { pos: [0.85, 0.55, -1.25] as const, s: 0.22 },
    ],
    []
  )

  return (
    <group ref={g}>
      {orbs.map((o, i) => (
        <mesh key={i} position={[...o.pos]} scale={o.s}>
          <sphereGeometry args={[1, 32, 24]} />
          <meshPhysicalMaterial
            color={locked ? '#c8c2b0' : '#ffeef8'}
            metalness={0.05}
            roughness={0.08}
            transmission={locked ? 0.72 : 0.88}
            thickness={0.65}
            ior={1.52}
            transparent
            opacity={locked ? 0.55 : 0.72}
            envMapIntensity={locked ? 0.45 : 0.95}
            clearcoat={1}
            clearcoatRoughness={0.1}
            attenuationColor={locked ? '#a09888' : '#ffc5a6'}
            attenuationDistance={2.2}
          />
        </mesh>
      ))}
    </group>
  )
}

/** Tyme gold + peach pill capsule — glassy materials, reflective floor, ambient orbs */
export function CapsuleScene({ phase }: { phase: CapsulePhase }) {
  const root = useRef<THREE.Group>(null)
  const top = useRef<THREE.Group>(null)
  const bottom = useRef<THREE.Group>(null)
  const glow = useRef<THREE.PointLight>(null)
  const { camera } = useThree()

  const palette = useMemo(
    () => ({
      top: '#f5ce53',
      bottom: '#ffc5a6',
      emissive: '#7b6100',
    }),
    []
  )

  const camZ = useRef(3.45)
  const camX = useRef(0)
  const lockPulse = useRef(0)

  useFrame((state, dt) => {
    const g = root.current
    const t = top.current
    const b = bottom.current
    const l = glow.current
    if (!g || !t || !b) return

    lockPulse.current += dt
    const time = state.clock.elapsedTime

    let targetZ = 3.5
    if (phase === 'locked') targetZ = 3.78
    if (phase === 'opening') targetZ = 2.62
    if (phase === 'open') targetZ = 2.95
    camZ.current = toward(camZ.current, targetZ, phase === 'idle' || phase === 'locked' ? 2.8 : 5.5, dt)

    let targetCamX = 0
    if (phase === 'idle' || phase === 'locked') targetCamX = Math.sin(time * 0.38) * 0.14
    if (phase === 'opening') targetCamX = Math.sin(time * 2.4) * 0.22
    if (phase === 'open') targetCamX = Math.sin(time * 0.55) * 0.1
    camX.current = toward(camX.current, targetCamX, 4, dt)

    camera.position.x = camX.current
    camera.position.z = camZ.current
    camera.position.y = toward(camera.position.y, 0.1 + Math.sin(time * 0.5) * 0.04, 2.5, dt)
    camera.lookAt(0, 0.02, 0)

    let targetTopY = 0
    let targetBotY = 0
    let targetTopRx = 0
    let targetBotRx = 0

    if (phase === 'locked') {
      g.rotation.y += dt * 0.14
      g.rotation.z = toward(g.rotation.z, Math.sin(lockPulse.current * 0.9) * 0.04, 2, dt)
      const pulse = 0.5 + Math.sin(lockPulse.current * 2.05) * 0.14
      if (l) l.intensity = toward(l.intensity, pulse, 3, dt)
    } else {
      g.rotation.z = toward(g.rotation.z, 0, 3, dt)
    }

    if (phase === 'idle') {
      g.rotation.y += dt * 0.62
      if (l) l.intensity = toward(l.intensity, 0.52, 4, dt)
    }

    if (phase === 'opening') {
      g.rotation.y += dt * 4.8
      targetTopY = 0.34
      targetBotY = -0.34
      targetTopRx = -1.18
      targetBotRx = 1.12
      if (l) l.intensity = toward(l.intensity, 7.2, 2.4, dt)
    }

    if (phase === 'open') {
      g.rotation.y += dt * 0.95
      targetTopY = 0.42
      targetBotY = -0.42
      targetTopRx = -1.35
      targetBotRx = 1.28
      if (l) l.intensity = toward(l.intensity, 0.42, 4, dt)
    }

    t.position.y = toward(t.position.y, targetTopY, phase === 'opening' ? 2.8 : 4.2, dt)
    b.position.y = toward(b.position.y, targetBotY, phase === 'opening' ? 2.8 : 4.2, dt)
    t.rotation.x = toward(t.rotation.x, targetTopRx, phase === 'opening' ? 3 : 4.5, dt)
    b.rotation.x = toward(b.rotation.x, targetBotRx, phase === 'opening' ? 3 : 4.5, dt)

    if (phase === 'locked' || phase === 'idle') {
      t.position.y = toward(t.position.y, 0, 4, dt)
      b.position.y = toward(b.position.y, 0, 4, dt)
      if (phase === 'idle') {
        t.rotation.x = toward(t.rotation.x, 0, 3.5, dt)
        b.rotation.x = toward(b.rotation.x, 0, 3.5, dt)
      }
    }

    g.position.y = Math.sin(time * 1.1) * 0.045
  })

  const sparkleCount =
    phase === 'locked' ? 28 : phase === 'idle' ? 64 : phase === 'opening' ? 120 : 180

  const lockedTint = phase === 'locked'

  return (
    <>
      <color attach="background" args={[lockedTint ? '#ebe8dc' : '#f5f4eb']} />
      <fog attach="fog" args={[lockedTint ? '#e2dfd3' : '#f0eee4', 6, 26]} />

      <ambientLight intensity={lockedTint ? 0.36 : 0.5} color={lockedTint ? '#d8d4c8' : '#fff8ef'} />
      <hemisphereLight intensity={lockedTint ? 0.25 : 0.4} color="#fff5e6" groundColor="#ffc5a6" />
      <directionalLight
        position={[4.5, 7, 5]}
        intensity={lockedTint ? 0.95 : 1.45}
        color="#fff5e0"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={22}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
      />
      <directionalLight position={[-3.5, 3, -2]} intensity={0.42} color="#ffd4be" />
      <pointLight ref={glow} position={[0.55, 0.45, 1.6]} intensity={0.52} color="#f5ce53" distance={8} />

      <DreamOrbs locked={lockedTint} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.12, 0]}>
        <planeGeometry args={[14, 14]} />
        <MeshReflectorMaterial
          blur={[280, 120]}
          resolution={384}
          mixBlur={0.85}
          mixStrength={lockedTint ? 18 : 32}
          roughness={1}
          depthScale={1.1}
          minDepthThreshold={0.35}
          maxDepthThreshold={1.35}
          metalness={0.35}
          mirror={0.22}
          color={lockedTint ? '#dcd6c8' : '#f0ebe0'}
        />
      </mesh>

      <group ref={root} position={[0, 0.08, 0]}>
        <Float
          speed={lockedTint ? 1.25 : 2.85}
          rotationIntensity={lockedTint ? 0.14 : 0.32}
          floatIntensity={lockedTint ? 0.28 : 0.62}
        >
          <group>
            {lockedTint && (
              <group rotation={[Math.PI / 2, 0, 0]}>
                <mesh>
                  <torusGeometry args={[R + 0.14, 0.022, 12, 56]} />
                  <meshStandardMaterial
                    color="#584500"
                    metalness={0.92}
                    roughness={0.22}
                    emissive="#3d3000"
                    emissiveIntensity={0.18}
                  />
                </mesh>
                <mesh rotation={[0.35, 0.5, 0.2]}>
                  <torusGeometry args={[R + 0.26, 0.016, 10, 48]} />
                  <meshStandardMaterial
                    color="#7b6100"
                    metalness={0.88}
                    roughness={0.28}
                    emissive="#5c4800"
                    emissiveIntensity={0.14}
                  />
                </mesh>
              </group>
            )}

            <group ref={top}>
              <PillHalf part="top" locked={lockedTint} phase={phase} palette={palette} />
            </group>

            <group ref={bottom}>
              <PillHalf part="bottom" locked={lockedTint} phase={phase} palette={palette} />
            </group>
          </group>
        </Float>

        <Sparkles
          key={sparkleCount}
          count={sparkleCount}
          scale={6.5}
          size={phase === 'opening' ? 3.8 : lockedTint ? 1.8 : 2.6}
          speed={phase === 'idle' ? 0.55 : lockedTint ? 0.22 : 1.15}
          opacity={lockedTint ? 0.32 : 0.62}
          color={lockedTint ? '#a8892e' : '#f5ce53'}
        />

        <ContactShadows
          position={[0, -1.1, 0]}
          opacity={lockedTint ? 0.38 : 0.5}
          scale={14}
          blur={3.2}
          far={5}
          color="#7b6100"
        />
      </group>

      <Environment preset="sunset" environmentIntensity={lockedTint ? 0.42 : 0.78} />
    </>
  )
}
