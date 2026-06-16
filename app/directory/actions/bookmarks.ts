'use server'

import { createClient } from '@/lib/supabase/server'

export async function toggleBookmark(lawyerId: string) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Not authenticated' }

  const { data: existing } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('user_id', user.id)
    .eq('lawyer_id', lawyerId)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('id', existing.id)
    if (error) return { error: error.message }
    return { bookmarked: false }
  }

  const { error } = await supabase
    .from('bookmarks')
    .insert({ user_id: user.id, lawyer_id: lawyerId })
  if (error) return { error: error.message }
  return { bookmarked: true }
}

export async function getBookmarkedLawyerIds() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return []

  const { data, error } = await supabase
    .from('bookmarks')
    .select('lawyer_id')
    .eq('user_id', user.id)

  if (error) {
    console.error("Failed to fetch bookmarks:", error.message)
    return []
  }
  return data.map(b => b.lawyer_id)
}
