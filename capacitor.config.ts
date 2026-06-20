import type { CapacitorConfig } from '@capacitor/cli'

/**
 * Capacitor v1 strategy: load the already-tested Vercel deployment directly via
 * `server.url`. This keeps every server-side feature (AI analysis, dynamic
 * rendering) intact with zero changes to the existing web app — the iOS binary
 * is a thin native shell around the live site, plus native camera (see
 * src/lib/native/camera.ts) so the app has genuine native capability.
 *
 * `webDir` points at a small placeholder page that shows briefly before the
 * remote URL loads and gives `cap sync` a valid directory to copy.
 *
 * v2 option (NOT done now): bundle statically for a fully native/offline build
 * by switching Next.js to `output: 'export'`, moving server-side API routes to
 * Supabase Edge Functions, pointing `webDir` at the exported `out/`, and
 * dropping `server.url`.
 */
const config: CapacitorConfig = {
  appId: 'app.skinproof.ios', // Bundle ID — must stay exactly this, do not change
  appName: 'SkinProof',
  webDir: 'capacitor/www',
  server: {
    url: 'https://skin-proof-23zt.vercel.app',
    cleartext: false,
  },
}

export default config
