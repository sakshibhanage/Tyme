'use client'

import dynamic from 'next/dynamic'
import type { HomeEnvelopeCanvasVariant } from './HomeEnvelopeCanvas'

function Loader() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-transparent">
      <div className="flex flex-col items-center gap-3 text-[#6B665F]">
        <span className="material-symbols-outlined animate-pulse text-4xl text-[#8B7D3A]/70">mail</span>
        <span className="text-sm font-medium tracking-wide">Unfolding…</span>
      </div>
    </div>
  )
}

const Inner = dynamic(
  () => import('./HomeEnvelopeCanvas').then(m => m.HomeEnvelopeCanvas),
  {
    ssr: false,
    loading: () => <Loader />,
  },
)

export function HomeEnvelopeCanvasLazy({
  variant = 'home',
  envelopeOpen = false,
  canvasTransparent = false,
  envelopeScale,
  cameraPosition,
  parallax,
  motionScale,
  staticRootY,
  showStamp,
  envelopeWidthMultiplier,
  pinClosedRestEnvelopeScale,
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
  return (
    <Inner
      variant={variant}
      envelopeOpen={envelopeOpen}
      canvasTransparent={canvasTransparent}
      envelopeScale={envelopeScale}
      cameraPosition={cameraPosition}
      parallax={parallax}
      motionScale={motionScale}
      staticRootY={staticRootY}
      showStamp={showStamp}
      envelopeWidthMultiplier={envelopeWidthMultiplier}
      pinClosedRestEnvelopeScale={pinClosedRestEnvelopeScale}
    />
  )
}
