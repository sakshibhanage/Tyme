'use client'

import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { CapsuleScene, type CapsulePhase } from './CapsuleScene'

export function CapsuleCanvas({ phase }: { phase: CapsulePhase }) {
  return (
    <div className="h-[min(58vh,480px)] w-full min-h-[260px] overflow-hidden rounded-2xl border border-tyme-border bg-tyme-panel-soft shadow-[0_20px_50px_rgba(123,97,0,0.1)]">
      <Canvas
        shadows
        camera={{ position: [0, 0.12, 3.5], fov: 38 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.08,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <CapsuleScene phase={phase} />
        </Suspense>
      </Canvas>
    </div>
  )
}
