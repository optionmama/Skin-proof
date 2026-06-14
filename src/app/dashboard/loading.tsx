export default function DashboardLoading() {
  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <div className="h-3 w-24 rounded skeleton" />
          <div className="h-8 w-44 rounded-lg skeleton" />
        </div>
        <div className="w-10 h-10 rounded-full skeleton" />
      </div>

      {/* Main card */}
      <div className="h-44 rounded-2xl skeleton mb-4" />

      {/* Nudge */}
      <div className="h-10 rounded-xl skeleton mb-4" />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="h-20 rounded-xl skeleton" />
        <div className="h-20 rounded-xl skeleton" />
        <div className="h-20 rounded-xl skeleton" />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="h-16 rounded-xl skeleton" />
        <div className="h-16 rounded-xl skeleton" />
      </div>

      {/* List */}
      <div className="space-y-2">
        <div className="h-14 rounded-xl skeleton" />
        <div className="h-14 rounded-xl skeleton" />
        <div className="h-14 rounded-xl skeleton" />
      </div>
    </div>
  )
}
