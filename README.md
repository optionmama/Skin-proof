# SkinProof 🧴

**AI-powered skin health tracker and product diary — PWA**

> ⚠️ **Medical Disclaimer**: SkinProof is a personal tracking tool, not a medical device. AI analysis is for informational purposes only and does not constitute medical advice, diagnosis, or treatment. Always consult a qualified dermatologist for skin concerns.

---

## Features

- 📸 **Daily skin photo upload** with AI analysis (scores for acne, redness, hydration, texture, pigmentation)
- 📊 **Progress tracker** with charts across 7d / 30d / 90d
- 🧴 **Product diary** — log products, reactions, ratings, and notes
- ✨ **AI recommendations** ranked by skin profile match (never by affiliate commission)
- 💰 **Price comparison** across retailers with full affiliate disclosure
- 🔬 **Ingredient analysis** with comedogenic ratings and EWG scores
- 👤 **Skin profile onboarding** including Fitzpatrick scale
- 🛡️ **Admin dashboard** for managing the product database
- 📱 **PWA** — installable, offline-capable

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Auth | Supabase Auth |
| Database | Supabase PostgreSQL |
| Storage | Supabase Storage |
| AI Vision | Anthropic Claude (via API) |
| Charts | Recharts |
| PWA | Service Worker (custom) |

---

## Project Structure

```
skinproof/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Landing page
│   │   ├── auth/page.tsx               # Sign up / Login
│   │   ├── onboarding/page.tsx         # Skin profile setup
│   │   ├── privacy/page.tsx            # Privacy policy
│   │   ├── terms/page.tsx              # Terms of service
│   │   ├── dashboard/
│   │   │   ├── layout.tsx              # Auth guard + nav
│   │   │   ├── page.tsx                # Dashboard home
│   │   │   ├── checkin/page.tsx        # Daily photo upload
│   │   │   ├── scan/page.tsx           # AI scan results
│   │   │   ├── diary/
│   │   │   │   ├── page.tsx            # Product diary list
│   │   │   │   ├── add/page.tsx        # Add product
│   │   │   │   └── [id]/page.tsx       # Product log detail
│   │   │   ├── progress/page.tsx       # Progress charts
│   │   │   ├── recommendations/page.tsx# Product recommendations
│   │   │   ├── prices/[productId]/     # Price comparison
│   │   │   └── profile/page.tsx        # User profile
│   │   ├── admin/page.tsx              # Admin dashboard
│   │   └── api/
│   │       ├── analyze-skin/route.ts   # AI skin analysis endpoint
│   │       └── recommendations/route.ts# Recommendation engine
│   ├── components/
│   │   ├── DashboardNav.tsx            # Bottom navigation
│   │   ├── AdminProductTable.tsx       # Admin product management
│   │   └── ServiceWorkerRegistration.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts               # Browser Supabase client
│   │   │   └── server.ts               # Server Supabase client
│   │   └── utils.ts                    # Utilities + constants
│   ├── middleware.ts                   # Auth route protection
│   └── types/
│       └── database.ts                 # Full TypeScript DB types
├── supabase/
│   └── schema.sql                      # Complete database schema
├── public/
│   ├── manifest.json                   # PWA manifest
│   └── sw.js                           # Service worker
└── .env.local.example                  # Environment variable template
```

---

## Setup

### 1. Clone and install

```bash
git clone <your-repo>
cd skinproof
npm install
```

### 2. Set up environment variables

```bash
cp .env.local.example .env.local
# Edit .env.local with your Supabase and Anthropic keys
```

### 3. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the SQL Editor
3. Set up Storage buckets (SQL included in `.env.local.example`)
4. Copy your project URL and anon key to `.env.local`

### 4. Run locally

```bash
npm run dev
# Open http://localhost:3000
```

### 5. Deploy

```bash
# Vercel (recommended)
vercel deploy

# Or build for any platform
npm run build
npm start
```

---

## Database Schema

11 tables with Row Level Security (RLS):

| Table | Purpose |
|-------|---------|
| `users` | User accounts (extends Supabase auth) |
| `skin_profiles` | Skin type, concerns, allergies, Fitzpatrick |
| `skin_checkins` | Daily check-in data (feelings, sleep, habits) |
| `skin_photos` | Photos + AI analysis results + quality scores |
| `products` | Verified product database |
| `product_ingredients` | INCI ingredients with EWG + comedogenic data |
| `user_product_logs` | Personal product diary entries |
| `skin_outcomes` | Product outcome tracking |
| `retailers` | Retailers with affiliate disclosure fields |
| `product_prices` | Prices per retailer with per-ml calculation |
| `recommendations` | Ranked recommendations (commission-free enforced) |

---

## Affiliate Transparency

SkinProof is built with affiliate transparency as a core principle:

- **`ranking_is_commission_free BOOLEAN DEFAULT TRUE NOT NULL`** — enforced at the database level
- Commission rates are stored in the `retailers` table for admin visibility only
- Commission rates are **never** queried or used in ranking calculations
- Every affiliate link has a mandatory `affiliate_disclosure` field
- UI displays commission-free badge on all recommendation pages
- Every retailer link shows its affiliate status to the user

---

## API Endpoints

### `POST /api/analyze-skin`
Analyzes an uploaded skin photo using Claude Vision.

**Body:** `{ photo_id, image_base64, acknowledged_disclaimer: true }`

**Returns:** Skin scores (overall, acne severity, redness, hydration, texture, pigmentation, photo quality)

### `POST /api/recommendations`
Generates personalised product recommendations for the authenticated user.

**Algorithm:** Skin type match → allergen check → comedogenic rating → EWG score → concern mapping

**Commission influence:** None. Ever.

---

## Contributing

1. Fork the repo
2. Create a feature branch
3. Ensure the medical disclaimer is preserved in all relevant UI
4. Ensure affiliate disclosures are maintained
5. Submit a PR

---

## License

MIT — see LICENSE for details.
