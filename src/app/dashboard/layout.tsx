import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardNav from '@/components/DashboardNav'
import SectionTabs from '@/components/SectionTabs'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  // Check onboarding status
  const { data: profile } = await supabase
    .from('users')
    .select('onboarding_completed')
    .eq('id', user.id)
    .single()

  if (profile && !profile.onboarding_completed) {
    redirect('/onboarding')
  }

  return (
    <div className="min-h-screen bg-skin-50 overflow-y-auto pt-[max(env(safe-area-inset-top),2.75rem)] pb-[calc(5rem+env(safe-area-inset-bottom))]">
      <main className="max-w-lg mx-auto">
        <SectionTabs />
        {children}
      </main>
      <DashboardNav />
    </div>
  )
}
