import { Loader2 } from 'lucide-react'

export default function CheckinLoading() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col">
      {/* Step bar placeholder */}
      <div className="bg-white border-b border-stone-100 px-4 py-3">
        <div className="flex items-center justify-around">
          <div className="w-8 h-8 rounded-full skeleton" />
          <div className="flex-1 h-0.5 mx-1 skeleton" />
          <div className="w-8 h-8 rounded-full skeleton" />
          <div className="flex-1 h-0.5 mx-1 skeleton" />
          <div className="w-8 h-8 rounded-full skeleton" />
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-rose-400" />
      </div>
    </div>
  )
}
