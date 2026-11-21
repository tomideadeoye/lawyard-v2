import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { TERMS } from '@/lib/constants'
import { seatState } from '@/lib/directory/seats'
import TeamClient, { type TeamMember, type TeamInvite } from './team-client'

// Firm seats (C22). The list, the invites and the seat count in one place, so a
// firm can answer "who is in my firm and am I paying for them" without support.
export default async function ChamberTeamPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Owner or delegate admin — the people allowed to spend seats.
  let chamber: { id: string; name: string; seat_limit: number; subscription_tier: string; subscription_status: string; user_id: string | null } | null = null

  const { data: owned } = await supabase
    .from('chambers')
    .select('id, name, seat_limit, subscription_tier, subscription_status, user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  chamber = owned

  if (!chamber) {
    const { data: adminRow } = await supabase
      .from('chamber_admins')
      .select('chamber_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (adminRow?.chamber_id) {
      const { data: delegated } = await supabase
        .from('chambers')
        .select('id, name, seat_limit, subscription_tier, subscription_status, user_id')
        .eq('id', adminRow.chamber_id)
        .maybeSingle()
      chamber = delegated
    }
  }

  if (!chamber) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <h1 className="text-2xl font-bold tracking-tight">No {TERMS.firm.lower} to manage</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Create your {TERMS.firm.lower} listing first, then you can add {TERMS.lawyer.lowerPlural} to it.
        </p>
        <Link
          href="/dashboard/chamber"
          className="mt-6 inline-block rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground"
        >
          Go to My {TERMS.firm.singular}
        </Link>
      </div>
    )
  }

  const { data: memberRows } = await supabase
    .from('chamber_members')
    .select('id, lawyer_id, seat_role, status, joined_at, created_at, note')
    .eq('chamber_id', chamber.id)
    .in('status', ['pending', 'active'])
    .order('created_at', { ascending: true })

  const ids = (memberRows ?? []).map((m) => m.lawyer_id)
  const { data: profiles } = ids.length
    ? await supabase.from('profiles').select('id, full_name, avatar_url').in('id', ids)
    : { data: [] as { id: string; full_name: string | null; avatar_url: string | null }[] }

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]))

  const members: TeamMember[] = (memberRows ?? []).map((m) => ({
    id: m.id,
    lawyerId: m.lawyer_id,
    name: profileById.get(m.lawyer_id)?.full_name || 'Unnamed lawyer',
    avatarUrl: profileById.get(m.lawyer_id)?.avatar_url || null,
    seatRole: m.seat_role as TeamMember['seatRole'],
    status: m.status as TeamMember['status'],
    joinedAt: m.joined_at,
    note: m.note,
    isFirmOwner: m.lawyer_id === chamber?.user_id,
  }))

  const { data: inviteRows } = await supabase
    .from('chamber_invites')
    .select('id, email, seat_role, token, expires_at, created_at')
    .eq('chamber_id', chamber.id)
    .is('accepted_at', null)
    .is('revoked_at', null)
    .order('created_at', { ascending: false })

  const invites: TeamInvite[] = (inviteRows ?? []).map((i) => ({
    id: i.id,
    email: i.email,
    seatRole: i.seat_role as TeamInvite['seatRole'],
    token: i.token,
    expiresAt: i.expires_at,
  }))

  const { data: used } = await supabase.rpc('chamber_seats_used', { p_chamber_id: chamber.id })
  const seats = seatState(Number(used ?? 0), chamber.seat_limit ?? 1)

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10 sm:px-6 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Team &amp; seats</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {chamber.name} · {seats.used} of {seats.limit} {seats.limit === 1 ? 'seat' : 'seats'} in use
          </p>
        </div>
        <Link
          href="/pricing"
          className="rounded-lg border border-border/60 px-3 py-2 text-xs font-semibold transition-colors hover:bg-muted/20"
        >
          {seats.atCapacity ? 'Buy more seats' : 'Manage seats'}
        </Link>
      </div>

      {seats.atCapacity && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          All {seats.limit} {seats.limit === 1 ? 'seat is' : 'seats are'} taken. Approving another
          {' '}{TERMS.lawyer.lower} needs another seat.
        </div>
      )}

      <TeamClient
        chamberId={chamber.id}
        members={members}
        invites={invites}
        seats={{ used: seats.used, limit: seats.limit }}
        currentUserId={user.id}
      />
    </div>
  )
}
