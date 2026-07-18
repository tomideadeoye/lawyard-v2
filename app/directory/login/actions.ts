'use server'

// Server actions for the delayed auth chain.
// These consume the redirect+category params forwarded by signup-form.tsx
// and login-form.tsx via form fields (for email/password) or OAuth redirectTo.
//
// Three actions, each with different redirect strategies:
//   login()        — reads redirect+category from formData, redirects to the
//                    intended destination (add-listing) instead of always going
//                    to /directory/dashboard
//   loginWithMagicLink() — passes redirect params through emailRedirectTo so the
//                    magic link confirmation preserves the chain through auth/callback
//   signup()       — same as loginWithMagicLink, but also passes redirect params
//                    to the success page URL

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { sendWelcomeEmail, addContact } from '@/lib/api/brevo'
import { mapAuthError } from '@/lib/auth/auth-errors'

// Email/password login — used when login-form.tsx submits credentials.
// If redirect+category are present (from add-listing flow), overrides the
// default dashboard destination so the user lands back at add-listing.
export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = (formData.get('email') as string).trim()
  const password = (formData.get('password') as string).trim()
  const redirectParam = formData.get('redirect') as string | null
  const categoryParam = formData.get('category') as string | null
  const captchaToken = formData.get('captchaToken') as string | null

  if (!email || !password) {
    return redirect('/login?message=Please provide both email and password')
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
    options: {
      captchaToken: captchaToken || undefined,
    },
  })

  if (error) {
    console.error('[login] Supabase auth error:', error)
    return redirect(`/login?message=${encodeURIComponent(mapAuthError(error))}`)
  }

  // Use custom redirect if provided, otherwise default to dashboard.
  let destination = '/dashboard'
  if (redirectParam) {
    destination = redirectParam
    if (categoryParam) {
      destination += `?category=${encodeURIComponent(categoryParam)}`
    }
  }

  revalidatePath('/', 'layout')
  redirect(destination)
}

// Magic link — the redirectTo URL (built by login-form.tsx's buildCallbackUrl)
// is passed to Supabase as emailRedirectTo, so when the user clicks the magic
// link in their email, they land at auth/callback with the redirect params preserved.
export async function loginWithMagicLink(formData: FormData) {
  const supabase = await createClient()

  const email = (formData.get('email') as string).trim()
  const redirectTo = formData.get('redirectTo') as string
  const captchaToken = formData.get('captchaToken') as string | null

  if (!email) {
    return redirect('/login?message=Please provide your email')
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      captchaToken: captchaToken || undefined,
      emailRedirectTo: redirectTo || undefined,
    },
  })

  if (error) {
    console.error('[magic-link] Supabase auth error:', error)
    return redirect(`/login?message=${encodeURIComponent(mapAuthError(error))}`)
  }

  return { success: true }
}

// Email/password signup — creates the user via Supabase Auth.
// The emailRedirectTo includes redirect+category so the confirmation email
// sends the user to auth/callback which forwards them to add-listing.
// Also passes redirect params to the success page (/login/success) so the
// "Return to Login" button can maintain context (though after email confirmation
// the auth callback handles the actual redirect).
export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = (formData.get('email') as string).trim()
  const password = (formData.get('password') as string).trim()
  const fullName = formData.get('fullName') as string
  const role = formData.get('role') as string || 'client'
  const redirectParam = formData.get('redirect') as string | null
  const categoryParam = formData.get('category') as string | null
  const captchaToken = formData.get('captchaToken') as string | null

  if (!email || !password || !fullName) {
    return redirect('/login?message=Please complete all required fields')
  }

  // Build the callback URL for Supabase email confirmation.
  // User clicks → /auth/callback?next=/add-listing&category=lawyer → middleware rewrites → handler
  let callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`
  const cbParams = new URLSearchParams()
  if (redirectParam) cbParams.set('next', redirectParam)
  if (categoryParam) cbParams.set('category', categoryParam)
  const cbQs = cbParams.toString()
  if (cbQs) callbackUrl += `?${cbQs}`

  const signUpOptions: any = {
    data: {
      full_name: fullName,
      role: role,
    },
    emailRedirectTo: callbackUrl,
  }
  if (captchaToken) signUpOptions.captchaToken = captchaToken

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: signUpOptions,
  })

  if (error) {
    console.error('[signup] Supabase auth error:', error)
    return redirect(`/login?message=${encodeURIComponent(mapAuthError(error))}`)
  }

  // Pass redirect info to the success page so it can inform the user
  // where they'll end up after confirming their email.
  let successUrl = `/login/success?email=${encodeURIComponent(email)}`
  if (redirectParam) {
    successUrl += `&redirect=${encodeURIComponent(redirectParam)}`
    if (categoryParam) successUrl += `&category=${encodeURIComponent(categoryParam)}`
  }

  const listId = process.env.NODE_ENV === 'production'
    ? Number(process.env.BREVO_PROD_LIST_ID)
    : Number(process.env.BREVO_TEST_LIST_ID)

  if (process.env.BREVO_API_KEY && listId) {
    Promise.all([
      sendWelcomeEmail({ email, name: fullName }),
      addContact({ email, name: fullName, listId, attributes: { ROLE: role } }),
    ]).catch(err => console.error('[Brevo] Signup notification failed:', err))
  }

  revalidatePath('/', 'layout')
  redirect(successUrl)
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}
