import { createClient } from '@/lib/supabase/client'

export async function redirectAfterOnboarding(router: { push: (url: string) => void }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { router.push('/login'); return }

  const { data: profile } = await supabase
    .from('skin_profiles')
    .select('routine_setup_completed_at')
    .eq('user_id', user.id)
    .single()

  if (profile?.routine_setup_completed_at) {
    router.push('/dashboard')
  } else {
    router.push('/routine/setup')
  }
}
