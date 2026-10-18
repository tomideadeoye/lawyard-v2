'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatNGN } from '@/lib/currency'
import { respondToServiceRequest } from '@/app/directory/actions/service-requests'

interface ServiceRequest {
  id: string
  client_name: string
  client_email: string
  client_phone: string | null
  service_type: string
  scope: string
  budget: string | null
  preferred_date: string | null
  message: string | null
  booking_fee: number
  status: string
  created_at: string
}

const STATUS_STYLES: Record<string, string> = {
  pending_payment: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  requested: 'bg-sky-500/10 text-sky-600 border-sky-500/20',
  accepted: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  declined: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
  completed: 'bg-muted text-muted-foreground border-border/40',
  cancelled: 'bg-muted text-muted-foreground border-border/40',
}

export default function BookingsClient({ requests }: { requests: ServiceRequest[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<string | null>(null)

  function respond(id: string, status: 'accepted' | 'declined' | 'completed') {
    setBusyId(id)
    startTransition(async () => {
      await respondToServiceRequest(id, status)
      setBusyId(null)
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      {requests.map((r) => (
        <Card key={r.id} className="border border-border/40 bg-card/45 backdrop-blur-md">
          <CardContent className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">{r.client_name}</h3>
                <p className="text-xs text-muted-foreground">
                  {r.client_email}
                  {r.client_phone ? ` · ${r.client_phone}` : ''}
                </p>
              </div>
              <span className={`self-start text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${STATUS_STYLES[r.status] || STATUS_STYLES.requested}`}>
                {r.status.replace('_', ' ')}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="block text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Service</span>
                <span className="font-medium">{r.service_type}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Budget</span>
                <span className="font-medium">{r.budget || '—'}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Preferred</span>
                <span className="font-medium">{r.preferred_date || '—'}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Fee paid</span>
                <span className="font-medium">{formatNGN(r.booking_fee)}</span>
              </div>
            </div>

            <div className="text-sm">
              <span className="block text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Scope</span>
              <p className="text-foreground/85 whitespace-pre-wrap">{r.scope}</p>
            </div>

            {r.message && (
              <p className="text-xs text-muted-foreground whitespace-pre-wrap">{r.message}</p>
            )}

            {(r.status === 'requested' || r.status === 'accepted') && (
              <div className="flex gap-2 pt-1">
                {r.status === 'requested' && (
                  <>
                    <Button size="sm" disabled={pending && busyId === r.id} onClick={() => respond(r.id, 'accepted')}>
                      Accept
                    </Button>
                    <Button size="sm" variant="outline" disabled={pending && busyId === r.id} onClick={() => respond(r.id, 'declined')}>
                      Decline
                    </Button>
                  </>
                )}
                {r.status === 'accepted' && (
                  <Button size="sm" variant="outline" disabled={pending && busyId === r.id} onClick={() => respond(r.id, 'completed')}>
                    Mark completed
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
