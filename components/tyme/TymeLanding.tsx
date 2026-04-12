'use client'

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import Link from 'next/link'
import { useEffect, useLayoutEffect, useRef, useSyncExternalStore } from 'react'
import { HomeEnvelopeCanvasLazy } from '@/components/home/HomeEnvelopeCanvasLazy'
import { TymeBackgroundArt } from './TymeBackgroundArt'

gsap.registerPlugin(ScrollTrigger)

const DUR = 1.55
const DUR_SLOW = 1.85
const easeOut = 'power2.out'
const easeSoft = 'power3.out'

const features = [
  {
    n: '01',
    title: 'ONE URL',
    body: 'Your entire memory compressed into a single link you own end to end.',
    active: true,
  },
  {
    n: '02',
    title: 'TIME LOCK',
    body: 'Set any date in the future. Opens only when the moment arrives.',
    active: false,
  },
  {
    n: '03',
    title: 'ZERO DATA',
    body: 'Nothing stored on servers. Everything lives in the link itself.',
    active: false,
  },
  {
    n: '04',
    title: 'ADD PHOTOS',
    body: 'Attach images to make your memories more vivid and personal.',
    active: false,
  },
] as const

/** Archive Vault–inspired landing palette */
const L = {
  charcoal: '#33302E',
  body: '#6B665F',
  olive: '#8B7D3A',
  border: '#D8D3C9',
  cardTint: 'color-mix(in srgb, #ffffff 88%, #FDC5A5 12%)',
} as const

const MOBILE_HERO_MQ = '(max-width: 639px)'

function subscribeMobileHero(cb: () => void) {
  const mq = window.matchMedia(MOBILE_HERO_MQ)
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}

function useIsMobileHeroEnvelope() {
  return useSyncExternalStore(
    subscribeMobileHero,
    () => window.matchMedia(MOBILE_HERO_MQ).matches,
    () => false,
  )
}

function TymeLogo({ className = '' }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-3 ${className}`} style={{ color: L.charcoal }}>
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold"
        style={{ borderColor: L.olive, color: L.olive }}
      >
        T
      </span>
      <span className="font-tyme-head text-lg font-semibold tracking-tight">Tyme</span>
    </Link>
  )
}

export function TymeLanding() {
  const rootRef = useRef<HTMLDivElement>(null)
  const isMobileHeroEnvelope = useIsMobileHeroEnvelope()

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.75,
      smoothWheel: true,
      wheelMultiplier: 0.82,
      touchMultiplier: 1.15,
    })

    lenis.on('scroll', ScrollTrigger.update)

    let rafId = 0
    function raf(time: number) {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }
    rafId = requestAnimationFrame(raf)

    const t = window.setTimeout(() => ScrollTrigger.refresh(), 200)

    return () => {
      cancelAnimationFrame(rafId)
      window.clearTimeout(t)
      lenis.destroy()
    }
  }, [])

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return

    const mm = gsap.matchMedia()

    const ctx = gsap.context(() => {
      gsap.from('.tyme-header-inner', {
        y: -28,
        opacity: 0,
        duration: 1.1,
        ease: easeSoft,
        onComplete: () => {
          /* Avoid leaving a composited transform layer on the bar — WebKit can drop custom cursors over it */
          gsap.set('.tyme-header-inner', { clearProps: 'transform' })
        },
      })

      gsap.from('.tyme-hero-title', {
        y: 56,
        opacity: 0,
        duration: DUR,
        ease: easeSoft,
        delay: 0.25,
      })

      gsap.to('.tyme-hero-title', {
        y: 16,
        x: 10,
        rotation: -0.9,
        duration: 3.1,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        delay: 1.05,
        overwrite: 'auto',
      })

      gsap.from('.tyme-hero-meta', {
        y: 56,
        opacity: 0,
        duration: DUR,
        ease: easeSoft,
        delay: 0.85,
      })

      gsap.from('.tyme-hero-dot', {
        scale: 0,
        opacity: 0,
        duration: 0.85,
        ease: 'back.out(2)',
        delay: 1.1,
      })

      gsap.from('.tyme-hero-envelope', {
        y: 56,
        opacity: 0,
        duration: DUR_SLOW,
        ease: easeSoft,
        delay: 0.4,
      })

      const featuresIntro = root.querySelector('.tyme-features-intro')
      if (featuresIntro) {
        gsap.from(featuresIntro, {
          scrollTrigger: {
            trigger: featuresIntro,
            start: 'top 84%',
            toggleActions: 'play none none none',
          },
          y: 120,
          opacity: 0,
          duration: DUR_SLOW,
          ease: easeOut,
        })

        gsap.from('.tyme-features-heading', {
          scrollTrigger: {
            trigger: featuresIntro,
            start: 'top 84%',
            toggleActions: 'play none none none',
          },
          y: 70,
          opacity: 0,
          duration: DUR,
          ease: easeSoft,
          delay: 0.05,
        })
      }

      mm.add('(max-width: 639px)', () => {
        const featuresFloat = root.querySelector('.tyme-features-heading-mobile-float')
        if (featuresFloat) {
          gsap.to(featuresFloat, {
            y: 16,
            x: 10,
            rotation: -0.9,
            duration: 3.1,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
            delay: 0.4,
            scrollTrigger: {
              trigger: featuresFloat,
              start: 'top 88%',
              toggleActions: 'play none none none',
            },
            overwrite: 'auto',
          })
        }
        const sealFloat = root.querySelector('.tyme-cta-seal-mobile-float')
        if (sealFloat) {
          gsap.to(sealFloat, {
            y: 16,
            x: 10,
            rotation: -0.9,
            duration: 3.1,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
            delay: 0.55,
            scrollTrigger: {
              trigger: '.tyme-section-cta',
              start: 'top 78%',
              toggleActions: 'play none none none',
            },
            overwrite: 'auto',
          })
        }
      })

      gsap.from('.tyme-feature-card', {
        scrollTrigger: {
          trigger: '.tyme-features-grid',
          start: 'top 78%',
          toggleActions: 'play none none none',
        },
        y: 100,
        opacity: 0,
        duration: DUR,
        stagger: 0.14,
        ease: easeOut,
      })

      gsap.from('.tyme-cta-line', {
        scrollTrigger: {
          trigger: '.tyme-section-cta',
          start: 'top 76%',
          toggleActions: 'play none none none',
        },
        y: 110,
        opacity: 0,
        duration: DUR_SLOW,
        stagger: 0.22,
        ease: easeOut,
      })

      gsap.from('.tyme-cta-btn', {
        scrollTrigger: {
          trigger: '.tyme-section-cta',
          start: 'top 62%',
          toggleActions: 'play none none none',
        },
        y: 56,
        opacity: 0,
        duration: DUR,
        delay: 0.2,
        ease: easeOut,
      })

      gsap.from('.tyme-footer-bar', {
        scrollTrigger: {
          trigger: '.tyme-footer-bar',
          start: 'top 95%',
          toggleActions: 'play none none none',
        },
        opacity: 0,
        y: 28,
        duration: 1.2,
        ease: easeOut,
      })

      gsap.to('.tyme-side-digits', {
        scrollTrigger: {
          trigger: root,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1.8,
        },
        y: 160,
        ease: 'none',
      })

      gsap.to('.tyme-features-parallax', {
        scrollTrigger: {
          trigger: '.tyme-section-features',
          start: 'top bottom',
          end: 'bottom top',
          scrub: 2,
        },
        y: -48,
        ease: 'none',
      })
    }, root)

    return () => {
      ctx.revert()
      mm.revert()
    }
  }, [])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const magnets = root.querySelectorAll<HTMLElement>('.tyme-cursor-magnet')
    const offs: Array<() => void> = []

    magnets.forEach(mag => {
      gsap.set(mag, { x: 0, y: 0, rotation: 0, transformOrigin: 'center center' })
      const xTo = gsap.quickTo(mag, 'x', { duration: 0.95, ease: 'power3.out' })
      const yTo = gsap.quickTo(mag, 'y', { duration: 0.95, ease: 'power3.out' })
      const rTo = gsap.quickTo(mag, 'rotation', { duration: 1.25, ease: 'power3.out' })

      const onMove = (e: MouseEvent) => {
        const r = mag.getBoundingClientRect()
        const cx = r.left + r.width / 2
        const cy = r.top + r.height / 2
        const strength = Number.parseFloat(mag.dataset.magnetStrength ?? '') || 0.045
        const rotStrength = Number.parseFloat(mag.dataset.magnetRotStrength ?? '') || 0.004
        const dx = (e.clientX - cx) * strength
        const dy = (e.clientY - cy) * strength
        const rot = (e.clientX - cx) * rotStrength
        xTo(dx)
        yTo(dy)
        rTo(rot)
      }
      const onLeave = () => {
        xTo(0)
        yTo(0)
        rTo(0)
      }

      window.addEventListener('mousemove', onMove, { passive: true })
      mag.addEventListener('mouseleave', onLeave)
      offs.push(() => {
        window.removeEventListener('mousemove', onMove)
        mag.removeEventListener('mouseleave', onLeave)
      })
    })

    return () => offs.forEach(o => o())
  }, [])

  return (
    <div
      ref={rootRef}
      className="relative bg-gradient-to-b from-[#fdf5df] to-[#FFFDF5] font-tyme-sans"
      style={{ color: L.charcoal }}
    >
      <TymeBackgroundArt variant="light" />

      <header
        className="fixed left-0 right-0 top-0 z-50 border-b bg-[#fdf5df] shadow-[0_1px_0_rgba(45,41,38,0.06)]"
        style={{ borderColor: `${L.border}99` }}
      >
        <div className="tyme-header-inner mx-auto flex max-w-[1600px] items-center justify-between gap-6 px-5 py-5 sm:px-10">
          <TymeLogo />
          <nav className="hidden items-center gap-10 font-tyme-sans text-[10px] font-semibold uppercase tracking-[0.28em] sm:flex" style={{ color: L.body }}>
            <Link href="#features" className="transition hover:text-[#8B7D3A]">
              Features
            </Link>
            <Link href="#how" className="transition hover:text-[#8B7D3A]">
              How it works
            </Link>
          </nav>
        </div>
      </header>

      <div
        className="tyme-side-digits pointer-events-none fixed right-6 top-1/3 z-40 hidden flex-col gap-1 font-tyme-sans text-[10px] font-medium tabular-nums text-[#8B7D3A]/45 lg:flex"
        aria-hidden
      >
        <span>1</span>
        <span>0</span>
        <span>0</span>
      </div>

      <main className="relative z-10">
        {/* Hero — flow layout: headline block, then meta panel (no absolute overlap) */}
        <section className="tyme-hero-section relative min-h-[100dvh] max-sm:overflow-x-hidden px-5 pb-14 pt-20 sm:px-10 sm:pb-32 sm:pt-36">
          <div className="relative mx-auto max-w-[1600px]">
            <div className="grid grid-cols-1 gap-2 sm:gap-12 lg:grid-cols-12 lg:items-stretch lg:gap-x-10 lg:gap-y-14 xl:gap-x-14">
              <div className="order-1 lg:col-span-5">
                <div className="tyme-hero-title relative max-w-[min(100%,18ch)] will-change-transform">
                  <div className="max-sm:translate-y-3 sm:translate-y-0">
                    <h1 className="m-0">
                      <span className="block font-tyme-sans text-[clamp(2.85rem,11vw,7rem)] font-extrabold leading-[0.96] tracking-[-0.03em] text-[#33302E] sm:text-[clamp(2.5rem,9vw,7rem)]">
                        Preserve your
                      </span>
                      <span className="mt-1 block font-tyme-sans text-[clamp(2.85rem,11vw,7rem)] font-extrabold italic leading-[0.96] tracking-[-0.03em] text-[#8B7D3A] sm:mt-2 sm:text-[clamp(2.5rem,9vw,7rem)]">
                        Memories.
                      </span>
                    </h1>
                  </div>
                </div>
              </div>

              <div className="tyme-hero-envelope order-2 flex w-full justify-center max-sm:-mt-2 max-sm:items-center max-sm:overflow-hidden sm:-translate-x-2 sm:-translate-y-2 sm:mt-0 sm:items-stretch lg:col-span-7 lg:row-span-2 lg:self-start lg:justify-end lg:-translate-x-6 lg:-translate-y-6 xl:-translate-x-10 xl:-translate-y-8 2xl:-translate-x-12">
                <div className="relative w-full max-sm:mx-auto max-sm:max-w-[min(100%,440px)] overflow-visible sm:max-w-[1200px] lg:max-w-none lg:w-[86vw] xl:w-[78vw]">
                  <div className="h-[min(50vh,420px)] w-full sm:h-[min(80vh,860px)] lg:h-[min(84vh,980px)]">
                    <HomeEnvelopeCanvasLazy
                      variant="home"
                      canvasTransparent
                      parallax
                      motionScale={isMobileHeroEnvelope ? 0.26 : 0.28}
                      showStamp
                      envelopeScale={isMobileHeroEnvelope ? 1.58 : 1.95}
                      cameraPosition={
                        isMobileHeroEnvelope ? [-0.42, 0.12, 7.45] : [0, 0.1, 6.75]
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="order-3 max-sm:-mt-3 sm:mt-0 lg:col-span-5">
                <div
                  className="tyme-hero-meta mt-0 max-w-lg rounded-2xl border-0 px-6 py-6 shadow-[0_24px_56px_rgba(51,48,46,0.08)] backdrop-blur-sm sm:p-10 lg:mt-4"
                  style={{
                    backgroundColor: 'color-mix(in srgb, #FEF6F0 72%, #ffffff 28%)',
                  }}
                >
                  <p className="font-tyme-sans text-[10px] font-semibold uppercase tracking-[0.38em] text-[#8B7D3A]">
                    Start now
                  </p>
                  <p className="mt-4 font-tyme-sans text-base leading-relaxed text-[#6B665F] sm:mt-5 sm:text-lg">
                    Create a time-locked memory in one link. No accounts. No servers.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3 sm:mt-8">
                    <Link
                      href="/tyme/seal"
                      className="group inline-flex rounded-xl bg-tyme-gold px-10 py-4 font-tyme-sans text-[10px] font-bold uppercase tracking-[0.28em] text-tyme-ink shadow-[0_8px_24px_rgba(212,175,55,0.35)] transition duration-300 ease-out hover:-translate-y-1 hover:scale-[1.03] hover:bg-tyme-gold-hover hover:shadow-[0_14px_36px_rgba(212,175,55,0.45)] active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7D3A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFFDF5]"
                    >
                      <span className="transition-transform duration-300 ease-out group-hover:translate-x-0.5">
                        Seal a memory →
                      </span>
                    </Link>
                    <Link
                      href="#features"
                      className="inline-flex rounded-xl border border-[#CFC8BC] bg-[#E9E7DE]/70 px-8 py-4 font-tyme-sans text-[10px] font-bold uppercase tracking-[0.24em] text-[#33302E] shadow-[0_4px_16px_rgba(51,48,46,0.06)] transition duration-300 ease-out hover:-translate-y-1 hover:scale-[1.03] hover:border-[#8B7D3A]/55 hover:bg-[#E9E7DE] hover:shadow-[0_12px_28px_rgba(51,48,46,0.12)] active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7D3A]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFFDF5]"
                    >
                      Learn more
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="features"
          className="tyme-section-features scroll-mt-24 px-5 py-28 sm:px-10 sm:py-36"
        >
          <div className="tyme-features-intro mx-auto max-w-[1600px]">
            <p className="tyme-st-features-label font-tyme-sans text-[10px] font-semibold uppercase tracking-[0.38em] text-[#8B7D3A]">
              Features
            </p>

            <div className="tyme-features-parallax mt-12 flex flex-col gap-14 will-change-transform lg:flex-row lg:items-start lg:justify-between lg:gap-24">
              <div
                className="tyme-features-heading tyme-cursor-magnet max-w-5xl will-change-transform"
                data-magnet-strength="0.032"
                data-magnet-rot-strength="0.002"
              >
                <div className="tyme-features-heading-mobile-float will-change-transform">
                  <span className="tyme-st-features-head block font-tyme-sans text-[clamp(2.85rem,11vw,7rem)] font-extrabold leading-[0.96] tracking-[-0.03em] text-[#33302E] sm:text-[clamp(2.5rem,9vw,7rem)]">
                    Built for
                  </span>
                  <span className="tyme-st-features-head mt-1 block font-tyme-sans text-[clamp(2.85rem,11vw,7rem)] font-extrabold italic leading-[0.96] tracking-[-0.03em] text-[#8B7D3A] sm:mt-2 sm:text-[clamp(2.5rem,9vw,7rem)]">
                    Simplicity
                  </span>
                </div>
              </div>
              <p className="tyme-st-features-aside max-w-sm font-tyme-sans text-base leading-relaxed text-[#6B665F] lg:pt-6">
                No complexity. No learning curve. Just the essentials to preserve what matters.
              </p>
            </div>
          </div>

          <div className="mx-auto max-w-[1600px]">
            <div
              id="how"
              className="tyme-features-grid mt-20 grid gap-4 sm:grid-cols-2 lg:mt-24 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-[#D5CFC3]"
            >
              {features.map(f => (
                <article
                  key={f.n}
                  className={`tyme-feature-card flex min-h-0 flex-col rounded-2xl border px-6 py-5 sm:min-h-[320px] sm:p-7 lg:rounded-none lg:border-0 lg:p-9 ${
                    f.active
                      ? 'border-[#D8D3C9] text-[#33302E] ring-1 ring-[#8B7D3A]/35 lg:ring-[#D8D3C9]/80'
                      : 'border-[#D5CFC3] bg-[#E9E7DE]/35'
                  }`}
                  style={f.active ? { backgroundColor: L.cardTint } : undefined}
                >
                  <span
                    className={`font-tyme-sans text-base font-extrabold ${f.active ? 'text-[#8B7D3A]' : 'text-[#6B665F]'}`}
                  >
                    {f.n}
                  </span>
                  <h3 className="mt-5 font-tyme-sans text-2xl font-extrabold uppercase tracking-wide text-[#33302E] sm:mt-8 sm:text-3xl">
                    {f.title}
                  </h3>
                  <p className="mt-4 font-tyme-sans text-base leading-relaxed text-[#6B665F] sm:mt-5">{f.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="tyme-section-cta relative px-5 py-32 text-[#33302E] sm:px-10 sm:py-40">
          <div className="pointer-events-none absolute right-8 top-10 hidden sm:block" aria-hidden>
            <span
              className="inline-flex h-8 w-8 items-center justify-center font-tyme-sans text-lg leading-none text-white"
              style={{ backgroundColor: L.olive }}
            >
              ✦
            </span>
          </div>

          <div className="mx-auto max-w-[1600px] text-center">
            <p className="tyme-cta-line font-tyme-sans text-[10px] font-semibold uppercase tracking-[0.48em] text-[#8B7D3A]">
              Start now
            </p>
            <div className="tyme-cta-line mt-12 font-tyme-head text-[clamp(2.65rem,9vw,4.5rem)] italic leading-tight text-[#33302E] sm:text-[clamp(2.25rem,7vw,4.5rem)]">
              Ready to
            </div>
            <div className="tyme-cursor-magnet tyme-cta-line mt-4 inline-block will-change-transform">
              <span className="tyme-cta-seal-mobile-float inline-block will-change-transform font-tyme-head text-[clamp(4.45rem,21vw,13rem)] font-semibold not-italic uppercase leading-[0.82] tracking-[0.02em] sm:text-[clamp(4rem,18vw,13rem)]">
                <span className="tyme-outline-olive-display" aria-label="Seal?">
                  Seal?
                </span>
              </span>
            </div>

            <Link
              href="/tyme/seal"
              className="tyme-cta-btn group mt-16 inline-flex rounded-xl bg-tyme-gold px-10 py-4 font-tyme-sans text-[10px] font-bold uppercase tracking-[0.28em] text-tyme-ink shadow-[0_8px_24px_rgba(212,175,55,0.35)] transition duration-300 ease-out hover:-translate-y-1 hover:scale-[1.03] hover:bg-tyme-gold-hover hover:shadow-[0_14px_36px_rgba(212,175,55,0.45)] active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7D3A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFFDF5]"
            >
              <span className="transition-transform duration-300 ease-out group-hover:translate-x-0.5">
                Create your first memory →
              </span>
            </Link>
          </div>

          <div
            className="tyme-footer-bar mx-auto mt-28 flex max-w-[1600px] flex-col gap-4 border-t pt-10 font-tyme-sans text-[10px] uppercase tracking-[0.22em] text-[#6B665F] sm:flex-row sm:items-center sm:justify-between"
            style={{ borderColor: `${L.border}b3` }}
          >
            <span>E © {new Date().getFullYear()}</span>
            <span>Time-locked memories</span>
          </div>
        </section>
      </main>
    </div>
  )
}
