// Detects whether an email belongs to an OAuth-only account (e.g. signed up
// with Google, never set a password). Used by login/signup to replace the
// useless "Incorrect email or password" error with an actionable message.
//
// Security note: this only fires AFTER a failed password attempt on that
// exact email — same enumeration surface as Clerk/Auth0 identifier-first
// flows. Never call it on a bare email probe.

const PROVIDER_LABELS: Record<string, string> = {
  google: 'Google',
  apple: 'Apple',
  facebook: 'Facebook',
  github: 'GitHub',
  linkedin_oidc: 'LinkedIn',
  linkedin: 'LinkedIn',
}

export function providerLabel(provider: string): string {
  return PROVIDER_LABELS[provider] || provider
}

export async function getOAuthOnlyProvider(email: string): Promise<string | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) return null

  try {
    const res = await fetch(
      `${url}/auth/v1/admin/users?filter=${encodeURIComponent(email)}`,
      {
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
        cache: 'no-store',
      },
    )
    if (!res.ok) return null
    const data = await res.json()
    const user = (data.users || []).find(
      (u: { email?: string }) => u.email?.toLowerCase() === email.toLowerCase(),
    )
    if (!user) return null

    const identities: Array<{ provider?: string }> = user.identities || []
    const hasEmailIdentity = identities.some((i) => i.provider === 'email')
    const hasPasswordFlag = !!user.user_metadata?.has_password
    if (hasEmailIdentity || hasPasswordFlag) return null

    const oauthIdentity = identities.find((i) => i.provider && i.provider !== 'email')
    const fallback = user.app_metadata?.provider
    const provider = oauthIdentity?.provider || (fallback !== 'email' ? fallback : undefined)
    return provider || null
  } catch {
    return null
  }
}
