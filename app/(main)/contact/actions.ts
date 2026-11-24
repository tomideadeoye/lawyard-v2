'use server'

import { createClient } from '@/lib/supabase/server'

export async function submitContact(formData: FormData) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const subject = formData.get('subject') as string
  const message = formData.get('message') as string

  if (!name || !email || !subject || !message) {
    return { error: 'All fields are required' }
  }

  if (!email.includes('@')) {
    return { error: 'Invalid email address' }
  }

  const supabase = await createClient()

  const { error } = await supabase.from('contact_messages').insert({
    name,
    email,
    subject,
    message,
  })

  if (error) {
    console.error('Failed to save contact message:', error)
    return { error: 'Failed to send message. Please try again.' }
  }

  return { success: true }
}
