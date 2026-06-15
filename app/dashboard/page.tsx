import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardOverview() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/signin')

  const profile = user.user_metadata?.full_name || user.email

  const [txResult, articlesResult] = await Promise.all([
    supabase.from('transactions').select('id, reference, amount, status, created_at').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('articles').select('id, title, status, article_type, created_at').eq('author_id', user.id).order('created_at', { ascending: false }),
  ])

  const transactions = txResult.data ?? []
  const articles = articlesResult.data ?? []

  const totalSpent = transactions
    .filter(t => t.status === 'success')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const pendingOrders = transactions.filter(t => t.status === 'pending').length
  const publishedArticles = articles.filter(a => a.status === 'published').length

  const stats = [
    { label: 'Total Orders', value: transactions.length },
    { label: 'Pending', value: pendingOrders },
    { label: 'Total Spent', value: `₦${totalSpent.toLocaleString()}` },
    { label: 'Published', value: publishedArticles },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black">Welcome{profile ? `, ${profile}` : ''}</h1>
        <p className="text-muted-foreground text-sm mt-1">{user.email}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-background p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{s.label}</p>
            <p className="text-2xl font-black mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Link href="/dashboard/orders" className="rounded-xl border border-border bg-background p-5 hover:bg-muted transition-colors no-underline">
          <h3 className="font-bold text-sm">View Orders</h3>
          <p className="text-xs text-muted-foreground mt-1">Check your brand press orders and payment status</p>
        </Link>
        <Link href="/dashboard/account" className="rounded-xl border border-border bg-background p-5 hover:bg-muted transition-colors no-underline">
          <h3 className="font-bold text-sm">Account Details</h3>
          <p className="text-xs text-muted-foreground mt-1">Manage your name, email, and password</p>
        </Link>
      </div>

      {transactions.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-3">Recent Orders</h2>
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Reference</th>
                  <th className="text-left p-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Amount</th>
                  <th className="text-left p-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Status</th>
                  <th className="text-left p-3 font-medium text-muted-foreground text-xs uppercase tracking-wide hidden md:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 5).map((tx, i) => (
                  <tr key={tx.id} className="border-b border-border last:border-0">
                    <td className="p-3 font-mono text-xs">{tx.reference.slice(0, 12)}…</td>
                    <td className="p-3 font-medium">₦{Number(tx.amount).toLocaleString()}</td>
                    <td className="p-3">
                      <span className={`text-xs font-semibold uppercase ${
                        tx.status === 'success' ? 'text-green-600' :
                        tx.status === 'pending' ? 'text-amber-600' :
                        'text-red-600'
                      }`}>{tx.status}</span>
                    </td>
                    <td className="p-3 text-muted-foreground text-xs hidden md:table-cell">
                      {new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
