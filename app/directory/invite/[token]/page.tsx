import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getInvite } from '@/app/directory/actions/chamber-members'
import { TERMS } from '@/lib/constants'
import AcceptInvite from './accept-invite'

export const dynamic = 'force-dynamic'

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const invite = await getInvite(token)

  if ('error' in invite) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Invitation unavailable</h1>
        <p className="mt-2 text-sm text-muted-foreground">{invite.error}</p>
        <Link href="/" className="mt-6 text-sm font-semibold text-brand-muted hover:underline">
          Back to Lawyard Directory
        </Link>
      </main>
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const redirectPath = `/invite/${token}`

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-12">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-muted">
        Firm invitation
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        Join {invite.chamberName}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        You&rsquo;ve been invited to take a {invite.seatRole.replace('_', ' ')} seat as a
        {' '}{TERMS.lawyer.lower}. Accepting puts your listing on the firm&rsquo;s page and gives
        you the firm&rsquo;s plan limits. Your profile stays yours.
      </p>

      {user ? (
        <div className="mt-6">
          <AcceptInvite token={token} />
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          <Link
            href={`/signup?redirect=${encodeURIComponent(redirectPath)}`}
            className="block w-full rounded-lg bg-brand px-4 py-3 text-center text-sm font-semibold text-brand-foreground"
          >
            Create an account to accept
          </Link>
          <Link
            href={`/login?redirect=${encodeURIComponent(redirectPath)}`}
            className="block w-full rounded-lg border border-border/60 px-4 py-3 text-center text-sm font-semibold"
          >
            I already have an account
          </Link>
          <p className="text-center text-xs text-muted-foreground">
            This invitation was sent to {invite.email}. Use that address.
          </p>
        </div>
      )}
    </main>
  )
}
