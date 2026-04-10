'use client'

/**
 * Pixel grid background (inspired by Aceternity’s Webcam Pixel Grid:
 * https://ui.aceternity.com/components/webcam-pixel-grid ).
 * - `pixelColors="gradient"`: same tile layout + depth, fills from warm cream→sand stops (default).
 * - `pixelColors="image"`: sample colors from `imageSrc`; blurred grid fallback if CORS blocks canvas.
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

const DEFAULT_COLS = 42
const DEFAULT_ROWS = 30
const GAP = 0.12
const MAX_LIFT = 10

type Sample = { r: number; g: number; b: number; luma: number }

type Rgb = { r: number; g: number; b: number }

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function lerpRgb(c0: Rgb, c1: Rgb, t: number): Rgb {
  return {
    r: Math.round(lerp(c0.r, c1.r, t)),
    g: Math.round(lerp(c0.g, c1.g, t)),
    b: Math.round(lerp(c0.b, c1.b, t)),
  }
}

/** Smooth multi-stop linear gradient (warm landing hues) mapped diagonally across the grid */
function gradientSamples(cols: number, rows: number, light: boolean): Sample[] {
  const stops: Array<{ u: number } & Rgb> = light
    ? [
        { u: 0, r: 253, g: 245, b: 223 },
        { u: 0.35, r: 255, g: 253, b: 245 },
        { u: 0.62, r: 240, g: 235, b: 226 },
        { u: 0.82, r: 228, g: 223, b: 214 },
        { u: 1, r: 216, g: 211, b: 201 },
      ]
    : [
        { u: 0, r: 32, g: 28, b: 24 },
        { u: 0.4, r: 42, g: 38, b: 32 },
        { u: 0.75, r: 52, g: 46, b: 38 },
        { u: 1, r: 26, g: 22, b: 18 },
      ]

  const sampleU = (u: number): Rgb => {
    const x = Math.min(1, Math.max(0, u))
    let i = 0
    while (i < stops.length - 1 && stops[i + 1]!.u < x) i++
    const a = stops[i]!
    const b = stops[i + 1] ?? a
    const span = b.u - a.u || 1
    const t = (x - a.u) / span
    return lerpRgb(a, b, t)
  }

  const out: Sample[] = []
  const cx = Math.max(1, cols - 1)
  const cy = Math.max(1, rows - 1)
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      // Diagonal + slight horizontal bias — matches page `bg-gradient-to-b` feel in 2D
      const u = (x / cx) * 0.42 + (y / cy) * 0.58
      let { r, g, b } = sampleU(u)
      // Tiny per-cell variation so squares stay visible without photo noise
      const wobble = 0.988 + 0.024 * Math.sin(x * 0.51 + y * 0.37)
      r = Math.min(255, Math.max(0, Math.round(r * wobble)))
      g = Math.min(255, Math.max(0, Math.round(g * wobble)))
      b = Math.min(255, Math.max(0, Math.round(b * wobble)))
      const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255
      out.push({ r, g, b, luma })
    }
  }
  return out
}

function sampleImage(
  img: HTMLImageElement,
  cols: number,
  rows: number,
): Sample[] | null {
  try {
    const canvas = document.createElement('canvas')
    canvas.width = cols
    canvas.height = rows
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return null
    ctx.drawImage(img, 0, 0, cols, rows)
    const { data } = ctx.getImageData(0, 0, cols, rows)
    const out: Sample[] = []
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = (y * cols + x) * 4
        const r = data[i]!
        const g = data[i + 1]!
        const b = data[i + 2]!
        const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255
        out.push({ r, g, b, luma })
      }
    }
    return out
  } catch {
    return null
  }
}

export function PixelGridImageBackground({
  imageSrc,
  gridCols = DEFAULT_COLS,
  gridRows = DEFAULT_ROWS,
  className = '',
  tone = 'dark',
  /** `gradient` = same grid look, colors from warm cream→sand stops (not photo sampling) */
  pixelColors = 'gradient',
}: {
  imageSrc?: string | null | undefined
  gridCols?: number
  gridRows?: number
  className?: string
  /** `light` matches warm cream landing (`/`) when used behind open-memory UI */
  tone?: 'dark' | 'light'
  pixelColors?: 'image' | 'gradient'
}) {
  const light = tone === 'light'
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const samplesRef = useRef<Sample[] | null>(null)
  const drawRef = useRef<() => void>(() => {})
  const [mode, setMode] = useState<'idle' | 'canvas' | 'fallback'>(() =>
    pixelColors === 'gradient' ? 'canvas' : 'idle',
  )

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    const samples = samplesRef.current
    if (!canvas || !wrap || !samples || samples.length !== gridCols * gridRows) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = wrap.clientWidth
    const h = wrap.clientHeight
    if (w < 2 || h < 2) return

    canvas.width = Math.floor(w * dpr)
    canvas.height = Math.floor(h * dpr)
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const cellW = w / gridCols
    const cellH = h / gridRows
    const innerW = cellW * (1 - GAP)
    const innerH = cellH * (1 - GAP)
    const offX = (cellW - innerW) / 2
    const offY = (cellH - innerH) / 2

    ctx.fillStyle = light ? '#fdf5df' : '#1a1612'
    ctx.fillRect(0, 0, w, h)

    const stroke = light ? 'rgba(51, 48, 46, 0.14)' : 'rgba(26, 22, 18, 0.35)'

    let idx = 0
    for (let y = 0; y < gridRows; y++) {
      for (let x = 0; x < gridCols; x++) {
        const s = samples[idx++]!
        const lift = s.luma * MAX_LIFT
        const px = x * cellW + offX
        const py = y * cellH + offY - lift * 0.35

        ctx.fillStyle = `rgb(${s.r},${s.g},${s.b})`
        ctx.fillRect(px, py, innerW, innerH + lift * 0.15)

        ctx.strokeStyle = stroke
        ctx.lineWidth = 0.5
        ctx.strokeRect(px, py, innerW, innerH + lift * 0.15)
      }
    }
  }, [gridCols, gridRows, light])

  drawRef.current = draw

  useLayoutEffect(() => {
    if (pixelColors !== 'gradient') return
    samplesRef.current = gradientSamples(gridCols, gridRows, light)
    drawRef.current()
  }, [pixelColors, gridCols, gridRows, light])

  useEffect(() => {
    if (pixelColors === 'gradient') {
      setMode('canvas')
      return
    }

    if (!imageSrc?.trim()) {
      samplesRef.current = null
      setMode('idle')
      return
    }

    let cancelled = false
    const img = new Image()
    if (!imageSrc.startsWith('data:')) {
      img.crossOrigin = 'anonymous'
    }

    img.onload = () => {
      if (cancelled) return
      const samples = sampleImage(img, gridCols, gridRows)
      if (samples) {
        samplesRef.current = samples
        setMode('canvas')
        requestAnimationFrame(() => {
          drawRef.current()
        })
      } else {
        samplesRef.current = null
        setMode('fallback')
      }
    }

    img.onerror = () => {
      if (!cancelled) setMode('fallback')
    }

    img.src = imageSrc

    return () => {
      cancelled = true
    }
  }, [imageSrc, gridCols, gridRows, pixelColors])

  useEffect(() => {
    if (mode !== 'canvas') return
    const wrap = wrapRef.current
    if (!wrap) return
    const ro = new ResizeObserver(() => drawRef.current())
    ro.observe(wrap)
    const onOrient = () => drawRef.current()
    window.addEventListener('orientationchange', onOrient)
    return () => {
      ro.disconnect()
      window.removeEventListener('orientationchange', onOrient)
    }
  }, [mode, gridCols, gridRows])

  if (pixelColors === 'image' && !imageSrc?.trim()) return null

  if (mode === 'fallback') {
    return (
      <div
        className={`pointer-events-none fixed inset-0 z-0 overflow-hidden ${className}`}
        aria-hidden
      >
        <div
          className="absolute inset-0 scale-110 bg-cover bg-center opacity-40"
          style={{ backgroundImage: `url(${imageSrc})` }}
        />
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage: light
              ? `
              linear-gradient(rgba(51,48,46,0.12) 1px, transparent 1px),
              linear-gradient(90deg, rgba(51,48,46,0.12) 1px, transparent 1px)
            `
              : `
              linear-gradient(rgba(26,22,18,0.55) 1px, transparent 1px),
              linear-gradient(90deg, rgba(26,22,18,0.55) 1px, transparent 1px)
            `,
            backgroundSize: `${100 / gridCols}% ${100 / gridRows}%`,
          }}
        />
        <div
          className={
            light
              ? 'absolute inset-0 bg-gradient-to-b from-[#fdf5df]/80 via-[#FFFDF5]/55 to-[#fdf5df]/85'
              : 'absolute inset-0 bg-tyme-canvas/65'
          }
        />
      </div>
    )
  }

  return (
    <div
      ref={wrapRef}
      className={`pointer-events-none fixed inset-0 z-0 overflow-hidden ${className}`}
      aria-hidden
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full object-cover" />
      {light ? (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-[#fdf5df]/82 via-[#FFFDF5]/50 to-[#fdf5df]/88" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_30%,transparent,rgba(253,245,223,0.55))]" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-tyme-canvas/80 via-tyme-canvas/55 to-tyme-canvas/85" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_30%,transparent,rgba(26,22,18,0.5))]" />
        </>
      )}
    </div>
  )
}
