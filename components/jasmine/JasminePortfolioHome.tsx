'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useNYClock } from '@/lib/useNYClock'

const nav = [
  { href: '#', label: 'Home' },
  { href: '#works', label: 'Works' },
  { href: '#break', label: 'Break' },
  { href: '#about', label: 'About' },
] as const

const featured = [
  {
    n: '01',
    title: 'Home in a Hot Pot',
    tags: ['Concept', 'Design', 'Motion'],
  },
  {
    n: '02',
    title: 'FLOW',
    tags: ['Art Direction', 'Concept', 'Design'],
  },
  {
    n: '03',
    title: "PreCollege '25",
    tags: ['Concept', 'Design', 'Motion'],
  },
  {
    n: '04',
    title: 'The Taste Gap',
    tags: ['Concept', 'Design', 'Motion'],
  },
] as const

const breaks = [
  { n: '01', title: 'Avant-Garde 2025' },
  { n: '02', title: 'Pea' },
  { n: '03', title: 'Graff Mayhem' },
  { n: '04', title: 'Future Proof' },
  { n: '05', title: 'Xenoflora' },
] as const

export function JasminePortfolioHome() {
  const ny = useNYClock()
  const [preloader, setPreloader] = useState(true)

  useEffect(() => {
    const t = window.setTimeout(() => setPreloader(false), 1400)
    return () => window.clearTimeout(t)
  }, [])

  return (
    <div className="jg-root min-h-screen bg-[#090909] text-[#ebeae4]">
      {/* Preloader — digit counter feel (simplified from original) */}
      <div
        className={[
          'fixed inset-0 z-[100] flex items-center justify-center bg-[#090909] transition-opacity duration-500',
          preloader ? 'opacity-100' : 'pointer-events-none opacity-0',
        ].join(' ')}
        aria-hidden={!preloader}
      >
        <div className="flex gap-3 font-[family-name:var(--font-jasmine-display)] text-4xl font-bold tabular-nums sm:text-5xl">
          <span className="jg-digit">0</span>
          <span className="jg-digit jg-digit--delay">1</span>
          <span className="jg-digit jg-digit--delay2">1</span>
        </div>
      </div>

      <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/[0.06] bg-[#090909]">
        <div className="mx-auto flex max-w-[1920px] flex-wrap items-center justify-between gap-4 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] sm:px-8 sm:py-4 sm:text-[11px]">
          <div className="order-1 flex flex-wrap gap-x-6 gap-y-1 text-white/55">
            <span>New York, US</span>
            <span className="tabular-nums text-white/70">{ny || '—'}</span>
            <span className="hidden text-white/45 sm:inline">36.7783° N, 119.4179°</span>
          </div>
          <nav className="order-3 flex w-full justify-center gap-6 sm:order-2 sm:w-auto sm:justify-end sm:gap-10">
            {nav.map(item => (
              <Link
                key={item.label}
                href={item.href}
                className="text-white/80 transition hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative min-h-[100dvh] pt-24 sm:pt-28">
          <div className="mx-auto grid max-w-[1920px] gap-6 px-4 pb-16 sm:grid-cols-12 sm:gap-0 sm:px-8 lg:px-12">
            <div className="sm:col-span-12">
              <h1 className="font-[family-name:var(--font-jasmine-display)] text-[clamp(2.5rem,12vw,8rem)] font-bold leading-[0.92] tracking-[-0.02em]">
                Jasmine Gunarto
              </h1>
            </div>

            <div className="relative aspect-video w-full overflow-hidden bg-[#141414] sm:col-span-10 sm:col-start-2 lg:col-span-8 lg:col-start-3">
              <div className="absolute inset-0 bg-gradient-to-br from-[#2a1810] via-[#090909] to-[#1a1520]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-center text-[10px] font-semibold uppercase tracking-[0.35em] text-white/35">
                  Motion reel placeholder
                  <br />
                  <span className="mt-2 inline-block text-white/25">(add your video)</span>
                </p>
              </div>
              <div className="pointer-events-none absolute left-0 right-0 top-0 flex justify-between px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.28em] text-white/50">
                <span>MOTION DESIGN</span>
                <span>2026</span>
              </div>
            </div>

            <div className="flex flex-col justify-between gap-4 sm:col-span-12 sm:flex-row sm:items-end sm:px-4 lg:px-8">
              <div className="font-[family-name:var(--font-jasmine-display)] text-[clamp(1.75rem,5vw,3.5rem)] font-bold leading-none tracking-[-0.02em]">
                <div>A visual</div>
              </div>
              <div className="font-[family-name:var(--font-jasmine-display)] text-[clamp(1.75rem,5vw,3.5rem)] font-bold leading-none tracking-[-0.02em] sm:text-right">
                <div>Designer</div>
              </div>
            </div>

            <div className="sm:col-span-12 sm:flex sm:justify-center">
              <div className="text-[10px] font-semibold uppercase tracking-[0.4em] text-white/40">scroll down</div>
            </div>
          </div>
        </section>

        {/* Intro typography block */}
        <section id="about" className="border-t border-white/[0.06] py-20 sm:py-28">
          <div className="mx-auto max-w-[1920px] px-4 sm:px-8 lg:px-12">
            <h2 className="max-w-6xl font-[family-name:var(--font-jasmine-display)] text-[clamp(1.5rem,4.5vw,3.25rem)] font-bold leading-[1.08] tracking-[-0.02em]">
              <span className="block text-white/55">
                Purposeful
                <br />
                design
              </span>
              <span className="mt-4 block text-white">
                Creating <span className="text-white/90">motion</span>
              </span>
              <span className="mt-2 block text-sm font-normal uppercase tracking-[0.25em] text-white/45 sm:text-base">
                Narrative through animation
              </span>
              <span className="mt-6 block text-white">With meaning</span>
            </h2>
          </div>
        </section>

        {/* Featured works */}
        <section id="works" className="border-t border-white/[0.06] py-20 sm:py-28">
          <div className="mx-auto max-w-[1920px] px-4 sm:px-8 lg:px-12">
            <div className="mb-16 max-w-xl">
              <p className="font-[family-name:var(--font-jasmine-display)] text-3xl font-bold uppercase tracking-[0.08em] sm:text-4xl">
                Featured works
              </p>
              <div className="mt-6 h-px w-24 bg-white/20" />
              <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/45">
                Design insights
              </p>
              <div className="mt-4 flex flex-wrap gap-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">
                <span>Conceptual</span>
                <span>Expressive</span>
                <span>Immersive</span>
              </div>
            </div>

            <div className="grid gap-12 sm:gap-16 lg:gap-24">
              {featured.map(work => (
                <Link
                  key={work.n}
                  href="#"
                  className="group block border-b border-white/[0.08] pb-12 last:border-0 sm:pb-16"
                >
                  <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
                    <div className="aspect-[16/10] overflow-hidden bg-[#141414] lg:col-span-7">
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-white/[0.04] to-transparent transition group-hover:from-white/[0.07]">
                        <span className="text-[10px] uppercase tracking-[0.35em] text-white/25">Frame</span>
                      </div>
                    </div>
                    <div className="flex flex-col justify-end lg:col-span-5">
                      <span className="font-[family-name:var(--font-jasmine-display)] text-sm font-bold text-white/35">
                        {work.n}
                      </span>
                      <h3 className="mt-2 font-[family-name:var(--font-jasmine-display)] text-3xl font-bold tracking-tight sm:text-4xl">
                        {work.title}
                      </h3>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {work.tags.map(tag => (
                          <span
                            key={tag}
                            className="border border-white/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/55"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-16">
              <Link
                href="#works"
                className="inline-flex border border-white/30 px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-white transition hover:bg-white hover:text-[#090909]"
              >
                See all work
              </Link>
            </div>
          </div>
        </section>

        {/* Break */}
        <section id="break" className="border-t border-white/[0.06] bg-[#0c0c0c] py-20 sm:py-28">
          <div className="mx-auto max-w-[1920px] px-4 sm:px-8 lg:px-12">
            <div className="overflow-hidden">
              <div className="jg-marquee-row flex w-max">
                <p
                  className="pr-12 font-[family-name:var(--font-jasmine-display)] text-[clamp(3rem,15vw,10rem)] font-bold uppercase leading-none tracking-tight text-white/[0.07]"
                  aria-hidden
                >
                  Break · Break · Break · Break ·
                </p>
                <p
                  className="pr-12 font-[family-name:var(--font-jasmine-display)] text-[clamp(3rem,15vw,10rem)] font-bold uppercase leading-none tracking-tight text-white/[0.07]"
                  aria-hidden
                >
                  Break · Break · Break · Break ·
                </p>
              </div>
            </div>
            <div className="mt-10 max-w-xl">
              <div className="h-px w-24 bg-white/20" />
              <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/45">
                Short, experimental designs
              </p>
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-white/35">
                Small scale visual
              </p>
            </div>

            <ul className="mt-16 space-y-6">
              {breaks.map(b => (
                <li key={b.n}>
                  <Link href="#" className="group flex items-baseline gap-6 border-b border-white/[0.06] pb-6 transition hover:border-white/20">
                    <span className="font-[family-name:var(--font-jasmine-display)] text-sm text-white/35">{b.n}</span>
                    <span className="font-[family-name:var(--font-jasmine-display)] text-2xl font-bold sm:text-3xl">
                      {b.title}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-12">
              <Link
                href="#break"
                className="inline-flex border border-white/30 px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-white transition hover:bg-white hover:text-[#090909]"
              >
                See all work
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-black/20 bg-[#341c09] px-4 py-16 text-[#ebeae4] sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1920px]">
          <div className="flex flex-col gap-4 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#ebeae4]/55 sm:flex-row sm:justify-between">
            <span>(Follow)</span>
            <span>(Navigation)</span>
          </div>
          <div className="mt-4 h-px bg-[#ebeae4]/15" />

          <div className="mt-10 grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col gap-3">
              <a href="#" className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#ebeae4]/80 hover:text-white">
                Instagram
              </a>
              <a href="#" className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#ebeae4]/80 hover:text-white">
                LinkedIn
              </a>
              <a href="#" className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#ebeae4]/80 hover:text-white">
                Behance
              </a>
              <a href="#" className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#ebeae4]/80 hover:text-white">
                Email
              </a>
            </div>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                className="w-fit text-left text-[11px] font-semibold uppercase tracking-[0.22em] text-[#ebeae4]/80 hover:text-white"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                Back to top
              </button>
            </div>
            <nav className="flex flex-col gap-3">
              {nav.map(item => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#ebeae4]/80 hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="mt-16 overflow-hidden border-t border-[#ebeae4]/10 pt-10">
            <div className="jg-footer-marquee flex whitespace-nowrap">
              <span className="inline-block pr-16 font-[family-name:var(--font-jasmine-display)] text-[clamp(2.5rem,12vw,6rem)] font-bold uppercase tracking-tight text-[#ebeae4]/90">
                Let&apos;s talk · Let&apos;s talk · Let&apos;s talk · Let&apos;s talk ·
              </span>
              <span className="inline-block pr-16 font-[family-name:var(--font-jasmine-display)] text-[clamp(2.5rem,12vw,6rem)] font-bold uppercase tracking-tight text-[#ebeae4]/90">
                Let&apos;s talk · Let&apos;s talk · Let&apos;s talk · Let&apos;s talk ·
              </span>
            </div>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-between gap-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#ebeae4]/45">
            <span>New York, US</span>
            <span className="tabular-nums">{ny}</span>
            <span>36.7783° N, 119.4179°</span>
          </div>
          <p className="mt-6 text-[10px] uppercase tracking-[0.2em] text-[#ebeae4]/35">
            © 2026 · All rights reserved
          </p>
          <p className="mt-4 max-w-2xl text-[10px] leading-relaxed text-[#ebeae4]/30">
            Recreation of the public layout rhythm of jasminegunarto.com for local development — custom MG fonts, page
            transitions, and media are not included. Replace placeholders with your own assets.
          </p>
        </div>
      </footer>
    </div>
  )
}
