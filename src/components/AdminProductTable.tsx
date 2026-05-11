'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Check, X, Plus, Search, Edit2, Trash2, ExternalLink,
  Package, Shield, AlertTriangle
} from 'lucide-react'
import type { Product, Retailer } from '@/types/database'

interface Props {
  initialProducts: Array<Product & { added_by?: { display_name?: string; email: string } | null }>
  retailers: Retailer[]
}

export default function AdminProductTable({ initialProducts, retailers }: Props) {
  const supabase = createClient()
  const [products, setProducts] = useState(initialProducts)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'unverified'>('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  // New product form state
  const [newProduct, setNewProduct] = useState({
    name: '', brand: '', category: 'serum' as Product['category'],
    description: '', image_url: '', size_ml: '', barcode: '',
    cruelty_free: false, vegan: false, fragrance_free: false, alcohol_free: false,
    suitable_skin_types: [] as string[], target_concerns: [] as string[],
  })

  const filtered = products.filter(p => {
    if (filter === 'unverified' && p.is_verified) return false
    if (search && !`${p.name} ${p.brand}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const verifyProduct = async (id: string, verified: boolean) => {
    const { error } = await supabase.from('products').update({ is_verified: verified }).eq('id', id)
    if (!error) {
      setProducts(prev => prev.map(p => p.id === id ? { ...p, is_verified: verified } : p))
      setMessage(`Product ${verified ? 'verified' : 'unverified'}`)
    }
  }

  const deleteProduct = async (id: string) => {
    if (!confirm('Delete this product? This cannot be undone.')) return
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (!error) {
      setProducts(prev => prev.filter(p => p.id !== id))
      setMessage('Product deleted')
    }
  }

  const addProduct = async () => {
    const { data, error } = await supabase.from('products').insert({
      ...newProduct,
      size_ml: newProduct.size_ml ? parseFloat(newProduct.size_ml) : undefined,
      is_verified: true,
    }).select().single()

    if (error) { setMessage(`Error: ${error.message}`); return }
    setProducts(prev => [data, ...prev])
    setShowAddForm(false)
    setNewProduct({ name: '', brand: '', category: 'serum', description: '', image_url: '', size_ml: '', barcode: '', cruelty_free: false, vegan: false, fragrance_free: false, alcohol_free: false, suitable_skin_types: [], target_concerns: [] })
    setMessage('Product added successfully')
  }

  return (
    <div>
      {message && (
        <div className="mb-4 bg-sage-50 border border-sage-200 text-sage-800 px-4 py-3 rounded-xl text-sm font-body flex items-center justify-between">
          {message}
          <button onClick={() => setMessage('')} className="text-sage-600 hover:text-sage-800">✕</button>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400" />
          <input
            type="text"
            placeholder="Search products…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-skin-200 rounded-xl text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none focus:border-skin-400 font-body text-sm"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={e => setFilter(e.target.value as 'all' | 'unverified')}
            className="px-4 py-3 bg-white border border-skin-200 rounded-xl text-charcoal-900 text-sm font-body focus:outline-none focus:border-skin-400"
          >
            <option value="all">All products</option>
            <option value="unverified">Unverified only</option>
          </select>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 bg-skin-500 text-white px-4 py-3 rounded-xl font-medium text-sm hover:bg-skin-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add product
          </button>
        </div>
      </div>

      {/* Add product form */}
      {showAddForm && (
        <div className="bg-white rounded-2xl border border-skin-200 p-5 mb-5">
          <h3 className="font-display text-xl font-light text-charcoal-900 mb-4">Add new product</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: 'name', label: 'Product name *', type: 'text' },
              { key: 'brand', label: 'Brand *', type: 'text' },
              { key: 'description', label: 'Description', type: 'text' },
              { key: 'image_url', label: 'Image URL', type: 'url' },
              { key: 'size_ml', label: 'Size (ml)', type: 'number' },
              { key: 'barcode', label: 'Barcode / EAN', type: 'text' },
            ].map(({ key, label, type }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-charcoal-700 mb-1.5">{label}</label>
                <input
                  type={type}
                  value={(newProduct as Record<string, string>)[key]}
                  onChange={e => setNewProduct(prev => ({ ...prev, [key]: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-skin-50 border border-skin-200 rounded-lg text-charcoal-900 text-sm focus:outline-none focus:border-skin-400 font-body"
                />
              </div>
            ))}

            <div>
              <label className="block text-xs font-medium text-charcoal-700 mb-1.5">Category *</label>
              <select
                value={newProduct.category}
                onChange={e => setNewProduct(prev => ({ ...prev, category: e.target.value as Product['category'] }))}
                className="w-full px-3 py-2.5 bg-skin-50 border border-skin-200 rounded-lg text-charcoal-900 text-sm focus:outline-none focus:border-skin-400 font-body"
              >
                {['cleanser','toner','serum','moisturizer','sunscreen','eye_cream','mask','exfoliant','treatment','oil','mist','balm','spf_makeup','other'].map(c => (
                  <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="block text-xs font-medium text-charcoal-700">Attributes</label>
              {[
                { key: 'cruelty_free', label: 'Cruelty-free' },
                { key: 'vegan', label: 'Vegan' },
                { key: 'fragrance_free', label: 'Fragrance-free' },
                { key: 'alcohol_free', label: 'Alcohol-free' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(newProduct as Record<string, boolean>)[key]}
                    onChange={e => setNewProduct(prev => ({ ...prev, [key]: e.target.checked }))}
                    className="w-4 h-4 rounded accent-skin-500"
                  />
                  <span className="text-sm text-charcoal-700 font-body">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={addProduct}
              disabled={!newProduct.name || !newProduct.brand}
              className="flex items-center gap-2 bg-skin-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-skin-600 transition-colors disabled:opacity-60"
            >
              <Check className="w-4 h-4" />
              Save product
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="flex items-center gap-2 border border-skin-200 text-charcoal-700 px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-skin-50 transition-colors"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Products table */}
      <div className="bg-white rounded-2xl border border-skin-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-skin-50 border-b border-skin-100">
              <tr>
                {['Product', 'Brand', 'Category', 'Attributes', 'Added by', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-charcoal-600 px-4 py-3 font-body whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-charcoal-400 text-sm font-body">
                    No products found
                  </td>
                </tr>
              ) : filtered.map((product, i) => (
                <tr key={product.id} className={`border-b border-skin-50 hover:bg-skin-50/50 transition-colors ${i % 2 === 0 ? '' : 'bg-skin-50/30'}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-skin-100 flex items-center justify-center shrink-0">
                          <Package className="w-4 h-4 text-skin-400" />
                        </div>
                      )}
                      <span className="text-sm font-medium text-charcoal-900 max-w-32 truncate">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-charcoal-600 font-body whitespace-nowrap">{product.brand}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-skin-100 text-skin-600 px-2 py-0.5 rounded-full capitalize whitespace-nowrap">
                      {product.category.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {product.cruelty_free && <span title="Cruelty-free" className="text-xs bg-sage-100 text-sage-600 px-1.5 py-0.5 rounded">CF</span>}
                      {product.vegan && <span title="Vegan" className="text-xs bg-sage-100 text-sage-600 px-1.5 py-0.5 rounded">V</span>}
                      {product.fragrance_free && <span title="Fragrance-free" className="text-xs bg-sage-100 text-sage-600 px-1.5 py-0.5 rounded">FF</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-charcoal-400 font-body whitespace-nowrap">
                    {product.added_by?.display_name || product.added_by?.email || 'System'}
                  </td>
                  <td className="px-4 py-3">
                    {product.is_verified ? (
                      <span className="flex items-center gap-1 text-xs text-sage-600 font-medium">
                        <Shield className="w-3.5 h-3.5" /> Verified
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5" /> Pending
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => verifyProduct(product.id, !product.is_verified)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          product.is_verified
                            ? 'text-amber-600 hover:bg-amber-50'
                            : 'text-sage-600 hover:bg-sage-50'
                        }`}
                        title={product.is_verified ? 'Unverify' : 'Verify'}
                      >
                        <Shield className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteProduct(product.id)}
                        className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Retailers section */}
      <div className="mt-8">
        <h2 className="font-display text-2xl font-light text-charcoal-900 mb-4">Retailers</h2>
        <div className="bg-white rounded-2xl border border-skin-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-skin-50 border-b border-skin-100">
                <tr>
                  {['Name', 'Country', 'Verified', 'Affiliate', 'Disclosure', 'Commission %'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-charcoal-600 px-4 py-3 font-body whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {retailers.map((retailer, i) => (
                  <tr key={retailer.id} className={`border-b border-skin-50 ${i % 2 === 0 ? '' : 'bg-skin-50/30'}`}>
                    <td className="px-4 py-3 text-sm font-medium text-charcoal-900">{retailer.name}</td>
                    <td className="px-4 py-3 text-sm text-charcoal-500 font-body">{retailer.country || '—'}</td>
                    <td className="px-4 py-3">
                      {retailer.is_verified_seller ? (
                        <span className="text-sage-600 text-xs font-medium flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Yes
                        </span>
                      ) : (
                        <span className="text-charcoal-400 text-xs">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {retailer.has_affiliate_relationship ? (
                        <span className="text-amber-600 text-xs font-medium bg-amber-50 px-2 py-0.5 rounded-full">
                          ⚠ Yes
                        </span>
                      ) : (
                        <span className="text-charcoal-400 text-xs">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-charcoal-500 font-body max-w-48 truncate">
                      {retailer.affiliate_disclosure || (retailer.has_affiliate_relationship ? '⚠ MISSING' : '—')}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-charcoal-600">
                      {retailer.commission_rate_pct ? `${retailer.commission_rate_pct}%` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p className="text-xs text-charcoal-400 font-body mt-2">
          Commission rates are stored for transparency only and never used to rank product recommendations.
        </p>
      </div>
    </div>
  )
}
