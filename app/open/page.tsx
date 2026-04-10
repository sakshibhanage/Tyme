import { Suspense } from 'react'
import { OpenMemoryClient } from '@/components/tyme/OpenMemoryClient'

export default function OpenMemoryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-tyme-canvas font-tyme-sans text-tyme-text-muted flex items-center justify-center text-sm">
          Opening…
        </div>
      }
    >
      <OpenMemoryClient />
    </Suspense>
  )
}
