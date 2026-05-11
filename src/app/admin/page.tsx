import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminProductTable from '@/components/AdminProductTable'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: userData } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!userData?.is_admin) {
    redirect('/dashboard')
  }

  const { data: products, count } = await supabase
    .from('products')
    .select('*, added_by:users(display_name, email)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(50)

  const { data: retailers } = await supabase
    .from('retailers')
    .select('*')
    .order('name')

  const { data: stats } = await supabase.rpc('get_admin_stats').maybeSingle()
    .catch(() => ({ data: null }))

  return (
    <div className="min-h-screen bg-skin-50">
      <div className="max-w-6xl mx-auto px-4 pt-8 pb-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-4xl font-light text-charcoal-900">Admin Dashboard</h1>
            <p className="text-charcoal-500 text-sm font-body mt-1">Product database management</p>
          </div>
          <span className="bg-skin-100 text-skin-700 text-xs font-semibold px-3 py-1.5 rounded-full">
            Admin
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total products', value: count || 0 },
            { label: 'Retailers', value: retailers?.length || 0 },
            { label: 'Verified products', value: products?.filter(p => p.is_verified).length || 0 },
            { label: 'Unverified', value: products?.filter(p => !p.is_verified).length || 0 },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-2xl border border-skin-100 p-5">
              <p className="text-charcoal-500 text-sm font-body mb-1">{label}</p>
              <p className="font-display text-3xl font-light text-charcoal-900">{value}</p>
            </div>
          ))}
        </div>

        {/* Products table */}
        <AdminProductTable
          initialProducts={products || []}
          retailers={retailers || []}
        />
      </div>
    </div>
  )
}
