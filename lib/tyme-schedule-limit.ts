/** Max horizon from “now” for a timed unlock so the letter and invitation stay in sync. */
export const TYME_MAX_UNLOCK_FROM_NOW_MS = 30 * 24 * 60 * 60 * 1000

/** `unlockMs` must already be validated as finite and in the future when > 0. */
export function clampUnlockMsToScheduleLimit(unlockMs: number, nowMs: number): number {
  if (unlockMs <= 0) return 0
  const cap = nowMs + TYME_MAX_UNLOCK_FROM_NOW_MS
  return unlockMs > cap ? cap : unlockMs
}
