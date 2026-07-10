import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { signOut } from '@/app/directory/login/actions'

export default async function DashboardOverview() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/directory/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  const { data: lawyer } = await supabase
    .from('lawyers')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  const [txResult, articlesResult] = await Promise.all([
    supabase.from('transactions').select('id, reference, amount, status, plan_name, metadata, created_at').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('articles').select('id, title, status, article_type, created_at').eq('author_id', user.id).order('created_at', { ascending: false }),
  ])

  const transactions = txResult.data ?? []
  const articles = articlesResult.data ?? []
  const totalSpent = transactions.filter(t => t.status === 'success').reduce((sum, t) => sum + Number(t.amount), 0)
  const pendingOrders = transactions.filter(t => t.status === 'pending').length
  const publishedArticles = articles.filter(a => a.status === 'published').length

  let initial = 'U'
  if (profile?.full_name?.[0]) initial = profile.full_name[0]
  else if (user.email?.[0]) initial = user.email[0].toUpperCase()

  return (
    <div className="min-h-[90vh] bg-background text-foreground py-10 px-4 md:px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground text-sm">Manage your purchases, submissions, and profile.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/directory/dashboard">
              <Button variant="outline" size="sm">Directory</Button>
            </Link>
            <form action={signOut}>
              <Button variant="destructive" size="sm">Sign Out</Button>
            </form>
          </div>
        </div>

        {/* Profile Card */}
        <Card className="overflow-hidden border border-border/40 shadow-lg bg-card/40 backdrop-blur-md">
          <div className="h-32 bg-gradient-to-r from-primary to-accent opacity-85 relative" />
          <CardContent className="relative px-6 pb-6 pt-0">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end -mt-12 mb-6 gap-4">
              <div className="flex items-end gap-4">
                <div className="w-24 h-24 rounded-full bg-background border-4 border-card flex items-center justify-center text-4xl font-extrabold shadow-md shrink-0 overflow-hidden">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    initial
                  )}
                </div>
                <div className="pb-1">
                  <h2 className="text-2xl font-bold tracking-tight">{profile?.full_name || 'Anonymous User'}</h2>
                  <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">{lawyer ? 'Lawyer / Creator' : 'Reader'}</p>
                </div>
              </div>
              <Link href="/dashboard/account">
                <Button size="sm" variant="outline" className="text-xs">Edit Profile</Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-border/40">
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Email</span>
                <p className="text-sm font-semibold truncate">{user.email}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Member Since</span>
                <p className="text-sm font-semibold">{new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Orders</span>
                <p className="text-sm font-semibold">{transactions.length} total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border border-border/40 bg-card/45 backdrop-blur-md">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Total Orders</p>
              <p className="text-2xl font-bold mt-1">{transactions.length}</p>
            </CardContent>
          </Card>
          <Card className="border border-border/40 bg-card/45 backdrop-blur-md">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Pending</p>
              <p className="text-2xl font-bold mt-1">{pendingOrders}</p>
            </CardContent>
          </Card>
          <Card className="border border-border/40 bg-card/45 backdrop-blur-md">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Total Spent</p>
              <p className="text-2xl font-bold mt-1">₦{totalSpent.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="border border-border/40 bg-card/45 backdrop-blur-md">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Published</p>
              <p className="text-2xl font-bold mt-1">{publishedArticles}</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content + Sidebar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main */}
          <Card className="md:col-span-2 border border-border/40 bg-card/45 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-lg">Recent Orders</CardTitle>
              <CardDescription>Your corporate post and legislation purchases.</CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-8 space-y-4">
                  <div className="text-4xl">🛒</div>
                  <div className="space-y-1">
                    <h4 className="font-semibold text-base">No orders yet</h4>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">Browse the shop or submit a corporate post article to get started.</p>
                  </div>
                  <Link href="/shop">
                    <Button size="sm" className="mt-2">Visit Shop</Button>
                  </Link>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/40">
                      <th className="text-left p-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Reference</th>
                      <th className="text-left p-3 font-medium text-muted-foreground text-xs uppercase tracking-wide hidden sm:table-cell">Plan</th>
                      <th className="text-left p-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Amount</th>
                      <th className="text-left p-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Status</th>
                      <th className="text-left p-3 font-medium text-muted-foreground text-xs uppercase tracking-wide hidden md:table-cell">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.slice(0, 10).map((tx, i) => (
                      <tr key={tx.id} className="border-b border-border/20 last:border-0">
                        <td className="p-3 font-mono text-xs">{tx.reference.slice(0, 12)}&hellip;</td>
                        <td className="p-3 text-muted-foreground text-xs hidden sm:table-cell truncate max-w-[140px]">{tx.plan_name}</td>
                        <td className="p-3 font-medium">₦{Number(tx.amount).toLocaleString()}</td>
                        <td className="p-3">
                          <span className={`text-xs font-semibold uppercase px-2 py-0.5 rounded-full border ${
                            tx.status === 'success' ? 'text-emerald-600 bg-emerald-50 border-emerald-200' :
                            tx.status === 'pending' ? 'text-amber-600 bg-amber-50 border-amber-200' :
                            'text-red-600 bg-red-50 border-red-200'
                          }`}>{tx.status}</span>
                        </td>
                        <td className="p-3 text-muted-foreground text-xs hidden md:table-cell">
                          {new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {transactions.length > 10 && (
                <div className="pt-4 text-center">
                  <Link href="/dashboard/orders" className="text-xs font-semibold text-primary hover:underline">View all orders &rarr;</Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="border border-border/40 bg-card/45 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-wider font-bold text-muted-foreground">Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/dashboard/orders" className="block text-sm font-semibold text-foreground/80 hover:text-primary transition-colors">
                  View All Orders &rarr;
                </Link>
                <Link href="/dashboard/account" className="block text-sm font-semibold text-foreground/80 hover:text-primary transition-colors">
                  Account Settings &rarr;
                </Link>
                <Link href="/corporate-posts/submit" className="block text-sm font-semibold text-foreground/80 hover:text-primary transition-colors">
                  Submit Corporate Post &rarr;
                </Link>
                <Link href="/shop" className="block text-sm font-semibold text-foreground/80 hover:text-primary transition-colors">
                  Browse Legislations &rarr;
                </Link>
                <Link href="/directory/dashboard" className="block text-sm font-semibold text-foreground/80 hover:text-primary transition-colors">
                  Directory Dashboard &rarr;
                </Link>
              </CardContent>
            </Card>

            <Card className="border border-border/40 bg-card/45 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-wider font-bold text-muted-foreground">Onboarding</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <span className="text-emerald-500 font-bold shrink-0">&#10003;</span>
                  <div>
                    <h5 className="font-semibold text-foreground/90">Account Created</h5>
                    <p className="text-muted-foreground">You are signed in.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className={lawyer ? "text-emerald-500 font-bold shrink-0" : "text-amber-500 font-bold shrink-0"}>
                    {lawyer ? '\u2713' : '\u25CB'}
                  </span>
                  <div>
                    <h5 className={`font-semibold ${lawyer ? 'text-foreground/90' : 'text-muted-foreground'}`}>Directory Listing</h5>
                    <p className="text-muted-foreground">{lawyer ? 'Profile created' : 'List yourself in the directory'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className={transactions.length > 0 ? "text-emerald-500 font-bold shrink-0" : "text-muted-foreground font-bold shrink-0"}>
                    {transactions.length > 0 ? '\u2713' : '\u25CB'}
                  </span>
                  <div>
                    <h5 className={`font-semibold ${transactions.length > 0 ? 'text-foreground/90' : 'text-muted-foreground'}`}>First Purchase</h5>
                    <p className="text-muted-foreground">{transactions.length > 0 ? 'Completed' : 'Buy a legislation or corporate post'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
