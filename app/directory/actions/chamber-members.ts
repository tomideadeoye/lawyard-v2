'use server'

// Chamber seats (C22 — 21 Nov 2026).
//
// Join, approve, decline, leave and remove all live here so the rules exist in
// one place and the browser never writes a membership row directly. Seat
// activation is delegated to `chamber_accept_seat()` in SQL: the count and the
// update have to happen under the same row lock or two simultaneous accepts can
// both take the last seat.
//
// Authorisation model:
//   - a firm owner (chambers.user_id) or a chamber_admin may invite, approve,
//     decline and remove
//   - a lawyer may request a seat, accept their own seat, decline it, and leave
//   - everything else is refused

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { sendTransactionalEmail } from '@/lib/api/brevo'

export type SeatRole = 'partner' | 'member' | 'associate' | 'of_counsel'

const SEAT_ROLES: SeatRole[] = ['partner', 'member', 'associate', 'of_counsel']

function siteOrigin() {
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://directory.lawyard.org'
}

interface ActionResult {
  error?: string
  ok?: boolean
  inviteUrl?: string
  emailed?: boolean
}

/** Owner or delegate admin of this firm. */
async function canManageFirm(
  admin: ReturnType<typeof createServiceRoleClient>,
  chamberId: string,
  userId: string
): Promise<boolean> {
  const { data: chamber } = await admin
    .from('chambers')
    .select('id, user_id')
    .eq('id', chamberId)
    .maybeSingle()

  if (chamber?.user_id === userId) return true

  const { data: adminRow } = await admin
    .from('chamber_admins')
    .select('role')
    .eq('chamber_id', chamberId)
    .eq('user_id', userId)
    .maybeSingle()

  return Boolean(adminRow)
}

async function currentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

// ---------------------------------------------------------------------------
// Firm side
// ---------------------------------------------------------------------------

export async function inviteMember(input: {
  chamberId: string
  email: string
  seatRole?: SeatRole
}): Promise<ActionResult> {
  const { user } = await currentUser()
  if (!user) return { error: 'Not authenticated' }

  const email = (input.email || '').trim().toLowerCase()
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: 'Enter a valid email address' }

  const seatRole: SeatRole = SEAT_ROLES.includes(input.seatRole as SeatRole)
    ? (input.seatRole as SeatRole)
    : 'member'

  const admin = createServiceRoleClient()
  if (!(await canManageFirm(admin, input.chamberId, user.id))) {
    return { error: 'You do not manage this firm' }
  }

  // Already has a live invite to this firm? Don't stack duplicates.
  const { data: openInvite } = await admin
    .from('chamber_invites')
    .select('id')
    .eq('chamber_id', input.chamberId)
    .ilike('email', email)
    .is('accepted_at', null)
    .is('revoked_at', null)
    .maybeSingle()

  if (openInvite) return { error: 'That address already has a live invite to this firm' }

  const { data: chamber } = await admin
    .from('chambers')
    .select('name, seat_limit')
    .eq('id', input.chamberId)
    .maybeSingle()

  const { data: created, error } = await admin
    .from('chamber_invites')
    .insert({
      chamber_id: input.chamberId,
      email,
      seat_role: seatRole,
      invited_by: user.id,
    })
    .select('token')
    .single()

  if (error || !created) return { error: error?.message || 'Could not create the invite' }

  const inviteUrl = `${siteOrigin()}/invite/${created.token}`

  let emailed = false
  if (process.env.BREVO_API_KEY) {
    const result = await sendTransactionalEmail({
      to: [{ email }],
      subject: `You're invited to join ${chamber?.name ?? 'a firm'} on Lawyard`,
      htmlContent: `
        <p>${chamber?.name ?? 'A firm'} has invited you to join their listing on Lawyard Directory as an ${seatRole.replace('_', ' ')}.</p>
        <p><a href="${inviteUrl}">Accept the invitation</a></p>
        <p>The link expires in 14 days. If you were not expecting this, ignore the email.</p>
      `,
    })
    emailed = !('error' in result)
  }

  revalidatePath('/dashboard/chamber/team')
  // The link is returned either way: many firms share it on WhatsApp rather than
  // rely on the invitee's inbox.
  return { ok: true, inviteUrl, emailed }
}

export async function revokeInvite(inviteId: string): Promise<ActionResult> {
  const { user } = await currentUser()
  if (!user) return { error: 'Not authenticated' }

  const admin = createServiceRoleClient()
  const { data: invite } = await admin
    .from('chamber_invites')
    .select('id, chamber_id')
    .eq('id', inviteId)
    .maybeSingle()

  if (!invite) return { error: 'Invite not found' }
  if (!(await canManageFirm(admin, invite.chamber_id, user.id))) {
    return { error: 'You do not manage this firm' }
  }

  const { error } = await admin
    .from('chamber_invites')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', inviteId)
    .is('accepted_at', null)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/chamber/team')
  return { ok: true }
}

/** A lawyer asks to join a firm. The firm approves; seats are checked then. */
export async function requestSeat(chamberId: string, note?: string): Promise<ActionResult> {
  const { user } = await currentUser()
  if (!user) return { error: 'Not authenticated' }

  const admin = createServiceRoleClient()

  const { data: open } = await admin
    .from('chamber_members')
    .select('id, chamber_id, status')
    .eq('lawyer_id', user.id)
    .in('status', ['pending', 'active'])
    .maybeSingle()

  if (open) {
    return {
      error:
        open.chamber_id === chamberId
          ? open.status === 'active'
            ? 'You are already a member of this firm'
            : 'Your request to join this firm is already pending'
          : 'You already hold a seat at another firm. Leave it before requesting to join another.',
    }
  }

  const { error } = await admin.from('chamber_members').insert({
    chamber_id: chamberId,
    lawyer_id: user.id,
    seat_role: 'member',
    status: 'pending',
    requested_by: user.id,
    note: note?.slice(0, 280) ?? null,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/chamber')
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Seat transitions
// ---------------------------------------------------------------------------

/** Approve (firm) or accept (lawyer). Atomic, seat-checked in SQL. */
export async function acceptSeat(memberId: string): Promise<ActionResult> {
  const { supabase, user } = await currentUser()
  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await supabase.rpc('chamber_accept_seat', { p_member_id: memberId })

  if (error) return { error: error.message }

  const result = data as { error?: string; cap?: number; used?: number } | null
  if (result?.error === 'seat_limit_reached') {
    return {
      error: `This firm has filled all ${result.cap} seats. Ask them to buy another seat to add you.`,
    }
  }
  if (result?.error) return { error: result.error }

  // Holding a seat in a law firm is the strongest signal that this account is a
  // lawyer. Promote out of the default role only — never demote an admin, never
  // overwrite an existing role.
  const admin = createServiceRoleClient()
  await admin
    .from('profiles')
    .update({ role: 'lawyer' })
    .eq('id', user.id)
    .eq('role', 'client')

  revalidatePath('/dashboard/chamber')
  revalidatePath('/dashboard/chamber/team')
  revalidatePath('/dashboard/listings')
  return { ok: true }
}

/** A lawyer turns down their own pending seat. */
export async function declineSeat(memberId: string): Promise<ActionResult> {
  const { user } = await currentUser()
  if (!user) return { error: 'Not authenticated' }

  const admin = createServiceRoleClient()
  const { data: member } = await admin
    .from('chamber_members')
    .select('id, lawyer_id, status')
    .eq('id', memberId)
    .maybeSingle()

  if (!member || member.lawyer_id !== user.id) return { error: 'Not found' }
  if (member.status !== 'pending') return { error: 'That invitation is no longer open' }

  const { error } = await admin
    .from('chamber_members')
    .update({ status: 'declined', ended_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', memberId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/chamber')
  return { ok: true }
}

/**
 * A firm turns down a request to join (or a stale invite it no longer wants).
 * The lawyer sees nothing on their side; the row stays as history.
 */
export async function declineRequest(memberId: string): Promise<ActionResult> {
  const { user } = await currentUser()
  if (!user) return { error: 'Not authenticated' }

  const admin = createServiceRoleClient()
  const { data: member } = await admin
    .from('chamber_members')
    .select('id, chamber_id, status')
    .eq('id', memberId)
    .maybeSingle()

  if (!member) return { error: 'Not found' }
  if (!(await canManageFirm(admin, member.chamber_id, user.id))) {
    return { error: 'You do not manage this firm' }
  }
  if (member.status !== 'pending') return { error: 'That request is no longer open' }

  const { error } = await admin
    .from('chamber_members')
    .update({ status: 'declined', ended_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', memberId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/chamber/team')
  return { ok: true }
}

/**
 * Leave (lawyer) or remove (firm). The lawyer's listing survives; only the firm
 * link and any firm-conferred entitlement go with it.
 */
export async function endSeat(memberId: string, reason?: string): Promise<ActionResult> {
  const { supabase, user } = await currentUser()
  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await supabase.rpc('chamber_end_seat', {
    p_member_id: memberId,
    p_reason: reason ?? null,
  })

  if (error) return { error: error.message }
  const result = data as { error?: string } | null
  if (result?.error) return { error: result.error }

  revalidatePath('/dashboard/chamber')
  revalidatePath('/dashboard/chamber/team')
  revalidatePath('/dashboard/listings')
  return { ok: true }
}

/**
 * Form-friendly leave action for the member view (server action, no client JS).
 */
export async function leaveFirm(formData: FormData) {
  const memberId = formData.get('member_id') as string
  if (memberId) await endSeat(memberId, 'Left the firm')
  redirect('/dashboard')
}

/**
 * Form-friendly decline action for the member view (server action, no client JS).
 */
export async function declineFirmSeat(formData: FormData) {
  const memberId = formData.get('member_id') as string
  if (memberId) await declineSeat(memberId)
  redirect('/dashboard/chamber')
}

// ---------------------------------------------------------------------------
// Invite redemption
// ---------------------------------------------------------------------------

/** Resolve an invite token for the public invite page. */
export async function getInvite(token: string) {
  const admin = createServiceRoleClient()
  const { data: invite } = await admin
    .from('chamber_invites')
    .select('id, email, seat_role, expires_at, accepted_at, revoked_at, chambers:chambers(id, name, location)')
    .eq('token', token)
    .maybeSingle()

  if (!invite) return { error: 'This invitation link is not valid.' }
  if (invite.accepted_at) return { error: 'This invitation has already been used.' }
  if (invite.revoked_at) return { error: 'This invitation was withdrawn by the firm.' }
  if (new Date(invite.expires_at) <= new Date()) return { error: 'This invitation has expired.' }

  const chamber = Array.isArray(invite.chambers) ? invite.chambers[0] : invite.chambers

  return {
    email: invite.email as string,
    seatRole: invite.seat_role as SeatRole,
    chamberName: (chamber as { name?: string } | null)?.name ?? 'the firm',
    chamberLocation: (chamber as { location?: string } | null)?.location ?? null,
  }
}

/** Redeem a token for the signed-in user. Creates the seat pending, then accepts. */
export async function redeemInvite(token: string): Promise<ActionResult> {
  const { user } = await currentUser()
  if (!user) return { error: 'Sign in to accept this invitation.' }

  const admin = createServiceRoleClient()
  const { data: invite } = await admin
    .from('chamber_invites')
    .select('id, chamber_id, email, seat_role, expires_at, accepted_at, revoked_at, invited_by')
    .eq('token', token)
    .maybeSingle()

  if (!invite) return { error: 'This invitation link is not valid.' }
  if (invite.accepted_at) return { error: 'This invitation has already been used.' }
  if (invite.revoked_at) return { error: 'This invitation was withdrawn by the firm.' }
  if (new Date(invite.expires_at) <= new Date()) return { error: 'This invitation has expired.' }

  // The token is addressed to an inbox; only that account may spend it.
  if ((user.email ?? '').toLowerCase() !== (invite.email as string).toLowerCase()) {
    return { error: `This invitation was sent to ${invite.email}. Sign in with that address to accept.` }
  }

  const { data: open } = await admin
    .from('chamber_members')
    .select('id, chamber_id, status')
    .eq('lawyer_id', user.id)
    .in('status', ['pending', 'active'])
    .maybeSingle()

  if (open) {
    if (open.chamber_id === invite.chamber_id && open.status === 'active') {
      await admin.from('chamber_invites')
        .update({ accepted_at: new Date().toISOString(), accepted_by: user.id })
        .eq('id', invite.id)
      return { ok: true }
    }
    return {
      error: 'You already hold a seat at another firm. Leave it before accepting this invitation.',
    }
  }

  const { data: member, error: insertError } = await admin
    .from('chamber_members')
    .insert({
      chamber_id: invite.chamber_id,
      lawyer_id: user.id,
      seat_role: invite.seat_role,
      status: 'pending',
      invited_by: invite.invited_by,
    })
    .select('id')
    .single()

  if (insertError || !member) return { error: insertError?.message || 'Could not create the seat' }

  const accepted = await acceptSeat(member.id)
  if (accepted.error) {
    // Seat was refused (firm at capacity): leave the pending row so the firm can
    // buy a seat and approve it, rather than making the lawyer start over.
    return { error: accepted.error }
  }

  await admin
    .from('chamber_invites')
    .update({ accepted_at: new Date().toISOString(), accepted_by: user.id })
    .eq('id', invite.id)

  return { ok: true }
}
