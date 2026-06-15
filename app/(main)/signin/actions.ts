'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function loginUser(prevState: { error?: string } | null, formData: FormData) {
  const supabase = await createClient()

  const email = (formData.get('email') as string).trim()
  const password = (formData.get('password') as string).trim()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('[loginUser] Supabase auth error:', JSON.stringify({ message: error.message, status: error.status, code: (error as any).code }))
    return { error: 'Invalid email or password' }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signupUser(formData: FormData) {
  const supabase = await createClient()

  const email = (formData.get('email') as string).trim()
  const password = (formData.get('password') as string).trim()
  const fullName = formData.get('fullName') as string

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: 'client',
      },
    },
  })

  if (error) {
    return redirect('/signin?message=Could not create account')
  }

  revalidatePath('/', 'layout')
  redirect(`/signin?success=${encodeURIComponent(email)}`)
}

export async function signOutUser() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}
