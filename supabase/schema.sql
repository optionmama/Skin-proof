-- =============================================
-- SkinProof Database Schema
-- Supabase / PostgreSQL
-- =============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for full-text product search

-- =============================================
-- USERS (extends Supabase auth.users)
-- =============================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male','female','non_binary','prefer_not_to_say')),
  location_country TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  is_admin BOOLEAN DEFAULT FALSE,
  -- Premium entitlement (groundwork only; defaults TRUE so everyone is unlocked
  -- while the app is free). See migrations/002_add_is_premium.sql.
  is_premium BOOLEAN NOT NULL DEFAULT TRUE,
  marketing_consent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SKIN PROFILES
-- =============================================
CREATE TABLE public.skin_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  skin_type TEXT CHECK (skin_type IN ('oily','dry','combination','normal','sensitive')),
  primary_concerns TEXT[], -- e.g. ['acne','hyperpigmentation','wrinkles']
  known_allergies TEXT[],
  known_sensitivities TEXT[],
  current_medications TEXT,
  dermatologist_care BOOLEAN DEFAULT FALSE,
  fitzpatrick_scale INT CHECK (fitzpatrick_scale BETWEEN 1 AND 6),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- =============================================
-- SKIN CHECK-INS (daily log metadata)
-- =============================================
CREATE TABLE public.skin_checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  checkin_date DATE NOT NULL DEFAULT CURRENT_DATE,
  overall_feeling INT CHECK (overall_feeling BETWEEN 1 AND 10),
  hydration_level INT CHECK (hydration_level BETWEEN 1 AND 10),
  oiliness_level INT CHECK (oiliness_level BETWEEN 1 AND 10),
  redness_level INT CHECK (redness_level BETWEEN 1 AND 10),
  breakout_count INT DEFAULT 0,
  stress_level INT CHECK (stress_level BETWEEN 1 AND 10),
  sleep_hours DECIMAL(4,1),
  water_intake_ml INT,
  notes TEXT,
  weather_condition TEXT,
  humidity_pct INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, checkin_date)
);

-- =============================================
-- SKIN PHOTOS
-- =============================================
CREATE TABLE public.skin_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  checkin_id UUID REFERENCES public.skin_checkins(id) ON DELETE SET NULL,
  storage_path TEXT NOT NULL,           -- original photo in Supabase Storage
  thumbnail_path TEXT,                   -- compressed thumbnail
  photo_angle TEXT CHECK (photo_angle IN ('front','left','right','forehead','chin','cheeks')),
  photo_quality_score DECIMAL(5,2),     -- 0-100 AI-assessed quality
  quality_flags TEXT[],                  -- e.g. ['blurry','poor_lighting','obstructed']
  -- AI Analysis fields
  ai_analysis_raw JSONB,                 -- full AI response JSON
  ai_analysis_version TEXT,             -- model/version used
  ai_analyzed_at TIMESTAMPTZ,
  -- Detected conditions (AI output, NOT medical diagnosis)
  detected_concerns TEXT[],
  acne_severity TEXT CHECK (acne_severity IN ('none','mild','moderate','severe')),
  redness_score DECIMAL(5,2),           -- 0-100
  hydration_score DECIMAL(5,2),         -- 0-100
  texture_score DECIMAL(5,2),           -- 0-100
  pigmentation_score DECIMAL(5,2),      -- 0-100
  overall_skin_score DECIMAL(5,2),      -- 0-100 composite
  -- Disclaimer acknowledgement
  user_acknowledged_disclaimer BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PRODUCTS
-- =============================================
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'cleanser','toner','serum','moisturizer','sunscreen',
    'eye_cream','mask','exfoliant','treatment','oil',
    'mist','balm','spf_makeup','other'
  )),
  subcategory TEXT,
  description TEXT,
  image_url TEXT,
  barcode TEXT UNIQUE,
  size_ml DECIMAL(8,2),
  size_oz DECIMAL(8,2),
  cruelty_free BOOLEAN,
  vegan BOOLEAN,
  fragrance_free BOOLEAN,
  alcohol_free BOOLEAN,
  reef_safe BOOLEAN,
  dermatologist_tested BOOLEAN,
  spf_rating INT,
  suitable_skin_types TEXT[],
  target_concerns TEXT[],
  is_verified BOOLEAN DEFAULT FALSE,   -- admin-verified product entry
  added_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PRODUCT INGREDIENTS
-- =============================================
CREATE TABLE public.product_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  ingredient_name TEXT NOT NULL,
  inci_name TEXT,                        -- International Nomenclature Cosmetic Ingredient
  position INT,                          -- order on label (lower = higher concentration)
  is_active_ingredient BOOLEAN DEFAULT FALSE,
  known_benefits TEXT[],
  known_irritants_for TEXT[],            -- e.g. ['sensitive','rosacea']
  comedogenic_rating INT CHECK (comedogenic_rating BETWEEN 0 AND 5),
  ewg_score INT CHECK (ewg_score BETWEEN 1 AND 10),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- USER PRODUCT LOGS (product diary)
-- =============================================
CREATE TABLE public.user_product_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  started_using DATE,
  stopped_using DATE,
  is_current BOOLEAN DEFAULT TRUE,
  usage_frequency TEXT CHECK (usage_frequency IN ('daily_am','daily_pm','twice_daily','as_needed','weekly','other')),
  user_rating INT CHECK (user_rating BETWEEN 1 AND 5),
  user_review TEXT,
  repurchase_intent BOOLEAN,
  skin_reaction TEXT CHECK (skin_reaction IN ('positive','neutral','negative','allergic')),
  reaction_notes TEXT,
  purchased_from TEXT,
  purchase_price DECIMAL(10,2),
  purchase_currency TEXT DEFAULT 'USD',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SKIN OUTCOMES (link products to outcomes)
-- =============================================
CREATE TABLE public.skin_outcomes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  product_log_id UUID REFERENCES public.user_product_logs(id) ON DELETE SET NULL,
  checkin_id UUID REFERENCES public.skin_checkins(id) ON DELETE SET NULL,
  outcome_type TEXT NOT NULL CHECK (outcome_type IN (
    'improvement','no_change','worsening','breakout','allergic_reaction',
    'purging','sensitivity','dryness','oiliness','redness'
  )),
  affected_concerns TEXT[],
  confidence_level INT CHECK (confidence_level BETWEEN 1 AND 5),
  notes TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- RETAILERS
-- =============================================
CREATE TABLE public.retailers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  website_url TEXT,
  logo_url TEXT,
  country TEXT,
  is_online BOOLEAN DEFAULT TRUE,
  -- Transparency fields
  has_affiliate_relationship BOOLEAN DEFAULT FALSE,
  affiliate_disclosure TEXT,            -- REQUIRED if has_affiliate_relationship=true
  -- e.g. "SkinProof may earn a commission from purchases via this link"
  commission_rate_pct DECIMAL(5,2),     -- stored for admin transparency, NOT used for ranking
  is_verified_seller BOOLEAN DEFAULT FALSE,
  return_policy_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PRODUCT PRICES (per retailer)
-- =============================================
CREATE TABLE public.product_prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  retailer_id UUID NOT NULL REFERENCES public.retailers(id) ON DELETE CASCADE,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  price_per_ml DECIMAL(10,4),           -- calculated field for fair comparison
  is_sale BOOLEAN DEFAULT FALSE,
  sale_ends_at TIMESTAMPTZ,
  product_url TEXT,                     -- direct product page URL
  affiliate_url TEXT,                   -- affiliate link (separate from product URL)
  -- Affiliate disclosure is REQUIRED if affiliate_url is set
  affiliate_disclosure TEXT,
  in_stock BOOLEAN DEFAULT TRUE,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  verified_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- RECOMMENDATIONS
-- =============================================
CREATE TABLE public.recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  recommendation_type TEXT CHECK (recommendation_type IN (
    'ai_generated','community','expert','trending'
  )),
  -- IMPORTANT: ranking_score is based ONLY on skin match, ingredients, and user outcomes
  -- It is NEVER influenced by affiliate commission rates
  ranking_score DECIMAL(8,4),
  match_reason TEXT[],                   -- e.g. ['matches_skin_type','targets_acne','fragrance_free']
  ingredient_compatibility_score DECIMAL(5,2),
  community_efficacy_score DECIMAL(5,2),
  ai_confidence DECIMAL(5,2),
  is_dismissed BOOLEAN DEFAULT FALSE,
  dismissed_reason TEXT,
  is_saved BOOLEAN DEFAULT FALSE,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  -- Explicit confirmation ranking is commission-free
  ranking_is_commission_free BOOLEAN DEFAULT TRUE NOT NULL,
  UNIQUE(user_id, product_id)
);

-- =============================================
-- USER PRODUCTS (personal product list for routines)
-- =============================================
CREATE TABLE public.user_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  brand TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL,
  category TEXT CHECK (category IN (
    'cleanser','toner','serum','moisturizer','eye_cream',
    'sunscreen','treatment','other'
  )),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_products_own" ON public.user_products FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_user_products_user ON public.user_products(user_id, is_active);

-- =============================================
-- USER ROUTINES (AM / PM product order)
-- =============================================
CREATE TABLE public.user_routines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.user_products(id) ON DELETE CASCADE,
  routine_type TEXT NOT NULL CHECK (routine_type IN ('am','pm','both')),
  step_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id, routine_type)
);

ALTER TABLE public.user_routines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_routines_own" ON public.user_routines FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_user_routines_user ON public.user_routines(user_id, is_active);

-- Also add skin_profiles column for routine setup tracking
ALTER TABLE public.skin_profiles
  ADD COLUMN IF NOT EXISTS routine_setup_completed_at TIMESTAMPTZ;

-- =============================================
-- CHECKIN PRODUCTS (products used during check-in)
-- =============================================
CREATE TABLE public.checkin_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  checkin_id UUID NOT NULL REFERENCES public.skin_checkins(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_product_id UUID REFERENCES public.user_products(id) ON DELETE SET NULL,
  brand TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL,
  category TEXT,
  is_temporary BOOLEAN DEFAULT FALSE,
  used_am BOOLEAN DEFAULT FALSE,
  used_pm BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.checkin_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "checkin_products_own" ON public.checkin_products FOR ALL USING (auth.uid() = user_id);

-- Also add missing columns to skin_checkins
ALTER TABLE public.skin_checkins
  ADD COLUMN IF NOT EXISTS photo_id UUID REFERENCES public.skin_photos(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ DEFAULT NOW();

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_skin_checkins_user_date ON public.skin_checkins(user_id, checkin_date DESC);
CREATE INDEX idx_skin_photos_user ON public.skin_photos(user_id, created_at DESC);
CREATE INDEX idx_skin_photos_checkin ON public.skin_photos(checkin_id);
CREATE INDEX idx_user_product_logs_user ON public.user_product_logs(user_id, is_current);
CREATE INDEX idx_product_prices_product ON public.product_prices(product_id);
CREATE INDEX idx_recommendations_user ON public.recommendations(user_id, ranking_score DESC);
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_brand_name ON public.products USING gin(to_tsvector('english', brand || ' ' || name));

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skin_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skin_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_product_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skin_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retailers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_prices ENABLE ROW LEVEL SECURITY;

-- Users can only see/edit their own data
CREATE POLICY "users_own_data" ON public.users FOR ALL USING (auth.uid() = id);
CREATE POLICY "skin_profiles_own" ON public.skin_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "skin_checkins_own" ON public.skin_checkins FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "skin_photos_own" ON public.skin_photos FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "product_logs_own" ON public.user_product_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "skin_outcomes_own" ON public.skin_outcomes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "recommendations_own" ON public.recommendations FOR ALL USING (auth.uid() = user_id);

-- Products, retailers, prices: read for all authenticated, write for admin
CREATE POLICY "products_read" ON public.products FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "products_write_admin" ON public.products FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = TRUE)
);
CREATE POLICY "ingredients_read" ON public.product_ingredients FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "retailers_read" ON public.retailers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "retailers_write_admin" ON public.retailers FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = TRUE)
);
CREATE POLICY "prices_read" ON public.product_prices FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "prices_write_admin" ON public.product_prices FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = TRUE)
);

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Auto-create user record after auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update updated_at timestamps
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER skin_profiles_updated_at BEFORE UPDATE ON public.skin_profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER skin_checkins_updated_at BEFORE UPDATE ON public.skin_checkins FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER product_logs_updated_at BEFORE UPDATE ON public.user_product_logs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Calculate price_per_ml automatically
CREATE OR REPLACE FUNCTION public.calculate_price_per_ml()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.price IS NOT NULL THEN
    SELECT
      CASE WHEN p.size_ml > 0 THEN NEW.price / p.size_ml ELSE NULL END
    INTO NEW.price_per_ml
    FROM public.products p WHERE p.id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER product_prices_calc BEFORE INSERT OR UPDATE ON public.product_prices FOR EACH ROW EXECUTE FUNCTION public.calculate_price_per_ml();

-- =============================================
-- STORAGE BUCKETS (run in Supabase dashboard)
-- =============================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('skin-photos', 'skin-photos', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', false);

-- Storage policies
-- CREATE POLICY "skin_photos_user_access" ON storage.objects FOR ALL USING (
--   bucket_id = 'skin-photos' AND auth.uid()::text = (storage.foldername(name))[1]
-- );
