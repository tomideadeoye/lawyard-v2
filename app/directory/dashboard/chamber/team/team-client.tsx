'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Copy, Loader2, Mail, UserMinus, X } from 'lucide-react'
import {
  acceptSeat,
  declineRequest,
  endSeat,
  inviteMember,
  revokeInvite,
  type SeatRole,
} from '@/app/directory/actions/chamber-members'
import { TERMS } from '@/lib/constants'

export type TeamMember = {
  id: string
  lawyerId: string
  name: string
  avatarUrl: string | null
  seatRole: SeatRole
  status: 'pending' | 'active'
  joinedAt: string | null
  note: string | null
  isFirmOwner: boolean
}

export type TeamInvite = {
  id: string
  email: string
  seatRole: SeatRole
  token: string
  expiresAt: string
}

const SEAT_ROLE_LABELS: Record<SeatRole, string> = {
  partner: 'Partner',
  member: 'Member',
  associate: 'Associate',
  of_counsel: 'Of counsel',
}

const SEAT_ROLE_OPTIONS: SeatRole[] = ['partner', 'member', 'associate', 'of_counsel']

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

export default function TeamClient({
  chamberId,
  members,
  invites,
  seats,
  currentUserId,
}: {
  chamberId: string
  members: TeamMember[]
  invites: TeamInvite[]
  seats: { used: number; limit: number }
  currentUserId: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [email, setEmail] = useState('')
  const [seatRole, setSeatRole] = useState<SeatRole>('member')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const active = members.filter((m) => m.status === 'active')
  const pendingRequests = members.filter((m) => m.status === 'pending')

  const run = (fn: () => Promise<{ error?: string; ok?: boolean; inviteUrl?: string; emailed?: boolean }>) => {
    setError(null)
    setNotice(null)
    startTransition(async () => {
      const result = await fn()
      if (result.error) {
        setError(result.error)
        return
      }
      if ('inviteUrl' in result && result.inviteUrl) {
        setNotice(
          result.emailed
            ? `Invite sent. Link: ${result.inviteUrl}`
            : `Invite created — share this link: ${result.inviteUrl}`
        )
      }
      router.refresh()
    })
  }

  const submitInvite = (e: React.FormEvent) => {
    e.preventDefault()
    const address = email.trim()
    if (!address) return
    run(async () => {
      const result = await inviteMember({ chamberId, email: address, seatRole })
      if (!result.error) setEmail('')
      return result
    })
  }

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(url)
      setTimeout(() => setCopied(null), 1800)
    } catch {
      setError('Could not copy — select the link and copy it manually.')
    }
  }

  const inviteUrl = (token: string) =>
    typeof window === 'undefined' ? `/invite/${token}` : `${window.location.origin}/invite/${token}`

  return (
    <div className="space-y-8">
      {/* Invite */}
      <section className="rounded-xl border border-border/50 bg-card/40 p-5">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          <Mail className="h-3.5 w-3.5" />
          Invite a {TERMS.lawyer.lower}
        </h2>
        <form onSubmit={submitInvite} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="lawyer@firm.com"
            className="h-10 flex-1 rounded-lg border border-border/60 bg-background px-3 text-sm outline-none focus:border-brand"
          />
          <select
            value={seatRole}
            onChange={(e) => setSeatRole(e.target.value as SeatRole)}
            className="h-10 rounded-lg border border-border/60 bg-background px-3 text-sm"
            aria-label="Seat role"
          >
            {SEAT_ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {SEAT_ROLE_LABELS[role]}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground disabled:opacity-60"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Invite
          </button>
        </form>
        <p className="mt-2 text-xs text-muted-foreground">
          {seats.used} of {seats.limit} seats in use. An invite only takes a seat when the
          {' '}{TERMS.lawyer.lower} accepts.
        </p>
      </section>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
          <p className="break-all">{notice}</p>
        </div>
      )}

      {/* Waiting */}
      {pendingRequests.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Waiting ({pendingRequests.length})
          </h2>
          <ul className="divide-y divide-border/40 overflow-hidden rounded-xl border border-border/50">
            {pendingRequests.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand-muted">
                  {initials(m.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{m.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {SEAT_ROLE_LABELS[m.seatRole]}
                    {m.note ? ` · ${m.note}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => run(() => acceptSeat(m.id))}
                  disabled={pending}
                  className="inline-flex items-center gap-1 rounded-lg border border-emerald-600/30 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-500/10 dark:text-emerald-400"
                >
                  <Check className="h-3.5 w-3.5" /> Approve
                </button>
                <button
                  type="button"
                  onClick={() => run(() => declineRequest(m.id))}
                  disabled={pending}
                  className="inline-flex items-center gap-1 rounded-lg border border-border/60 px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted/20"
                >
                  <X className="h-3.5 w-3.5" /> Decline
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Members */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Members ({active.length})
        </h2>
        {active.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">
            No {TERMS.lawyer.lowerPlural} in this {TERMS.firm.lower} yet.
          </p>
        ) : (
          <ul className="divide-y divide-border/40 overflow-hidden rounded-xl border border-border/50">
            {active.map((m) => (
              <li key={m.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand-muted">
                  {initials(m.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {m.name}
                    {m.isFirmOwner && (
                      <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-brand-muted">Owner</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">{SEAT_ROLE_LABELS[m.seatRole]}</p>
                </div>
                {!m.isFirmOwner ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (!confirm(`Remove ${m.name} from the firm? Their listing stays live.`)) return
                      run(() => endSeat(m.id, 'Removed by the firm'))
                    }}
                    disabled={pending}
                    className="inline-flex items-center gap-1 rounded-lg border border-border/60 px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive"
                  >
                    <UserMinus className="h-3.5 w-3.5" /> Remove
                  </button>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {m.lawyerId === currentUserId ? 'You own this firm' : 'Firm owner'}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Invites */}
      {invites.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Invites sent ({invites.length})
          </h2>
          <ul className="divide-y divide-border/40 overflow-hidden rounded-xl border border-border/50">
            {invites.map((i) => {
              const url = inviteUrl(i.token)
              return (
                <li key={i.id} className="flex flex-wrap items-center gap-2 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{i.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {SEAT_ROLE_LABELS[i.seatRole]} · expires{' '}
                      {new Date(i.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copy(url)}
                    className="inline-flex items-center gap-1 rounded-lg border border-border/60 px-2.5 py-1.5 text-xs font-semibold transition-colors hover:bg-muted/20"
                  >
                    {copied === url ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied === url ? 'Copied' : 'Link'}
                  </button>
                  <button
                    type="button"
                    onClick={() => run(() => revokeInvite(i.id))}
                    disabled={pending}
                    className="inline-flex items-center gap-1 rounded-lg border border-border/60 px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" /> Withdraw
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </div>
  )
}
