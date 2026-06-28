'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type DisplayEmail = 'everyone' | 'logged_in_only' | 'dont_display'
export type ContactFormRecipient = 'author_email' | 'listing_email'

export interface PreferencesData {
  hide_contact_form: boolean
  display_email: DisplayEmail
  contact_form_recipient: ContactFormRecipient
}

export async function getPreferences(): Promise<PreferencesData | { error: string }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) return { error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('profiles')
    .select('hide_contact_form, display_email, contact_form_recipient')
    .eq('id', user.id)
    .maybeSingle()

  if (error) return { error: error.message }

  return {
    hide_contact_form: data?.hide_contact_form ?? false,
    display_email: data?.display_email ?? 'everyone',
    contact_form_recipient: data?.contact_form_recipient ?? 'author_email',
  }
}

export async function updatePreferences(formData: FormData) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  const hide_contact_form = formData.get('hide_contact_form') === 'on'
  const display_email = formData.get('display_email') as DisplayEmail
  const contact_form_recipient = formData.get('contact_form_recipient') as ContactFormRecipient

  if (!['everyone', 'logged_in_only', 'dont_display'].includes(display_email)) {
    return { error: 'Invalid display_email value' }
  }

  if (!['author_email', 'listing_email'].includes(contact_form_recipient)) {
    return { error: 'Invalid contact_form_recipient value' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      hide_contact_form,
      display_email,
      contact_form_recipient,
    })
    .eq('id', user.id)

  if (error) {
    // Column might not exist yet in the database
    if (error.message?.includes('column') && error.message?.includes('does not exist')) {
      return { error: 'Preferences columns not yet added to database. Run the schema migration first.' }
    }
    return { error: `Failed to update preferences: ${error.message}` }
  }

  revalidatePath('/directory/dashboard/settings')
  return { success: true }
}
