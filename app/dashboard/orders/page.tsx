import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

function LegislationDownloads({ transactions }: { transactions: Array<Record<string, any>> }) {
  const purchases = transactions.filter(
    (tx) => tx.status === 'success' && tx.plan_role === 'legislation_buyer'
  )

  const items = purchases.flatMap((tx) => {
    const raw = (tx.metadata as { items?: Array<{ id?: string; title?: string; quantity?: number }> } | null)?.items ?? []
    return raw.map((item) => ({ ...item, reference: tx.reference as string }))
  })

  if (items.length === 0) return null

  const seen = new Set<string>()

  return (
    <div className="rounded-xl border border-border bg-background p-5">
      <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Your legislations</h2>
      <ul className="mt-3 divide-y divide-border/60">
        {items.map((item) => {
          const slug = item.id as string
          if (!slug || seen.has(slug)) return null
          seen.add(slug)
          return (
            <li key={`${item.reference}-${slug}`} className="flex items-center justify-between gap-4 py-3">
              <span className="text-sm font-medium">{item.title ?? slug}</span>
              <a
                href={`/api/legislations/${slug}/download`}
                className="shrink-0 rounded-lg bg-accent px-4 py-2 text-xs font-bold text-accent-foreground hover:bg-accent/90"
              >
                Download PDF
              </a>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    success: 'text-green-600 bg-green-50 border-green-200',
    pending: 'text-amber-600 bg-amber-50 border-amber-200',
    failed: 'text-red-600 bg-red-50 border-red-200',
  }
  const cls = map[status] || 'text-muted-foreground bg-muted border-border'
  return (
    <span className={`inline-block text-xs font-semibold uppercase px-2.5 py-1 rounded border ${cls}`}>
      {status}
    </span>
  )
}

export default async function OrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">Orders</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {transactions?.length ?? 0} order{(transactions?.length ?? 0) !== 1 ? 's' : ''}
        </p>
      </div>

      <LegislationDownloads transactions={transactions ?? []} />

      {!transactions?.length ? (
        <div className="rounded-xl border border-border bg-background p-8 text-center">
          <p className="text-muted-foreground">No orders yet.</p>
          <a href="https://directory.lawyard.org/corporate-posts" className="inline-block mt-3 text-sm font-medium text-[var(--accent)] hover:underline">
            Submit a corporate post article
          </a>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Reference</th>
                <th className="text-left p-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Plan</th>
                <th className="text-left p-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Amount</th>
                <th className="text-left p-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Status</th>
                <th className="text-left p-3 font-medium text-muted-foreground text-xs uppercase tracking-wide hidden sm:table-cell">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-border last:border-0">
                  <td className="p-3 font-mono text-xs">{tx.reference}</td>
                  <td className="p-3 text-muted-foreground">{tx.plan_name}</td>
                  <td className="p-3 font-medium">₦{Number(tx.amount).toLocaleString()}</td>
                  <td className="p-3"><StatusBadge status={tx.status} /></td>
                  <td className="p-3 text-muted-foreground text-xs hidden sm:table-cell">
                    {new Date(tx.created_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-border p-3 text-xs text-muted-foreground">
            Bought a legislation? Downloads are under each order below.
          </div>
        </div>
      )}
    </div>
  )
}
