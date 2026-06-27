'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Sparkles, ArrowLeft, Loader2, Mail, Lock, User } from 'lucide-react'

function AuthForm() {
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<'login' | 'signup'>(
    searchParams.get('mode') === 'signup' ? 'signup' : 'login'
  )
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: displayName },
          },
        })
        if (error) throw error
        setSuccess('Check your email to confirm your account.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        // Full-page navigation (not router.push) so the freshly-set Supabase
        // session cookie is sent to the SSR middleware on the FIRST attempt.
        // router.push raced the cookie write, so the middleware saw no session,
        // bounced back to /auth, and the user had to tap "Sign in" twice.
        window.location.assign('/dashboard')
        return
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-skin-50 flex flex-col safe-area-pt safe-area-pb overflow-x-hidden">
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1.5 text-charcoal-600 hover:text-charcoal-900 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-body">Back</span>
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-skin-500 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-display text-xl font-medium text-charcoal-900">SkinProof</span>
        </div>
      </div>

      {/* Decorative */}
      <div className="absolute top-20 right-0 w-64 h-64 bg-skin-200 rounded-full blur-3xl opacity-30 pointer-events-none" />
      <div className="absolute bottom-20 left-0 w-48 h-48 bg-sage-200 rounded-full blur-3xl opacity-25 pointer-events-none" />

      {/* Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="font-display text-4xl font-light text-charcoal-900 mb-2">
              {mode === 'login' ? 'Welcome back' : 'Start your journey'}
            </h1>
            <p className="text-charcoal-600 text-sm font-body">
              {mode === 'login'
                ? 'Sign in to continue your skin tracking'
                : 'Create your free SkinProof account'}
            </p>
          </div>

          {/* Toggle */}
          <div className="flex rounded-xl bg-skin-100 p-1 mb-6">
            {(['login', 'signup'] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); setSuccess('') }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === m
                    ? 'bg-white text-charcoal-900 shadow-sm'
                    : 'text-charcoal-600 hover:text-charcoal-800'
                }`}
              >
                {m === 'login' ? 'Sign in' : 'Sign up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-charcoal-700 mb-1.5">
                  Your name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="Alex Smith"
                    className="w-full pl-10 pr-4 py-3 bg-white border border-skin-200 rounded-xl text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none focus:border-skin-400 focus:ring-2 focus:ring-skin-200 transition-all font-body text-sm"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-charcoal-700 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-skin-200 rounded-xl text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none focus:border-skin-400 focus:ring-2 focus:ring-skin-200 transition-all font-body text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'Min. 8 characters' : 'Your password'}
                  minLength={8}
                  className="w-full pl-10 pr-12 py-3 bg-white border border-skin-200 rounded-xl text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none focus:border-skin-400 focus:ring-2 focus:ring-skin-200 transition-all font-body text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-body">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-sage-50 border border-sage-200 text-sage-700 px-4 py-3 rounded-xl text-sm font-body">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-skin-500 text-white py-3.5 rounded-xl font-medium hover:bg-skin-600 transition-all hover:shadow-md hover:shadow-skin-200 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          {mode === 'login' && (
            <div className="text-center mt-4">
              <button
                onClick={async () => {
                  if (!email) { setError('Enter your email first'); return }
                  setLoading(true)
                  const { error } = await supabase.auth.resetPasswordForEmail(email)
                  setLoading(false)
                  if (error) setError(error.message)
                  else setSuccess('Password reset email sent!')
                }}
                className="text-sm text-skin-600 hover:text-skin-700 font-medium"
              >
                Forgot password?
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-skin-50 flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-skin-500" />
    </div>}>
      <AuthForm />
    </Suspense>
  )
}
