'use server'

import { createClient } from '@/lib/supabase/server'
import { addContact } from '@/lib/api/brevo'

export async function subscribeToNewsletter(formData: FormData) {
  const email = formData.get('email') as string
  if (!email) return { error: 'Email is required' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('newsletter_subscribers')
    .insert([{ email }])

  if (error) {
    if (error.code === '23505') {
      return { success: true, message: 'You are already subscribed!' }
    }
    return { error: 'Failed to subscribe. Please try again.' }
  }

  const listId = process.env.NODE_ENV === 'production'
    ? Number(process.env.BREVO_PROD_LIST_ID || 4)
    : Number(process.env.BREVO_TEST_LIST_ID || 5)

  if (process.env.BREVO_API_KEY && listId) {
    addContact({ email, listId }).catch(err =>
      console.error('[Brevo] Newsletter subscribe failed:', err)
    )
  }

  return { success: true, message: 'Welcome to Lawyard Weekly!' }
}
