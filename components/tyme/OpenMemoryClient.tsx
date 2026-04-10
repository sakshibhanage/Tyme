'use client'

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { toPng } from 'html-to-image'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { getCapsuleTokenFromOpenUrl } from '@/lib/open-url'
import type { DecodedCapsule } from '@/lib/payload'
import { decodeCapsule } from '@/lib/payload'

gsap.registerPlugin(ScrollTrigger)

/** Same tokens as `TymeLanding` — warm cream, charcoal, olive */
const L = {
  charcoal: '#33302E',
  olive: '#8B7D3A',
  border: '#D8D3C9',
  letterGold: '#c4a44d',
  letterInk: '#2d2926',
  letterMuted: '#6b6560',
  letterPaper: '#fdfaf5',
  cardTint: 'color-mix(in srgb, #ffffff 88%, #FDC5A5 12%)',
  metaPanel: 'color-mix(in srgb, #FEF6F0 72%, #ffffff 28%)',
} as const

function formatUnlock(ts: number) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date(ts))
}

/** Remaining time until unlock; all units non-negative. */
function getCountdownParts(unlockAtMs: number, nowMs: number) {
  const ms = Math.max(0, unlockAtMs - nowMs)
  const totalSec = Math.floor(ms / 1000)
  const days = Math.floor(totalSec / 86_400)
  const hours = Math.floor((totalSec % 86_400) / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  const seconds = totalSec % 60
  return { days, hours, minutes, seconds }
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  const display = label === 'Days' ? String(value) : String(value).padStart(2, '0')
  return (
    <div className="flex min-w-0 flex-col items-center gap-2">
      <span
        className="font-tyme-sans text-[clamp(1.75rem,6vw,2.75rem)] font-extrabold tabular-nums leading-none text-[#33302E]"
        aria-hidden
      >
        {display}
      </span>
      <span className="font-tyme-sans text-[9px] font-semibold uppercase tracking-[0.28em] text-[#6B665F]">
        {label}
      </span>
    </div>
  )
}

function OpenHeader() {
  return (
    <header
      className="open-mem-anim relative z-20 border-b bg-[#fdf5df] px-5 py-5 shadow-[0_1px_0_rgba(45,41,38,0.06)] sm:px-10"
      style={{ borderColor: `${L.border}99` }}
    >
      <div className="mx-auto flex max-w-[1200px] items-center justify-between">
        <Link href="/" className="flex items-center gap-3" style={{ color: L.charcoal }}>
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold"
            style={{ borderColor: L.olive, color: L.olive }}
          >
            T
          </span>
          <span className="font-tyme-head text-lg font-semibold tracking-tight">Tyme</span>
        </Link>
      </div>
    </header>
  )
}

function readCapsuleCFromBrowser(): string {
  if (typeof window === 'undefined') return ''
  return getCapsuleTokenFromOpenUrl(new URL(window.location.href))
}

function memoryDownloadFilename(title: string) {
  const s = title
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-_]/g, '')
    .slice(0, 48)
  return s || 'memory'
}

export function OpenMemoryClient() {
  const searchParams = useSearchParams()
  const queryC = searchParams.get('c') ?? ''
  const [raw, setRaw] = useState(queryC)
  const [now, setNow] = useState(() => Date.now())
  const [downloadBusy, setDownloadBusy] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const memoryExportRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const sync = () => {
      const fromWindow = readCapsuleCFromBrowser()
      setRaw(fromWindow || queryC)
    }
    sync()
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [queryC])

  const capsule = useMemo<DecodedCapsule | null | 'bad'>(() => {
    const t = raw.trim()
    if (!t) return null
    let payload = t
    try {
      payload = decodeURIComponent(t)
    } catch {
      return 'bad'
    }
    const decoded = decodeCapsule(payload)
    return decoded ?? 'bad'
  }, [raw])

  const phase = useMemo(() => {
    if (!raw.trim()) return 'empty'
    if (capsule === 'bad') return 'bad'
    if (capsule === null) return 'empty'
    if (capsule.unlockAt > 0 && now < capsule.unlockAt) return 'locked'
    return 'open'
  }, [raw, capsule, now])

  /** Single stable primitive for GSAP layout effect — avoids React “deps length changed” (e.g. HMR). */
  const animSignature = `${phase}:${raw.length}:${raw.slice(0, 120)}`

  const unlockAt =
    capsule !== null && capsule !== 'bad' ? capsule.unlockAt : 0
  const isTimeLocked = unlockAt > 0 && now < unlockAt

  useEffect(() => {
    if (capsule === null || capsule === 'bad') return
    if (!isTimeLocked) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [capsule, isTimeLocked])

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    const ease = 'power3.out'

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.open-mem-anim',
        { y: 56, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.05, stagger: 0.12, ease, delay: 0.06 },
      )
      gsap.fromTo(
        '.open-mem-card',
        { y: 72, opacity: 0, scale: 0.98 },
        { y: 0, opacity: 1, scale: 1, duration: 1.15, ease, delay: 0.12 },
      )
      gsap.fromTo(
        '.open-mem-line',
        { scaleX: 0, opacity: 0 },
        { scaleX: 1, opacity: 1, duration: 1.2, ease, delay: 0.35, transformOrigin: 'left center' },
      )

      const img = root.querySelector('.open-mem-img')
      if (img) {
        gsap.from(img, {
          scrollTrigger: {
            trigger: img,
            start: 'top 88%',
            toggleActions: 'play none none none',
          },
          y: 48,
          opacity: 0,
          duration: 1,
          ease,
        })
      }

      const prose = root.querySelector('.open-mem-prose')
      if (prose && phase === 'open') {
        gsap.from(prose, {
          scrollTrigger: {
            trigger: prose,
            start: 'top 90%',
            toggleActions: 'play none none none',
          },
          y: 36,
          opacity: 0,
          duration: 0.95,
          ease,
        })
      }
    }, root)

    const t = window.setTimeout(() => ScrollTrigger.refresh(), 300)
    return () => {
      window.clearTimeout(t)
      ctx.revert()
    }
  }, [animSignature])

  const shell = (children: React.ReactNode) => (
    <div
      ref={rootRef}
      className="relative min-h-screen bg-gradient-to-b from-[#fdf5df] to-[#FFFDF5] font-tyme-sans"
      style={{ color: L.charcoal }}
    >
      <OpenHeader />
      <div className="relative z-10">{children}</div>
    </div>
  )

  if (phase === 'empty') {
    return shell(
      <div className="flex min-h-[calc(100dvh-5rem)] flex-col items-center justify-center px-6 pb-24 pt-12 text-center">
        <div>
          <p className="font-tyme-sans text-[10px] font-semibold uppercase tracking-[0.42em] text-[#8B7D3A]">
            Tyme
          </p>
          <h1 className="mt-6 font-tyme-sans text-[clamp(2.5rem,10vw,5.5rem)] font-extrabold uppercase leading-[0.9] tracking-[-0.03em] text-[#33302E]">
            No link
          </h1>
          <p className="tyme-outline-olive mx-auto mt-2 max-w-[12ch] font-tyme-sans text-[clamp(2rem,8vw,4rem)] font-extrabold uppercase leading-none">
            Here
          </p>
        </div>
        <p className="open-mem-anim mt-10 max-w-md text-[#6B665F]">
          Open a memory from a Tyme URL, or create a new sealed link.
        </p>
        <Link
          href="/tyme/seal"
          className="open-mem-anim mt-10 rounded-xl bg-tyme-gold px-10 py-4 text-[10px] font-bold uppercase tracking-[0.24em] text-tyme-ink shadow-[0_8px_24px_rgba(212,175,55,0.35)] transition hover:bg-tyme-gold-hover"
        >
          Seal a memory
        </Link>
      </div>,
    )
  }

  if (phase === 'bad') {
    return shell(
      <div className="flex min-h-[calc(100dvh-5rem)] flex-col items-center justify-center px-6 pb-24 pt-12 text-center">
        <div>
          <p className="font-tyme-sans text-[10px] font-semibold uppercase tracking-[0.42em] text-[#b3723e]">
            Broken seal
          </p>
          <h1 className="mt-6 font-tyme-sans text-[clamp(2.25rem,9vw,4.5rem)] font-extrabold uppercase leading-[0.92] tracking-[-0.02em] text-[#33302E]">
            Link
          </h1>
          <p className="tyme-outline-olive mt-1 font-tyme-sans text-[clamp(2rem,8vw,4rem)] font-extrabold uppercase leading-none">
            Corrupt
          </p>
        </div>
        <p className="open-mem-anim mt-10 max-w-lg text-[#6B665F]">
          The checksum no longer matches. Even one edited character breaks the seal.
        </p>
        <Link
          href="/"
          className="open-mem-anim mt-10 rounded-xl border border-[#CFC8BC] bg-[#E9E7DE]/70 px-10 py-4 text-[10px] font-bold uppercase tracking-[0.22em] text-[#33302E] transition hover:border-[#8B7D3A]/55 hover:bg-[#E9E7DE]"
        >
          ← Home
        </Link>
      </div>,
    )
  }

  if (phase === 'locked' && capsule !== null && capsule !== 'bad') {
    const { days, hours, minutes, seconds } = getCountdownParts(capsule.unlockAt, now)
    const timerLabel = `${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds until open`

    return shell(
      <div className="mx-auto max-w-3xl px-6 pb-32 pt-16 text-center sm:pt-20">
        <div>
          <p className="font-tyme-sans text-[10px] font-semibold uppercase tracking-[0.42em] text-[#8B7D3A]">
            Time locked
          </p>
          <h1 className="mt-8 font-tyme-sans text-[clamp(3rem,14vw,8rem)] font-extrabold uppercase leading-[0.85] tracking-[-0.04em] text-[#33302E]">
            Not yet
          </h1>
        </div>
        <div
          className="open-mem-card open-mem-anim mx-auto mt-14 max-w-xl rounded-2xl border border-[#D8D3C9] p-10 shadow-[0_24px_56px_rgba(51,48,46,0.08)] backdrop-blur-sm"
          style={{ backgroundColor: L.metaPanel }}
        >
          <p className="open-mem-anim font-tyme-sans text-sm text-[#8B7D3A]">Opens in</p>
          <div
            className="open-mem-anim mt-6 grid w-full max-w-lg grid-cols-2 gap-6 sm:mx-auto sm:grid-cols-4 sm:gap-4"
            role="timer"
            aria-label={timerLabel}
          >
            <CountdownUnit value={days} label="Days" />
            <CountdownUnit value={hours} label="Hrs" />
            <CountdownUnit value={minutes} label="Min" />
            <CountdownUnit value={seconds} label="Sec" />
          </div>
          <div className="open-mem-line mx-auto mt-10 h-px w-full max-w-xs bg-gradient-to-r from-transparent via-[#8B7D3A]/35 to-transparent" />
          <p className="open-mem-anim mt-8 font-tyme-sans text-sm text-[#8B7D3A]">Unlocks on</p>
          <p className="open-mem-anim mt-3 font-tyme-head text-2xl font-semibold text-[#33302E] sm:text-3xl">
            {formatUnlock(capsule.unlockAt)}
          </p>
          <p className="open-mem-anim mt-8 font-tyme-sans text-sm leading-relaxed text-[#6B665F]">
            Bookmark this page and come back after the moment passes.
          </p>
        </div>
        <Link
          href="/"
          className="open-mem-anim mt-12 inline-block font-tyme-sans text-[10px] font-bold uppercase tracking-[0.22em] text-[#6B665F] transition hover:text-[#8B7D3A]"
        >
          ← Home
        </Link>
      </div>,
    )
  }

  if (capsule === null || capsule === 'bad') {
    return null
  }

  const mem = capsule

  const polaroid = mem.img ? (
    <div className="open-mem-img flex w-full max-w-[300px] justify-center lg:max-w-[320px] lg:justify-end">
      <div className="relative w-full rotate-[-2deg] drop-shadow-[0_28px_48px_rgba(0,0,0,0.55)] transition-transform hover:rotate-0">
        <div
          className="rounded-sm border border-[#CFC8BC] bg-[#f5f4eb] p-3 pb-10 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]"
          style={{
            boxShadow:
              'inset 0 1px 0 rgba(255,255,255,0.5), 0 2px 0 rgba(51,48,46,0.08), 0 12px 40px rgba(51,48,46,0.12)',
          }}
        >
          <div className="overflow-hidden rounded-[2px] border border-[#D8D3C9] bg-[#E9E7DE]/50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={mem.img}
              alt=""
              className="aspect-square w-full max-h-[min(42vh,300px)] object-cover sm:max-h-[min(48vh,340px)]"
            />
          </div>
          <div className="mt-5 flex justify-center" aria-hidden>
            <span className="h-1.5 w-1.5 rounded-full border border-[#8B7D3A]/35 bg-[#8B7D3A]/20" />
          </div>
        </div>
      </div>
    </div>
  ) : null

  async function handleDownloadMemoryPng() {
    const root = memoryExportRef.current
    if (!root || downloadBusy) return
    setDownloadBusy(true)
    try {
      const dataUrl = await toPng(root, {
        pixelRatio: 2,
        filter: (node) => {
          if (!(node instanceof HTMLElement)) return true
          return !node.classList.contains('open-mem-export-skip')
        },
      })
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `tyme-${memoryDownloadFilename(mem.title)}.png`
      a.click()
    } catch (err) {
      console.error('Download memory PNG failed:', err)
    } finally {
      setDownloadBusy(false)
    }
  }

  return shell(
    <div className="mx-auto max-w-6xl px-6 pb-32 pt-10 sm:pt-14">
      <div
        ref={memoryExportRef}
        className="rounded-[1.75rem] bg-gradient-to-b from-[#fdf5df] to-[#FFFDF5] p-6 shadow-[0_28px_64px_rgba(51,48,46,0.07)] sm:p-10 lg:p-14"
      >
      <article
        className="open-mem-card relative overflow-hidden rounded-2xl border border-[#D8D3C9] shadow-[0_24px_56px_rgba(51,48,46,0.08)] backdrop-blur-sm ring-1 ring-[#8B7D3A]/20"
        style={{ backgroundColor: L.cardTint }}
      >
        <div
          className="pointer-events-none absolute right-0 top-0 h-32 w-32 blur-3xl"
          style={{ backgroundColor: 'color-mix(in srgb, #FDC5A5 35%, transparent)' }}
          aria-hidden
        />

        <header className="open-mem-anim relative px-6 pb-10 pt-10 sm:px-10 sm:pb-12 sm:pt-12 lg:px-14">
          <div
            className="pointer-events-none absolute left-5 top-6 flex items-center gap-1.5 font-tyme-head text-[11px] sm:left-8"
            style={{ color: L.letterGold }}
            aria-hidden
          >
            <span>✦</span>
            <span className="opacity-50">·</span>
            <span className="opacity-50">·</span>
          </div>
          <div
            className="pointer-events-none absolute right-5 top-6 flex items-center gap-1.5 font-tyme-head text-[11px] sm:right-8"
            style={{ color: L.letterGold }}
            aria-hidden
          >
            <span>✦</span>
            <span className="opacity-50">·</span>
            <span className="opacity-50">·</span>
          </div>

          <div className="relative mx-auto flex max-w-md flex-col items-center text-center">
            <div
              className="flex h-[3.35rem] w-[3.35rem] items-center justify-center rounded-full font-tyme-head text-2xl font-semibold sm:h-[3.85rem] sm:w-[3.85rem] sm:text-[1.65rem]"
              style={{
                color: L.letterInk,
                backgroundColor: L.letterPaper,
                boxShadow: `0 0 0 1px ${L.charcoal}2e, 0 0 0 3px ${L.letterPaper}, 0 0 0 4px ${L.charcoal}24`,
              }}
            >
              T
            </div>
            <p
              className="mt-5 font-tyme-head text-[10px] font-medium uppercase tracking-[0.52em] sm:text-[11px]"
              style={{ color: L.letterMuted }}
            >
              Tyme Seal
            </p>
          </div>
        </header>

        <div className="px-8 pb-2 pt-0 sm:px-12 lg:px-14">
          <div className="open-mem-anim">
            <p className="font-tyme-sans text-[10px] font-semibold uppercase tracking-[0.42em] text-[#8B7D3A]">
              Your memory
            </p>

            {mem.img ? (
              <div className="mt-4 grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-14 lg:items-start">
                <div className="min-w-0">
                  <div className="min-w-0">
                    <h1 className="font-tyme-sans text-[clamp(2.5rem,8vw,4.5rem)] font-extrabold leading-[0.92] tracking-[-0.035em] text-[#33302E] lg:text-[clamp(2.75rem,5vw,4.25rem)]">
                      {mem.title}
                    </h1>
                  </div>
                  <div className="open-mem-prose mt-8 border-l-2 border-[#8B7D3A]/40 pl-6 sm:pl-8 lg:mt-10">
                    <div className="whitespace-pre-wrap font-tyme-sans text-lg leading-[1.75] text-[#6B665F] sm:text-xl">
                      {mem.message}
                    </div>
                  </div>
                </div>
                <div className="flex justify-center lg:sticky lg:top-28 lg:justify-end lg:self-start">{polaroid}</div>
              </div>
            ) : (
              <>
                <div className="mt-4">
                  <h1 className="font-tyme-sans text-[clamp(2.75rem,11vw,6.25rem)] font-extrabold leading-[0.92] tracking-[-0.035em] text-[#33302E]">
                    {mem.title}
                  </h1>
                </div>
                <div className="open-mem-prose mt-10 border-l-2 border-[#8B7D3A]/40 pl-6 sm:pl-8">
                  <div className="whitespace-pre-wrap font-tyme-sans text-lg leading-[1.75] text-[#6B665F] sm:text-xl">
                    {mem.message}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div
          className="pointer-events-none relative px-6 pb-10 pt-4 sm:px-10 sm:pb-12 lg:px-14"
          aria-hidden
        >
          <div
            className="absolute bottom-0 left-5 flex items-center gap-1.5 font-tyme-head text-[11px] sm:left-8"
            style={{ color: L.letterGold }}
          >
            <span>✦</span>
            <span className="opacity-50">·</span>
            <span className="opacity-50">·</span>
          </div>
          <div
            className="absolute bottom-0 right-5 flex items-center gap-1.5 font-tyme-head text-[11px] sm:right-8"
            style={{ color: L.letterGold }}
          >
            <span>✦</span>
            <span className="opacity-50">·</span>
            <span className="opacity-50">·</span>
          </div>
        </div>

        <div className="open-mem-export-skip open-mem-anim flex flex-col gap-4 px-8 pb-8 pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-6 sm:px-12 sm:pt-6 lg:px-14">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Link
              href="/tyme/seal"
              className="inline-flex justify-center rounded-xl bg-tyme-gold px-10 py-4 text-center text-[10px] font-bold uppercase tracking-[0.24em] text-tyme-ink shadow-[0_8px_24px_rgba(212,175,55,0.35)] transition hover:bg-tyme-gold-hover"
            >
              Seal another →
            </Link>
            <button
              type="button"
              onClick={() => void handleDownloadMemoryPng()}
              disabled={downloadBusy}
              className="inline-flex justify-center rounded-md border border-[#8B7D3A] bg-transparent px-8 py-3.5 font-tyme-sans text-[10px] font-bold uppercase tracking-[0.22em] text-[#8B7D3A] transition hover:bg-[#f5f3ef] disabled:cursor-wait disabled:opacity-60"
            >
              {downloadBusy ? 'Preparing…' : 'Download memory'}
            </button>
          </div>
          <Link
            href="/"
            className="text-center text-[10px] font-bold uppercase tracking-[0.22em] text-[#6B665F] transition hover:text-[#8B7D3A] sm:text-left"
          >
            Back home
          </Link>
        </div>
      </article>
      </div>
    </div>,
  )
}
