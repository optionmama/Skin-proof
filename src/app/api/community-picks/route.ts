import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export interface CommunityProduct {
  brand: string
  name: string
  category: string | null
  user_count: number
  avg_score: number
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const threshold = Number(request.nextUrl.searchParams.get('threshold') || '75')

  // Get current user's skin profile for matching
  const { data: myProfile } = await supabase
    .from('skin_profiles')
    .select('skin_type, age_range')
    .eq('user_id', user.id)
    .single()

  // Step 1: Find users (excluding self) whose best score meets the threshold
  const { data: highScoreUsers } = await supabase
    .from('skin_photos')
    .select('user_id, overall_skin_score')
    .neq('user_id', user.id)
    .gte('overall_skin_score', threshold)
    .not('overall_skin_score', 'is', null)

  if (!highScoreUsers || highScoreUsers.length === 0) {
    return NextResponse.json({ products: [], userCount: 0, threshold })
  }

  // Unique users who achieved the threshold
  const eligibleUserIds = [...new Set(highScoreUsers.map(r => r.user_id))]

  // Step 2: Filter by same skin_type if we have enough data
  let filteredUserIds = eligibleUserIds
  if (myProfile?.skin_type && eligibleUserIds.length >= 2) {
    const { data: sameTypeProfiles } = await supabase
      .from('skin_profiles')
      .select('user_id')
      .in('user_id', eligibleUserIds)
      .eq('skin_type', myProfile.skin_type)

    if (sameTypeProfiles && sameTypeProfiles.length > 0) {
      filteredUserIds = sameTypeProfiles.map(p => p.user_id)
    }
    // If no match on skin_type, fall back to all high-scorers
  }

  if (filteredUserIds.length === 0) {
    return NextResponse.json({ products: [], userCount: 0, threshold })
  }

  // Step 3: Get products those users have in their active routines
  const { data: routines } = await supabase
    .from('user_routines')
    .select('user_id, user_products(brand, name, category)')
    .in('user_id', filteredUserIds)
    .eq('is_active', true)

  if (!routines || routines.length === 0) {
    return NextResponse.json({ products: [], userCount: filteredUserIds.length, threshold })
  }

  // Step 4: Count how many users use each product
  const productMap = new Map<string, CommunityProduct>()
  for (const r of routines) {
    const p = r.user_products as { brand?: string; name?: string; category?: string } | null
    if (!p?.name) continue
    const key = `${(p.brand || '').toLowerCase()}|${p.name.toLowerCase()}`
    if (productMap.has(key)) {
      productMap.get(key)!.user_count++
    } else {
      productMap.set(key, {
        brand: p.brand || '',
        name: p.name,
        category: p.category || null,
        user_count: 1,
        avg_score: threshold, // placeholder — actual avg would need a join
      })
    }
  }

  // Sort by usage count, take top 5
  const products = Array.from(productMap.values())
    .sort((a, b) => b.user_count - a.user_count)
    .slice(0, 5)

  return NextResponse.json({
    products,
    userCount: filteredUserIds.length,
    threshold,
    skinType: myProfile?.skin_type || null,
  })
}
