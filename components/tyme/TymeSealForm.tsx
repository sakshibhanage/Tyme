'use client'

import gsap from 'gsap'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { imageFileToDataUrl } from '@/lib/compress-image'
import { clampUnlockMsToScheduleLimit } from '@/lib/tyme-schedule-limit'
import { encodeCapsule } from '@/lib/payload'
import { TymeBackgroundArt } from './TymeBackgroundArt'

const STEP_LABELS = ['Write', 'Lock', 'Done'] as const

const STEP_META = [
  'Step 01 of 03 — Write',
  'Step 02 of 03 — Lock',
  'Step 03 of 03 — Sealed',
] as const

/** Seal page: letter stationery + vault accents; page gradient unchanged */
const V = {
  charcoal: '#33302E',
  body: '#6B665F',
  olive: '#8B7D3A',
  letterPaper: '#fdfaf5',
  letterInk: '#2d2926',
  letterMuted: '#6b6560',
  letterRule: '#e0ddd6',
  letterGold: '#c4a44d',
  letterField: '#f5f3ef',
  sand: '#E9E7DE',
  peachTint: '#FEF6F0',
  border: '#D8D3C9',
  borderSoft: '#E5E1D8',
  inputBorder: '#CFC8BC',
  errorBg: '#FDECE5',
  errorBorder: '#D4A089',
  errorText: '#5E3023',
} as const

function TymeLogo() {
  return (
    <Link href="/" className="flex items-center gap-3" style={{ color: V.charcoal }}>
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold"
        style={{ borderColor: V.olive, color: V.olive }}
      >
        T
      </span>
      <span className="font-tyme-head text-lg font-semibold tracking-tight">Tyme</span>
    </Link>
  )
}

export function TymeSealForm() {
  const router = useRouter()
  const rootRef = useRef<HTMLDivElement>(null)
  const [step, setStep] = useState(1)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [lockMode, setLockMode] = useState<'anytime' | 'scheduled'>('anytime')
  const [unlockLocal, setUnlockLocal] = useState('')
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null)
  const [imageBusy, setImageBusy] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  /** Unlock timestamp encoded in the link (0 = open anytime). Passed to the invite API for time-locked copy. */
  const [sealUnlockMs, setSealUnlockMs] = useState(0)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteSending, setInviteSending] = useState(false)
  const [inviteSent, setInviteSent] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [homeLeaveConfirmOpen, setHomeLeaveConfirmOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!homeLeaveConfirmOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setHomeLeaveConfirmOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [homeLeaveConfirmOpen])

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    const ease = 'power3.out'
    const ctx = gsap.context(() => {
      gsap.from('header.tyme-seal-head', { y: -24, opacity: 0, duration: 0.85, ease })
      gsap.from('.tyme-seal-panel', { y: 48, opacity: 0, duration: 0.9, ease, delay: 0.2 })
    }, root)
    return () => ctx.revert()
  }, [])

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    const ease = 'power3.out'
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.tyme-seal-step-animate',
        { y: 28, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.55, ease, stagger: 0.06 },
      )
    }, root)
    return () => ctx.revert()
  }, [step])

  function goBack() {
    setFormError(null)
    if (step <= 1) return
    if (step === 3) {
      setShareUrl(null)
      setInviteEmail('')
      setInviteSent(false)
      setInviteError(null)
      setStep(2)
      return
    }
    setStep(s => Math.max(1, s - 1))
  }

  function handleStep1Continue(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    const t = title.trim()
    const m = message.trim()
    if (!t || !m) {
      setFormError('Add a title and a message to continue.')
      return
    }
    setStep(2)
  }

  function handleStep2Continue(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    let unlockMs = 0
    if (lockMode === 'scheduled') {
      if (!unlockLocal) {
        setFormError('Choose a date and time for the unlock, or switch to “Open anytime”.')
        return
      }
      unlockMs = new Date(unlockLocal).getTime()
      if (!Number.isFinite(unlockMs)) {
        setFormError('That date is not valid.')
        return
      }
      const now = Date.now()
      if (unlockMs <= now) {
        setFormError('Unlock must be in the future.')
        return
      }
      unlockMs = clampUnlockMsToScheduleLimit(unlockMs, now)
    }

    const res = encodeCapsule(title.trim(), message.trim(), imageDataUrl, unlockMs)
    if (!res.ok) {
      setFormError(res.error)
      return
    }
    const envOrigin = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, '') ?? ''
    const origin =
      typeof window !== 'undefined' ? (envOrigin || window.location.origin) : envOrigin
    setSealUnlockMs(unlockMs)
    setShareUrl(`${origin}/open#c=${encodeURIComponent(res.encoded)}`)
    setStep(3)
  }

  async function sendInviteEmail() {
    if (!shareUrl) return
    const to = inviteEmail.trim()
    if (!to) {
      setInviteError('Enter the recipient’s email address.')
      return
    }
    setInviteError(null)
    setInviteSending(true)
    try {
      const scheduledAt =
        lockMode === 'scheduled' && sealUnlockMs > 0
          ? new Date(sealUnlockMs).toISOString()
          : undefined

      const res = await fetch('/api/send-sealed-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,
          shareUrl,
          ...(scheduledAt ? { scheduledAt } : {}),
        }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        setInviteError(data.error || 'Could not send the email.')
        return
      }
      setInviteSent(true)
    } catch {
      setInviteError('Network error — try again.')
    } finally {
      setInviteSending(false)
    }
  }

  async function onImageFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setFormError(null)
    setImageBusy(true)
    const result = await imageFileToDataUrl(file)
    setImageBusy(false)
    if ('error' in result) {
      setFormError(result.error)
      return
    }
    setImageDataUrl(result.dataUrl)
  }

  function startOver() {
    setStep(1)
    setTitle('')
    setMessage('')
    setImageDataUrl(null)
    setLockMode('anytime')
    setUnlockLocal('')
    setShareUrl(null)
    setSealUnlockMs(0)
    setFormError(null)
    setInviteEmail('')
    setInviteSending(false)
    setInviteSent(false)
    setInviteError(null)
  }

  const steps = ['01', '02', '03'] as const

  return (
    <div
      ref={rootRef}
      className="relative min-h-screen bg-gradient-to-b from-[#fdf5df] to-[#FFFDF5] font-tyme-sans"
      style={{ color: V.charcoal }}
    >
      <TymeBackgroundArt variant="light" />

      <header
        className="tyme-seal-head relative z-10 border-b bg-[#fdf5df] px-5 py-5 shadow-[0_1px_0_rgba(45,41,38,0.06)] sm:px-10 sm:py-6"
        style={{ borderColor: `${V.border}99` }}
      >
        <div className="mx-auto flex max-w-[1100px] items-center">
          <TymeLogo />
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-[900px] px-5 pt-6 pb-10 sm:px-10 sm:pt-8 sm:pb-14">
        {/* Progress stepper — on page, outside the letter */}
        <nav className="mb-8 sm:mb-10" aria-label="Seal steps">
          <div className="flex w-full flex-wrap items-center justify-center gap-y-3 sm:flex-nowrap">
            {steps.map((s, i) => {
              const n = i + 1
              const active = step === n
              const done = step > n
              return (
                <div key={s} className="flex items-center">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-tyme-head text-[11px] font-bold tabular-nums sm:h-12 sm:w-12 sm:text-xs ${
                        active ? 'shadow-sm' : ''
                      }`}
                    style={
                      active
                        ? { backgroundColor: V.letterGold, color: V.letterInk }
                        : {
                            borderWidth: 1,
                            borderStyle: 'solid',
                            borderColor: done ? `${V.letterGold}99` : `${V.letterRule}`,
                            color: V.letterMuted,
                            backgroundColor: done ? `${V.letterGold}18` : V.letterPaper,
                          }
                    }
                    aria-current={active ? 'step' : undefined}
                  >
                    {s}
                  </div>
                  {i < steps.length - 1 ? (
                    <div
                      className="mx-2 h-px w-5 sm:mx-3 sm:w-10"
                      style={{ backgroundColor: done ? `${V.letterGold}55` : V.letterRule }}
                      aria-hidden
                    />
                  ) : null}
                </div>
              )
            })}
          </div>
          <p
            className="tyme-seal-step-meta mt-5 text-center font-tyme-sans text-[10px] font-semibold uppercase tracking-[0.36em]"
            style={{ color: V.letterGold }}
          >
            {STEP_META[step - 1]}
          </p>
        </nav>

        <div className="relative">
          {step > 1 ? (
            <button
              type="button"
              onClick={goBack}
              aria-label="Back"
              className="group mb-5 flex min-h-10 items-center rounded-sm text-[#33302E] transition-colors duration-300 ease-out hover:text-[#B08D57] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c4a44d]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fdf5df] sm:absolute sm:mb-0 sm:right-full sm:top-[2.65rem] sm:mr-10 sm:min-h-0 sm:py-1 sm:pl-0 sm:pr-1"
            >
              <span className="inline-flex items-center gap-2 transition-transform duration-300 ease-out group-hover:-translate-x-1.5">
                <svg
                  className="h-[11px] w-[7px] shrink-0 sm:h-[13px] sm:w-2"
                  viewBox="0 0 8 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden
                >
                  <path
                    d="M6 1 1 7l5 6"
                    stroke="currentColor"
                    strokeWidth="1.25"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="font-tyme-sans text-[10px] font-bold uppercase tracking-[0.26em]">Back</span>
              </span>
            </button>
          ) : null}
          <div
            className="tyme-seal-panel relative overflow-hidden rounded-lg border shadow-[0_4px_48px_rgba(45,41,38,0.07)] sm:rounded-xl"
            style={{
              borderColor: V.letterRule,
              backgroundColor: V.letterPaper,
            }}
          >
          <header className="relative px-6 pb-10 pt-10 sm:px-10 sm:pb-12 sm:pt-12">
            <div
              className="pointer-events-none absolute left-5 top-6 flex items-center gap-1.5 font-tyme-head text-[11px] sm:left-8"
              style={{ color: V.letterGold }}
              aria-hidden
            >
              <span>✦</span>
              <span className="opacity-50">·</span>
              <span className="opacity-50">·</span>
            </div>
            <div
              className="pointer-events-none absolute right-5 top-6 flex items-center gap-1.5 font-tyme-head text-[11px] sm:right-8"
              style={{ color: V.letterGold }}
              aria-hidden
            >
              <span>✦</span>
              <span className="opacity-50">·</span>
              <span className="opacity-50">·</span>
            </div>

            <div className="relative mx-auto flex max-w-md flex-col items-center text-center">
              {/* Double-ring emblem (thin outer + inner ring) */}
              <div
                className="flex h-[3.35rem] w-[3.35rem] items-center justify-center rounded-full font-tyme-head text-2xl font-semibold sm:h-[3.85rem] sm:w-[3.85rem] sm:text-[1.65rem]"
                style={{
                  color: V.letterInk,
                  backgroundColor: V.letterPaper,
                  boxShadow: `0 0 0 1px ${V.letterInk}2e, 0 0 0 3px ${V.letterPaper}, 0 0 0 4px ${V.letterInk}24`,
                }}
              >
                T
              </div>
              <p
                className="mt-5 font-tyme-head text-[10px] font-medium uppercase tracking-[0.52em] sm:text-[11px]"
                style={{ color: V.letterMuted }}
              >
                Tyme Seal
              </p>
            </div>
          </header>

          <div className="px-6 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-12">

          {formError ? (
            <p
              className="tyme-seal-step-animate mt-0 rounded-md border px-4 py-3 text-sm font-tyme-sans"
              style={{
                borderColor: V.errorBorder,
                backgroundColor: V.errorBg,
                color: V.errorText,
              }}
              role="alert"
            >
              {formError}
            </p>
          ) : null}

          {/* Step 1 — Write */}
          {step === 1 ? (
            <div key="s1" className="tyme-seal-step-animate">
              <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-14 lg:items-start">
                <form id="tyme-seal-step1" className="min-w-0 space-y-10" onSubmit={handleStep1Continue}>
                  <div>
                    <label
                      htmlFor="mem-title"
                      className="font-tyme-sans text-[10px] font-semibold uppercase tracking-[0.32em]"
                      style={{ color: V.letterGold }}
                    >
                      Title
                    </label>
                    <input
                      id="mem-title"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      autoComplete="off"
                      placeholder="For them on graduation day"
                      className="mt-2 w-full border-0 border-b bg-transparent py-2 font-tyme-sans text-sm font-normal leading-normal outline-none transition-colors placeholder:font-normal placeholder:text-sm placeholder:italic placeholder:text-[#9a958d] placeholder:leading-normal sm:text-base sm:placeholder:text-base"
                      style={{
                        borderBottomColor: V.letterRule,
                        color: V.letterInk,
                      }}
                      onFocus={e => {
                        e.target.style.borderBottomColor = V.letterGold
                      }}
                      onBlur={e => {
                        e.target.style.borderBottomColor = V.letterRule
                      }}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="mem-body"
                      className="font-tyme-sans text-[10px] font-semibold uppercase tracking-[0.32em]"
                      style={{ color: V.letterGold }}
                    >
                      Your message
                    </label>
                    <textarea
                      id="mem-body"
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      rows={8}
                      placeholder="The note you want tucked inside the link…"
                      className="mt-2 w-full resize-y border-0 border-b bg-transparent py-2 font-tyme-sans text-sm font-normal leading-normal outline-none transition-colors placeholder:font-normal placeholder:text-sm placeholder:italic placeholder:text-[#9a958d] placeholder:leading-normal sm:text-base sm:placeholder:text-base"
                      style={{
                        borderBottomColor: V.letterRule,
                        color: V.letterInk,
                        minHeight: '12rem',
                      }}
                      onFocus={e => {
                        e.target.style.borderBottomColor = V.letterGold
                      }}
                      onBlur={e => {
                        e.target.style.borderBottomColor = V.letterRule
                      }}
                    />
                  </div>
                </form>

                <aside className="flex flex-col items-center lg:items-center lg:pt-2">
                  <p
                    className="mb-4 w-full font-tyme-sans text-[10px] font-semibold uppercase tracking-[0.32em] lg:text-center"
                    style={{ color: V.letterGold }}
                  >
                    Photo (optional)
                  </p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    onChange={onImageFileChange}
                    aria-label="Upload a photo for this memory"
                  />

                  {imageDataUrl ? (
                    <div className="flex w-full max-w-[280px] flex-col items-center gap-5">
                      <div
                        className="relative w-full rotate-[-2deg] drop-shadow-[0_16px_40px_rgba(51,48,46,0.12)] transition-transform hover:rotate-0"
                        style={{ perspective: '800px' }}
                      >
                        <div
                          className="rounded-xl border border-[#D8D3C9] bg-white p-3 pb-10 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]"
                          style={{
                            boxShadow:
                              'inset 0 1px 0 rgba(255,255,255,0.85), 0 4px 20px rgba(51,48,46,0.08)',
                          }}
                        >
                          <div
                            className="overflow-hidden rounded-lg border border-[#E5E1D8]"
                            style={{ backgroundColor: V.peachTint }}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={imageDataUrl}
                              alt=""
                              className="aspect-square w-full max-h-[220px] object-cover"
                            />
                          </div>
                          <div className="mt-5 flex justify-center" aria-hidden>
                            <span className="h-1.5 w-1.5 rounded-full border border-[#C9C2B6] bg-[#8B7D3A]/20" />
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={imageBusy}
                          className="rounded-md border px-5 py-2.5 font-tyme-sans text-[10px] font-bold uppercase tracking-[0.2em] transition disabled:opacity-50"
                          style={{
                            borderColor: V.letterRule,
                            backgroundColor: V.letterField,
                            color: V.letterInk,
                          }}
                        >
                          Replace
                        </button>
                        <button
                          type="button"
                          onClick={() => setImageDataUrl(null)}
                          disabled={imageBusy}
                          className="font-tyme-sans text-[10px] font-bold uppercase tracking-[0.2em] underline-offset-4 hover:underline disabled:opacity-50"
                          style={{ color: V.letterMuted }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={imageBusy}
                      className="group flex w-full max-w-[280px] flex-col items-center justify-center rounded-md border border-dashed px-6 py-14 transition hover:border-[#c4a44d]/45 disabled:cursor-wait disabled:opacity-60"
                      style={{
                        borderColor: `${V.letterRule}`,
                        backgroundColor: V.letterField,
                      }}
                    >
                      {imageBusy ? (
                        <span className="font-tyme-sans text-sm" style={{ color: V.letterMuted }}>
                          Compressing…
                        </span>
                      ) : (
                        <>
                          <span
                            className="font-tyme-sans text-[10px] font-bold uppercase tracking-[0.28em]"
                            style={{ color: V.letterGold }}
                          >
                            Add photo
                          </span>
                          <span
                            className="mt-3 max-w-[200px] text-center font-tyme-sans text-xs leading-relaxed"
                            style={{ color: V.letterMuted }}
                          >
                            JPEG, PNG, or WebP. Shown as a polaroid preview; stored in your link.
                          </span>
                        </>
                      )}
                    </button>
                  )}
                </aside>

                <div className="col-span-full grid grid-cols-1 gap-4 pt-8 lg:grid-cols-2 lg:gap-14 lg:items-center">
                  <div className="flex justify-start">
                    <button
                      type="submit"
                      form="tyme-seal-step1"
                      className="inline-flex shrink-0 justify-center rounded-xl bg-[#c4a44d] px-10 py-3.5 font-tyme-sans text-[10px] font-bold uppercase tracking-[0.28em] text-tyme-ink shadow-[0_8px_24px_rgba(196,164,77,0.35)] transition duration-300 ease-out hover:-translate-y-1 hover:scale-[1.03] hover:bg-[#d4b856] hover:shadow-[0_14px_36px_rgba(196,164,77,0.45)] active:translate-y-0 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7D3A]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fdfaf5]"
                    >
                      Continue
                    </button>
                  </div>
                  <p
                    className="text-right font-tyme-sans text-xs leading-relaxed lg:max-w-none"
                    style={{ color: V.letterMuted }}
                  >
                    Next: choose whether this memory is time-locked.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {/* Step 2 — Lock */}
          {step === 2 ? (
            <div key="s2" className="tyme-seal-step-animate">
              <div className="relative mt-2 sm:mt-0">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <h1
                    className="font-tyme-sans text-xl font-bold uppercase leading-tight tracking-[0.2em] sm:text-2xl"
                    style={{ color: V.letterInk }}
                  >
                    {STEP_LABELS[1]}
                  </h1>
                  <span className="hidden font-tyme-sans text-lg sm:block" style={{ color: V.letterGold }} aria-hidden>
                    ✦
                  </span>
                </div>
                <p className="mt-4 max-w-2xl font-tyme-sans text-sm leading-relaxed sm:text-base" style={{ color: V.letterMuted }}>
                  Decide when the message can be read. Everything stays encoded in the link — we never store it.
                </p>
              </div>

              <form className="mt-10 max-w-2xl space-y-10 border-t pt-10" style={{ borderColor: V.letterRule }} onSubmit={handleStep2Continue}>
                <fieldset className="space-y-0">
                  <legend
                    className="font-tyme-sans text-[10px] font-semibold uppercase tracking-[0.32em]"
                    style={{ color: V.letterGold }}
                  >
                    Unlock
                  </legend>
                  <label
                    className="mt-6 flex cursor-pointer items-start gap-4 border-b pb-6 transition-colors"
                    style={{ borderColor: V.letterRule }}
                  >
                    <input
                      type="radio"
                      name="lock"
                      checked={lockMode === 'anytime'}
                      onChange={() => setLockMode('anytime')}
                      className="mt-1 accent-[#c4a44d]"
                    />
                    <span>
                      <span className="block font-tyme-head text-base font-semibold" style={{ color: V.letterInk }}>
                        Open anytime
                      </span>
                      <span className="mt-1 block font-tyme-sans text-sm leading-relaxed" style={{ color: V.letterMuted }}>
                        Anyone with the link can read it as soon as they open it.
                      </span>
                    </span>
                  </label>
                  <label className="mt-6 flex cursor-pointer items-start gap-4 pb-2">
                    <input
                      type="radio"
                      name="lock"
                      checked={lockMode === 'scheduled'}
                      onChange={() => setLockMode('scheduled')}
                      className="mt-1 accent-[#c4a44d]"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block font-tyme-head text-base font-semibold" style={{ color: V.letterInk }}>
                        Unlock on a date &amp; time
                      </span>
                      <span className="mt-1 block font-tyme-sans text-sm leading-relaxed" style={{ color: V.letterMuted }}>
                        The page stays sealed until that moment (in your local time).
                      </span>
                      {lockMode === 'scheduled' ? (
                        <input
                          type="datetime-local"
                          value={unlockLocal}
                          onChange={e => setUnlockLocal(e.target.value)}
                          className="mt-4 box-border w-full min-w-0 max-w-full rounded-md border px-3 py-2.5 font-tyme-sans text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#c4a44d]/40 sm:max-w-xs"
                          style={{
                            borderColor: V.letterRule,
                            backgroundColor: V.letterField,
                            color: V.letterInk,
                          }}
                        />
                      ) : null}
                    </span>
                  </label>
                </fieldset>

                <div className="flex w-full flex-col gap-4 pt-8 sm:flex-row sm:items-center sm:gap-6">
                  <button
                    type="submit"
                    className="inline-flex shrink-0 justify-center self-start rounded-xl bg-[#c4a44d] px-10 py-3.5 font-tyme-sans text-[10px] font-bold uppercase tracking-[0.28em] text-tyme-ink shadow-[0_8px_24px_rgba(196,164,77,0.35)] transition duration-300 ease-out hover:-translate-y-1 hover:scale-[1.03] hover:bg-[#d4b856] hover:shadow-[0_14px_36px_rgba(196,164,77,0.45)] active:translate-y-0 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7D3A]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fdfaf5] sm:self-auto"
                  >
                    Continue
                  </button>
                  <p
                    className="min-w-0 flex-1 text-right font-tyme-sans text-xs leading-relaxed"
                    style={{ color: V.letterMuted }}
                  >
                    Next: send the invitation by email.
                  </p>
                </div>
              </form>
            </div>
          ) : null}

          {/* Step 3 — Sealed + email only (no link on screen) */}
          {step === 3 && shareUrl ? (
            <div key="s3-done" className="tyme-seal-step-animate">
              <div className="relative mt-2 sm:mt-0">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <h1
                    className="font-tyme-head text-[clamp(2.5rem,10vw,4.25rem)] font-bold uppercase leading-[0.95] tracking-[-0.02em]"
                    style={{ color: V.letterInk }}
                  >
                    Sealed
                  </h1>
                  <span className="hidden font-tyme-head text-xl sm:block" style={{ color: V.letterGold }} aria-hidden>
                    ✦
                  </span>
                </div>
                <p className="mt-5 max-w-2xl font-tyme-sans text-sm leading-relaxed sm:text-base" style={{ color: V.letterMuted }}>
                  {lockMode === 'scheduled' && sealUnlockMs > 0 ? (
                    <>
                      The open link is only sent by email. Your guest will get a message with a button when it&apos;s time
                      to open—nothing to copy here.
                    </>
                  ) : (
                    <>
                      The open link is only sent by email. Enter their address below—we never show the long link on this
                      page.
                    </>
                  )}
                </p>
              </div>

              <div
                className="mt-10 max-w-2xl space-y-5 border-t pt-10"
                style={{ borderColor: V.letterRule }}
              >
                <div>
                  <p
                    className="font-tyme-sans text-[10px] font-semibold uppercase tracking-[0.32em]"
                    style={{ color: V.letterGold }}
                  >
                    Email invitation
                  </p>
                  <p className="mt-3 max-w-xl font-tyme-sans text-sm leading-relaxed" style={{ color: V.letterMuted }}>
                    {lockMode === 'scheduled' && sealUnlockMs > 0 ? (
                      <>
                        We&apos;ll email your guest when the letter unlocks so they know it&apos;s time to open it.
                      </>
                    ) : (
                      <>Send an invitation so they know a sealed letter is waiting.</>
                    )}
                  </p>
                </div>
                <div className="flex max-w-md flex-col gap-3 sm:flex-row sm:items-end">
                  <label className="min-w-0 flex-1 font-tyme-sans text-xs" style={{ color: V.letterInk }}>
                    <span className="mb-1.5 block font-semibold" style={{ color: V.letterMuted }}>
                      Recipient
                    </span>
                    <input
                      type="email"
                      autoComplete="email"
                      value={inviteEmail}
                      onChange={e => {
                        setInviteEmail(e.target.value)
                        setInviteSent(false)
                        setInviteError(null)
                      }}
                      disabled={inviteSending || inviteSent}
                      placeholder="name@example.com"
                      className="w-full rounded-md border px-3 py-2.5 font-tyme-sans text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#c4a44d]/40 disabled:opacity-60"
                      style={{
                        borderColor: V.letterRule,
                        backgroundColor: V.letterField,
                        color: V.letterInk,
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={sendInviteEmail}
                    disabled={inviteSending || inviteSent}
                    className={`shrink-0 rounded-xl px-6 py-2.5 font-tyme-sans text-[10px] font-bold uppercase tracking-[0.2em] text-tyme-ink shadow-[0_8px_24px_rgba(196,164,77,0.35)] transition duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7D3A]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fdfaf5] disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:scale-100 disabled:hover:shadow-[0_8px_24px_rgba(196,164,77,0.35)] ${
                      inviteSent
                        ? 'bg-[#a89358] opacity-95'
                        : 'bg-[#c4a44d] hover:-translate-y-1 hover:scale-[1.03] hover:bg-[#d4b856] hover:shadow-[0_14px_36px_rgba(196,164,77,0.45)] active:translate-y-0 active:scale-[0.98] disabled:opacity-55'
                    }`}
                  >
                    {inviteSending ? 'Sending…' : inviteSent ? 'Invitation sent' : 'Send invitation email'}
                  </button>
                </div>
                {inviteError ? (
                  <p
                    className="rounded-md border px-3 py-2 font-tyme-sans text-sm"
                    style={{
                      borderColor: V.errorBorder,
                      backgroundColor: V.errorBg,
                      color: V.errorText,
                    }}
                  >
                    {inviteError}
                  </p>
                ) : null}
                {inviteSent ? (
                  <p className="font-tyme-sans text-sm" style={{ color: V.olive }}>
                    Invitation sent.
                  </p>
                ) : null}
              </div>

              <div
                className="mt-10 flex max-w-2xl flex-col gap-4 border-t pt-10 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
                style={{ borderColor: V.letterRule }}
              >
                <button
                  type="button"
                  onClick={() => setHomeLeaveConfirmOpen(true)}
                  className="inline-flex w-fit items-center justify-center rounded-md border border-[#8B7D3A] bg-transparent px-10 py-3.5 font-tyme-sans text-[10px] font-bold uppercase tracking-[0.28em] text-[#8B7D3A] transition duration-300 ease-out hover:bg-[#f5f3ef] hover:border-[#6d6430] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7D3A]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fdfaf5]"
                >
                  Return home
                </button>
                <button
                  type="button"
                  onClick={startOver}
                  className="self-end py-3.5 font-tyme-sans text-[10px] font-bold uppercase tracking-[0.24em] underline-offset-4 hover:underline sm:self-auto sm:px-2"
                  style={{ color: V.letterMuted }}
                >
                  Create another
                </button>
              </div>
            </div>
          ) : null}
          </div>
        </div>
        </div>
      </div>

      {homeLeaveConfirmOpen ? (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-6"
          role="presentation"
          onClick={() => setHomeLeaveConfirmOpen(false)}
        >
          <div className="absolute inset-0 bg-[#33302E]/45 backdrop-blur-[2px]" aria-hidden />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="tyme-home-leave-title"
            className="relative max-w-md rounded-2xl border p-8 shadow-[0_24px_56px_rgba(51,48,46,0.18)]"
            style={{
              backgroundColor: V.letterPaper,
              borderColor: V.border,
            }}
            onClick={e => e.stopPropagation()}
          >
            <h2
              id="tyme-home-leave-title"
              className="font-tyme-sans text-lg font-semibold tracking-tight"
              style={{ color: V.letterInk }}
            >
              Return to homepage?
            </h2>
            <p className="mt-3 font-tyme-sans text-sm leading-relaxed" style={{ color: V.body }}>
              Are you sure you want to leave? You can always come back to seal another memory.
            </p>
            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setHomeLeaveConfirmOpen(false)}
                className="rounded-md border px-6 py-3 font-tyme-sans text-[10px] font-bold uppercase tracking-[0.22em] transition hover:bg-[#f5f3ef] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7D3A]/50"
                style={{ borderColor: V.olive, color: V.olive }}
              >
                Stay here
              </button>
              <button
                type="button"
                onClick={() => {
                  setHomeLeaveConfirmOpen(false)
                  router.push('/')
                }}
                className="rounded-xl px-6 py-3 font-tyme-sans text-[10px] font-bold uppercase tracking-[0.2em] text-tyme-ink shadow-[0_8px_24px_rgba(196,164,77,0.35)] transition hover:bg-[#d4b856] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7D3A]/50"
                style={{ backgroundColor: V.letterGold }}
              >
                Yes, go home
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
