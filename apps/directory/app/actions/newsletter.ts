'use server';

import { createClient } from '@/lib/supabase/server';

export async function subscribeToNewsletter(formData: FormData) {
  const email = formData.get('email') as string;
  if (!email) return { error: 'Email is required' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('newsletter_subscribers')
    .insert([{ email }]);

  if (error) {
    if (error.code === '23505') return { success: true, message: 'You are already subscribed!' };
    return { error: 'Failed to subscribe. Please try again.' };
  }

  return { success: true, message: 'Welcome to Lawyard Weekly!' };
}