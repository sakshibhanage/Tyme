/** Human-readable time until `targetMs` (UTC-safe comparison uses caller's `now`). */
export function formatUnlockCountdown(targetMs: number, now: number): string {
  const ms = Math.max(0, targetMs - now)
  if (ms === 0) return 'Unlocked'

  const s = Math.floor(ms / 1000)
  const days = Math.floor(s / 86400)
  const hours = Math.floor((s % 86400) / 3600)
  const mins = Math.floor((s % 3600) / 60)
  const secs = s % 60

  const parts: string[] = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0 || days > 0) parts.push(`${hours}h`)
  parts.push(`${mins}m`)
  if (days === 0 && hours === 0) parts.push(`${secs}s`)

  return parts.join(' ')
}
