'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Environment, Float, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { ENVELOPE_FLAP_CLOSE_MS, ENVELOPE_FLAP_OPEN_MS } from './envelope-timing'
import { ENVELOPE_CLOSED_REST_SCALE_MULTIPLIER } from './seal-envelope-view-config'

/** Perimeter with scalloped / postage-stamp teeth */
function scallopedRectangleShape(halfW: number, halfH: number, teethX: number, teethY: number, amp: number) {
  const shape = new THREE.Shape()
  const segX = (2 * halfW) / teethX
  const segY = (2 * halfH) / teethY

  shape.moveTo(-halfW, halfH)

  for (let i = 0; i < teethX; i++) {
    const x0 = -halfW + i * segX
    const x1 = -halfW + (i + 1) * segX
    const xm = (x0 + x1) / 2
    shape.quadraticCurveTo(xm, halfH + amp, x1, halfH)
  }
  for (let j = 0; j < teethY; j++) {
    const y0 = halfH - j * segY
    const y1 = halfH - (j + 1) * segY
    const ym = (y0 + y1) / 2
    shape.quadraticCurveTo(halfW + amp, ym, halfW, y1)
  }
  for (let i = 0; i < teethX; i++) {
    const x0 = halfW - i * segX
    const x1 = halfW - (i + 1) * segX
    const xm = (x0 + x1) / 2
    shape.quadraticCurveTo(xm, -halfH - amp, x1, -halfH)
  }
  for (let j = 0; j < teethY; j++) {
    const y0 = -halfH + j * segY
    const y1 = -halfH + (j + 1) * segY
    const ym = (y0 + y1) / 2
    shape.quadraticCurveTo(-halfW - amp, ym, -halfW, y1)
  }
  shape.closePath()
  return shape
}

const PALETTES = {
  clay: {
    body: '#e8b565',
    flap: '#df9f52',
    ao: '#c99845',
    stampPaper: '#f4f1eb',
    stampBlue: '#7eb8dc',
  },
  /** Light baby pink / blush — editorial seal page */
  blush: {
    body: '#f7dfe3',
    flap: '#f0d0d6',
    ao: '#dcb6be',
    stampPaper: '#fdfaf8',
    stampBlue: '#a8cce3',
  },
} as const

export type EnvelopePalette = keyof typeof PALETTES

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3
}

/**
 * Clay / 3D-icon style envelope — thick rounded body, puffy triangular flap,
 * scalloped postage stamp (white + sky blue). Matches soft matte reference.
 * @param parallax - tilt follows cursor (default true). Set false if parent handles motion.
 */
export function EnvelopeScene({
  parallax = true,
  palette = 'clay',
  envelopeScale = 1.22,
  transparentBackground = false,
  /** Flap folded back — open pocket (e.g. seal page letter slot) */
  openEnvelope = false,
  /** World Y on root when parallax is off (negative = appears lower on screen) */
  staticRootY = 0,
  /** Scale the idle + cursor motion to keep framing safe */
  motionScale = 1,
  showStamp = true,
  /** Stretch envelope along X only. Default 1. */
  envelopeWidthMultiplier = 1,
  /**
   * When true, always apply `ENVELOPE_CLOSED_REST_SCALE_MULTIPLIER` (same as fully closed at rest)
   * even while the flap is moving or open.
   */
  pinClosedRestEnvelopeScale = false,
}: {
  parallax?: boolean
  palette?: EnvelopePalette
  envelopeScale?: number
  transparentBackground?: boolean
  openEnvelope?: boolean
  staticRootY?: number
  motionScale?: number
  showStamp?: boolean
  envelopeWidthMultiplier?: number
  pinClosedRestEnvelopeScale?: boolean
}) {
  const rootRef = useRef<THREE.Group>(null)
  const mouse = useRef({ x: 0, y: 0 })
  const { gl } = useThree()

  useEffect(() => {
    if (!parallax) return
    const el = gl.domElement
    const setFromClient = (cx: number, cy: number) => {
      const r = el.getBoundingClientRect()
      const w = r.width || 1
      const h = r.height || 1
      mouse.current.x = ((cx - r.left) / w) * 2 - 1
      mouse.current.y = ((cy - r.top) / h) * 2 - 1
    }
    const onMove = (e: MouseEvent) => setFromClient(e.clientX, e.clientY)
    const onTouch = (e: TouchEvent) => {
      if (e.touches.length === 0) return
      const t = e.touches[0]
      setFromClient(t.clientX, t.clientY)
    }
    el.addEventListener('mousemove', onMove)
    el.addEventListener('touchmove', onTouch, { passive: true })
    return () => {
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('touchmove', onTouch)
    }
  }, [gl, parallax])

  const mat = PALETTES[palette]
  const sceneShiftX = 0

  const bodyH = 1.46
  const bodyHalfH = bodyH / 2
  const bodyDepth = 0.34
  const frontZ = bodyDepth / 2 + 0.002

  const openProgressRef = useRef(openEnvelope ? 1 : 0)
  const flapAnimRef = useRef<{
    from: number
    to: number
    start: number
    duration: number
  } | null>(null)
  const flapPivotRef = useRef<THREE.Group>(null)
  const flapMeshRef = useRef<THREE.Mesh>(null)
  const aoMeshRef = useRef<THREE.Mesh>(null)
  const pocketMeshRef = useRef<THREE.Mesh>(null)
  /** Seal-style static framing: nothing (flap/stamp) should mutate uniform scale — re-apply every frame. */
  const envelopeUniformScaleRef = useRef<THREE.Group>(null)

  const applyOpenProgress = useCallback((p: number) => {
    const anchorY = THREE.MathUtils.lerp(bodyHalfH, bodyHalfH - 0.082, p)
    const anchorZ = THREE.MathUtils.lerp(frontZ + 0.055, frontZ + 0.012, p)
    const pivot = flapPivotRef.current
    if (pivot) pivot.position.set(0, anchorY, anchorZ)
    const flap = flapMeshRef.current
    if (flap) {
      /** Closed pose (nearly flush on front). */
      const closedX = 0.055
      /** Open: flap folded back. */
      const openX = Math.PI
      /**
       * Use the long X arc (π → 2π + closed) when closing so the triangle swings forward
       * over the front of the envelope; the short arc π → closed reads as flipping from behind.
       * `2π + closedX` is the same pose as `closedX`.
       */
      const rotX = openX + (1 - p) * (openX + closedX)
      flap.rotation.set(rotX, 0, 0)
      const m = flap.material as THREE.MeshStandardMaterial
      m.side = p > 0.12 ? THREE.DoubleSide : THREE.FrontSide
    }
    const ao = aoMeshRef.current
    if (ao) {
      const m = ao.material as THREE.MeshBasicMaterial
      const o = (1 - p) * 0.22
      m.opacity = o
      ao.visible = o > 0.025
    }
    const pocket = pocketMeshRef.current
    if (pocket) {
      const m = pocket.material as THREE.MeshStandardMaterial
      m.opacity = p
      pocket.visible = p > 0.035
    }
  }, [bodyHalfH, frontZ])

  useLayoutEffect(() => {
    const target = openEnvelope ? 1 : 0
    const from = openProgressRef.current
    if (Math.abs(from - target) < 1e-4) {
      flapAnimRef.current = null
      applyOpenProgress(from)
      return
    }
    flapAnimRef.current = {
      from,
      to: target,
      start: performance.now(),
      duration: openEnvelope ? ENVELOPE_FLAP_OPEN_MS : ENVELOPE_FLAP_CLOSE_MS,
    }
    applyOpenProgress(from)
  }, [openEnvelope, applyOpenProgress])

  const { flapGeom, stampGeom } = useMemo(() => {
    const tri = new THREE.Shape()
    const tw = 0.98
    const th = 0.72
    tri.moveTo(-tw, th * 0.12)
    tri.lineTo(tw, th * 0.12)
    tri.lineTo(0, -th)
    tri.lineTo(-tw, th * 0.12)

    // Thinner than body: shallow depth + modest bevel (still soft, not chunky)
    const flapGeom = new THREE.ExtrudeGeometry(tri, {
      depth: 0.038,
      bevelEnabled: true,
      bevelThickness: 0.042,
      bevelSize: 0.034,
      bevelOffset: 0,
      bevelSegments: 2,
      curveSegments: 16,
    })
    flapGeom.computeBoundingBox()
    const bb = flapGeom.boundingBox!
    // Hinge at top edge of flap: put max(Y) at local 0 so we can parent to body top
    flapGeom.translate(0, -bb.max.y, 0)

    const stampShape = scallopedRectangleShape(0.15, 0.175, 7, 8, 0.022)
    const stampGeom = new THREE.ExtrudeGeometry(stampShape, {
      depth: 0.038,
      bevelEnabled: true,
      bevelThickness: 0.028,
      bevelSize: 0.02,
      bevelSegments: 3,
      curveSegments: 12,
    })
    stampGeom.center()

    return { flapGeom, stampGeom }
  }, [])

  useFrame(({ clock }, dt) => {
    const g = rootRef.current
    if (!g) return
    if (!parallax) {
      g.rotation.set(0, 0, 0)
      g.position.x = sceneShiftX
      g.position.y = staticRootY
      g.position.z = 0
      return
    }
    const t = clock.elapsedTime
    const lam = 1 - Math.exp(-8 * dt)
    const s = Math.max(0, motionScale)
    const idleY = 0.2 + Math.sin(t * 0.2) * (0.028 * s)
    const idleX = -0.06 + Math.sin(t * 0.35) * (0.012 * s)
    const bob = Math.sin(t * 0.55) * (0.025 * s)
    const mx = mouse.current.x * (0.42 * s)
    const my = mouse.current.y * (0.24 * s)
    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, idleY + mx, lam)
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, idleX - my, lam)
    g.position.y = THREE.MathUtils.lerp(g.position.y, -0.06 + bob, lam)
  })

  useFrame(() => {
    const run = flapAnimRef.current
    if (run) {
      const t = Math.min(1, (performance.now() - run.start) / run.duration)
      const e = easeOutCubic(t)
      openProgressRef.current = THREE.MathUtils.lerp(run.from, run.to, e)
      if (t >= 1) {
        openProgressRef.current = run.to
        flapAnimRef.current = null
      }
    }
    applyOpenProgress(openProgressRef.current)
    if (!parallax) {
      const sg = envelopeUniformScaleRef.current
      if (sg) {
        const p = openProgressRef.current
        const flapAnimating = flapAnimRef.current !== null
        const fullyClosedAtRest = !flapAnimating && p <= 1e-3
        const mult = pinClosedRestEnvelopeScale
          ? ENVELOPE_CLOSED_REST_SCALE_MULTIPLIER
          : fullyClosedAtRest
            ? ENVELOPE_CLOSED_REST_SCALE_MULTIPLIER
            : 1
        const s = envelopeScale * mult
        sg.scale.set(s * envelopeWidthMultiplier, s, s)
      }
    }
  })

  const envelopeInner = (
    <group ref={envelopeUniformScaleRef} scale={envelopeScale}>
      <RoundedBox
        args={[2.28, bodyH, bodyDepth]}
        radius={0.16}
        smoothness={5}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={mat.body}
          roughness={0.93}
          metalness={0}
          envMapIntensity={palette === 'blush' ? 0.14 : 0.1}
        />
      </RoundedBox>

      <mesh ref={aoMeshRef} position={[0, bodyHalfH - 0.55, frontZ + 0.004]} rotation={[0, 0, 0]}>
        <planeGeometry args={[1.85, 0.08]} />
        <meshBasicMaterial color={mat.ao} transparent opacity={0.22} depthWrite={false} />
      </mesh>

      <mesh ref={pocketMeshRef} position={[0, 0.12, frontZ - 0.04]} rotation={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[1.92, 0.95]} />
        <meshStandardMaterial
          color="#c9a574"
          roughness={0.94}
          metalness={0}
          envMapIntensity={0.06}
          transparent
          opacity={1}
        />
      </mesh>

      <group ref={flapPivotRef}>
        <mesh ref={flapMeshRef} geometry={flapGeom} rotation={[0, 0, 0]} castShadow receiveShadow>
          <meshStandardMaterial
            color={mat.flap}
            roughness={0.9}
            metalness={0}
            envMapIntensity={palette === 'blush' ? 0.14 : 0.12}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {showStamp && (
        <>
          <mesh
            geometry={stampGeom}
            position={[0.72, -0.44, frontZ + 0.1]}
            rotation={[-0.02, 0, -0.04]}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial
              color={mat.stampPaper}
              roughness={0.88}
              metalness={0}
              envMapIntensity={0.08}
            />
          </mesh>

          <RoundedBox
            args={[0.16, 0.19, 0.06]}
            radius={0.025}
            smoothness={3}
            position={[0.72, -0.44, frontZ + 0.158]}
            rotation={[-0.02, 0, -0.04]}
            castShadow
          >
            <meshStandardMaterial
              color={mat.stampBlue}
              roughness={0.82}
              metalness={0}
              envMapIntensity={0.15}
            />
          </RoundedBox>
        </>
      )}
    </group>
  )

  return (
    <>
      {!transparentBackground && (
        <>
          <color attach="background" args={['#141210']} />
          <fog attach="fog" args={['#141210', 14, 42]} />
        </>
      )}

      {/* Key light: top-left — warm product hero (blush: slightly cooler fill) */}
      <ambientLight intensity={palette === 'blush' ? 0.48 : 0.42} color={palette === 'blush' ? '#fff5f8' : '#ffe8d0'} />
      <hemisphereLight
        intensity={palette === 'blush' ? 0.42 : 0.38}
        color="#fff4f6"
        groundColor={palette === 'blush' ? '#4a3538' : '#3d3028'}
      />
      <directionalLight
        position={[-4.2, 6.5, 5.5]}
        intensity={1.35}
        color="#fff4e0"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={24}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
      />
      <directionalLight position={[3.5, 2.5, 6]} intensity={0.28} color="#ffe0cc" />
      <directionalLight position={[0, -2, 4]} intensity={palette === 'blush' ? 0.1 : 0.12} color="#c4a574" />

      <group ref={rootRef} position={[sceneShiftX, parallax ? -0.06 : 0, 0]} rotation={[0, 0, 0]}>
        {parallax ? (
          <Float speed={1.1} rotationIntensity={0.08} floatIntensity={0.22}>
            {envelopeInner}
          </Float>
        ) : (
          envelopeInner
        )}
      </group>

      <Environment preset="studio" environmentIntensity={palette === 'blush' ? 0.32 : 0.26} />
    </>
  )
}
