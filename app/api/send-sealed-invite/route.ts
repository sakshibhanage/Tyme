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

  /** One stack everywhere so body + CTA match when webfonts load (and fall back together when they don’t). */
  const ff =
    "'Manrope','Helvetica Neue',Helvetica,Arial,sans-serif"
  const gold = '#d4af37'
  const goldHover = '#e4c34d'
  const ink = '#1a1612'
  const olive = '#8b7d3a'

  const bodyHtml = isTimeLocked
    ? `${escapeHtml('Your sealed memory is ready.')}<br /><br />${escapeHtml('Open it on Tyme to read it.')}`
    : `${escapeHtml('A sealed memory is waiting for you on Tyme.')}<br /><br />${escapeHtml('Open it when you are ready.')}`

  const heroBlock = brandImageUrl
    ? `<div style="margin:0 0 24px;text-align:center;"><img src="${escapeHtml(brandImageUrl)}" alt="Tyme" width="200" style="max-width:72%;height:auto;display:inline-block;border:0;border-radius:16px;vertical-align:middle;" /></div>`
    : ''

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="color-scheme" content="light" />
<meta name="supported-color-schemes" content="light" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
<style type="text/css">
  :root { color-scheme: light; }
  .tyme-email-body {
    font-family: ${ff} !important;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    font-weight: 600 !important;
    font-synthesis: none;
    color: ${olive} !important;
  }
  .tyme-email-cta {
    font-family: ${ff} !important;
    font-weight: 700 !important;
    border-radius: 20px !important;
    -webkit-transition: transform 0.3s ease-out, background-color 0.3s ease-out, box-shadow 0.3s ease-out;
    transition: transform 0.3s ease-out, background-color 0.3s ease-out, box-shadow 0.3s ease-out;
  }
  .tyme-email-cta:hover {
    background-color: ${goldHover} !important;
    -webkit-transform: translateY(-4px) scale(1.03);
    transform: translateY(-4px) scale(1.03);
    box-shadow: 0 14px 36px rgba(212, 175, 55, 0.45) !important;
  }
</style>
</head>
<body style="margin:0;padding:28px 16px;background-color:#ffffff;font-family:${ff};-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:0;">
    <tr>
      <td align="center" style="padding:0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;border-collapse:separate;border-spacing:0;border-radius:24px;overflow:hidden;background-color:#fffdf5;background-image:linear-gradient(180deg,#fdf5df 0%,#fffdf5 100%);box-shadow:0 16px 48px rgba(51,48,46,0.08);">
          <tr>
            <td style="padding:40px 28px;text-align:center;font-family:${ff};">
      ${heroBlock}
      <p class="tyme-email-body" style="margin:0 0 28px;padding:0;font-family:${ff};font-size:12px;font-weight:600;line-height:1.75;text-align:center;text-transform:uppercase;letter-spacing:0.12em;color:${olive};">${bodyHtml}</p>
      <p style="margin:0;">
        <a href="${escapeHtml(shareUrl)}" class="tyme-email-cta" style="display:inline-block;mso-padding-alt:0;background-color:${gold};color:${ink};text-decoration:none;padding:16px 40px;border-radius:20px;font-family:${ff};font-weight:700;font-size:10px;letter-spacing:0.28em;text-transform:uppercase;line-height:1.35;box-shadow:0 8px 24px rgba(212,175,55,0.35);white-space:nowrap;">Open memory&nbsp;&rarr;</a>
      </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  const text = `${bodyLine.toUpperCase()}\n\nOPEN YOUR MEMORY → — USE THE BUTTON IN THE HTML VERSION OF THIS EMAIL.`

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
