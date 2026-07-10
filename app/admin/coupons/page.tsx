import { Suspense } from 'react'
import type React from 'react'
import { getAdminClient } from '@/lib/supabase/admin-auth'
import { createCoupon, updateCouponStatus, deleteCoupon } from '../actions'
import { EditCouponDialog } from './edit-dialog'

type Coupon = {
  id: string
  code: string
  discount_type: string
  discount_value: number | null
  frequency_days: number | null
  max_uses: number | null
  is_active: boolean
  description: string | null
  created_at: string
  updated_at: string
}

type CouponWithUsage = Coupon & { usage_count: number; last_used: string | null }

const PAGE_SIZE = 20

async function getCoupons(search?: string, page?: number): Promise<{ coupons: CouponWithUsage[]; total: number }> {
  const { supabase } = await getAdminClient()

  let query = supabase.from('coupons').select('*', { count: 'exact' })

  if (search) {
    query = query.ilike('code', `%${search}%`)
  }

  const from = ((page || 1) - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error || !data) return { coupons: [], total: 0 }

  const coupons = data as Coupon[]

  const codes = coupons.map(c => c.code)
  const usageMap = new Map<string, { count: number; last: string | null }>()

  if (codes.length > 0) {
    const { data: txData } = await supabase
      .from('transactions')
      .select('metadata, created_at')
      .not('metadata', 'is', null)

    if (txData) {
      for (const tx of txData) {
        const meta = tx.metadata as Record<string, unknown> | null
        const cc = meta?.coupon_code as string | undefined
        if (cc && codes.includes(cc)) {
          const entry = usageMap.get(cc) || { count: 0, last: null }
          entry.count++
          if (!entry.last || tx.created_at > entry.last) entry.last = tx.created_at
          usageMap.set(cc, entry)
        }
      }
    }
  }

  const withUsage: CouponWithUsage[] = coupons.map(c => ({
    ...c,
    usage_count: usageMap.get(c.code)?.count || 0,
    last_used: usageMap.get(c.code)?.last || null,
  }))

  return { coupons: withUsage, total: count || 0 }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

async function CouponsTable({ search, page }: { search?: string; page?: number }) {
  const { coupons, total } = await getCoupons(search, page)
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const currentPage = page || 1

  return (
    <div className="section-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 scrollbar-thin">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--card-border)', background: 'rgba(255,255,255,0.02)' }}>
              <th style={thStyle}>Code</th>
              <th style={thStyle}>Discount</th>
              <th style={thStyle}>Frequency</th>
              <th style={thStyle}>Max uses</th>
              <th style={thStyle}>Used</th>
              <th style={thStyle}>Last used</th>
              <th style={thStyle}>Description</th>
              <th style={thStyle}>Created</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.length === 0 ? (
              <tr><td colSpan={10} style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>{search ? 'No coupons match your search.' : 'No coupons yet.'}</td></tr>
            ) : coupons.map((coupon) => (
              <tr key={coupon.id} style={{ borderBottom: '1px solid var(--card-border)', background: 'transparent' }}>
                <td style={{ padding: '14px 16px', fontWeight: 600, fontSize: '0.85rem' }}>{coupon.code}</td>
                <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#64748B' }}>
                  {coupon.discount_type === 'free' ? 'Free' : `${coupon.discount_value}%`}
                </td>
                <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#64748B' }}>
                  {coupon.frequency_days ? `Every ${coupon.frequency_days}d` : '—'}
                </td>
                <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#64748B' }}>
                  {coupon.max_uses ?? '—'}
                </td>
                <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#64748B' }}>
                  {coupon.usage_count}
                </td>
                <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#94A3B8' }}>
                  {coupon.last_used ? formatDateTime(coupon.last_used) : '—'}
                </td>
                <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#64748B', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {coupon.description || '—'}
                </td>
                <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#94A3B8' }}>{formatDate(coupon.created_at)}</td>
                <td style={{ padding: '14px 16px', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>
                  <span style={{
                    background: coupon.is_active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: coupon.is_active ? '#10B981' : '#EF4444',
                    padding: '3px 10px', borderRadius: '999px',
                    border: `1px solid ${coupon.is_active ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
                  }}>
                    {coupon.is_active ? 'Active' : 'Paused'}
                  </span>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <EditCouponDialog coupon={coupon} />
                    <form action={updateCouponStatus} style={{ display: 'inline' }}>
                      <input type="hidden" name="id" value={coupon.id} />
                      <input type="hidden" name="is_active" value={coupon.is_active ? 'false' : 'true'} />
                      <button type="submit" className="btn btn-ghost" style={{ fontSize: '0.7rem', padding: '5px 10px', color: coupon.is_active ? '#F59E0B' : '#10B981' }}>
                        {coupon.is_active ? 'Pause' : 'Activate'}
                      </button>
                    </form>
                    <form action={deleteCoupon} style={{ display: 'inline' }} onSubmit={(e) => { if (!confirm('Delete this coupon? This cannot be undone.')) e.preventDefault() }}>
                      <input type="hidden" name="id" value={coupon.id} />
                      <button type="submit" className="btn btn-ghost" style={{ fontSize: '0.7rem', padding: '5px 10px', color: '#EF4444' }}>Delete</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '16px', borderTop: '1px solid var(--card-border)' }}>
          {currentPage > 1 && (
            <a href={`/admin/coupons?page=${currentPage - 1}${search ? `&search=${search}` : ''}`} className="btn btn-ghost" style={{ padding: '8px 14px', fontSize: '0.85rem', textDecoration: 'none' }}>
              Previous
            </a>
          )}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <a key={p} href={`/admin/coupons?page=${p}${search ? `&search=${search}` : ''}`} style={{
              padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', textDecoration: 'none',
              background: p === currentPage ? 'var(--primary)' : 'transparent',
              color: p === currentPage ? 'white' : '#94A3B8',
              fontWeight: p === currentPage ? 600 : 400,
            }}>
              {p}
            </a>
          ))}
          {currentPage < totalPages && (
            <a href={`/admin/coupons?page=${currentPage + 1}${search ? `&search=${search}` : ''}`} className="btn btn-ghost" style={{ padding: '8px 14px', fontSize: '0.85rem', textDecoration: 'none' }}>
              Next
            </a>
          )}
        </div>
      )}
    </div>
  )
}

export default function CouponsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>
}) {
  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-gradient">Coupons</h1>
          <p style={{ color: '#94A3B8', fontSize: '0.95rem', marginTop: '4px' }}>
            Manage partner codes. Active codes can be used for free or discounted Corporate Post submissions.
          </p>
        </div>
      </header>

      <div className="section-card" style={{ padding: '16px 18px' }}>
        <h2 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '12px' }}>Create coupon</h2>
        <form action={createCoupon} style={{ display: 'grid', gap: '10px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
            <Field label="Code" name="code" placeholder="e.g. PARTNER3" required />
            <Field label="Type" name="discount_type" required>
              <select name="discount_type" className="input" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'transparent' }}>
                <option value="free">Free</option>
                <option value="percentage">Percentage</option>
              </select>
            </Field>
            <Field label="Discount %" name="discount_value" placeholder="e.g. 100" />
            <Field label="Frequency (days)" name="frequency_days" placeholder="e.g. 7" />
            <Field label="Max uses" name="max_uses" placeholder="e.g. 10" />
            <Field label="Description" name="description" placeholder="Short description" />
          </div>
          <div>
            <button type="submit" className="btn btn-primary" style={{ padding: '10px 16px' }}>Create coupon</button>
          </div>
        </form>
      </div>

      <CouponsSearchBar searchParams={searchParams} />

      <Suspense fallback={<div style={{ color: '#64748B', padding: '20px' }}>Loading coupons...</div>}>
        <CouponsTableResolved searchParams={searchParams} />
      </Suspense>
    </div>
  )
}

async function CouponsSearchBar({ searchParams }: { searchParams: Promise<{ search?: string; page?: string }> }) {
  const sp = await searchParams

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <form method="GET" action="/admin/coupons" style={{ display: 'flex', gap: '8px', flex: 1, maxWidth: '320px' }}>
        <input
          name="search"
          defaultValue={sp.search || ''}
          placeholder="Search by code..."
          className="input"
          style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'transparent', fontSize: '0.85rem' }}
        />
        <button type="submit" className="btn btn-ghost" style={{ padding: '10px 14px', fontSize: '0.85rem' }}>Search</button>
        {sp.search && (
          <a href="/admin/coupons" className="btn btn-ghost" style={{ padding: '10px 14px', fontSize: '0.85rem', textDecoration: 'none' }}>Clear</a>
        )}
      </form>
    </div>
  )
}

async function CouponsTableResolved({ searchParams }: { searchParams: Promise<{ search?: string; page?: string }> }) {
  const sp = await searchParams
  return <CouponsTable search={sp.search} page={sp.page ? parseInt(sp.page) : 1} />
}

function Field({ label, name, children, required, placeholder }: any) {
  return (
    <div>
      <label style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>
        {label}
      </label>
      {children || (
        <input
          name={name}
          className="input"
          placeholder={placeholder}
          required={required}
          style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'transparent' }}
        />
      )}
    </div>
  )
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '12px 16px',
  color: '#94A3B8',
  fontWeight: 600,
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  borderBottom: '1px solid var(--card-border)',
}
