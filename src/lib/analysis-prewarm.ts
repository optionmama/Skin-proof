/**
 * Pre-warmed skin-analysis handoff between the check-in page and the result page.
 *
 * Speed fix (2026-07-10 audit): analysis used to start only AFTER the user
 * finished the habits/products steps and landed on the result page — the 10–20s
 * the user spends on the steps was wasted waiting time. Now the check-in page
 * starts the analysis as soon as the photo upload+insert completes (while the
 * page is still MOUNTED, per the R20 rule), stores the in-flight promise here,
 * and the result page AWAITS it before deciding whether to run its own call.
 *
 * R20 ownership is preserved: the result page still verifies the score landed
 * and still has its own awaited retry loop — this module only prevents wasted
 * time and duplicate concurrent analyze calls. Module-level state survives
 * client-side (App Router) navigation because the JS context is shared; if the
 * WebView tears the request down anyway, the result page's retry path covers it.
 */

let pending: { photoId: string; promise: Promise<unknown> } | null = null

/** Register the in-flight analyze call for a photo (check-in page). */
export function setAnalysisPrewarm(photoId: string, promise: Promise<unknown>) {
  pending = { photoId, promise }
}

/**
 * Wait (bounded) for the pre-warmed analyze call for this photo, if one exists.
 * Always resolves — errors/timeouts just mean the caller proceeds with its own
 * analysis. Clears the slot so a retake starts fresh.
 */
export async function awaitAnalysisPrewarm(photoId: string, timeoutMs = 25000): Promise<void> {
  if (!pending || pending.photoId !== photoId) return
  const p = pending.promise
  pending = null
  try {
    await Promise.race([
      p,
      new Promise((resolve) => setTimeout(resolve, timeoutMs)),
    ])
  } catch {
    /* result page's own retry path takes over */
  }
}
