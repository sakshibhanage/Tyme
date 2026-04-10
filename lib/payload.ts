import { gzipSync, gunzipSync, strFromU8, strToU8 } from 'fflate'
import {
  isCapsuleImageRef,
  isSafeImageDataUrl,
  MAX_HOSTED_IMAGE_URL_LENGTH,
  MAX_IMAGE_DATA_URL_LENGTH,
} from './compress-image'

/** Gzip-compressed JSON capsule (base64url after this prefix). Legacy links omit the prefix. */
const CAPSULE_GZIP_PREFIX = 'z1.'

/** Reject absurd decompressed payloads (gzip bomb / abuse). */
const MAX_DECOMPRESSED_JSON_CHARS = 2_000_000

export type CapsulePayloadV1 = {
  v: 1
  title: string
  message: string
  t: number
  x: string
}

export type CapsulePayloadV2 = {
  v: 2
  title: string
  message: string
  t: number
  x: string
  /** JPEG data URL from client compression */
  img?: string
}

export type CapsulePayloadV3 = {
  v: 3
  title: string
  message: string
  t: number
  x: string
  img?: string
  /** Unix ms when the capsule may be opened; 0 = no time lock */
  u: number
}

/** Normalized shape for the UI (all versions). */
export type DecodedCapsule = {
  title: string
  message: string
  t: number
  img?: string
  /** 0 = open anytime (after link is followed) */
  unlockAt: number
}

function checksumV1(title: string, message: string, t: number): string {
  const raw = `${title}\n${message}\n${t}`
  return fnv1a(raw)
}

function checksumV2(title: string, message: string, t: number, img: string): string {
  const raw = `${title}\n${message}\n${t}\n${img}`
  return fnv1a(raw)
}

function checksumV3(title: string, message: string, t: number, img: string, u: number): string {
  const raw = `${title}\n${message}\n${t}\n${img}\n${u}`
  return fnv1a(raw)
}

function fnv1a(s: string): string {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0).toString(16)
}

function toBase64Url(json: string): string {
  const bytes = new TextEncoder().encode(json)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(s: string): string {
  return new TextDecoder().decode(base64UrlToUint8(s))
}

function uint8ToBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlToUint8(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4))
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + pad
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function capsuleJsonFromEncoded(trimmed: string): string | null {
  try {
    if (trimmed.startsWith(CAPSULE_GZIP_PREFIX)) {
      const raw = trimmed.slice(CAPSULE_GZIP_PREFIX.length)
      if (!raw) return null
      const json = strFromU8(gunzipSync(base64UrlToUint8(raw)))
      if (json.length > MAX_DECOMPRESSED_JSON_CHARS) return null
      return json
    }
    const json = fromBase64Url(trimmed)
    if (json.length > MAX_DECOMPRESSED_JSON_CHARS) return null
    return json
  } catch {
    return null
  }
}

const MAX_TITLE = 120
const MAX_MESSAGE = 2000
/** Total encoded payload cap — browsers choke on huge URLs. */
export const MAX_ENCODED_PAYLOAD_CHARS = 52_000

export type EncodeResult =
  | { ok: true; encoded: string }
  | { ok: false; error: string }

export function encodeCapsule(
  title: string,
  message: string,
  imageDataUrl?: string | null,
  unlockAtMs: number = 0
): EncodeResult {
  const tTitle = title.trim().slice(0, MAX_TITLE)
  const tMsg = message.trim().slice(0, MAX_MESSAGE)
  if (!tTitle || !tMsg) {
    return { ok: false, error: 'Title and message are required.' }
  }

  let u = typeof unlockAtMs === 'number' && Number.isFinite(unlockAtMs) && unlockAtMs > 0 ? Math.floor(unlockAtMs) : 0

  let img: string | undefined
  if (imageDataUrl && imageDataUrl.length > 0) {
    if (!isCapsuleImageRef(imageDataUrl)) {
      return { ok: false, error: 'Image data is invalid or unsupported.' }
    }
    if (isSafeImageDataUrl(imageDataUrl)) {
      if (imageDataUrl.length > MAX_IMAGE_DATA_URL_LENGTH) {
        return { ok: false, error: 'Image is still too large after compression for a single URL.' }
      }
    } else if (imageDataUrl.length > MAX_HOSTED_IMAGE_URL_LENGTH) {
      return { ok: false, error: 'Image link is invalid or too long.' }
    }
    img = imageDataUrl
  }

  const t = Date.now()
  const imgPart = img ?? ''
  const x = checksumV3(tTitle, tMsg, t, imgPart, u)
  const body: CapsulePayloadV3 = { v: 3, title: tTitle, message: tMsg, t, x, u, ...(img ? { img } : {}) }

  const json = JSON.stringify(body)
  const plain = toBase64Url(json)
  let encoded = plain
  try {
    const gzB64 = CAPSULE_GZIP_PREFIX + uint8ToBase64Url(gzipSync(strToU8(json), { level: 9 }))
    if (gzB64.length < plain.length) encoded = gzB64
  } catch {
    /* keep plain */
  }
  if (encoded.length > MAX_ENCODED_PAYLOAD_CHARS) {
    return {
      ok: false,
      error: 'This capsule is too long for a URL (usually the photo). Shorten the text or use a smaller image.',
    }
  }

  return { ok: true, encoded }
}

export function decodeCapsule(encoded: string): DecodedCapsule | null {
  const trimmed = encoded.trim()
  if (!trimmed) return null
  const json = capsuleJsonFromEncoded(trimmed)
  if (json === null) return null
  try {
    const data = JSON.parse(json) as CapsulePayloadV1 | CapsulePayloadV2 | CapsulePayloadV3

    if (data.v === 1) {
      if (typeof data.title !== 'string' || typeof data.message !== 'string') return null
      if (typeof data.t !== 'number' || typeof data.x !== 'string') return null
      if (checksumV1(data.title, data.message, data.t) !== data.x) return null
      return { title: data.title, message: data.message, t: data.t, unlockAt: 0 }
    }

    if (data.v === 2) {
      if (typeof data.title !== 'string' || typeof data.message !== 'string') return null
      if (typeof data.t !== 'number' || typeof data.x !== 'string') return null
      const img = typeof data.img === 'string' && data.img.length > 0 ? data.img : ''
      if (data.img && !isCapsuleImageRef(data.img)) return null
      if (checksumV2(data.title, data.message, data.t, img) !== data.x) return null
      return {
        title: data.title,
        message: data.message,
        t: data.t,
        unlockAt: 0,
        ...(data.img && isCapsuleImageRef(data.img) ? { img: data.img } : {}),
      }
    }

    if (data.v === 3) {
      if (typeof data.title !== 'string' || typeof data.message !== 'string') return null
      if (typeof data.t !== 'number' || typeof data.x !== 'string') return null
      if (typeof data.u !== 'number' || !Number.isFinite(data.u) || data.u < 0) return null
      const img = typeof data.img === 'string' && data.img.length > 0 ? data.img : ''
      if (data.img && !isCapsuleImageRef(data.img)) return null
      if (checksumV3(data.title, data.message, data.t, img, data.u) !== data.x) return null
      return {
        title: data.title,
        message: data.message,
        t: data.t,
        unlockAt: data.u,
        ...(data.img && isCapsuleImageRef(data.img) ? { img: data.img } : {}),
      }
    }

    return null
  } catch {
    return null
  }
}
