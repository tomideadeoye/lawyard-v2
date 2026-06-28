'use client'

import { usePathname } from 'next/navigation'
import { signOut } from '@/app/admin/login/actions'

const navItems = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/pipeline', label: 'Editorial Pipeline' },
  { href: '/admin/lawyers', label: 'Lawyers Directory' },
  { href: '/admin/verifications', label: 'Verifications' },
  { href: '/admin/subscribers', label: 'Subscribers' },
  { href: '/admin/content', label: 'Content Manager' },
  { href: '/admin/transactions', label: 'Transactions' },
  { href: '/admin/settings', label: 'Settings' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="bg-white border-b md:border-b-0 md:border-r border-slate-200 p-4 md:p-7 flex flex-row md:flex-col gap-4 md:gap-7 items-center md:items-stretch justify-between md:justify-start sticky top-0 z-50 shadow-sm md:shadow-none w-full">
      <div className="flex items-center gap-3 shrink-0">
        <img src="/lawyard-logo.png" alt="Lawyard Brand" style={{ height: '28px', width: 'auto' }} />
      </div>

      <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-x-visible pb-1 md:pb-0 scrollbar-none">
        {navItems.map((item) => {
          const isActive = item.href === '#'
            ? false
            : item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href)

          return (
            <a
              key={item.label}
              href={item.href}
              className={`whitespace-nowrap flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-slate-500 font-medium text-sm transition-all duration-150 no-underline hover:text-[var(--foreground)] hover:bg-[var(--secondary)]${isActive ? ' text-[var(--primary)] bg-[var(--info-bg)] font-semibold' : ''}`}
            >
              {item.label}
            </a>
          )
        })}
      </nav>

      <div className="hidden md:flex flex-col gap-3 mt-auto border-t border-slate-200 pt-5">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="inline-block w-[7px] h-[7px] rounded-full bg-[var(--success)] shadow-[0_0_6px_var(--success)]" />
          <span>Secure Tunnel: Online</span>
        </div>
        <form action={signOut}>
          <button type="submit" className="btn btn-ghost w-full text-left text-xs py-2 px-2 flex items-center gap-2 justify-start">
            Sign Out
          </button>
        </form>
      </div>
    </aside>
  )
}
