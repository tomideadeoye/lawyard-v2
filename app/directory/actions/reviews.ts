'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitReview(formData: FormData) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'You must be logged in to submit a review' }

  const lawyerId = formData.get('lawyer_id') as string
  const rating = parseInt(formData.get('rating') as string, 10)
  const title = (formData.get('title') as string)?.trim() || null
  const content = (formData.get('content') as string)?.trim() || null

  if (!lawyerId) return { error: 'Missing lawyer ID' }
  if (isNaN(rating) || rating < 1 || rating > 5) return { error: 'Rating must be between 1 and 5' }

  // Check if user already reviewed this lawyer
  const { data: existing } = await supabase
    .from('reviews')
    .select('id')
    .eq('lawyer_id', lawyerId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) return { error: 'You have already reviewed this lawyer' }

  const { error } = await supabase.from('reviews').insert({
    lawyer_id: lawyerId,
    user_id: user.id,
    rating,
    title,
    content,
  })

  if (error) return { error: 'Failed to submit review' }

  revalidatePath(`/directory/lawyer/${lawyerId}`)
  return { success: true }
}

export async function deleteReview(lawyerId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('lawyer_id', lawyerId)
    .eq('user_id', user.id)

  if (error) return { error: 'Failed to delete review' }

  revalidatePath(`/directory/lawyer/${lawyerId}`)
  return { success: true }
}
