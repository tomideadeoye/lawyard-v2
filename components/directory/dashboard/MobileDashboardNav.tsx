'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, LayoutDashboard, Building2, Building, MessageSquare, PenSquare, Bookmark, CreditCard, Settings, LogOut, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { signOut } from '@/app/directory/login/actions'

interface NavSection {
  label: string
  href: string
  icon: LucideIcon
  badge?: string | number
}

interface MobileDashboardNavProps {
  fullName: string
  email: string
  avatarUrl?: string | null
  role: string
  initial: string
  isLawyer: boolean
  tier: string
  subscriptionStatus: string | null
}

export default function MobileDashboardNav({
  fullName,
  email,
  avatarUrl,
  role,
  initial,
  isLawyer,
  tier,
  subscriptionStatus,
}: MobileDashboardNavProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  const baseLinks: NavSection[] = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  ]

  const roleLinks: NavSection[] = isLawyer
    ? [
        { label: 'My Listings', href: '/dashboard/listings', icon: Building2 },
        { label: 'My Chamber', href: '/dashboard/chamber', icon: Building },
        { label: 'Inbox', href: '/dashboard/inquiries', icon: MessageSquare },
        { label: 'Content Studio', href: '/dashboard/publish', icon: PenSquare },
      ]
    : [
        { label: 'Bookmarks', href: '/dashboard/favorites', icon: Bookmark },
      ]

  const bottomLinks: NavSection[] = [
    { label: 'Subscription', href: '/dashboard/settings?tab=billing', icon: CreditCard },
    { label: 'Settings', href: '/dashboard/settings', icon: Settings },
  ]

  const links = [...baseLinks, ...roleLinks, ...bottomLinks]

  function isActive(href: string): boolean {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Hamburger button */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted/50 transition-colors"
      >
        <Menu className="h-5 w-5 text-foreground" />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Dashboard navigation"
        className={cn(
          'fixed inset-y-0 left-0 z-[110] w-80 max-w-[85vw] bg-background border-r border-border shadow-2xl transition-transform duration-300 ease-in-out flex flex-col',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between p-4 border-b border-border/30 shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2 no-underline" onClick={() => setOpen(false)}>
            <div className="w-8 h-8 rounded-lg bg-[#a77c5c]/20 flex items-center justify-center text-[#a77c5c] font-bold text-sm">L</div>
            <div>
              <p className="text-sm font-bold leading-tight text-foreground">Lawyard</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Dashboard</p>
            </div>
          </Link>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {links.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
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

        {/* User footer */}
        <div className="border-t border-border/30 shrink-0">
          <div className="flex items-center gap-3 px-4 pt-3 pb-2">
            <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-foreground shrink-0 overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                initial
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate text-foreground">{fullName || 'User'}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider truncate">{role}</p>
            </div>
          </div>

          <div className="px-4 pb-3">
            {tier === 'free' ? (
              <Link
                href="/pricing"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-white bg-[#a77c5c] hover:bg-[#906b4e] transition-colors no-underline"
              >
                Upgrade Plan
              </Link>
            ) : (
              <Link
                href="/dashboard/settings?tab=billing"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-[#a77c5c] border border-[#a77c5c]/30 hover:bg-[#a77c5c]/5 transition-colors no-underline"
              >
                Manage Plan
              </Link>
            )}
          </div>

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
      </div>
    </>
  )
}
