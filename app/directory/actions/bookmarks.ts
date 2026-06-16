'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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
    revalidatePath('/directory', 'layout')
    return { bookmarked: false }
  }

  const { error } = await supabase
    .from('bookmarks')
    .insert({ user_id: user.id, lawyer_id: lawyerId })
  if (error) return { error: error.message }
  revalidatePath('/directory', 'layout')
  return { bookmarked: true }
}
