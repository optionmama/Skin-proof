# SkinProof — Development Progress (2026-06-13)

## Summary of changes shipped today

---

### 1. Landing page visual redesign (feat: redesign landing page)
- Replaced text-heavy layout with visual-first editorial design
- New hero: model portrait (`landing page pic.webp`) + 3 floating AI score cards (HYDRATION 87, TEXTURE 92, RADIANCE 79) + AI Scanning pill
- Hero headline: "Your skin story, *clearly proven*" with terracotta italic
- Three steps section: full-width alternating image/text layout (60%/40%)
- Stats section: +12pts / 89% / 14 days cards + results banner image
- Transparency strip: NO PAID RANKINGS · REAL DATA ONLY · YOUR PHOTOS STAY PRIVATE
- Color palette: background #FAF7F5, accent #C4836A, text #2C1810, secondary #8B6355

### 2. Three steps section redesign (feat: redesign three-step section with new photos)
- Downloaded 3 new step images to `public/landing/steps/`:
  - `step1-selfie.jpg` — model taking selfie (Step 01 · Daily Scan)
  - `step2-lookscreen.jpg` — model looking at phone screen (Step 02 · Routine Check)
  - `step3-result.jpg` — model holding phone showing SkinProof app (Step 03 · Glass Skin)
- Mobile: stacked layout with rounded image cards (border-radius 20px)
- Desktop: alternating 60%/40% flex layout with `box-sizing: border-box` fix

### 3. Hero section restored (fix: restore hero section to original design with score cards)
- Hero had been accidentally replaced with plain overhead photo
- Restored model portrait, 3 floating score cards, AI Scanning pill, original headline and CTA

### 4. Three-step face-crop fix (fix: three-step images no longer crop faces)
**Problem:** All 3 step images are 9:16 portrait (1289×2305). The container was
landscape (min-height 540px, width ~60%), so `object-cover` only showed the top
35% of each photo — cutting off faces.

**Fix:**
- Changed `.step-block-image` from `min-height: 540px` (inherited) to `aspect-ratio: 3/4`
- Container is now portrait-shaped: at 733px wide → 977px tall
- Shows 74.5% of each portrait photo from top → faces fully visible on all 3 steps
- Mobile: replaced `height: 70vw; max-height: 420px` with `aspect-ratio: 3/4` — same fix
- Added `quality={90}` to all 3 Image components (was blurry due to over-compression)
- Adjusted `objectPosition` per image: step1 → `center 10%`, step2 → `center 12%`, step3 → `center 8%`

---

## Files modified
- `src/app/page.tsx` — all landing page changes
- `public/landing/steps/step1-selfie.jpg` — new image
- `public/landing/steps/step2-lookscreen.jpg` — new image
- `public/landing/steps/step3-result.jpg` — new image
- `public/landing page pic.webp` — hero portrait (existing)

## Live site
https://skin-proof-23zt.vercel.app
