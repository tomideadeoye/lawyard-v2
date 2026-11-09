// Email-confirmation handler — the token_hash flow, not the PKCE `?code=` flow.
//
// Why this exists: @supabase/ssr defaults to `flowType: "pkce"` for both the
// server and browser clients, so a confirmation email carries `?code=…` and the
// exchange only succeeds in the browser holding the `code-verifier` cookie. Open
// the email on a phone, in another browser, or after the cookie expires and
// `exchangeCodeForSession` fails — the user is verified in auth.users but never
// signed in, and lands on a login page with "Missing authentication code".
//
// `verifyOtp({ type, token_hash })` needs no cookie, so it works from any
// device. The Send Email hook (app/api/auth/hook/route.ts) mails links here.
//
// Upstream: Supabase Send Email hook → /auth/confirm?token_hash&type&next
// Downstream: role-based destination, preserving ?next= from the original flow.

import { NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

const OTP_TYPES = new Set(['signup', 'invite', 'magiclink', 'recovery', 'email_change', 'email'])

// Behind the Vercel proxy `request.url` can carry an internal origin, so prefer
// the forwarded host outside development — same rule the OAuth callback uses.
function absolute(request: Request, origin: string, path: string): string {
  const forwardedHost = request.headers.get('x-forwarded-host')
  if (process.env.NODE_ENV !== 'development' && forwardedHost) {
    return `https://${forwardedHost}${path}`
  }
  return `${origin}${path}`
}

export async function handleAuthConfirm(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const tokenHash = searchParams.get('token_hash')
  const rawType = searchParams.get('type') || 'signup'
  const next = searchParams.get('next')
  const errorCode = searchParams.get('error_code')
  const errorDescription = searchParams.get('error_description')

  if (errorCode) {
    const message = errorDescription || 'This link is invalid or has expired. Please request a new one.'
    return NextResponse.redirect(absolute(request, origin, `/login?message=${encodeURIComponent(message)}`))
  }

  if (!tokenHash) {
    const message = 'This link is missing its token. Please request a new email.'
    return NextResponse.redirect(absolute(request, origin, `/login?message=${encodeURIComponent(message)}`))
  }

  const type = (OTP_TYPES.has(rawType) ? rawType : 'signup') as EmailOtpType
  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })

  if (error) {
    console.error('[auth/confirm] verifyOtp failed:', error.message, { type })
    const expired = /expired|invalid|not found/i.test(error.message)
    const message = expired
      ? 'That link has expired or was already used. Request a new one from the sign-in page.'
      : error.message
    return NextResponse.redirect(absolute(request, origin, `/login?message=${encodeURIComponent(message)}`))
  }

  // Password recovery needs to land on the security tab, not the dashboard root.
  if (type === 'recovery') {
    return NextResponse.redirect(absolute(request, origin, '/dashboard/settings?tab=security&recovery=true'))
  }

  const { data: { user } } = await supabase.auth.getUser()
  let destination = next

  if (!destination && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'client') destination = '/search'
    else if (profile?.role === 'lawyer' || profile?.role === 'chamber') destination = '/dashboard'
  }

  return NextResponse.redirect(absolute(request, origin, destination || '/dashboard'))
}
