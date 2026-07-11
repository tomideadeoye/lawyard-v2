'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Building2, Building, MessageSquare, PenSquare, Bookmark, CreditCard, Settings, LogOut, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { signOut } from '@/app/directory/login/actions'

interface SidebarSection {
  label: string
  href: string
  icon: LucideIcon
  badge?: string | number
}

interface DashboardSidebarProps {
  fullName: string
  email: string
  avatarUrl?: string | null
  role: string
  initial: string
  isLawyer: boolean
  tier: string
  subscriptionStatus: string | null
}

const TIER_LABELS: Record<string, string> = {
  free: 'Free',
  premium_single: 'Premium',
  premium_package: 'Premium Package',
  enterprise: 'Enterprise',
}

export default function DashboardSidebar({
  fullName,
  email,
  avatarUrl,
  role,
  initial,
  isLawyer,
  tier,
  subscriptionStatus,
}: DashboardSidebarProps) {
  const pathname = usePathname()

  const baseLinks: SidebarSection[] = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  ]

  const lawyerLinks: SidebarSection[] = [
    { label: 'My Listings', href: '/dashboard/listings', icon: Building2 },
    { label: 'My Chamber', href: '/dashboard/chamber', icon: Building },
    { label: 'Inbox', href: '/dashboard/inquiries', icon: MessageSquare },
    { label: 'Content Studio', href: '/dashboard/publish', icon: PenSquare },
  ]

  const clientLinks: SidebarSection[] = [
    { label: 'Bookmarks', href: '/dashboard/favorites', icon: Bookmark },
  ]

  const bottomLinks: SidebarSection[] = [
    { label: 'Subscription', href: '/dashboard/settings?tab=billing', icon: CreditCard },
    { label: 'Settings', href: '/dashboard/settings', icon: Settings },
  ]

  const links = [...baseLinks, ...(isLawyer ? lawyerLinks : clientLinks), ...bottomLinks]

  function isActive(href: string): boolean {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  return (
    <aside className="hidden md:flex flex-col border-r border-border/40 bg-card/30 backdrop-blur-md sticky top-0 h-screen">
      {/* Logo */}
      <div className="p-5 border-b border-border/30 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2 no-underline">
          <div className="w-8 h-8 rounded-lg bg-[#a77c5c]/20 flex items-center justify-center text-[#a77c5c] font-bold text-sm">
            L
          </div>
          <div>
            <p className="text-sm font-bold leading-tight">Lawyard</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Dashboard</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {links.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center justify-between gap-2 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors no-underline',
                isActive(item.href)
                  ? 'bg-[#a77c5c]/10 text-[#a77c5c]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge != null && (
                <span className="shrink-0 px-1.5 py-0.5 rounded-full bg-[#a77c5c]/10 text-[#a77c5c] text-[10px] font-bold">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}

      </nav>

      {/* User Footer — ChatGPT-style: profile + tier + upgrade */}
      <div className="border-t border-border/30 shrink-0">
        {/* User info + tier row */}
        <div className="flex items-center gap-3 px-4 pt-3 pb-2">
          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-sm font-bold shrink-0 overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              initial
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate">{fullName || 'User'}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider truncate">
              {role}
            </p>
          </div>
        </div>


        {/* Upgrade/manage button */}
        <div className="px-4 pb-3">
          <Link
            href="/dashboard/settings?tab=billing"
            className="flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-white bg-[#a77c5c] hover:bg-[#906b4e] transition-colors no-underline"
          >
            {tier === 'free' ? 'Upgrade Plan' : 'Manage Plan'}
          </Link>
        </div>

        {/* Sign Out */}
        <div className="border-t border-border/30">
          <form action={signOut}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors no-underline"
            >
            <LogOut className="h-4 w-4 shrink-0" />
                Sign Out
            </button>
          </form>
        </div>
      </div>
    </aside>
  )
}
