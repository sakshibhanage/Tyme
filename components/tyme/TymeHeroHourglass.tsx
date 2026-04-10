'use client'

import { useEffect, useRef, useState } from 'react'

const DRAIN_MS = 5_200
const FLIP_MS = 750
const PAUSE_AFTER_FLIP_MS = 140

const CX = 100
const CY = 160

/** Inner fluid chamber — trapezoids (matches visual glass interior) */
const Y_TOP = 56
const Y_NECK_TOP = 136
const X_TL = 56
const X_TR = 144
const X_NL = 93
const X_NR = 107

const Y_NECK_BOT = 144
const Y_BOT = 258
const X_BL = 56
const X_BR = 144
const X_BNL = 93
const X_BNR = 107

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function topEdgeXLeft(y: number) {
  return lerp(X_TL, X_NL, (y - Y_TOP) / (Y_NECK_TOP - Y_TOP))
}

function topEdgeXRight(y: number) {
  return lerp(X_TR, X_NR, (y - Y_TOP) / (Y_NECK_TOP - Y_TOP))
}

function bottomEdgeXLeft(y: number) {
  return lerp(X_BNL, X_BL, (y - Y_NECK_BOT) / (Y_BOT - Y_NECK_BOT))
}

function bottomEdgeXRight(y: number) {
  return lerp(X_BNR, X_BR, (y - Y_NECK_BOT) / (Y_BOT - Y_NECK_BOT))
}

function topSandPolygon(fill: number): string | null {
  if (fill < 0.002) return null
  const ySurf = Y_TOP + (Y_NECK_TOP - Y_TOP) * (1 - fill)
  const xl = topEdgeXLeft(ySurf)
  const xr = topEdgeXRight(ySurf)
  return `M ${xl} ${ySurf} L ${xr} ${ySurf} L ${X_NR} ${Y_NECK_TOP} L ${X_NL} ${Y_NECK_TOP} Z`
}

function bottomSandPolygon(fill: number): string | null {
  if (fill < 0.002) return null
  const ySurf = Y_NECK_BOT + (Y_BOT - Y_NECK_BOT) * fill
  const xl = bottomEdgeXLeft(ySurf)
  const xr = bottomEdgeXRight(ySurf)
  return `M ${X_BNL} ${Y_NECK_BOT} L ${X_BNR} ${Y_NECK_BOT} L ${xr} ${ySurf} L ${xl} ${ySurf} Z`
}

function easeInOutQuad(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2
}

/** Smooth glass outline — bulbous, similar to 3D reference */
const GLASS_PATH =
  'M 52 58 C 52 46, 100 34, 148 58 C 156 92, 132 118, 108 132 L 108 136 C 132 168, 156 228, 148 262 C 100 286, 52 274, 52 262 C 44 228, 68 168, 92 136 L 92 132 C 68 118, 44 92, 52 58 Z'

export function TymeHeroHourglass({ className = '' }: { className?: string }) {
  const [fillTop, setFillTop] = useState(1)
  const [fillBottom, setFillBottom] = useState(0)
  const [rotation, setRotation] = useState(0)
  const [streamPulse, setStreamPulse] = useState(0)
  const drainingTopRef = useRef(true)

  useEffect(() => {
    let cancelled = false
    let raf = 0
    const timeouts: number[] = []

    const clearAllTimeouts = () => {
      timeouts.forEach(t => window.clearTimeout(t))
      timeouts.length = 0
    }

    const runDrain = () => {
      if (cancelled) return
      const start = performance.now()
      const fromTop = drainingTopRef.current

      const tick = (now: number) => {
        if (cancelled) return
        const raw = Math.min(1, (now - start) / DRAIN_MS)
        const e = easeInOutQuad(raw)
        if (fromTop) {
          setFillTop(1 - e)
          setFillBottom(e)
        } else {
          setFillBottom(1 - e)
          setFillTop(e)
        }
        setStreamPulse(Math.sin(now * 0.014) * 0.5 + 0.5)

        if (raw < 1) {
          raf = requestAnimationFrame(tick)
        } else {
          setRotation(r => r + 180)
          const t1 = window.setTimeout(() => {
            if (cancelled) return
            drainingTopRef.current = !drainingTopRef.current
            const t2 = window.setTimeout(() => {
              if (cancelled) return
              runDrain()
            }, PAUSE_AFTER_FLIP_MS)
            timeouts.push(t2)
          }, FLIP_MS)
          timeouts.push(t1)
        }
      }

      raf = requestAnimationFrame(tick)
    }

    runDrain()

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      clearAllTimeouts()
    }
  }, [])

  const topPath = topSandPolygon(fillTop)
  const bottomPath = bottomSandPolygon(fillBottom)
  const neckOpacity =
    Math.min(1, fillTop + fillBottom) * (1 - Math.abs(fillTop - fillBottom)) * 2.5
  const streamBright = 0.45 + streamPulse * 0.5

  return (
    <div className={`flex h-full w-full items-center justify-center ${className}`}>
      <div
        className="relative mx-auto h-full max-h-full w-full max-w-full [&_svg]:h-full [&_svg]:w-auto [&_svg]:max-w-full"
        style={{ aspectRatio: '200 / 320' }}
      >
        <svg
          viewBox="0 0 200 320"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-[0_24px_60px_rgba(60,40,120,0.35)]"
          aria-hidden
        >
          <defs>
            <linearGradient id="hg-fluid" x1="70" y1="40" x2="130" y2="280" gradientUnits="userSpaceOnUse">
              <stop stopColor="#D4B8FF" />
              <stop offset="0.35" stopColor="#A575F5" />
              <stop offset="0.65" stopColor="#8A5CF5" />
              <stop offset="1" stopColor="#5B32A8" />
            </linearGradient>
            <radialGradient id="hg-fluid-shine" cx="35%" cy="30%" r="65%">
              <stop offset="0%" stopColor="#F0E5FF" stopOpacity="0.55" />
              <stop offset="45%" stopColor="#B894FF" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#5B32A8" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="hg-glass-fill" x1="30" y1="20" x2="170" y2="300" gradientUnits="userSpaceOnUse">
              <stop stopColor="rgba(180,230,255,0.14)" />
              <stop offset="0.4" stopColor="rgba(120,200,255,0.06)" />
              <stop offset="0.7" stopColor="rgba(200,180,255,0.08)" />
              <stop offset="1" stopColor="rgba(100,160,220,0.1)" />
            </linearGradient>
            <linearGradient id="hg-iridescent" x1="40" y1="0" x2="160" y2="320" gradientUnits="userSpaceOnUse">
              <stop stopColor="#5EE7DF" />
              <stop offset="0.25" stopColor="#6BB5FF" />
              <stop offset="0.5" stopColor="#A8D4FF" />
              <stop offset="0.72" stopColor="#7EC8E8" />
              <stop offset="1" stopColor="#4ADE80" stopOpacity="0.6" />
            </linearGradient>
            <linearGradient id="hg-metal" x1="100" y1="0" x2="100" y2="24" gradientUnits="userSpaceOnUse">
              <stop stopColor="#3d3a38" />
              <stop offset="0.5" stopColor="#2a2826" />
              <stop offset="1" stopColor="#1a1918" />
            </linearGradient>
            <linearGradient id="hg-metal-rim" x1="0" y1="0" x2="1" y2="0" gradientUnits="objectBoundingBox">
              <stop offset="0%" stopColor="#6b5340" stopOpacity="0.9" />
              <stop offset="0.35" stopColor="#c9a227" stopOpacity="0.85" />
              <stop offset="0.55" stopColor="#e8d4a8" stopOpacity="0.5" />
              <stop offset="0.75" stopColor="#b8935c" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#4a4035" stopOpacity="0.9" />
            </linearGradient>
            <filter id="hg-fluid-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="1.2" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="hg-glass-soft" x="-15%" y="-15%" width="130%" height="130%">
              <feGaussianBlur stdDeviation="0.4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <g
            style={{
              transform: `rotate(${rotation}deg)`,
              transformOrigin: `${CX}px ${CY}px`,
              transition: `transform ${FLIP_MS}ms cubic-bezier(0.45, 0, 0.2, 1)`,
            }}
          >
            {/* Bottom metal cap */}
            <ellipse cx={CX} cy={278} rx={52} ry={11} fill="url(#hg-metal)" />
            <ellipse
              cx={CX}
              cy={276}
              rx={50}
              ry={9}
              fill="none"
              stroke="url(#hg-metal-rim)"
              strokeWidth={2.2}
              opacity={0.95}
            />

            {/* Glass body */}
            <path d={GLASS_PATH} fill="url(#hg-glass-fill)" opacity={0.92} />
            <path
              d={GLASS_PATH}
              fill="none"
              stroke="url(#hg-iridescent)"
              strokeWidth={2.4}
              strokeLinejoin="round"
              strokeLinecap="round"
              opacity={0.85}
              filter="url(#hg-glass-soft)"
            />
            <path
              d={GLASS_PATH}
              fill="none"
              stroke="rgba(255,255,255,0.35)"
              strokeWidth={0.9}
              strokeLinejoin="round"
              opacity={0.5}
            />

            {/* Purple fluid */}
            {bottomPath ? (
              <g filter="url(#hg-fluid-glow)">
                <path d={bottomPath} fill="url(#hg-fluid)" />
                <path d={bottomPath} fill="url(#hg-fluid-shine)" />
              </g>
            ) : null}

            <rect
              x={98}
              y={Y_NECK_TOP}
              width={4}
              height={Y_NECK_BOT - Y_NECK_TOP}
              rx={1.5}
              fill="url(#hg-fluid)"
              opacity={neckOpacity * streamBright}
              filter="url(#hg-fluid-glow)"
            />

            {topPath ? (
              <g filter="url(#hg-fluid-glow)">
                <path d={topPath} fill="url(#hg-fluid)" />
                <path d={topPath} fill="url(#hg-fluid-shine)" />
              </g>
            ) : null}

            {/* Top metal cap */}
            <ellipse cx={CX} cy={42} rx={52} ry={11} fill="url(#hg-metal)" />
            <ellipse
              cx={CX}
              cy={44}
              rx={50}
              ry={9}
              fill="none"
              stroke="url(#hg-metal-rim)"
              strokeWidth={2.2}
              opacity={0.95}
            />
          </g>
        </svg>
      </div>
    </div>
  )
}
