/** Max length of data URL string we allow inside the capsule JSON (keeps total URL shareable). */
export const MAX_IMAGE_DATA_URL_LENGTH = 26_000

const ACCEPT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export async function imageFileToDataUrl(file: File): Promise<{ dataUrl: string } | { error: string }> {
  if (!ACCEPT_TYPES.includes(file.type)) {
    return { error: 'Use JPEG, PNG, WebP, or GIF.' }
  }
  if (file.size > 12 * 1024 * 1024) {
    return { error: 'Image is too large before compression (max 12MB).' }
  }

  const bitmap = await createImageBitmap(file).catch(() => null)
  if (!bitmap) {
    return { error: 'Could not read this image.' }
  }

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    return { error: 'Canvas not available.' }
  }

  const maxSides = [512, 400, 320, 256, 200]
  const qualities = [0.78, 0.65, 0.52, 0.42, 0.35]

  for (const maxSide of maxSides) {
    let { width, height } = bitmap
    const scale = Math.min(1, maxSide / Math.max(width, height))
    width = Math.round(width * scale)
    height = Math.round(height * scale)
    canvas.width = width
    canvas.height = height
      ctx.fillStyle = '#f5f4eb'
    ctx.fillRect(0, 0, width, height)
    ctx.drawImage(bitmap, 0, 0, width, height)

    for (const q of qualities) {
      const dataUrl = canvas.toDataURL('image/jpeg', q)
      if (dataUrl.length <= MAX_IMAGE_DATA_URL_LENGTH) {
        bitmap.close()
        return { dataUrl }
      }
    }
  }

  bitmap.close()
  return {
    error:
      'Even after heavy compression this image is too large for a URL capsule. Try a smaller or simpler photo, or skip the image.',
  }
}

export function isSafeImageDataUrl(s: string): boolean {
  return (
    typeof s === 'string' &&
    s.length > 20 &&
    s.length < 400_000 &&
    /^data:image\/(jpeg|jpg|png|webp);base64,/.test(s)
  )
}

/** Max length for a hosted image URL stored in the capsule (keeps hash compact). */
export const MAX_HOSTED_IMAGE_URL_LENGTH = 400

/**
 * HTTPS image URL from our upload flow (Catbox / ImgBB). Not a general open redirect.
 */
export function isSafeHostedImageUrl(s: string): boolean {
  if (typeof s !== 'string' || s.length < 24 || s.length > MAX_HOSTED_IMAGE_URL_LENGTH) return false
  try {
    const u = new URL(s)
    if (u.protocol !== 'https:') return false
    const host = u.hostname.toLowerCase()
    if (host === 'files.catbox.moe') {
      return /^\/[A-Za-z0-9_.-]{3,120}$/.test(u.pathname) && !u.pathname.includes('..')
    }
    if (host === 'i.ibb.co' || host === 'i.imgbb.com') {
      return u.pathname.length > 2 && /\.(jpe?g|png|webp|gif)$/i.test(u.pathname)
    }
    return false
  } catch {
    return false
  }
}

export function isCapsuleImageRef(s: string): boolean {
  return isSafeImageDataUrl(s) || isSafeHostedImageUrl(s)
}
