import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

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
  if (!user) redirect('/signin')

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

      {!transactions?.length ? (
        <div className="rounded-xl border border-border bg-background p-8 text-center">
          <p className="text-muted-foreground">No orders yet.</p>
          <a href="/brand-press" className="inline-block mt-3 text-sm font-medium text-[var(--accent)] hover:underline">
            Submit a brand press article
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
              {transactions.map((tx, i) => (
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
        </div>
      )}
    </div>
  )
}
