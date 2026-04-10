import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getCapsuleTokenFromOpenUrl, isOpenSharePathname } from '@/lib/open-url'

export const runtime = 'nodejs'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isTrustedHttpsUrl(s: string): boolean {
  try {
    const u = new URL(s)
    return u.protocol === 'https:' && s.length < 2048
  } catch {
    return false
  }
}

function resolveBrandInviteImageUrl(): string | null {
  const url = process.env.TYME_ENV_IMAGE?.trim()
  if (url && isTrustedHttpsUrl(url)) return url
  return null
}

function isAllowedShareUrl(shareUrl: string): boolean {
  try {
    const u = new URL(shareUrl)
    if (!isOpenSharePathname(u.pathname)) return false
    const c = getCapsuleTokenFromOpenUrl(u)
    if (!c || c.length < 10) return false
    const base = process.env.NEXT_PUBLIC_APP_URL?.trim()
    if (base) {
      const allowed = new URL(base)
      if (u.origin !== allowed.origin) return false
    }
    return true
  } catch {
    return false
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildInviteEmail(args: {
  isTimeLocked: boolean
  shareUrl: string
  brandImageUrl: string | null
}): { subject: string; html: string; text: string } {
  const { isTimeLocked, shareUrl, brandImageUrl } = args

  const subject = isTimeLocked ? 'Your memory is ready to open' : 'A memory is waiting to be opened'

  const bodyLine = isTimeLocked
    ? 'Your sealed memory is ready. Open it on Tyme to read it.'
    : 'A sealed memory is waiting for you on Tyme. Open it when you are ready.'

  const heroBlock = brandImageUrl
    ? `<div style="margin:0 0 24px;text-align:center;"><img src="${escapeHtml(brandImageUrl)}" alt="Tyme" width="200" style="max-width:72%;height:auto;display:inline-block;border:0;" /></div>`
    : ''

  const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:40px 20px;background:#fdfaf5;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;">
    <tr><td style="text-align:center;">
      ${heroBlock}
      <p style="color:#2d2926;font-size:17px;line-height:1.55;margin:0 0 28px;text-align:center;">${escapeHtml(bodyLine)}</p>
      <p style="margin:0;">
        <a href="${escapeHtml(shareUrl)}" style="display:inline-block;background:#c4a44d;color:#2d2926;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;">Open memory</a>
      </p>
    </td></tr>
  </table>
</body>
</html>`

  const text = `${bodyLine}\n\nOpen your memory using the “Open memory” button in the HTML version of this email.`

  return { subject, html, text }
}

export async function POST(req: Request) {
  const resendKey = process.env.RESEND_API_KEY?.trim()
  const resendFrom = process.env.RESEND_FROM?.trim()
  if (!resendKey || !resendFrom) {
    return NextResponse.json(
      {
        error:
          'Email is not configured. Set RESEND_API_KEY and RESEND_FROM in .env.local — see .env.example.',
      },
      { status: 503 },
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid body.' }, { status: 400 })
  }

  const o = body as Record<string, unknown>
  const to = typeof o.to === 'string' ? o.to.trim() : ''
  const shareUrl = typeof o.shareUrl === 'string' ? o.shareUrl.trim() : ''
  const scheduledAtRaw = typeof o.scheduledAt === 'string' ? o.scheduledAt.trim() : ''

  if (!to || !EMAIL_RE.test(to)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
  }
  if (!isAllowedShareUrl(shareUrl)) {
    return NextResponse.json(
      {
        error:
          'Invalid share link. If you deploy, set NEXT_PUBLIC_APP_URL to your site URL so links match.',
      },
      { status: 400 },
    )
  }

  const brandImageUrl = resolveBrandInviteImageUrl()

  let unlockMs: number | null = null
  if (scheduledAtRaw) {
    const t = Date.parse(scheduledAtRaw)
    if (!Number.isFinite(t)) {
      return NextResponse.json({ error: 'scheduledAt must be a valid ISO 8601 date.' }, { status: 400 })
    }
    if (t <= Date.now()) {
      return NextResponse.json(
        { error: 'For time-locked letters, the unlock time must still be in the future.' },
        { status: 400 },
      )
    }
    unlockMs = t
  }

  const isTimeLocked = unlockMs !== null

  const { subject, html, text } = buildInviteEmail({
    isTimeLocked,
    shareUrl,
    brandImageUrl,
  })

  const scheduledAtIso = isTimeLocked ? new Date(unlockMs!).toISOString() : undefined

  const resend = new Resend(resendKey)
  const { data, error } = await resend.emails.send({
    from: resendFrom,
    to: [to],
    subject,
    html,
    text,
    ...(scheduledAtIso ? { scheduledAt: scheduledAtIso } : {}),
  })

  if (error) {
    console.error('Resend error:', error)
    return NextResponse.json(
      { error: error.message || 'Could not send email. Check RESEND_FROM and domain verification.' },
      { status: 502 },
    )
  }

  return NextResponse.json({
    id: data?.id,
    scheduledDelivery: !!scheduledAtIso,
  })
}
