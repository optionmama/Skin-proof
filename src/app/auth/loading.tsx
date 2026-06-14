import { Sparkles, Loader2 } from 'lucide-react'

export default function AuthLoading() {
  return (
    <div className="min-h-screen bg-skin-50 flex flex-col">
      <div className="px-6 py-4 flex items-center justify-end">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-skin-500 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-display text-xl font-medium text-charcoal-900">SkinProof</span>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
        <Loader2 className="w-6 h-6 animate-spin text-skin-500" />
        <div className="w-full max-w-sm space-y-4">
          <div className="h-10 rounded-xl skeleton" />
          <div className="h-12 rounded-xl skeleton" />
          <div className="h-12 rounded-xl skeleton" />
          <div className="h-12 rounded-xl skeleton mt-2" />
        </div>
      </div>
    </div>
  )
}
