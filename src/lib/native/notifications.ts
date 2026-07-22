/**
 * Daily photo-reminder scheduling via @capacitor/local-notifications.
 *
 * LOCAL notifications only (v1.1): the schedule lives on the device, fires at
 * a fixed local time daily, needs no backend/APNs, and works offline. True
 * push (milestones, price drops) is a separate v1.x project.
 *
 * Safety contract (do not weaken):
 * - The plugin is imported DYNAMICALLY and never evaluated during SSR.
 * - The LIVE app binary that shipped before v1.1 does NOT contain this plugin,
 *   but it loads this newer web code from Vercel immediately — so every entry
 *   point checks `notificationsAvailable()` first and every call is wrapped in
 *   try/catch. An old binary must see a graceful "update the app" state, never
 *   a crash.
 * - Times are interpreted in the DEVICE's local timezone (matches the app's
 *   local-day architecture in src/lib/day.ts).
 */

const REMINDER_ID = 1001

/** True only inside a native shell whose binary actually contains the plugin. */
export async function notificationsAvailable(): Promise<boolean> {
  if (typeof window === 'undefined') return false
  try {
    const { Capacitor } = await import('@capacitor/core')
    return Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('LocalNotifications')
  } catch {
    return false
  }
}

/** Current permission state without prompting. */
export async function hasNotificationPermission(): Promise<boolean> {
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    return (await LocalNotifications.checkPermissions()).display === 'granted'
  } catch {
    return false
  }
}

/** Ask iOS for notification permission (shows the system prompt once). */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    const current = await LocalNotifications.checkPermissions()
    if (current.display === 'granted') return true
    const res = await LocalNotifications.requestPermissions()
    return res.display === 'granted'
  } catch {
    return false
  }
}

/**
 * (Re)schedule the single daily reminder at `time` ("HH:MM", device-local).
 * Idempotent: cancels the previous schedule for the same id first, so calling
 * it repeatedly (settings change, app launch re-sync, language switch) is safe.
 */
export async function scheduleDailyReminder(time: string, title: string, body: string): Promise<boolean> {
  try {
    const [h, m] = (time || '21:00').split(':').map(Number)
    if (!Number.isInteger(h) || !Number.isInteger(m) || h < 0 || h > 23 || m < 0 || m > 59) return false
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    await LocalNotifications.cancel({ notifications: [{ id: REMINDER_ID }] }).catch(() => {})
    await LocalNotifications.schedule({
      notifications: [{
        id: REMINDER_ID,
        title,
        body,
        // `on: {hour, minute}` + `repeats: true` = fire DAILY at that local
        // time. Without repeats, iOS builds a one-time UNCalendarNotification-
        // Trigger that fires at the next matching time and is then consumed —
        // i.e. the reminder only ever fires once (user-reported 2026-07-22).
        schedule: { on: { hour: h, minute: m }, repeats: true, allowWhileIdle: true },
      }],
    })
    return true
  } catch {
    return false
  }
}

/** Cancel the daily reminder (toggle off). Safe on old binaries (no-op). */
export async function cancelDailyReminder(): Promise<void> {
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    await LocalNotifications.cancel({ notifications: [{ id: REMINDER_ID }] })
  } catch {
    /* plugin absent — nothing was ever scheduled on this binary */
  }
}
