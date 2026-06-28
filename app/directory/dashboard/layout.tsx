import { createClient } from '@/lib/supabase/server'
import DashboardSidebar from '@/components/directory/dashboard/DashboardSidebar'
import MobileDashboardNav from '@/components/directory/dashboard/MobileDashboardNav'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, role, subscription_tier, subscription_status')
    .eq('id', user?.id)
    .maybeSingle()

  const isLawyer = profile?.role === 'lawyer' || profile?.role === 'chamber'
  const role = profile?.role || 'client'

  let initial = 'U'
  if (profile?.full_name?.[0]) initial = profile.full_name[0]
  else if (user?.email?.[0]) initial = user.email[0].toUpperCase()

  return (
    <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] min-h-dvh">
      <DashboardSidebar
        fullName={profile?.full_name || ''}
        email={user?.email || ''}
        avatarUrl={profile?.avatar_url}
        role={role}
        initial={initial}
        isLawyer={isLawyer}
        tier={profile?.subscription_tier || 'free'}
        subscriptionStatus={profile?.subscription_status}
      />

      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border/40 bg-background">
        <span className="text-sm font-bold text-foreground">Dashboard</span>
        <MobileDashboardNav
          fullName={profile?.full_name || ''}
          email={user?.email || ''}
          avatarUrl={profile?.avatar_url}
          role={role}
          initial={initial}
          isLawyer={isLawyer}
          tier={profile?.subscription_tier || 'free'}
          subscriptionStatus={profile?.subscription_status}
        />
      </div>

      {/* Main Content */}
      <main className="p-4 md:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  )
}
