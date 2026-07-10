export type SkinType = 'oily' | 'dry' | 'combination' | 'normal' | 'sensitive'
export type ProductCategory =
  | 'cleanser' | 'toner' | 'serum' | 'moisturizer' | 'sunscreen'
  | 'eye_cream' | 'mask' | 'exfoliant' | 'treatment' | 'oil'
  | 'mist' | 'balm' | 'spf_makeup' | 'other'
export type SkinReaction = 'positive' | 'neutral' | 'negative' | 'allergic'
export type UsageFrequency = 'daily_am' | 'daily_pm' | 'twice_daily' | 'as_needed' | 'weekly' | 'other'
export type PhotoAngle = 'front' | 'left' | 'right' | 'forehead' | 'chin' | 'cheeks'
export type AcneSeverity = 'none' | 'mild' | 'moderate' | 'severe'
export type OutcomeType =
  | 'improvement' | 'no_change' | 'worsening' | 'breakout'
  | 'allergic_reaction' | 'purging' | 'sensitivity' | 'dryness' | 'oiliness' | 'redness'
export type RecommendationType = 'ai_generated' | 'community' | 'expert' | 'trending'

export interface User {
  id: string
  email: string
  display_name?: string
  avatar_url?: string
  date_of_birth?: string
  gender?: 'male' | 'female' | 'non_binary' | 'prefer_not_to_say'
  location_country?: string
  onboarding_completed: boolean
  is_admin: boolean
  /** Premium entitlement (groundwork; defaults true while the app is free). */
  is_premium: boolean
  marketing_consent: boolean
  created_at: string
  updated_at: string
}

export interface SkinProfile {
  id: string
  user_id: string
  skin_type?: SkinType
  primary_concerns?: string[]
  known_allergies?: string[]
  known_sensitivities?: string[]
  current_medications?: string
  dermatologist_care: boolean
  fitzpatrick_scale?: number
  notes?: string
  created_at: string
  updated_at: string
}

export interface SkinCheckin {
  id: string
  user_id: string
  checkin_date: string
  /** The photo this check-in is linked to (skin_photos.id). */
  photo_id?: string | null
  overall_feeling?: number
  hydration_level?: number
  oiliness_level?: number
  redness_level?: number
  breakout_count: number
  stress_level?: number
  sleep_hours?: number
  water_intake_ml?: number
  notes?: string
  weather_condition?: string
  humidity_pct?: number
  created_at: string
  updated_at: string
}

export interface SkinPhoto {
  id: string
  user_id: string
  checkin_id?: string
  storage_path: string
  thumbnail_path?: string
  photo_angle?: PhotoAngle
  photo_quality_score?: number
  quality_flags?: string[]
  ai_analysis_raw?: Record<string, unknown>
  ai_analysis_version?: string
  ai_analyzed_at?: string
  detected_concerns?: string[]
  acne_severity?: AcneSeverity
  redness_score?: number
  hydration_score?: number
  texture_score?: number
  pigmentation_score?: number
  overall_skin_score?: number
  user_acknowledged_disclaimer: boolean
  created_at: string
}

export interface Product {
  id: string
  name: string
  brand: string
  category: ProductCategory
  subcategory?: string
  description?: string
  image_url?: string
  barcode?: string
  size_ml?: number
  size_oz?: number
  cruelty_free?: boolean
  vegan?: boolean
  fragrance_free?: boolean
  alcohol_free?: boolean
  reef_safe?: boolean
  dermatologist_tested?: boolean
  spf_rating?: number
  suitable_skin_types?: string[]
  target_concerns?: string[]
  is_verified: boolean
  added_by_user_id?: string
  created_at: string
  updated_at: string
}

export interface ProductIngredient {
  id: string
  product_id: string
  ingredient_name: string
  inci_name?: string
  position?: number
  is_active_ingredient: boolean
  known_benefits?: string[]
  known_irritants_for?: string[]
  comedogenic_rating?: number
  ewg_score?: number
  created_at: string
}

export interface UserProductLog {
  id: string
  user_id: string
  product_id: string
  started_using?: string
  stopped_using?: string
  is_current: boolean
  usage_frequency?: UsageFrequency
  user_rating?: number
  user_review?: string
  repurchase_intent?: boolean
  skin_reaction?: SkinReaction
  reaction_notes?: string
  purchased_from?: string
  purchase_price?: number
  purchase_currency: string
  notes?: string
  created_at: string
  updated_at: string
  product?: Product
}

export interface SkinOutcome {
  id: string
  user_id: string
  product_log_id?: string
  checkin_id?: string
  outcome_type: OutcomeType
  affected_concerns?: string[]
  confidence_level?: number
  notes?: string
  recorded_at: string
}

export interface Retailer {
  id: string
  name: string
  website_url?: string
  logo_url?: string
  country?: string
  is_online: boolean
  has_affiliate_relationship: boolean
  affiliate_disclosure?: string
  commission_rate_pct?: number
  is_verified_seller: boolean
  return_policy_url?: string
  created_at: string
  updated_at: string
}

export interface ProductPrice {
  id: string
  product_id: string
  retailer_id: string
  price: number
  currency: string
  price_per_ml?: number
  is_sale: boolean
  sale_ends_at?: string
  product_url?: string
  affiliate_url?: string
  affiliate_disclosure?: string
  in_stock: boolean
  last_updated: string
  verified_by_user_id?: string
  created_at: string
  retailer?: Retailer
}

export interface Recommendation {
  id: string
  user_id: string
  product_id: string
  recommendation_type?: RecommendationType
  ranking_score?: number
  match_reason?: string[]
  ingredient_compatibility_score?: number
  community_efficacy_score?: number
  ai_confidence?: number
  is_dismissed: boolean
  dismissed_reason?: string
  is_saved: boolean
  generated_at: string
  expires_at?: string
  ranking_is_commission_free: boolean
  product?: Product
}

export interface Database {
  public: {
    Tables: {
      users: { Row: User; Insert: Omit<User, 'created_at' | 'updated_at'>; Update: Partial<User> }
      skin_profiles: { Row: SkinProfile; Insert: Omit<SkinProfile, 'id' | 'created_at' | 'updated_at'>; Update: Partial<SkinProfile> }
      skin_checkins: { Row: SkinCheckin; Insert: Omit<SkinCheckin, 'id' | 'created_at' | 'updated_at'>; Update: Partial<SkinCheckin> }
      skin_photos: { Row: SkinPhoto; Insert: Omit<SkinPhoto, 'id' | 'created_at'>; Update: Partial<SkinPhoto> }
      products: { Row: Product; Insert: Omit<Product, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Product> }
      product_ingredients: { Row: ProductIngredient; Insert: Omit<ProductIngredient, 'id' | 'created_at'>; Update: Partial<ProductIngredient> }
      user_product_logs: { Row: UserProductLog; Insert: Omit<UserProductLog, 'id' | 'created_at' | 'updated_at'>; Update: Partial<UserProductLog> }
      skin_outcomes: { Row: SkinOutcome; Insert: Omit<SkinOutcome, 'id'>; Update: Partial<SkinOutcome> }
      retailers: { Row: Retailer; Insert: Omit<Retailer, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Retailer> }
      product_prices: { Row: ProductPrice; Insert: Omit<ProductPrice, 'id' | 'created_at'>; Update: Partial<ProductPrice> }
      recommendations: { Row: Recommendation; Insert: Omit<Recommendation, 'id'>; Update: Partial<Recommendation> }
    }
  }
}
