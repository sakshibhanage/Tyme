import { NextResponse } from 'next/server'
import { isSafeHostedImageUrl, isSafeImageDataUrl } from '@/lib/compress-image'

export const runtime = 'nodejs'

const MAX_DATA_URL_CHARS = 28_000

async function uploadToImgBB(base64NoPrefix: string, key: string): Promise<string> {
  const params = new URLSearchParams()
  params.append('key', key)
  params.append('image', base64NoPrefix)
  const res = await fetch('https://api.imgbb.com/1/upload', {
    method: 'POST',
    body: params,
  })
  const j = (await res.json()) as {
    data?: { url?: string; display_url?: string }
    error?: { message?: string }
    status?: number
  }
  const raw = j?.data?.url ?? j?.data?.display_url
  if (!raw || typeof raw !== 'string') {
    throw new Error(j?.error?.message || 'ImgBB upload failed.')
  }
  let url = raw.trim()
  if (url.startsWith('http://')) url = `https://${url.slice(7)}`
  if (!url.startsWith('https://')) throw new Error('ImgBB returned an invalid URL.')
  return url
}

async function uploadToCatbox(jpegBuffer: Buffer): Promise<string> {
  const blob = new Blob([new Uint8Array(jpegBuffer)], { type: 'image/jpeg' })
  const form = new FormData()
  form.append('reqtype', 'fileupload')
  form.append('fileToUpload', blob, 'tyme-seal.jpg')
  const res = await fetch('https://catbox.moe/user/api.php', { method: 'POST', body: form })
  const text = (await res.text()).trim()
  if (!res.ok || !text.startsWith('https://')) {
    throw new Error(
      text || 'Catbox upload failed. Add IMGBB_API_KEY to .env.local for ImgBB fallback.',
    )
  }
  return text
}

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }
  const image =
    body &&
    typeof body === 'object' &&
    'image' in body &&
    typeof (body as { image: unknown }).image === 'string'
      ? (body as { image: string }).image
      : ''
  if (!image || !isSafeImageDataUrl(image)) {
    return NextResponse.json({ error: 'Send a compressed JPEG data URL from the Seal page.' }, { status: 400 })
  }
  if (image.length > MAX_DATA_URL_CHARS) {
    return NextResponse.json({ error: 'Image payload is too large.' }, { status: 400 })
  }

  const comma = image.indexOf(',')
  const base64 = comma >= 0 ? image.slice(comma + 1) : ''
  if (!base64) {
    return NextResponse.json({ error: 'Invalid image data.' }, { status: 400 })
  }
  let buf: Buffer
  try {
    buf = Buffer.from(base64, 'base64')
  } catch {
    return NextResponse.json({ error: 'Invalid base64 image.' }, { status: 400 })
  }
  if (buf.length < 80 || buf.length > 4 * 1024 * 1024) {
    return NextResponse.json({ error: 'Image size is not allowed.' }, { status: 400 })
  }

  const imgbbKey = process.env.IMGBB_API_KEY?.trim()

  try {
    const url = imgbbKey
      ? await uploadToImgBB(base64, imgbbKey)
      : await uploadToCatbox(buf)
    if (!isSafeHostedImageUrl(url)) {
      return NextResponse.json({ error: 'Image host returned an unexpected URL.' }, { status: 502 })
    }
    return NextResponse.json({ url })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Upload failed.'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
