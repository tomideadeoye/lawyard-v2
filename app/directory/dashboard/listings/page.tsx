import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  free: { label: 'Free', color: 'bg-slate-500/10 text-slate-500 border-slate-500/20' },
  premium_single: { label: 'Premium Single', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  premium_package: { label: 'Premium Package', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  enterprise: { label: 'Enterprise', color: 'bg-violet-500/10 text-violet-500 border-violet-500/20' },
}

const STATUS_STYLES: Record<string, string> = {
  published: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  expired: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  rejected: 'bg-red-500/10 text-red-500 border-red-500/20',
}

interface ListingItem {
  id: string
  name: string
  type: 'Lawyer' | 'Chamber'
  category: string
  expires_at: string | null
  status: 'published' | 'pending' | 'expired' | 'rejected'
  plan: string
  href: string
}

function deriveStatus(
  verificationStatus: string | null,
  subscriptionStatus: string | null,
  expiresAt: string | null,
): ListingItem['status'] {
  if (subscriptionStatus === 'expired') return 'expired'
  if (expiresAt && new Date(expiresAt) <= new Date()) return 'expired'
  if (verificationStatus === 'pending') return 'pending'
  if (verificationStatus === 'rejected') return 'rejected'
  if (verificationStatus === 'verified') return 'published'
  return 'pending'
}

function formatCategory(specialties: unknown, role: string | null): string {
  const arr = Array.isArray(specialties) ? specialties : []
  const names = arr.flatMap((s: Record<string, unknown>) => {
    const sp = s?.specialty
    if (sp && typeof sp === 'object' && 'name' in (sp as Record<string, unknown>)) {
      return [(sp as Record<string, unknown>).name as string]
    }
    return []
  })
  return names.slice(0, 2).join(', ') || role || 'Legal Practitioner'
}

function formatExpiry(date: string | null): string {
  if (!date) return '—'
  const d = new Date(date)
  const now = new Date()
  if (d <= now) return 'Expired'
  const days = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (days <= 30) return `${days}d left`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string }>
}) {
  const { tab = 'all', q = '' } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  const isChamber = profile?.role === 'chamber'
  const isLawyer = profile?.role === 'lawyer' || isChamber

  if (!isLawyer) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Listings are only available for lawyers and chambers.</p>
      </div>
    )
  }

  const listings: ListingItem[] = []

  if (isChamber) {
    const { data: chamber } = await supabase
      .from('chambers')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (chamber) {
      const status = deriveStatus(
        'verified',
        chamber.subscription_status,
        chamber.subscription_expires_at,
      )
      listings.push({
        id: chamber.id,
        name: chamber.name,
        type: 'Chamber',
        category: chamber.focus || 'Law Chamber',
        expires_at: chamber.subscription_expires_at,
        status,
        plan: chamber.subscription_tier || 'free',
        href: `/chamber/${chamber.id}`,
      })
    }

    if (chamber) {
      const { data: lawyers } = await supabase
        .from('lawyers')
        .select(`
          id, name, role, verification_status, location,
          specialties:lawyer_specialties(specialty:specialties(name))
        `)
        .eq('chamber_id', chamber.id)

      if (lawyers) {
        for (const l of lawyers) {
          listings.push({
            id: l.id,
            name: l.name,
            type: 'Lawyer',
            category: formatCategory(l.specialties, l.role),
            expires_at: chamber.subscription_expires_at,
            status: deriveStatus(l.verification_status, null, null),
            plan: chamber.subscription_tier || 'free',
            href: `/lawyer/${l.id}`,
          })
        }
      }
    }
  } else {
    const { data: lawyer } = await supabase
      .from('lawyers')
      .select(`
        id, name, role, verification_status, location,
        specialties:lawyer_specialties(specialty:specialties(name))
      `)
      .eq('id', user.id)
      .maybeSingle()

    if (lawyer) {
      const profileTier = profile?.subscription_tier || 'free'
      const expiresAt = profile?.subscription_expires_at as string | null
      listings.push({
        id: lawyer.id,
        name: lawyer.name,
        type: 'Lawyer',
        category: formatCategory(lawyer.specialties, lawyer.role),
        expires_at: expiresAt,
        status: deriveStatus(lawyer.verification_status, null, expiresAt),
        plan: profileTier,
        href: `/lawyer/${lawyer.id}`,
      })
    }
  }

  const tabs = ['all', 'published', 'pending', 'expired', 'rejected'] as const
  const filtered = tab === 'all'
    ? listings
    : listings.filter(l => l.status === tab)

  const searched = q
    ? filtered.filter(l =>
        l.name.toLowerCase().includes(q.toLowerCase()) ||
        l.category.toLowerCase().includes(q.toLowerCase())
      )
    : filtered

  const tabCounts = Object.fromEntries(
    tabs.map(t => [t, t === 'all' ? listings.length : listings.filter(l => l.status === t).length])
  )

  return (
    <div className="space-y-6 animate-fade-in px-4 sm:px-0">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">All Listings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your directory listings and subscription.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border/40 pb-0 overflow-x-auto">
        {tabs.map(t => (
          <Link
            key={t}
            href={`/dashboard/listings?tab=${t}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
            className={`relative px-4 py-2.5 text-sm font-medium capitalize whitespace-nowrap transition-colors no-underline ${
              tab === t
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t}
            {tabCounts[t] > 0 && (
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                tab === t ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
              }`}>
                {tabCounts[t]}
              </span>
            )}
            {tab === t && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </Link>
        ))}
      </div>

      {/* Search */}
      <form className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          name="q"
          defaultValue={q}
          placeholder="Search listings by name or category..."
          className="w-full pl-10 pr-4 py-2.5 bg-background border border-border/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
          onChange={e => {
            const params = new URLSearchParams(window.location.search)
            if (e.target.value) params.set('q', e.target.value)
            else params.delete('q')
            window.location.search = params.toString()
          }}
        />
      </form>

      {/* Table */}
      {searched.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <div className="text-5xl opacity-20">◆</div>
          <p className="text-base font-semibold text-muted-foreground">No Items Found</p>
          <p className="text-sm text-muted-foreground/60 max-w-sm mx-auto">
            {tab !== 'all' || q
              ? 'Try adjusting your filters or search term.'
              : listings.length === 0
              ? 'Create a listing to get started.'
              : ''}
          </p>
        </div>
      ) : (
        <div className="border border-border/40 rounded-xl overflow-hidden bg-card/40 backdrop-blur-md">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 bg-muted/20">
                <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Name</th>
                <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider hidden sm:table-cell">Category</th>
                <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">Type</th>
                <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider hidden lg:table-cell">Expiration Date</th>
                <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                <th className="text-left p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider hidden sm:table-cell">Plan</th>
                <th className="text-right p-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">View</th>
              </tr>
            </thead>
            <tbody>
              {searched.map(l => {
                const planInfo = PLAN_LABELS[l.plan] || PLAN_LABELS.free
                return (
                  <tr key={`${l.type}-${l.id}`} className="border-b border-border/20 last:border-0 hover:bg-muted/10 transition-colors">
                    <td className="p-4">
                      <p className="font-semibold text-sm">{l.name}</p>
                    </td>
                    <td className="p-4 text-muted-foreground text-xs hidden sm:table-cell max-w-[160px] truncate">
                      {l.category}
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <span className="text-xs font-medium text-muted-foreground">{l.type}</span>
                    </td>
                    <td className="p-4 text-xs text-muted-foreground hidden lg:table-cell">
                      {formatExpiry(l.expires_at)}
                    </td>
                    <td className="p-4">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${STATUS_STYLES[l.status]}`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="p-4 hidden sm:table-cell">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${planInfo.color}`}>
                        {planInfo.label}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        href={l.href}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        View &rarr;
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
