/**
 * Capsule share links use `#c=` so the encoded payload is not sent on the HTTP request
 * (avoids HTTP 431 when the seal includes a large image). Legacy `?c=` is still supported.
 */
export function getCapsuleTokenFromOpenUrl(u: URL): string {
  if (u.hash.length > 1) {
    const c = new URLSearchParams(u.hash.slice(1)).get('c')
    if (c?.trim()) return c.trim()
  }
  const q = u.searchParams.get('c')
  return q?.trim() ?? ''
}

export function isOpenSharePathname(pathname: string): boolean {
  const p = pathname.replace(/\/$/, '') || '/'
  return p === '/open'
}
