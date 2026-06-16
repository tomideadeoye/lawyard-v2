import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { signOut } from '@/app/directory/login/actions'

const clientLinks = [
  { label: 'Dashboard', href: '/directory/dashboard', icon: '◈' },
  { label: 'Settings', href: '/directory/dashboard/settings', icon: '⚯' },
]

const lawyerLinks = [
  { label: 'Dashboard', href: '/directory/dashboard', icon: '◈' },
  { label: 'My Listing', href: '/directory/dashboard/add-listing', icon: '◆' },
  { label: 'Content Studio', href: '/directory/dashboard/publish', icon: '✎' },
  { label: 'Subscription', href: '/directory/pricing', icon: '⚙' },
  { label: 'Settings', href: '/directory/dashboard/settings', icon: '⚯' },
]

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, role')
    .eq('id', user?.id)
    .maybeSingle()

  const isLawyer = profile?.role === 'lawyer' || profile?.role === 'chamber'
  const links = isLawyer ? lawyerLinks : clientLinks

  let initial = 'U'
  if (profile?.full_name?.[0]) initial = profile.full_name[0]
  else if (user?.email?.[0]) initial = user.email[0].toUpperCase()

  return (
    <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] min-h-[calc(100vh-80px)]">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col border-r border-border/40 bg-card/30 backdrop-blur-md sticky top-20 h-[calc(100vh-80px)]">
        <div className="p-5 border-b border-border/30">
          <Link href="/directory/dashboard" className="flex items-center gap-2 no-underline">
            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center text-accent font-bold text-sm">L</div>
            <div>
              <p className="text-sm font-bold leading-tight">Lawyard</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Dashboard</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors no-underline"
            >
              <span className="w-5 text-center text-xs">{link.icon}</span>
              {link.label}
            </Link>
          ))}
          <div className="pt-3 mt-3 border-t border-border/30">
            <form action={signOut}>
              <Button variant="ghost" size="sm" className="w-full justify-start gap-3 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/5 px-3">
                <span className="w-5 text-center">↩</span>
                Sign Out
              </Button>
            </form>
          </div>
        </nav>

        <div className="p-4 border-t border-border/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-sm font-bold shrink-0 overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                initial
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">{profile?.full_name || 'User'}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{profile?.role || 'client'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border/40 bg-background/90 backdrop-blur-md sticky top-20 z-50">
        <Link href="/directory/dashboard" className="flex items-center gap-2 no-underline">
          <div className="w-7 h-7 rounded-lg bg-accent/20 flex items-center justify-center text-accent font-bold text-xs">L</div>
          <span className="text-sm font-bold">Dashboard</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/directory/dashboard/settings" className="text-xs text-muted-foreground hover:text-foreground no-underline">Settings</Link>
        </div>
      </div>

      {/* Main Content */}
      <main className="p-4 md:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  )
}
