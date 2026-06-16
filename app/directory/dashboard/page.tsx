import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const tierLabels: Record<string, { label: string; color: string }> = {
  free: { label: 'Free', color: 'bg-slate-500/10 text-slate-500 border-slate-500/20' },
  premium_single: { label: 'Premium Single', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  premium_package: { label: 'Premium Package', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
}

export default async function DirectoryDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/directory/login')

  const [profileResult, lawyerResult, articlesResult, podcastsResult, txResult, bookmarksResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('lawyers').select(`*, chambers(name, location, focus, image_url)`).eq('id', user.id).maybeSingle(),
    supabase.from('articles').select('id, title, status, created_at').eq('author_id', user.id).order('created_at', { ascending: false }).limit(5),
    supabase.from('podcasts').select('id, title, status, media_type, created_at').eq('author_id', user.id).order('created_at', { ascending: false }).limit(5),
    supabase.from('transactions').select('id, reference, amount, status, plan_name, created_at').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('bookmarks').select(`
      created_at,
      lawyer:lawyers(id, name, role, location, image_url, rating, reviews_count, verification_status)
    `).eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
  ])

  const profile = profileResult.data
  const lawyer = lawyerResult.data
  const articles = articlesResult.data ?? []
  const podcasts = podcastsResult.data ?? []
  const transactions = txResult.data ?? []
  const bookmarks = bookmarksResult.data ?? []

  const isLawyer = profile?.role === 'lawyer' || profile?.role === 'chamber'

  const tier = profile?.subscription_tier || 'free'
  const tierInfo = tierLabels[tier] || tierLabels.free

  const totalSpent = transactions.filter(t => t.status === 'success').reduce((sum, t) => sum + Number(t.amount), 0)
  const pendingOrders = transactions.filter(t => t.status === 'pending').length
  const publishedArticles = articles.filter(a => a.status === 'published').length

  let initial = 'U'
  if (profile?.full_name?.[0]) initial = profile.full_name[0]
  else if (user.email?.[0]) initial = user.email[0].toUpperCase()

  const recentContent = [
    ...articles.map(a => ({ type: 'article' as const, id: a.id, title: a.title, status: a.status, date: a.created_at })),
    ...podcasts.map(p => ({ type: 'podcast' as const, id: p.id, title: p.title, status: p.status, date: p.created_at })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            {isLawyer ? 'Manage your directory presence, content, and subscription.' : 'Track your orders, purchases, and account.'}
          </p>
        </div>
        {isLawyer && (
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${tierInfo.color}`}>
              {tierInfo.label}
            </span>
          </div>
        )}
      </div>

      {/* Profile Card */}
      <Card className="overflow-hidden border border-border/40 shadow-lg bg-card/40 backdrop-blur-md">
        <div className="h-32 bg-gradient-to-r from-primary to-accent opacity-85 relative" />
        <CardContent className="relative px-6 pb-6 pt-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end -mt-12 mb-6 gap-4">
            <div className="flex items-end gap-4">
              <div className="w-24 h-24 rounded-full bg-background border-4 border-card flex items-center justify-center text-4xl font-extrabold shadow-md shrink-0 overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  initial
                )}
              </div>
              <div className="pb-1">
                <h2 className="text-2xl font-bold tracking-tight">{profile?.full_name || 'Anonymous User'}</h2>
                <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
                  {lawyer?.role || profile?.role || 'client'}
                </p>
              </div>
            </div>
            <Link href="/directory/dashboard/settings">
              <Button size="sm" variant="outline" className="text-xs">Edit Profile</Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-4 border-t border-border/40">
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Email</span>
              <p className="text-sm font-semibold truncate">{user.email}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Orders</span>
              <p className="text-sm font-semibold">{transactions.length}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{isLawyer ? 'Verification' : 'Spent'}</span>
              <p className="text-sm font-semibold">{isLawyer ? (lawyer?.verification_status || '—') : `₦${totalSpent.toLocaleString()}`}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Member Since</span>
              <p className="text-sm font-semibold">
                {new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLawyer ? (
        <>
          {/* Lawyer Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border border-border/40 bg-card/45 backdrop-blur-md">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Profile Views</p>
                <p className="text-2xl font-bold mt-1">—</p>
                <p className="text-[10px] text-muted-foreground mt-1">Analytics coming soon</p>
              </CardContent>
            </Card>
            <Card className="border border-border/40 bg-card/45 backdrop-blur-md">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Inquiries</p>
                <p className="text-2xl font-bold mt-1">—</p>
                <p className="text-[10px] text-muted-foreground mt-1">Analytics coming soon</p>
              </CardContent>
            </Card>
            <Card className="border border-border/40 bg-card/45 backdrop-blur-md">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Articles</p>
                <p className="text-2xl font-bold mt-1">{publishedArticles}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{articles.length - publishedArticles} drafts</p>
              </CardContent>
            </Card>
            <Card className="border border-border/40 bg-card/45 backdrop-blur-md">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Orders</p>
                <p className="text-2xl font-bold mt-1">{transactions.length}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{pendingOrders} pending</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div>
            <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/directory/dashboard/add-listing" className="no-underline group">
                <Card className="border border-border/40 bg-card/45 backdrop-blur-md hover:shadow-md hover:border-accent/30 transition-all h-full cursor-pointer">
                  <CardContent className="p-5">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent mb-3 group-hover:scale-110 transition-transform">◆</div>
                    <h4 className="font-semibold text-sm mb-1">Edit Listing</h4>
                    <p className="text-xs text-muted-foreground">Update your profile, specialties, and contact info</p>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/directory/dashboard/publish" className="no-underline group">
                <Card className="border border-border/40 bg-card/45 backdrop-blur-md hover:shadow-md hover:border-accent/30 transition-all h-full cursor-pointer">
                  <CardContent className="p-5">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-3 group-hover:scale-110 transition-transform">✎</div>
                    <h4 className="font-semibold text-sm mb-1">New Article</h4>
                    <p className="text-xs text-muted-foreground">Publish insights to the legal community</p>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/directory/dashboard/publish" className="no-underline group">
                <Card className="border border-border/40 bg-card/45 backdrop-blur-md hover:shadow-md hover:border-accent/30 transition-all h-full cursor-pointer">
                  <CardContent className="p-5">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-3 group-hover:scale-110 transition-transform">▶</div>
                    <h4 className="font-semibold text-sm mb-1">New Podcast</h4>
                    <p className="text-xs text-muted-foreground">Upload audio or video discussions</p>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/directory/pricing" className="no-underline group">
                <Card className="border border-border/40 bg-card/45 backdrop-blur-md hover:shadow-md hover:border-accent/30 transition-all h-full cursor-pointer">
                  <CardContent className="p-5">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 mb-3 group-hover:scale-110 transition-transform">⚙</div>
                    <h4 className="font-semibold text-sm mb-1">Upgrade Plan</h4>
                    <p className="text-xs text-muted-foreground">Unlock featured listings and premium features</p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>

          {/* Two Column: Listing + Recent Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border border-border/40 bg-card/45 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-lg">Directory Listing</CardTitle>
                <CardDescription>Your public profile information visible in the directory.</CardDescription>
              </CardHeader>
              <CardContent>
                {lawyer ? (
                  <div className="space-y-5">
                    <div className="flex justify-between items-start pb-4 border-b border-border/30">
                      <div>
                        <h3 className="font-bold text-lg text-primary">{lawyer.name}</h3>
                        <p className="text-sm text-muted-foreground">{lawyer.role || 'Legal Practitioner'}</p>
                        {lawyer.chambers && (
                          <p className="text-xs text-muted-foreground font-semibold mt-1">
                            🏛 {lawyer.chambers.name}{lawyer.chambers.location ? ` — ${lawyer.chambers.location}` : ''}
                          </p>
                        )}
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${
                        lawyer.verification_status === 'verified'
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          : lawyer.verification_status === 'rejected'
                          ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      }`}>
                        {lawyer.verification_status}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Location</span>
                        <p className="font-medium">{lawyer.location || 'Not specified'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Website</span>
                        <p className="font-medium truncate">
                          {lawyer.website ? (
                            <a href={lawyer.website} target="_blank" rel="noreferrer" className="text-primary hover:underline">{lawyer.website}</a>
                          ) : 'None listed'}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Phone</span>
                        <p className="font-medium">{lawyer.phone || 'None listed'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Email</span>
                        <p className="font-medium">{lawyer.email || 'None listed'}</p>
                      </div>
                    </div>
                    {lawyer.bio && (
                      <div className="pt-2">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Bio</span>
                        <p className="text-sm text-foreground/80 leading-relaxed mt-1 whitespace-pre-wrap line-clamp-3">{lawyer.bio}</p>
                      </div>
                    )}
                    <div className="pt-2">
                      <Link href="/directory/dashboard/add-listing">
                        <Button variant="outline" size="sm" className="text-xs">Edit Listing</Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10 space-y-4">
                    <div className="text-4xl">📂</div>
                    <div className="space-y-1">
                      <h4 className="font-semibold text-base">No directory listing yet</h4>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                        Create a lawyer or chamber profile to appear in the Lawyard Directory.
                      </p>
                    </div>
                    <Link href="/directory/dashboard/add-listing">
                      <Button size="sm" className="mt-2">Create Listing</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border border-border/40 bg-card/45 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-wider font-bold text-muted-foreground">Recent Content</CardTitle>
              </CardHeader>
              <CardContent>
                {recentContent.length > 0 ? (
                  <div className="space-y-3">
                    {recentContent.map((item) => (
                      <div key={`${item.type}-${item.id}`} className="flex items-start gap-3 pb-3 border-b border-border/20 last:border-0">
                        <span className="text-xs mt-0.5 shrink-0">
                          {item.type === 'article' ? '✎' : '▶'}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{item.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[10px] font-semibold uppercase ${item.status === 'published' ? 'text-emerald-500' : 'text-amber-500'}`}>{item.status}</span>
                            <span className="text-[10px] text-muted-foreground">{new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    <Link href="/directory/dashboard/publish" className="block text-center text-xs font-semibold text-primary hover:underline pt-2">Publish new content &rarr;</Link>
                  </div>
                ) : (
                  <div className="text-center py-6 space-y-3">
                    <p className="text-sm text-muted-foreground">No articles or podcasts yet.</p>
                    <Link href="/directory/dashboard/publish">
                      <Button size="sm" variant="outline" className="text-xs">Publish your first piece</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Subscription Section */}
          <Card className="border border-border/40 bg-card/45 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-lg">Subscription</CardTitle>
              <CardDescription>Your current plan and available upgrades.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-muted/30 rounded-lg border border-border/30">
                <div>
                  <p className="text-sm font-semibold">Current Plan: <span className="text-primary">{tierInfo.label}</span></p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {tier === 'free'
                      ? 'Upgrade to Premium for featured listings, enhanced visibility, and priority support.'
                      : 'Your premium features are active.'}
                  </p>
                </div>
                <Link href="/directory/pricing">
                  <Button size="sm" className="shrink-0">{tier === 'free' ? 'Upgrade Now' : 'Manage Plan'}</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Bookmarked Directory */}
          <Card className="border border-border/40 bg-card/45 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-lg">Bookmarked Directory</CardTitle>
              <CardDescription>Lawyers and chambers you&rsquo;ve saved for later.</CardDescription>
            </CardHeader>
            <CardContent>
              {bookmarks.length === 0 ? (
                <div className="text-center py-8 space-y-4">
                  <div className="text-4xl">🔖</div>
                  <div className="space-y-1">
                    <h4 className="font-semibold text-base">No bookmarks yet</h4>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      Browse the directory and bookmark profiles you&rsquo;re interested in.
                    </p>
                  </div>
                  <Link href="/directory/search"><Button size="sm">Browse Directory</Button></Link>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/40">
                      <th className="text-left p-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Name</th>
                      <th className="text-left p-3 font-medium text-muted-foreground text-xs uppercase tracking-wide hidden sm:table-cell">Role</th>
                      <th className="text-left p-3 font-medium text-muted-foreground text-xs uppercase tracking-wide hidden md:table-cell">Location</th>
                      <th className="text-left p-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Saved</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookmarks.map((bm: Record<string, unknown>) => {
                      const bl = bm.lawyer as Record<string, unknown> | null
                      if (!bl) return null
                      return (
                        <tr key={bm.id as string} className="border-b border-border/20 last:border-0">
                          <td className="p-3">
                            <Link
                              href={`/directory/lawyer/${bl.id}`}
                              className="font-semibold text-sm hover:text-primary transition-colors"
                            >
                              {bl.name as string}
                            </Link>
                          </td>
                          <td className="p-3 text-muted-foreground text-xs hidden sm:table-cell">
                            {(bl.role as string) || 'Legal Practitioner'}
                          </td>
                          <td className="p-3 text-muted-foreground text-xs hidden md:table-cell">
                            {(bl.location as string) || '—'}
                          </td>
                          <td className="p-3 text-muted-foreground text-xs">
                            {new Date(bm.created_at as string).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
              {bookmarks.length > 0 && (
                <div className="mt-4 text-center">
                  <Link href="/directory/search" className="text-xs font-semibold text-primary hover:underline">
                    View all in directory &rarr;
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          {/* Client Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card className="border border-border/40 bg-card/45 backdrop-blur-md">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Bookmarked</p>
                <p className="text-2xl font-bold mt-1">{bookmarks.length}</p>
                <p className="text-[10px] text-muted-foreground mt-1">lawyers & chambers</p>
              </CardContent>
            </Card>
          </div>

          {/* Client Quick Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/directory/search" className="no-underline group">
              <Card className="border border-border/40 bg-card/45 backdrop-blur-md hover:shadow-md hover:border-accent/30 transition-all h-full cursor-pointer">
                <CardContent className="p-5">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent mb-3 group-hover:scale-110 transition-transform">◈</div>
                  <h4 className="font-semibold text-sm mb-1">Search Directory</h4>
                  <p className="text-xs text-muted-foreground">Find lawyers and chambers by specialty or location</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/shop" className="no-underline group">
              <Card className="border border-border/40 bg-card/45 backdrop-blur-md hover:shadow-md hover:border-accent/30 transition-all h-full cursor-pointer">
                <CardContent className="p-5">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-3 group-hover:scale-110 transition-transform">🛒</div>
                  <h4 className="font-semibold text-sm mb-1">Browse Legislations</h4>
                  <p className="text-xs text-muted-foreground">Purchase legal documents and legislation</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/brand-press/submit" className="no-underline group">
              <Card className="border border-border/40 bg-card/45 backdrop-blur-md hover:shadow-md hover:border-accent/30 transition-all h-full cursor-pointer">
                <CardContent className="p-5">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-3 group-hover:scale-110 transition-transform">◆</div>
                  <h4 className="font-semibold text-sm mb-1">Brand Press</h4>
                  <p className="text-xs text-muted-foreground">Submit press coverage and announcements</p>
                </CardContent>
              </Card>
            </Link>

          </div>

          {/* Bookmarked Directory */}
          <Card className="border border-border/40 bg-card/45 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-lg">Bookmarked Directory</CardTitle>
              <CardDescription>Lawyers and chambers you&rsquo;ve saved for later.</CardDescription>
            </CardHeader>
            <CardContent>
              {bookmarks.length === 0 ? (
                <div className="text-center py-8 space-y-4">
                  <div className="text-4xl">🔖</div>
                  <div className="space-y-1">
                    <h4 className="font-semibold text-base">No bookmarks yet</h4>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      Browse the directory and bookmark profiles you&rsquo;re interested in.
                    </p>
                  </div>
                  <Link href="/directory/search"><Button size="sm">Browse Directory</Button></Link>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/40">
                      <th className="text-left p-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Name</th>
                      <th className="text-left p-3 font-medium text-muted-foreground text-xs uppercase tracking-wide hidden sm:table-cell">Role</th>
                      <th className="text-left p-3 font-medium text-muted-foreground text-xs uppercase tracking-wide hidden md:table-cell">Location</th>
                      <th className="text-left p-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Saved</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookmarks.map((bm: Record<string, unknown>) => {
                      const lawyer = bm.lawyer as Record<string, unknown> | null
                      if (!lawyer) return null
                      return (
                        <tr key={bm.id as string} className="border-b border-border/20 last:border-0">
                          <td className="p-3">
                            <Link
                              href={`/directory/lawyer/${lawyer.id}`}
                              className="font-semibold text-sm hover:text-primary transition-colors"
                            >
                              {lawyer.name as string}
                            </Link>
                          </td>
                          <td className="p-3 text-muted-foreground text-xs hidden sm:table-cell">
                            {(lawyer.role as string) || 'Legal Practitioner'}
                          </td>
                          <td className="p-3 text-muted-foreground text-xs hidden md:table-cell">
                            {(lawyer.location as string) || '—'}
                          </td>
                          <td className="p-3 text-muted-foreground text-xs">
                            {new Date(bm.created_at as string).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
              {bookmarks.length > 0 && (
                <div className="mt-4 text-center">
                  <Link href="/directory/search" className="text-xs font-semibold text-primary hover:underline">
                    View all in directory &rarr;
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card className="border border-border/40 bg-card/45 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-lg">Recent Orders</CardTitle>
              <CardDescription>Your brand press and legislation purchases.</CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-8 space-y-4">
                  <div className="text-4xl">🛒</div>
                  <div className="space-y-1">
                    <h4 className="font-semibold text-base">No orders yet</h4>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">Browse the shop or submit a brand press article to get started.</p>
                  </div>
                  <div className="flex gap-3 justify-center">
                    <Link href="/shop"><Button size="sm">Visit Shop</Button></Link>
                    <Link href="/brand-press/submit"><Button size="sm" variant="outline">Brand Press</Button></Link>
                  </div>
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
                    {transactions.slice(0, 10).map((tx) => (
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
            </CardContent>
          </Card>

          {/* Directory Onboarding */}
          <Card className="border border-border/40 bg-card/45 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wider font-bold text-muted-foreground">Looking to Join the Directory?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-muted/30 rounded-lg border border-border/30">
                <div>
                  <p className="text-sm font-semibold">Are you a lawyer or chamber?</p>
                  <p className="text-xs text-muted-foreground mt-1">Create a listing to get discovered by clients actively seeking legal expertise.</p>
                </div>
                <Link href="/directory/dashboard/add-listing">
                  <Button size="sm" variant="outline" className="shrink-0">Create a Listing</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
