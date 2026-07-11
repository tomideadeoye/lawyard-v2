// Hop 3 in the Delayed Auth Chain — OAuth callback handler.
// Receives the auth code from Google/LinkedIn (or email confirmation),
// exchanges it for a Supabase session, then redirects the user to the
// intended destination with ?category=X preserved.
//
// Priority for redirect destination:
//   1. `?next=` param (set by signup-form/login-form's buildCallbackUrl)
//      → used when coming from add-listing flow
//   2. Role-based routing (if no `?next` provided)
//      → client → /search, lawyer/chamber → /dashboard
//   3. Fallback → /dashboard
//
// The `category` param is appended to whatever destination is chosen,
// so add-listing/page.tsx can restore the user's category selection.
//
// Upstream: signup-form.tsx / login-form.tsx — OAuth redirectTo with ?next=...&category=...
// Downstream: add-listing/page.tsx — reads ?category= from URL

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const category = searchParams.get('category')
  const isRecovery = searchParams.get('recovery') === 'true' || searchParams.get('type') === 'recovery'

  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  if (error) {
    const msg = mapOAuthError(error, errorDescription)
    return NextResponse.redirect(`${origin}/login?message=${encodeURIComponent(msg)}`)
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?message=Missing authentication code. Please try again.`)
  }

  const supabase = await createClient()
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    const msg = exchangeError.message?.toLowerCase() || ''
    if (msg.includes('expired') || msg.includes('invalid code')) {
      return NextResponse.redirect(`${origin}/login?message=This link has expired. Please log in again.`)
    }
    if (msg.includes('rate limit') || msg.includes('too many')) {
      return NextResponse.redirect(`${origin}/login?message=Too many attempts. Please wait and try again.`)
    }
    console.error('[auth/callback] Code exchange error:', exchangeError)
    return NextResponse.redirect(`${origin}/login?message=${encodeURIComponent(mapAuthError(exchangeError))}`)
  }

  const { data: { user } } = await supabase.auth.getUser()
  let redirectTo = next

  if (!searchParams.has('next') && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'client') {
      redirectTo = '/search'
    } else if (profile?.role === 'lawyer' || profile?.role === 'chamber') {
      redirectTo = '/dashboard'
    }
  }

  if (category) {
    const separator = redirectTo.includes('?') ? '&' : '?'
    redirectTo += `${separator}category=${encodeURIComponent(category)}`
  }

  if (isRecovery) {
    const separator = redirectTo.includes('?') ? '&' : '?'
    redirectTo += `${separator}recovery=true`
  }

  const forwardedHost = request.headers.get('x-forwarded-host')
  const isLocalEnv = process.env.NODE_ENV === 'development'
  
  if (isLocalEnv) {
    return NextResponse.redirect(`${origin}${redirectTo}`)
  } else if (forwardedHost) {
    return NextResponse.redirect(`https://${forwardedHost}${redirectTo}`)
  } else {
    return NextResponse.redirect(`${origin}${redirectTo}`)
  }
}

function mapAuthError(error: { message?: string } | null) {
  const msg = error?.message?.toLowerCase() || ''
  if (msg.includes('rate limit') || msg.includes('too many')) return 'Too many attempts. Please wait and try again.'
  if (msg.includes('expired') || msg.includes('invalid code')) return 'This link has expired. Please log in again.'
  if (msg.includes('invalid credentials')) return 'Authentication failed. Please log in again.'
  return 'Something went wrong. Please try logging in again.'
}

function mapOAuthError(error: string | null, description: string | null) {
  const desc = (description || '').toLowerCase()
  if (error === 'access_denied') return 'Login cancelled. Please try again.'
  if (desc.includes('expired')) return 'This login attempt has expired. Please try again.'
  if (desc.includes('temporarily unavailable')) return 'The provider is temporarily unavailable. Please try again later.'
  return description || 'Social login failed. Please try again or use email instead.'
}
