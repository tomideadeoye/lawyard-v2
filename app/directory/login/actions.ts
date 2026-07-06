'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { sendSignupVerification, addContact } from '@/lib/api/brevo'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = (formData.get('email') as string).trim()
  const password = (formData.get('password') as string).trim()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return redirect('/directory/login?message=Could not authenticate user')
  }

  revalidatePath('/', 'layout')
  redirect('/directory/dashboard')
}

export async function loginWithMagicLink(formData: FormData) {
  const supabase = await createClient()

  const email = (formData.get('email') as string).trim()
  const redirectTo = formData.get('redirectTo') as string

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo || undefined,
    },
  })

  if (error) {
    return redirect(`/directory/login?message=${encodeURIComponent(error.message)}`)
  }

  return { success: true }
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = (formData.get('email') as string).trim()
  const password = (formData.get('password') as string).trim()
  const fullName = formData.get('fullName') as string
  const role = formData.get('role') as string || 'client'

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: role,
      },
    },
  })

  if (error) {
    return redirect('/directory/login?message=Could not authenticate user')
  }

  const listId = process.env.NODE_ENV === 'production'
    ? Number(process.env.BREVO_PROD_LIST_ID)
    : Number(process.env.BREVO_TEST_LIST_ID)

  if (process.env.BREVO_API_KEY && listId) {
    Promise.all([
      sendSignupVerification({ email, name: fullName }),
      addContact({ email, name: fullName, listId, attributes: { ROLE: role } }),
    ]).catch(err => console.error('[Brevo] Signup notification failed:', err))
  }

  revalidatePath('/', 'layout')
  redirect(`/directory/login/success?email=${encodeURIComponent(email)}`)
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/directory')
}
