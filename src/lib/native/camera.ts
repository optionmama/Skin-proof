/**
 * True when running inside the Capacitor native iOS/Android shell.
 *
 * Async + dynamically imported on purpose: `@capacitor/core` must never be
 * evaluated during Next.js SSR/static export (it would break the web build), so
 * we only load it in the browser. On the server / web this resolves to false.
 */
export async function isNativePlatform(): Promise<boolean> {
  if (typeof window === 'undefined') return false
  try {
    const { Capacitor } = await import('@capacitor/core')
    return Capacitor.isNativePlatform()
  } catch {
    return false
  }
}

/**
 * Capture a photo with the device's native camera (Apple Guideline 4.2 — the
 * app must use real native capability, not just wrap the website).
 *
 * Returns a `File` in the exact shape the existing upload/analysis pipeline
 * already consumes (`handlePhotoCapture(file: File)`), so nothing downstream
 * changes. On web/PWA this isn't used — the `<input capture>` flow stays as the
 * fallback.
 *
 * The `@capacitor/camera` plugin is imported dynamically so it never affects
 * the web bundle and only loads on native.
 */
export async function captureNativePhoto(): Promise<File | null> {
  const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera')

  const photo = await Camera.getPhoto({
    quality: 90,
    allowEditing: false,
    resultType: CameraResultType.Base64,
    source: CameraSource.Camera,
    saveToGallery: false,
    correctOrientation: true,
  })

  if (!photo.base64String) return null

  const format = photo.format || 'jpeg'
  const mime = `image/${format === 'jpg' ? 'jpeg' : format}`
  const file = base64ToFile(photo.base64String, `scan-${Date.now()}.${format}`, mime)
  return file
}

/**
 * Pick an existing photo from the library on native (mirrors the web "choose
 * from library" fallback). Returns a `File` for the same pipeline.
 */
export async function pickNativePhoto(): Promise<File | null> {
  const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera')

  const photo = await Camera.getPhoto({
    quality: 90,
    allowEditing: false,
    resultType: CameraResultType.Base64,
    source: CameraSource.Photos,
    correctOrientation: true,
  })

  if (!photo.base64String) return null
  const format = photo.format || 'jpeg'
  const mime = `image/${format === 'jpg' ? 'jpeg' : format}`
  return base64ToFile(photo.base64String, `scan-${Date.now()}.${format}`, mime)
}

function base64ToFile(base64: string, filename: string, mime: string): File {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  const blob = new Blob([bytes], { type: mime })
  return new File([blob], filename, { type: mime })
}
