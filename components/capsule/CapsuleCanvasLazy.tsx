'use client'

import dynamic from 'next/dynamic'
import type { CapsulePhase } from './CapsuleScene'

const Inner = dynamic(() => import('./CapsuleCanvas').then(m => m.CapsuleCanvas), {
  ssr: false,
  loading: () => (
    <div className="flex h-[min(58vh,480px)] min-h-[260px] w-full items-center justify-center rounded-2xl border border-tyme-border bg-tyme-panel-mid text-sm text-tyme-muted">
      <span className="material-symbols-outlined mr-2 animate-pulse text-tyme-primary">view_in_ar</span>
      Loading 3D capsule…
    </div>
  ),
})

export function CapsuleCanvasLazy({ phase }: { phase: CapsulePhase }) {
  return <Inner phase={phase} />
}
