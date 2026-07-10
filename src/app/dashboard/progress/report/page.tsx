'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Loader2, RefreshCw } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import type { TranslationKey } from '@/lib/i18n/translations'
import { localDayKey } from '@/lib/day'

type TFn = (key: TranslationKey, vars?: Record<string, string | number>) => string

interface ReportData {
  period_days: number
  overall_trend: 'improving' | 'stable' | 'declining'
  score_change: number
  average_score: number
  best_score: number
  best_score_date: string
  key_findings: string[]
  most_improved: string
  needs_attention: string
  product_insights: { product: string; correlation: string; insight: string }[]
  recommendations: string[]
  next_goal: string
}

function TrendBadge({ trend, t }: { trend: string; t: TFn }) {
  if (trend === 'improving') return <span className="inline-flex items-center gap-1 bg-sage-100 text-sage-700 text-xs px-2.5 py-1 rounded-full font-medium"><TrendingUp className="w-3 h-3" /> {t('report_trend_improving')}</span>
  if (trend === 'declining') return <span className="inline-flex items-center gap-1 bg-red-100 text-red-600 text-xs px-2.5 py-1 rounded-full font-medium"><TrendingDown className="w-3 h-3" /> {t('report_trend_declining')}</span>
  return <span className="inline-flex items-center gap-1 bg-skin-100 text-skin-700 text-xs px-2.5 py-1 rounded-full font-medium"><Minus className="w-3 h-3" /> {t('report_trend_stable')}</span>
}

function ReportContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { t, lang } = useLanguage()
  const period = Number(searchParams.get('period') || '14') as 14 | 30 | 90

  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [generating, setGenerating] = useState(false)

  // Regenerate when the period OR the active locale changes. The locale matters
  // because LanguageProvider hydrates from 'en' to the user's real locale after
  // mount — without `lang` here the report would stay in the language it first
  // generated in (usually English) even after the UI switches.
  useEffect(() => { generateReport() }, [period, lang])

  const generateReport = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/skin-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // `today` = the DEVICE's local day — the server can't see the user's
        // timezone and its own UTC day is the wrong day for part of every day.
        body: JSON.stringify({ period, lang, today: localDayKey() }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.checkinCount !== undefined) {
          setError(t('report_not_enough', { n: data.checkinCount }))
        } else {
          setError(data.error || t('report_failed'))
        }
      } else {
        setReport(data.report)
      }
    } catch {
      setError(t('report_failed'))
    }
    setLoading(false)
    setGenerating(false)
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-skin-500" />
      <p className="font-display text-xl font-light text-charcoal-800">{t('report_generating', { n: period })}</p>
      <p className="text-sm text-charcoal-500 font-body">{t('report_analysing')}</p>
    </div>
  )

  if (error) return (
    <div className="text-center py-16 px-4">
      <p className="text-charcoal-500 font-body mb-4">{error}</p>
      <Link href="/dashboard/progress" className="text-skin-600 text-sm font-medium hover:underline">{t('report_back_progress')}</Link>
    </div>
  )

  if (!report) return null

  return (
    <div className="px-4 pt-6 pb-8 max-w-lg mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-charcoal-400 font-body">{t('report_ai_generated')}</p>
          <h1 className="font-display text-2xl font-light text-charcoal-900">{t('report_title', { n: period })}</h1>
        </div>
        <button onClick={() => { setGenerating(true); generateReport() }} disabled={generating}
          className="p-2 text-charcoal-400 hover:text-skin-600 transition-colors">
          <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Overall */}
      <div className="bg-white rounded-2xl border border-skin-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <TrendBadge trend={report.overall_trend} t={t} />
          <div className="text-right">
            <p className="font-display text-2xl font-light text-charcoal-900">{report.average_score}</p>
            <p className="text-xs text-charcoal-400">{t('report_avg_score')}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-skin-50 rounded-xl p-3">
            <p className="font-display text-xl font-light text-charcoal-900">
              {report.score_change > 0 ? '+' : ''}{report.score_change}
            </p>
            <p className="text-xs text-charcoal-500">{t('report_score_change')}</p>
          </div>
          <div className="bg-skin-50 rounded-xl p-3">
            <p className="font-display text-xl font-light text-charcoal-900">{report.best_score}</p>
            <p className="text-xs text-charcoal-500">{t('report_best_score')}</p>
          </div>
          <div className="bg-skin-50 rounded-xl p-3">
            <p className="font-display text-xl font-light text-charcoal-900">{report.period_days}d</p>
            <p className="text-xs text-charcoal-500">{t('report_period')}</p>
          </div>
        </div>
      </div>

      {/* Key findings */}
      <div className="bg-white rounded-2xl border border-skin-100 p-5">
        <h2 className="font-display text-lg font-light text-charcoal-900 mb-3">{t('report_key_findings')}</h2>
        <ul className="space-y-2">
          {report.key_findings.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-charcoal-700 font-body">
              <span className="text-skin-400 mt-0.5 shrink-0">•</span>{f}
            </li>
          ))}
        </ul>
        <div className="mt-3 pt-3 border-t border-skin-50 grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-charcoal-400 font-body">{t('report_most_improved')}</p>
            <p className="text-sm font-medium text-sage-700 capitalize">{report.most_improved}</p>
          </div>
          <div>
            <p className="text-xs text-charcoal-400 font-body">{t('report_needs_attention')}</p>
            <p className="text-sm font-medium text-skin-600 capitalize">{report.needs_attention}</p>
          </div>
        </div>
      </div>

      {/* Product insights */}
      {report.product_insights && report.product_insights.length > 0 && (
        <div className="bg-white rounded-2xl border border-skin-100 p-5">
          <h2 className="font-display text-lg font-light text-charcoal-900 mb-3">{t('report_product_insights')}</h2>
          <div className="space-y-3">
            {report.product_insights.map((p, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className={`text-sm shrink-0 mt-0.5 ${p.correlation === 'positive' ? '✅' : p.correlation === 'negative' ? '⚠️' : '○'}`}>
                  {p.correlation === 'positive' ? '✅' : p.correlation === 'negative' ? '⚠️' : '○'}
                </span>
                <div>
                  <p className="text-sm font-medium text-charcoal-800">{p.product}</p>
                  <p className="text-xs text-charcoal-500 font-body">{p.insight}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="bg-sage-50 border border-sage-200 rounded-2xl p-5">
        <h2 className="font-display text-lg font-light text-charcoal-900 mb-3">{t('report_recommendations')}</h2>
        <ol className="space-y-2">
          {report.recommendations.map((r, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-charcoal-700 font-body">
              <span className="w-5 h-5 rounded-full bg-sage-200 text-sage-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
              {r}
            </li>
          ))}
        </ol>
      </div>

      {/* Next goal */}
      <div className="bg-skin-500 rounded-2xl p-5 text-white text-center">
        <p className="font-display text-lg font-light mb-1">{t('report_next_goal')}</p>
        <p className="text-sm font-body text-white/90">{report.next_goal}</p>
      </div>

      <Link href="/dashboard/progress"
        className="block text-center text-xs text-charcoal-400 font-body py-2 hover:text-skin-600 transition-colors">
        {t('report_back_progress')}
      </Link>
    </div>
  )
}

export default function ReportPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="w-6 h-6 animate-spin text-skin-400" /></div>}>
      <ReportContent />
    </Suspense>
  )
}
