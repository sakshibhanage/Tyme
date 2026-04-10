'use client'

/** `min(vw, rem)` — matches 3D body width with shared camera/scale tuning. */
export const SEAL_POCKET_VW = 62.5
export const SEAL_POCKET_MAX_REM = 67

export function sealPocketOuterWidthStyle(): { width: string; maxWidth: string } {
  return {
    // +3px on each side (total +6px), while still respecting viewport cap.
    width: `min(calc(min(${SEAL_POCKET_VW}vw, ${SEAL_POCKET_MAX_REM}rem) + 6px), calc(100vw - 1.5rem))`,
    maxWidth: 'calc(100vw - 1.5rem)',
  }
}

/**
 * How far the **bottom of the HTML pocket** sits **above the viewport bottom** so it lines up with the
 * 3D envelope body’s base in the scene — not the canvas edge (the mesh sits inside the frame).
 */
export const SEAL_POCKET_BOTTOM_LIFT =
  'clamp(0rem, min(10dvh, 22vw), 11rem)'

/** HTML pocket — width matches 3D body; vertical anchor is `SEAL_POCKET_BOTTOM_LIFT`. */
export function SealEnvelopePocketFront() {
  return (
    <div
      className="pointer-events-none relative shrink-0"
      style={sealPocketOuterWidthStyle()}
      aria-hidden
    >
      <div className="translate-y-0">
        <div
          className="h-60 w-full rounded-b-[clamp(1.85rem,5.2vw,3.1rem)] border-t border-white/25 bg-[#e8b565] shadow-[0_-5px_16px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.28)] sm:h-[18.5rem] sm:rounded-b-[clamp(2rem,4.6vw,3.35rem)]"
        />
      </div>
    </div>
  )
}
