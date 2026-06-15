'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/orders', label: 'Orders' },
  { href: '/dashboard/account', label: 'Account Details' },
]

export function DashNav() {
  const pathname = usePathname()

  return (
    <aside className="w-full md:w-64 shrink-0 border-b md:border-b-0 md:border-r border-border bg-background">
      <nav className="p-4 md:p-6 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible">
        {navItems.map((item) => {
          const isActive = item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors no-underline ${
                isActive
                  ? 'text-[var(--accent)] bg-[var(--accent)]/10 font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
        <div className="hidden md:block mt-auto border-t border-border pt-4">
          <form action="/api/auth/signout" method="post">
            <button type="submit" className="w-full text-left text-sm text-muted-foreground hover:text-foreground px-3.5 py-2.5 rounded-lg hover:bg-muted transition-colors">
              Sign Out
            </button>
          </form>
        </div>
      </nav>
    </aside>
  )
}
