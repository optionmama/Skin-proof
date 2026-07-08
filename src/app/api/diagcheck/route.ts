import { NextResponse } from 'next/server'

// TEMPORARY — tests whether this Vercel deployment actually lets a function run
// longer than ~10s (i.e. is maxDuration=60 honored, or is the plan capping us?).
// REMOVE after debugging.
export const maxDuration = 60

export async function GET() {
  const t0 = Date.now()
  await new Promise((r) => setTimeout(r, 15000))
  return NextResponse.json({ sleptMs: Date.now() - t0 })
}
