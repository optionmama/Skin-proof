'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, BarChart, Bar
} from 'recharts'
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react'
import { formatShortDate } from '@/lib/utils'
import type { SkinCheckin, SkinPhoto } from '@/types/database'

type Period = '7d' | '30d' | '90d'

export default function ProgressPage() {
  const supabase = createClient()
  const [period, setPeriod] = useState<Period>('30d')
  const [checkins, setCheckins] = useState<SkinCheckin[]>([])
  const [photos, setPhotos] = useState<SkinPhoto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [period])

  const loadData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
    const fromDate = new Date()
    fromDate.setDate(fromDate.getDate() - days)
    const fromStr = fromDate.toISOString().split('T')[0]

    const [{ data: ci }, { data: ph }] = await Promise.all([
      supabase.from('skin_checkins')
        .select('*')
        .eq('user_id', user.id)
        .gte('checkin_date', fromStr)
        .order('checkin_date'),
      supabase.from('skin_photos')
        .select('*')
        .eq('user_id', user.id)
        .not('overall_skin_score', 'is', null)
        .gte('created_at', fromDate.toISOString())
        .order('created_at'),
    ])

    setCheckins(ci || [])
    setPhotos(ph || [])
    setLoading(false)
  }

  // Combine data for chart
  const chartData = checkins.map(ci => {
    const dayPhotos = photos.filter(p =>
      p.created_at.startsWith(ci.checkin_date)
    )
    const avgScore = dayPhotos.length
      ? dayPhotos.reduce((s, p) => s + (p.overall_skin_score || 0), 0) / dayPhotos.length
      : null

    return {
      date: formatShortDate(ci.checkin_date),
      overall: ci.overall_feeling ? ci.overall_feeling * 10 : null,
      hydration: ci.hydration_level ? ci.hydration_level * 10 : null,
      redness: ci.redness_level ? ci.redness_level * 10 : null,
      skinScore: avgScore ? Math.round(avgScore) : null,
      stress: ci.stress_level ? ci.stress_level * 10 : null,
      sleep: ci.sleep_hours,
      breakouts: ci.breakout_count,
    }
  })

  // Compute trend
  const trend = (key: keyof typeof chartData[0]) => {
    const vals = chartData.map(d => d[key]).filter(v => v !== null) as number[]
    if (vals.length < 2) return null
    const recent = vals.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, vals.length)
    const earlier = vals.slice(0, 3).reduce((a, b) => a + b, 0) / Math.min(3, vals.length)
    return recent - earlier
  }

  const TrendIcon = ({ value }: { value: number | null }) => {
    if (value === null) return <Minus className="w-3.5 h-3.5 text-charcoal-400" />
    if (value > 3) return <TrendingUp className="w-3.5 h-3.5 text-sage-500" />
    if (value < -3) return <TrendingDown className="w-3.5 h-3.5 text-skin-500" />
    return <Minus className="w-3.5 h-3.5 text-charcoal-400" />
  }

  const latestCheckin = checkins[checkins.length - 1]
  const avgSkinScore = photos.length
    ? Math.round(photos.reduce((s, p) => s + (p.overall_skin_score || 0), 0) / photos.length)
    : null

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display text-3xl font-light text-charcoal-900">Progress</h1>
          <p className="text-charcoal-500 text-sm font-body">{checkins.length} check-ins tracked</p>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="disclaimer-box mb-5">
        <p className="font-semibold text-charcoal-700 mb-0.5">⚠️ Tracking tool only</p>
        <p>Scores reflect personal tracking, not medical assessment. Consult a dermatologist for concerns.</p>
      </div>

      {/* Period selector */}
      <div className="flex gap-1 bg-skin-100 rounded-xl p-1 mb-5">
        {(['7d', '30d', '90d'] as Period[]).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
              period === p ? 'bg-white text-charcoal-900 shadow-sm' : 'text-charcoal-500'
            }`}
          >
            {p === '7d' ? '7 days' : p === '30d' ? '30 days' : '90 days'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-40 skeleton rounded-2xl" />)}
        </div>
      ) : checkins.length === 0 ? (
        <div className="text-center py-12">
          <p className="font-display text-xl font-light text-charcoal-700 mb-2">No data yet</p>
          <p className="text-charcoal-500 text-sm font-body">Complete daily check-ins to see your progress.</p>
        </div>
      ) : (
        <>
          {/* Stats cards */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {[
              { label: 'Avg skin score', value: avgSkinScore ? `${avgSkinScore}` : '—', trend: trend('skinScore'), unit: '/100' },
              { label: 'Avg feeling', value: latestCheckin?.overall_feeling ? `${latestCheckin.overall_feeling}` : '—', trend: trend('overall'), unit: '/10' },
              { label: 'Avg hydration', value: latestCheckin?.hydration_level ? `${latestCheckin.hydration_level}` : '—', trend: trend('hydration'), unit: '/10' },
              { label: 'Check-ins', value: `${checkins.length}`, trend: null, unit: '' },
            ].map(({ label, value, trend: t, unit }) => (
              <div key={label} className="bg-white rounded-xl border border-skin-100 p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-charcoal-500 font-body">{label}</p>
                  <TrendIcon value={t} />
                </div>
                <p className="font-display text-2xl font-light text-charcoal-900">
                  {value}<span className="text-sm text-charcoal-400 font-body">{unit}</span>
                </p>
              </div>
            ))}
          </div>

          {/* Skin score chart */}
          {photos.length > 0 && (
            <div className="bg-white rounded-2xl border border-skin-100 p-5 mb-4">
              <h2 className="font-display text-xl font-light text-charcoal-900 mb-4">AI Skin Score</h2>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={chartData.filter(d => d.skinScore !== null)}>
                  <defs>
                    <linearGradient id="skinGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#cc6b47" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#cc6b47" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f2d5c7" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#7d6b64' }} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#7d6b64' }} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #f2d5c7', fontSize: '12px' }}
                    formatter={(v: number) => [`${v}/100`, 'Skin Score']}
                  />
                  <Area type="monotone" dataKey="skinScore" stroke="#cc6b47" strokeWidth={2} fill="url(#skinGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Feeling + Hydration */}
          <div className="bg-white rounded-2xl border border-skin-100 p-5 mb-4">
            <h2 className="font-display text-xl font-light text-charcoal-900 mb-4">Daily ratings</h2>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f2d5c7" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#7d6b64' }} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#7d6b64' }} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #f2d5c7', fontSize: '12px' }} />
                <Line type="monotone" dataKey="overall" stroke="#cc6b47" strokeWidth={2} dot={false} name="Overall" />
                <Line type="monotone" dataKey="hydration" stroke="#6f8362" strokeWidth={2} dot={false} name="Hydration" />
                <Line type="monotone" dataKey="redness" stroke="#e5b04e" strokeWidth={2} dot={false} name="Redness" />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-3 justify-center">
              {[['#cc6b47', 'Overall'], ['#6f8362', 'Hydration'], ['#e5b04e', 'Redness']].map(([color, label]) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className="w-3 h-0.5 rounded" style={{ backgroundColor: color }} />
                  <span className="text-xs text-charcoal-500 font-body">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Breakouts */}
          <div className="bg-white rounded-2xl border border-skin-100 p-5 mb-4">
            <h2 className="font-display text-xl font-light text-charcoal-900 mb-4">Breakout tracker</h2>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f2d5c7" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#7d6b64' }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#7d6b64' }} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #f2d5c7', fontSize: '12px' }} />
                <Bar dataKey="breakouts" fill="#da8b6a" radius={[4, 4, 0, 0]} name="Breakouts" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Sleep */}
          <div className="bg-white rounded-2xl border border-skin-100 p-5 mb-4">
            <h2 className="font-display text-xl font-light text-charcoal-900 mb-4">Sleep & hydration</h2>
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="sleepGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6f8362" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6f8362" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f2d5c7" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#7d6b64' }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#7d6b64' }} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #f2d5c7', fontSize: '12px' }} />
                <Area type="monotone" dataKey="sleep" stroke="#6f8362" strokeWidth={2} fill="url(#sleepGrad)" name="Sleep (hrs)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Correlation note */}
          <div className="bg-sage-50 border border-sage-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-sage-800 mb-1">💡 Correlation tracking tip</p>
            <p className="text-xs text-sage-700 font-body leading-relaxed">
              Log consistently for 3+ weeks to identify correlations between habits, products, and skin changes.
              These are personal patterns only — not clinical findings.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
