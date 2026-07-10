/**
 * On-device photo downscaling, applied BEFORE upload.
 *
 * Root cause of "analysis is slow" (2026-07-10 audit): the camera handed us
 * full-resolution photos (~1.7–2.0 MB measured in Storage) and that original
 * traveled the whole pipeline — phone upload → Storage → server download →
 * OpenAI vision. ~1080px is more than enough detail for skin scoring; shrinking
 * to ~200–400 KB speeds every stage (upload, download, vision tokens).
 *
 * Guarantees: NEVER throws and NEVER blocks the flow — any failure (odd format,
 * old WebView, canvas quota) just returns the original file unchanged.
 */
export async function downscaleImage(
  file: File,
  maxDim = 1080,
  quality = 0.85
): Promise<File> {
  try {
    // Decode. `imageOrientation: 'from-image'` bakes EXIF rotation in (the
    // native camera path already corrects orientation; this covers web files).
    let bitmap: ImageBitmap
    try {
      bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' } as ImageBitmapOptions)
    } catch {
      bitmap = await createImageBitmap(file)
    }

    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height))
    if (scale >= 1 && file.size < 600 * 1024) {
      // Already small in both dimensions and bytes — keep the original.
      bitmap.close()
      return file
    }

    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const ctx = canvas.getContext('2d')
    if (!ctx) { bitmap.close(); return file }
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', quality)
    )
    if (!blob || blob.size === 0) return file

    const name = file.name.replace(/\.\w+$/, '') + '.jpg'
    return new File([blob], name, { type: 'image/jpeg' })
  } catch {
    return file
  }
}
