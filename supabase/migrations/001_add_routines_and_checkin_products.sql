-- =============================================
-- Migration 001: Add user_products, user_routines,
--                checkin_products tables + missing columns
-- Run this in Supabase Dashboard → SQL Editor
-- =============================================

-- USER PRODUCTS（使用者的個人產品清單，用於 Routine）
CREATE TABLE IF NOT EXISTS public.user_products (
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

DROP POLICY IF EXISTS "user_products_own" ON public.user_products;
CREATE POLICY "user_products_own" ON public.user_products FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_products_user ON public.user_products(user_id, is_active);

-- USER ROUTINES（早 / 晚保養順序）
CREATE TABLE IF NOT EXISTS public.user_routines (
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

DROP POLICY IF EXISTS "user_routines_own" ON public.user_routines;
CREATE POLICY "user_routines_own" ON public.user_routines FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_routines_user ON public.user_routines(user_id, is_active);

-- CHECKIN PRODUCTS（每次 check-in 使用的產品記錄）
CREATE TABLE IF NOT EXISTS public.checkin_products (
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

DROP POLICY IF EXISTS "checkin_products_own" ON public.checkin_products;
CREATE POLICY "checkin_products_own" ON public.checkin_products FOR ALL USING (auth.uid() = user_id);

-- 補上 skin_profiles 缺少的欄位
ALTER TABLE public.skin_profiles
  ADD COLUMN IF NOT EXISTS routine_setup_completed_at TIMESTAMPTZ;

-- 補上 skin_checkins 缺少的欄位
ALTER TABLE public.skin_checkins
  ADD COLUMN IF NOT EXISTS photo_id UUID REFERENCES public.skin_photos(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ DEFAULT NOW();
