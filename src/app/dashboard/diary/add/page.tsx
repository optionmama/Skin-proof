'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft, Search, Plus, Star, AlertTriangle,
  CheckCircle2, Camera, Sparkles, Loader2, X
} from 'lucide-react'

const REACTION_TAGS = [
  { value: 'none', label: '✅ No reaction', color: 'bg-sage-100 text-sage-700 border-sage-200' },
  { value: 'breakout', label: '⚠️ Breakout', color: 'bg-red-100 text-red-700 border-red-200' },
  { value: 'redness', label: '🔴 Redness', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { value: 'dryness', label: '🏜️ Dryness', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'irritation', label: '😣 Irritation', color: 'bg-red-100 text-red-700 border-red-200' },
  { value: 'purging', label: '🔄 Purging', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { value: 'improved', label: '✨ Improved', color: 'bg-skin-100 text-skin-700 border-skin-200' },
  { value: 'hydrating', label: '💧 Hydrating', color: 'bg-blue-100 text-blue-700 border-blue-200' },
]

const USAGE_OPTIONS = [
  { value: 'daily_am', label: 'Daily AM' },
  { value: 'daily_pm', label: 'Daily PM' },
  { value: 'twice_daily', label: 'Twice Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'as_needed', label: 'As Needed' },
  { value: 'occasional', label: 'Occasional' },
]

interface ProductResult {
  id: string
  name: string
  brand: string
  category: string
  is_verified: boolean
}

interface AIIdentified {
  brand: string | null
  name: string | null
  category: string
  confidence: number
  notes: string
}

export default function AddToDiaryPage() {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Step: 'scan' | 'search' | 'details'
  const [step, setStep] = useState<'scan' | 'search' | 'details'>('scan')

  // Photo scan state
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [isIdentifying, setIsIdentifying] = useState(false)
  const [identified, setIdentified] = useState<AIIdentified | null>(null)
  const [identifyError, setIdentifyError] = useState('')

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ProductResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<ProductResult | null>(null)

  // Details state
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [usage, setUsage] = useState('')
  const [reaction, setReaction] = useState('')
  const [notes, setNotes] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // ── Photo handling ────────────────────────────────────────────────────────

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve((reader.result as string).split(',')[1])
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoPreview(URL.createObjectURL(file))
    setIdentifyError('')
    setIsIdentifying(true)

    try {
      const image_base64 = await fileToBase64(file)
      const res = await fetch('/api/identify-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64 }),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Identification failed')

      setIdentified(data.identified)

      // Pre-fill search with identified name/brand
      if (data.identified.confidence >= 50) {
        const q = [data.identified.brand, data.identified.name].filter(Boolean).join(' ')
        setSearchQuery(q)
        if (data.matched_products?.length > 0) {
          setSearchResults(data.matched_products)
        }
      }
    } catch (err) {
      setIdentifyError(err instanceof Error ? err.message : 'Could not identify product')
    } finally {
      setIsIdentifying(false)
    }
  }, [])

  // ── Search ────────────────────────────────────────────────────────────────

  const handleSearch = async (q: string) => {
    setSearchQuery(q)
    if (q.length < 2) { setSearchResults([]); return }
    setIsSearching(true)
    const { data } = await supabase
      .from('products')
      .select('id, name, brand, category, is_verified')
      .or(`name.ilike.%${q}%,brand.ilike.%${q}%`)
      .limit(8)
    setSearchResults(data || [])
    setIsSearching(false)
  }

  const handleSelectProduct = (product: ProductResult) => {
    setSelectedProduct(product)
    setStep('details')
  }

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!selectedProduct) return
    setIsSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth'); return }

    await supabase.from('user_product_logs').insert({
      user_id: user.id,
      product_id: selectedProduct.id,
      usage_frequency: usage || null,
      user_rating: rating || null,
      skin_reaction: reaction || null,
      notes: notes || null,
      purchase_price: purchasePrice ? parseFloat(purchasePrice) : null,
      started_using_at: startDate,
    })

    setSaved(true)
    setTimeout(() => router.push('/dashboard/diary'), 1500)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (saved) {
    return (
      <div className="min-h-screen bg-skin-50 flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-sage-100 flex items-center justify-center mx-auto">
            <CheckCircle2 className="text-sage-600" size={40} />
          </div>
          <h2 className="font-display text-2xl text-charcoal-800">Added to your diary</h2>
          <p className="text-charcoal-500 text-sm">Redirecting you back…</p>
        </div>
      </div>
    )
  }

  const stepIndex = step === 'scan' ? 0 : step === 'search' ? 1 : 2

  return (
    <div className="min-h-screen bg-skin-50 pb-24">
      {/* Header */}
      <div className="bg-skin-50/80 backdrop-blur-sm border-b border-skin-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/dashboard/diary" className="p-2 hover:bg-skin-100 rounded-xl transition-colors">
            <ArrowLeft size={20} className="text-charcoal-600" />
          </Link>
          <div className="flex-1">
            <h1 className="font-display text-xl text-charcoal-800">Add to Diary</h1>
            {step === 'details' && selectedProduct && (
              <p className="text-xs text-charcoal-500">{selectedProduct.brand} · {selectedProduct.name}</p>
            )}
          </div>
        </div>
        {/* Step progress */}
        <div className="flex gap-1 px-4 pb-3">
          {['Scan', 'Search', 'Details'].map((label, i) => (
            <div key={label} className="flex-1 flex flex-col gap-1">
              <div className={`h-1 rounded-full transition-all ${i <= stepIndex ? 'bg-skin-500' : 'bg-skin-200'}`} />
              <span className={`text-[10px] text-center ${i === stepIndex ? 'text-skin-600 font-medium' : 'text-charcoal-400'}`}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* ── STEP 1: SCAN ──────────────────────────────────────────────── */}
        {step === 'scan' && (
          <>
            <div className="text-center py-4">
              <h2 className="font-display text-2xl font-light text-charcoal-900 mb-2">
                Scan your product
              </h2>
              <p className="text-sm text-charcoal-500 font-body">
                Take a photo of the product packaging.<br/>AI will identify the brand and name.
              </p>
            </div>

            {/* Photo area */}
            {!photoPreview ? (
              <div
                className="border-2 border-dashed border-skin-300 rounded-2xl p-10 text-center cursor-pointer hover:border-skin-400 hover:bg-skin-50 transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-16 h-16 rounded-2xl bg-skin-100 flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-8 h-8 text-skin-500" />
                </div>
                <p className="font-medium text-charcoal-800 mb-1">Take or upload photo</p>
                <p className="text-sm text-charcoal-400 font-body">Point at the product label</p>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden bg-charcoal-900">
                <img src={photoPreview} alt="Product" className="w-full h-56 object-cover" />
                {!isIdentifying && (
                  <button
                    onClick={() => {
                      setPhotoPreview(null)
                      setIdentified(null)
                      setIdentifyError('')
                      setSearchResults([])
                      setSearchQuery('')
                    }}
                    className="absolute top-3 right-3 bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center backdrop-blur"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                {/* Identifying overlay */}
                {isIdentifying && (
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center backdrop-blur-sm">
                    <Loader2 className="w-8 h-8 text-white animate-spin mb-3" />
                    <p className="text-white text-sm font-medium">AI identifying product…</p>
                  </div>
                )}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileSelect}
            />

            {/* AI result */}
            {identified && !isIdentifying && (
              <div className={`rounded-2xl p-4 border ${
                identified.confidence >= 70
                  ? 'bg-sage-50 border-sage-200'
                  : identified.confidence >= 40
                  ? 'bg-cream-50 border-cream-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-start gap-3">
                  <Sparkles className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                    identified.confidence >= 70 ? 'text-sage-500' : 'text-amber-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-charcoal-800 mb-0.5">
                      {identified.confidence >= 70 ? 'Product identified' :
                       identified.confidence >= 40 ? 'Possible match' :
                       'Could not identify'}
                    </p>
                    {identified.brand && (
                      <p className="text-sm text-charcoal-700">
                        <span className="font-medium">{identified.brand}</span>
                        {identified.name && ` — ${identified.name}`}
                      </p>
                    )}
                    <p className="text-xs text-charcoal-500 mt-1 font-body">
                      Confidence: {identified.confidence}% · {identified.category}
                    </p>
                    {identified.notes && (
                      <p className="text-xs text-charcoal-400 mt-1 font-body">{identified.notes}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {identifyError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-sm text-red-700 font-body">{identifyError}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-2">
              {photoPreview && !isIdentifying && (
                <button
                  onClick={() => setStep('search')}
                  className="w-full bg-skin-500 text-white py-3.5 rounded-xl font-medium hover:bg-skin-600 transition-all"
                >
                  {identified && identified.confidence >= 50
                    ? 'Confirm & search →'
                    : 'Search manually →'}
                </button>
              )}
              <button
                onClick={() => setStep('search')}
                className="w-full py-3 text-sm text-charcoal-500 hover:text-charcoal-700 transition-colors"
              >
                Skip — search manually
              </button>
            </div>
          </>
        )}

        {/* ── STEP 2: SEARCH ────────────────────────────────────────────── */}
        {step === 'search' && (
          <>
            {/* Show AI result as hint if available */}
            {identified && identified.confidence >= 50 && (
              <div className="flex items-center gap-2 bg-skin-50 border border-skin-200 rounded-xl p-3">
                <Sparkles className="w-4 h-4 text-skin-500 shrink-0" />
                <p className="text-xs text-charcoal-600 font-body">
                  AI identified: <strong>{[identified.brand, identified.name].filter(Boolean).join(' — ')}</strong>
                </p>
              </div>
            )}

            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal-400" />
              <input
                autoFocus
                type="text"
                placeholder="Search by product name or brand…"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-skin-200 rounded-2xl text-charcoal-800 placeholder:text-charcoal-400 focus:outline-none focus:border-skin-400 text-sm font-body"
              />
            </div>

            {isSearching && (
              <div className="text-center py-8 text-charcoal-400 text-sm font-body">Searching…</div>
            )}

            {!isSearching && searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectProduct(p)}
                    className="w-full text-left bg-white border border-skin-100 rounded-2xl p-4 hover:border-skin-300 hover:shadow-sm transition-all flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-charcoal-800 text-sm">{p.name}</span>
                        {p.is_verified && (
                          <span className="text-[10px] bg-sage-100 text-sage-700 px-1.5 py-0.5 rounded-full">Verified</span>
                        )}
                      </div>
                      <span className="text-xs text-charcoal-500 font-body">{p.brand} · {p.category}</span>
                    </div>
                    <Plus size={18} className="text-skin-500 flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}

            {!isSearching && searchQuery.length >= 2 && searchResults.length === 0 && (
              <div className="text-center py-8 space-y-2">
                <p className="text-charcoal-500 text-sm font-body">No products found for "{searchQuery}"</p>
                <p className="text-charcoal-400 text-xs font-body">Try a different name or brand</p>
              </div>
            )}

            {searchQuery.length === 0 && (
              <div className="text-center py-12 space-y-2">
                <Search size={40} className="text-skin-200 mx-auto" />
                <p className="text-charcoal-500 text-sm font-body">Search our product database</p>
              </div>
            )}
          </>
        )}

        {/* ── STEP 3: DETAILS ───────────────────────────────────────────── */}
        {step === 'details' && selectedProduct && (
          <>
            {/* Product card */}
            <div className="bg-white border border-skin-100 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-skin-50 flex items-center justify-center text-xl">
                  🧴
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-charcoal-800">{selectedProduct.name}</h3>
                  <p className="text-sm text-charcoal-500 font-body">{selectedProduct.brand} · {selectedProduct.category}</p>
                </div>
                <button
                  onClick={() => { setSelectedProduct(null); setStep('search') }}
                  className="text-xs text-skin-600 hover:underline"
                >
                  Change
                </button>
              </div>
            </div>

            {/* Star rating */}
            <div className="bg-white border border-skin-100 rounded-2xl p-5 space-y-3">
              <h3 className="font-semibold text-charcoal-800 text-sm">Your Rating</h3>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      size={28}
                      className={star <= (hoverRating || rating) ? 'text-amber-400 fill-amber-400' : 'text-charcoal-200'}
                    />
                  </button>
                ))}
                {rating > 0 && (
                  <span className="text-sm text-charcoal-500 self-center ml-1 font-body">
                    {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][rating]}
                  </span>
                )}
              </div>
            </div>

            {/* Usage frequency */}
            <div className="bg-white border border-skin-100 rounded-2xl p-5 space-y-3">
              <h3 className="font-semibold text-charcoal-800 text-sm">Usage Frequency</h3>
              <div className="flex flex-wrap gap-2">
                {USAGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setUsage(usage === opt.value ? '' : opt.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      usage === opt.value
                        ? 'bg-skin-500 text-white border-skin-500'
                        : 'bg-skin-50 text-charcoal-600 border-skin-200 hover:border-skin-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Skin reaction */}
            <div className="bg-white border border-skin-100 rounded-2xl p-5 space-y-3">
              <h3 className="font-semibold text-charcoal-800 text-sm">Skin Reaction</h3>
              <div className="flex flex-wrap gap-2">
                {REACTION_TAGS.map((tag) => (
                  <button
                    key={tag.value}
                    onClick={() => setReaction(reaction === tag.value ? '' : tag.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      reaction === tag.value
                        ? `${tag.color} ring-2 ring-offset-1 ring-current`
                        : `${tag.color} opacity-60 hover:opacity-100`
                    }`}
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Start date + price */}
            <div className="bg-white border border-skin-100 rounded-2xl p-5 space-y-4">
              <h3 className="font-semibold text-charcoal-800 text-sm">Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-charcoal-500 font-medium">Started using</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-skin-50 border border-skin-200 rounded-xl text-sm text-charcoal-800 focus:outline-none focus:border-skin-400 font-body"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-charcoal-500 font-medium">Price paid (optional)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400 text-sm">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={purchasePrice}
                      onChange={(e) => setPurchasePrice(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 bg-skin-50 border border-skin-200 rounded-xl text-sm text-charcoal-800 focus:outline-none focus:border-skin-400 font-body"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white border border-skin-100 rounded-2xl p-5 space-y-3">
              <h3 className="font-semibold text-charcoal-800 text-sm">Notes <span className="text-charcoal-400 font-normal">(optional)</span></h3>
              <textarea
                rows={3}
                placeholder="How does this product feel? Any observations…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-skin-50 border border-skin-200 rounded-xl text-sm text-charcoal-800 placeholder:text-charcoal-400 focus:outline-none focus:border-skin-400 resize-none font-body"
              />
            </div>

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full py-4 bg-skin-500 hover:bg-skin-600 disabled:opacity-50 text-white font-semibold rounded-2xl transition-colors flex items-center justify-center gap-2"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSaving ? 'Saving…' : 'Add to Diary'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
