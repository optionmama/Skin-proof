'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Search, Plus, Star, AlertTriangle, CheckCircle2 } from 'lucide-react'

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

export default function AddToDiaryPage() {
  const router = useRouter()
  const supabase = createClient()

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ProductResult[]>([])
  const [selectedProduct, setSelectedProduct] = useState<ProductResult | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [step, setStep] = useState<'search' | 'details'>('search')

  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [usage, setUsage] = useState('')
  const [reaction, setReaction] = useState('')
  const [notes, setNotes] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

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

  if (saved) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-6">
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

  return (
    <div className="min-h-screen bg-cream pb-24">
      {/* Header */}
      <div className="bg-cream/80 backdrop-blur-sm border-b border-skin-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/dashboard/diary" className="p-2 hover:bg-skin-50 rounded-xl transition-colors">
            <ArrowLeft size={20} className="text-charcoal-600" />
          </Link>
          <div>
            <h1 className="font-display text-xl text-charcoal-800">Add to Diary</h1>
            {step === 'details' && selectedProduct && (
              <p className="text-xs text-charcoal-500">{selectedProduct.brand} · {selectedProduct.name}</p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">

        {step === 'search' && (
          <>
            {/* Search */}
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal-400" />
              <input
                autoFocus
                type="text"
                placeholder="Search by product name or brand…"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-skin-200 rounded-2xl text-charcoal-800 placeholder:text-charcoal-400 focus:outline-none focus:ring-2 focus:ring-skin-300 text-sm"
              />
            </div>

            {/* Results */}
            {isSearching && (
              <div className="text-center py-8 text-charcoal-400 text-sm">Searching…</div>
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
                      <span className="text-xs text-charcoal-500">{p.brand} · {p.category}</span>
                    </div>
                    <Plus size={18} className="text-skin-500 flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}

            {!isSearching && searchQuery.length >= 2 && searchResults.length === 0 && (
              <div className="text-center py-8 space-y-2">
                <p className="text-charcoal-500 text-sm">No products found for "{searchQuery}"</p>
                <p className="text-charcoal-400 text-xs">Try a different name or brand</p>
              </div>
            )}

            {searchQuery.length === 0 && (
              <div className="text-center py-12 space-y-2">
                <Search size={40} className="text-skin-200 mx-auto" />
                <p className="text-charcoal-500 text-sm">Search our product database</p>
                <p className="text-charcoal-400 text-xs">Over 10,000 verified skincare products</p>
              </div>
            )}
          </>
        )}

        {step === 'details' && selectedProduct && (
          <>
            {/* Product card */}
            <div className="bg-white border border-skin-100 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-skin-50 flex items-center justify-center text-xl">
                  🧴
                </div>
                <div>
                  <h3 className="font-semibold text-charcoal-800">{selectedProduct.name}</h3>
                  <p className="text-sm text-charcoal-500">{selectedProduct.brand} · {selectedProduct.category}</p>
                </div>
                <button
                  onClick={() => { setSelectedProduct(null); setStep('search') }}
                  className="ml-auto text-xs text-skin-600 hover:underline"
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
                  <span className="text-sm text-charcoal-500 self-center ml-1">
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
                    className="w-full px-3 py-2 bg-skin-50 border border-skin-200 rounded-xl text-sm text-charcoal-800 focus:outline-none focus:ring-2 focus:ring-skin-300"
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
                      className="w-full pl-7 pr-3 py-2 bg-skin-50 border border-skin-200 rounded-xl text-sm text-charcoal-800 focus:outline-none focus:ring-2 focus:ring-skin-300"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white border border-skin-100 rounded-2xl p-5 space-y-3">
              <h3 className="font-semibold text-charcoal-800 text-sm">Notes (optional)</h3>
              <textarea
                rows={3}
                placeholder="How does this product feel? Any observations…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-skin-50 border border-skin-200 rounded-xl text-sm text-charcoal-800 placeholder:text-charcoal-400 focus:outline-none focus:ring-2 focus:ring-skin-300 resize-none"
              />
            </div>

            {/* Disclaimer */}
            <div className="flex gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertTriangle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                Product logs are for personal tracking only. Consult a dermatologist for medical advice.
              </p>
            </div>

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full py-4 bg-skin-500 hover:bg-skin-600 disabled:opacity-50 text-white font-semibold rounded-2xl transition-colors"
            >
              {isSaving ? 'Saving…' : 'Add to Diary'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
