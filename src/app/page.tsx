import Link from 'next/link'
import { ArrowRight, Sparkles, Shield, TrendingUp, Camera, BookOpen, Star } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-skin-50 overflow-hidden">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 px-6 py-4 flex items-center justify-between bg-skin-50/80 backdrop-blur-md border-b border-skin-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-skin-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-display text-2xl font-medium text-charcoal-900">SkinProof</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth" className="text-sm font-body text-charcoal-700 hover:text-skin-600 transition-colors">
            Sign in
          </Link>
          <Link
            href="/auth?mode=signup"
            className="text-sm bg-charcoal-900 text-skin-50 px-4 py-2 rounded-full hover:bg-charcoal-800 transition-colors font-medium"
          >
            Get started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 relative">
        {/* Background blob */}
        <div className="absolute top-20 right-0 w-96 h-96 bg-skin-200 rounded-full blur-3xl opacity-40 -translate-y-1/4 translate-x-1/3" />
        <div className="absolute top-40 left-10 w-64 h-64 bg-sage-200 rounded-full blur-3xl opacity-30" />

        <div className="max-w-lg mx-auto relative">
          <div className="inline-flex items-center gap-2 bg-cream-100 border border-cream-300 text-charcoal-700 text-xs font-medium px-3 py-1.5 rounded-full mb-6 animate-fade-in">
            <Shield className="w-3 h-3 text-skin-500" />
            Not medical diagnosis · For tracking only
          </div>

          <h1 className="font-display text-5xl md:text-6xl font-light leading-tight text-charcoal-900 mb-6 animate-fade-up">
            Your skin story,{' '}
            <em className="text-skin-500 font-light">clearly told</em>
          </h1>

          <p className="text-charcoal-700 text-lg leading-relaxed mb-8 animate-fade-up delay-100 font-body">
            Track daily skin changes, build your product diary, and discover
            what actually works for your unique skin — powered by AI insights.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 animate-fade-up delay-200">
            <Link
              href="/auth?mode=signup"
              className="flex items-center justify-center gap-2 bg-skin-500 text-white px-6 py-3.5 rounded-xl font-medium hover:bg-skin-600 transition-all hover:shadow-lg hover:shadow-skin-200 active:scale-95"
            >
              Start tracking free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="#features"
              className="flex items-center justify-center gap-2 border border-skin-200 text-charcoal-700 px-6 py-3.5 rounded-xl font-medium hover:bg-skin-50 hover:border-skin-300 transition-all"
            >
              See how it works
            </Link>
          </div>

          {/* Social proof */}
          <div className="flex items-center gap-3 mt-8 animate-fade-up delay-300">
            <div className="flex -space-x-2">
              {['A', 'B', 'C', 'D'].map((l, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 border-white bg-gradient-to-br from-skin-300 to-skin-400 flex items-center justify-center text-xs text-white font-medium"
                >
                  {l}
                </div>
              ))}
            </div>
            <div className="text-sm text-charcoal-600">
              <span className="font-medium text-charcoal-800">4,200+</span> users tracking their skin
            </div>
          </div>
        </div>

        {/* Phone mockup */}
        <div className="max-w-xs mx-auto mt-12 animate-fade-up delay-400">
          <div className="bg-white rounded-3xl shadow-2xl shadow-skin-200 border border-skin-100 overflow-hidden">
            {/* Phone header */}
            <div className="bg-skin-500 px-4 py-5 text-white">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs opacity-80 font-body">Today's Check-in</p>
                  <p className="font-display text-xl font-medium">May 10, 2026</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                  <span className="font-display text-2xl font-semibold">82</span>
                </div>
              </div>
              <div className="flex gap-2">
                {['Hydration', 'Texture', 'Glow'].map(label => (
                  <div key={label} className="bg-white/15 px-2.5 py-1 rounded-full text-xs">
                    {label} ✓
                  </div>
                ))}
              </div>
            </div>
            {/* Mock content */}
            <div className="p-4 space-y-3">
              <div className="flex gap-3">
                <div className="w-14 h-14 rounded-xl skeleton" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 skeleton w-3/4" />
                  <div className="h-2.5 skeleton w-1/2" />
                  <div className="flex gap-1 mt-2">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className="w-3 h-3 fill-cream-400 text-cream-400" />
                    ))}
                  </div>
                </div>
              </div>
              <div className="h-px bg-skin-100" />
              <div className="flex gap-3">
                <div className="w-14 h-14 rounded-xl skeleton" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 skeleton w-2/3" />
                  <div className="h-2.5 skeleton w-2/5" />
                </div>
              </div>
              <div className="bg-sage-50 rounded-xl p-3 border border-sage-100">
                <p className="text-xs text-sage-700 font-medium">💡 AI Insight</p>
                <p className="text-xs text-sage-600 mt-1">Your skin improved 8% this week after adding the niacinamide serum.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer Banner */}
      <div className="bg-cream-100 border-y border-cream-300 px-6 py-3">
        <p className="text-center text-xs text-charcoal-600 max-w-2xl mx-auto">
          <span className="font-semibold">Medical Disclaimer:</span> SkinProof provides AI-assisted skin tracking for personal use only.
          Results are not medical diagnoses. Always consult a licensed dermatologist for skin conditions.
        </p>
      </div>

      {/* Features */}
      <section id="features" className="px-6 py-16 max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-display text-4xl font-light text-charcoal-900 mb-3">
            Everything your skin journal{' '}
            <em className="text-skin-500">deserves</em>
          </h2>
          <p className="text-charcoal-600 font-body">
            From photo tracking to ingredient analysis — all in one place.
          </p>
        </div>

        <div className="grid gap-4">
          {[
            {
              icon: Camera,
              title: 'Daily Photo Tracking',
              desc: 'Upload skin photos with AI quality scoring. Track changes over time with consistent, comparable images.',
              color: 'bg-skin-100 text-skin-600',
            },
            {
              icon: Sparkles,
              title: 'AI Skin Analysis',
              desc: 'Get instant feedback on hydration, texture, redness, and more. For tracking purposes — not medical diagnosis.',
              color: 'bg-sage-100 text-sage-600',
            },
            {
              icon: BookOpen,
              title: 'Product Diary',
              desc: 'Log every product you use. Track reactions, ratings, and discover what combinations work for your skin.',
              color: 'bg-cream-100 text-cream-500',
            },
            {
              icon: TrendingUp,
              title: 'Progress Tracker',
              desc: 'Visualize your skin journey with charts. See correlations between products, habits, and skin health.',
              color: 'bg-skin-100 text-skin-600',
            },
            {
              icon: Shield,
              title: 'Transparent Recommendations',
              desc: 'Product recommendations ranked by skin compatibility — never by affiliate commission. Fully disclosed.',
              color: 'bg-sage-100 text-sage-600',
            },
          ].map(({ icon: Icon, title, desc, color }, i) => (
            <div
              key={i}
              className="flex gap-4 p-5 bg-white rounded-2xl border border-skin-100 hover:border-skin-200 hover:shadow-sm transition-all animate-fade-up"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center shrink-0 mt-0.5`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium text-charcoal-900 mb-1 font-body">{title}</h3>
                <p className="text-sm text-charcoal-600 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16">
        <div className="max-w-md mx-auto bg-charcoal-900 rounded-3xl p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-skin-500 rounded-full blur-3xl opacity-20" />
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-skin-500 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h2 className="font-display text-3xl font-light text-white mb-3">
              Start your skin journey
            </h2>
            <p className="text-charcoal-400 text-sm mb-6 font-body">
              Free forever. No hidden fees. No affiliate-ranked products.
            </p>
            <Link
              href="/auth?mode=signup"
              className="inline-flex items-center gap-2 bg-skin-500 text-white px-8 py-3.5 rounded-xl font-medium hover:bg-skin-400 transition-all hover:shadow-lg hover:shadow-skin-500/30 active:scale-95"
            >
              Create free account
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-skin-100">
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-skin-500 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="font-display text-lg font-medium text-charcoal-700">SkinProof</span>
          </div>
          <p className="text-xs text-charcoal-500 text-center">
            Not a medical device. AI analysis is for personal tracking only.
            Always consult a dermatologist for medical advice.
          </p>
          <div className="flex gap-4 text-xs text-charcoal-500">
            <Link href="/privacy" className="hover:text-skin-500">Privacy</Link>
            <Link href="/terms" className="hover:text-skin-500">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
