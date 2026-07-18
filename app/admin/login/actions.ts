'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { mapAuthError } from '@/lib/auth/auth-errors'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = (formData.get('email') as string).trim()
  const password = (formData.get('password') as string).trim()
  const captchaToken = formData.get('captchaToken') as string | null

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
    options: {
      captchaToken: captchaToken || undefined,
    },
  })

  if (error) {
    return redirect(`/admin/login?message=${encodeURIComponent(mapAuthError(error))}`)
  }

  revalidatePath('/', 'layout')
  redirect('/admin')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/admin/login')
}

export async function loginWithMagicLink(formData: FormData) {
  const supabase = await createClient();
  const email = (formData.get('email') as string).trim();
  const redirectTo = formData.get('redirectTo') as string;
  const captchaToken = formData.get('captchaToken') as string | null;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      captchaToken: captchaToken || undefined,
      emailRedirectTo: redirectTo || undefined,
    },
  });

  if (error) {
    return redirect(`/admin/login?message=${encodeURIComponent(mapAuthError(error))}`);
  }

  return { success: true };
}
