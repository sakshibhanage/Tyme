/**
 * Upload a client-compressed JPEG data URL to a free host (Catbox by default; ImgBB if
 * `IMGBB_API_KEY` is set). Returns an `https` URL to store in the capsule instead of base64.
 */
export async function uploadCapsuleImageHost(
  dataUrl: string,
): Promise<{ url: string } | { error: string }> {
  const res = await fetch('/api/host-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: dataUrl }),
  })
  const j = (await res.json().catch(() => ({}))) as { url?: unknown; error?: unknown }
  if (!res.ok) {
    const msg = typeof j.error === 'string' ? j.error : 'Could not upload image.'
    return { error: msg }
  }
  if (typeof j.url !== 'string' || !j.url.startsWith('https://')) {
    return { error: 'Invalid response from image host.' }
  }
  return { url: j.url }
}
