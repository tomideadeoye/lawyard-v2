import { createServiceRoleClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { VerificationsTable } from './verifications-table'

export const dynamic = 'force-dynamic'

async function getVerifications(status?: string) {
  const sbAdmin = createServiceRoleClient()
  let query = sbAdmin
    .from('lawyer_verifications')
    .select('*, profiles!inner(email)')
    .order('created_at', { ascending: false })

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) {
    console.error('Error fetching verifications:', error)
    return []
  }
  return data
}

export default async function VerificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const verifications = await getVerifications(status)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lawyer Verifications</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review and approve lawyer verification requests.
          </p>
        </div>
        <Link
          href="/admin/verifications"
          className="text-xs text-muted-foreground hover:text-foreground underline"
        >
          Clear filters
        </Link>
      </div>

      <div className="flex gap-2 mb-6">
        {['all', 'pending', 'approved', 'rejected'].map((s) => {
          const isActive = !status ? s === 'all' : status === s
          return (
            <Link
              key={s}
              href={s === 'all' ? '/admin/verifications' : `/admin/verifications?status=${s}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors no-underline ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Link>
          )
        })}
      </div>

      {verifications.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-medium">No verifications found</p>
          <p className="text-sm mt-1">
            {status
              ? `No ${status} verification requests.`
              : 'Lawyer verification requests will appear here.'}
          </p>
        </div>
      ) : (
        <VerificationsTable verifications={verifications} />
      )}
    </div>
  )
}
