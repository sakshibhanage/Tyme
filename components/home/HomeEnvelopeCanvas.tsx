'use client'

import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { EnvelopeScene } from './EnvelopeScene'
import { SEAL_ENVELOPE_SCALE } from './seal-envelope-view-config'

export type HomeEnvelopeCanvasVariant = 'home' | 'seal'

const DEFAULT_CAMERA: [number, number, number] = [0, 0.12, 4.45]

export function HomeEnvelopeCanvas({
  variant = 'home',
  envelopeOpen = false,
  /** Clear to transparent (clay palette) — e.g. seal page over page gradient */
  canvasTransparent = false,
  /** Scene scale; home hero defaults to 1.22; seal variant static framing defaults to `SEAL_ENVELOPE_SCALE` */
  envelopeScale,
  cameraPosition = DEFAULT_CAMERA,
  /** Cursor tilt + Float idle; set false on seal page for a static envelope */
  parallax = true,
  /** Reduce motion to keep the full envelope in frame */
  motionScale = 1,
  /** Passed to EnvelopeScene when parallax is false */
  staticRootY = 0,
  showStamp = true,
  envelopeWidthMultiplier = 1,
  pinClosedRestEnvelopeScale = false,
}: {
  variant?: HomeEnvelopeCanvasVariant
  envelopeOpen?: boolean
  canvasTransparent?: boolean
  envelopeScale?: number
  cameraPosition?: [number, number, number]
  parallax?: boolean
  motionScale?: number
  staticRootY?: number
  showStamp?: boolean
  envelopeWidthMultiplier?: number
  pinClosedRestEnvelopeScale?: boolean
}) {
  const seal = variant === 'seal'
  const transparent = seal || canvasTransparent
  const heroStaticFraming = canvasTransparent && !parallax
  const resolvedEnvelopeScale =
    envelopeScale ?? (heroStaticFraming || seal ? SEAL_ENVELOPE_SCALE : 1.22)

  return (
    <Canvas
      shadows
      className="h-full w-full cursor-inherit"
      camera={{ position: cameraPosition, fov: 36 }}
      gl={{
        antialias: true,
        alpha: transparent,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
        outputColorSpace: THREE.SRGBColorSpace,
      }}
      onCreated={({ gl }) => {
        if (transparent) gl.setClearColor(0x000000, 0)
      }}
      dpr={[1, 2]}
    >
      <Suspense fallback={null}>
        <EnvelopeScene
          parallax={parallax}
          palette="clay"
          envelopeScale={resolvedEnvelopeScale}
          transparentBackground={transparent}
          openEnvelope={envelopeOpen}
          motionScale={motionScale}
          staticRootY={staticRootY}
          showStamp={showStamp}
          envelopeWidthMultiplier={envelopeWidthMultiplier}
          pinClosedRestEnvelopeScale={pinClosedRestEnvelopeScale}
        />
      </Suspense>
    </Canvas>
  )
}
