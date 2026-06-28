'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Check, X, ExternalLink, Mail, Phone, Scale } from 'lucide-react'

interface Verification {
  id: string
  user_id: string
  full_name: string
  scn: string | null
  year_of_call: number
  phone: string | null
  firm_name: string | null
  status: string
  notes: string | null
  created_at: string
  reviewed_at: string | null
  profiles: { email: string } | { email: string }[]
}

function getEmail(profiles: { email: string } | { email: string }[]): string {
  if (Array.isArray(profiles)) return profiles[0]?.email ?? ''
  return profiles.email ?? ''
}

export function VerificationsTable({ verifications }: { verifications: Verification[] }) {
  const router = useRouter()
  const [acting, setActing] = useState<string | null>(null)

  async function handleAction(id: string, action: 'approved' | 'rejected') {
    setActing(id)
    const supabase = createClient()

    // Get the verification
    const { data: verification } = await supabase
      .from('lawyer_verifications')
      .select('user_id, full_name')
      .eq('id', id)
      .single()

    if (!verification) {
      setActing(null)
      return
    }

    // Update verification status
    const { error: updateError } = await supabase
      .from('lawyer_verifications')
      .update({
        status: action,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) {
      console.error('Failed to update:', updateError)
      setActing(null)
      return
    }

    // If approved, upgrade the user's role
    if (action === 'approved') {
      await supabase
        .from('profiles')
        .update({ role: 'lawyer' })
        .eq('id', verification.user_id)
    }

    setActing(null)
    router.refresh()
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border/40">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/30 border-b border-border/40">
            <th className="text-left p-3 font-medium text-xs uppercase tracking-wide text-muted-foreground">Lawyer</th>
            <th className="text-left p-3 font-medium text-xs uppercase tracking-wide text-muted-foreground hidden sm:table-cell">Bar Details</th>
            <th className="text-left p-3 font-medium text-xs uppercase tracking-wide text-muted-foreground hidden md:table-cell">Contact</th>
            <th className="text-left p-3 font-medium text-xs uppercase tracking-wide text-muted-foreground">Status</th>
            <th className="text-left p-3 font-medium text-xs uppercase tracking-wide text-muted-foreground hidden lg:table-cell">Submitted</th>
            <th className="text-right p-3 font-medium text-xs uppercase tracking-wide text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {verifications.map((v) => (
            <tr key={v.id} className="border-b border-border/20 last:border-0 hover:bg-muted/20 transition-colors">
              <td className="p-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#a77c5c]/10 flex items-center justify-center text-[#a77c5c] text-xs font-bold shrink-0">
                    {v.full_name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{v.full_name}</p>
                    {v.firm_name && (
                      <p className="text-[10px] text-muted-foreground">{v.firm_name}</p>
                    )}
                  </div>
                </div>
              </td>
              <td className="p-3 hidden sm:table-cell">
                <div className="space-y-0.5">
                  {v.scn && <p className="text-xs font-mono">SCN: {v.scn}</p>}
                  <p className="text-xs text-muted-foreground">Call: {v.year_of_call}</p>
                </div>
              </td>
              <td className="p-3 hidden md:table-cell">
                <div className="space-y-0.5">
                  <a
                    href={`mailto:${getEmail(v.profiles)}`}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground no-underline"
                  >
                    <Mail className="h-3 w-3" />
                    {getEmail(v.profiles)}
                  </a>
                  {v.phone && (
                    <a
                      href={`tel:${v.phone}`}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground no-underline"
                    >
                      <Phone className="h-3 w-3" />
                      {v.phone}
                    </a>
                  )}
                </div>
              </td>
              <td className="p-3">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                    v.status === 'approved'
                      ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400'
                      : v.status === 'rejected'
                        ? 'text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400'
                        : 'text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400'
                  }`}
                >
                  {v.status === 'approved' && <Check className="h-3 w-3" />}
                  {v.status === 'rejected' && <X className="h-3 w-3" />}
                  {v.status === 'pending' && <Scale className="h-3 w-3" />}
                  {v.status}
                </span>
              </td>
              <td className="p-3 hidden lg:table-cell text-xs text-muted-foreground">
                {new Date(v.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </td>
              <td className="p-3 text-right">
                {v.status === 'pending' ? (
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => handleAction(v.id, 'approved')}
                      disabled={acting === v.id}
                      className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors disabled:opacity-50"
                      title="Approve"
                    >
                      {acting === v.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleAction(v.id, 'rejected')}
                      disabled={acting === v.id}
                      className="p-1.5 rounded-md text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50"
                      title="Deny"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <span className="text-[10px] text-muted-foreground italic">
                    {v.reviewed_at
                      ? new Date(v.reviewed_at).toLocaleDateString()
                      : '—'}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
