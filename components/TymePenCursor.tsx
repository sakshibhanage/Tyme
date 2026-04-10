'use client'

import { useEffect, useState } from 'react'

/** Hotspot matches `6 4` from CSS cursor definition (nib tip). */
const HOTSPOT_X = 6
const HOTSPOT_Y = 4

/**
 * DOM-following pen cursor — CSS `cursor: url(...)` is flaky in WebKit (vanishes over compositing / after small moves).
 * Fine pointers only; touch / reduced-motion users keep the normal cursor (component returns null; globals.css handles that case.
 */
export function TymePenCursor() {
  const [on, setOn] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(pointer: coarse)').matches) return

    const onMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY })
      setOn(true)
    }
    const onWinLeave = () => setOn(false)

    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('blur', onWinLeave)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('blur', onWinLeave)
    }
  }, [])

  if (!on) return null

  return (
    <img
      src="/cursors/tyme-pen-cursor.png"
      alt=""
      width={32}
      height={32}
      className="pointer-events-none fixed z-[2147483647] select-none"
      aria-hidden
      style={{
        left: pos.x,
        top: pos.y,
        transform: `translate(-${HOTSPOT_X}px, -${HOTSPOT_Y}px)`,
      }}
    />
  )
}
