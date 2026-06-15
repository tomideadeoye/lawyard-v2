'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function UserMenu({ scrolled }: { scrolled: boolean }) {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<{ email?: string; name?: string; avatar?: string } | null>(null)
  const [open, setOpen] = useState(false)
  const [imgError, setImgError] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const meta = session.user.user_metadata || {}
        setUser({
          email: session.user.email,
          name: meta.full_name || meta.name,
          avatar: meta.avatar_url || meta.picture,
        })
      }
    })
  }, [supabase])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    setUser(null)
    setOpen(false)
    router.push('/signin')
    router.refresh()
  }

  if (!user) {
    return (
      <Link
        href="/signin"
        className={`transition-colors no-underline ${scrolled ? 'hover:text-white' : 'hover:text-foreground'}`}
      >
        My Account
      </Link>
    )
  }

  const initial = (user.name || user.email || '?').charAt(0).toUpperCase()

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 transition-colors ${scrolled ? 'text-white/70 hover:text-white' : 'text-muted-foreground hover:text-foreground'}`}
      >
        {user.avatar && !imgError ? (
          <img src={user.avatar} alt="" className="w-6 h-6 rounded-full object-cover" onError={() => setImgError(true)} />
        ) : (
          <span className="w-6 h-6 rounded-full bg-[var(--accent)] text-white text-[10px] font-bold flex items-center justify-center">
            {initial}
          </span>
        )}
      </button>

      {open && (
        <div className={`absolute top-full right-0 pt-2 z-50`}>
          <div className={`border shadow-xl rounded-lg p-2 min-w-[180px] flex flex-col gap-1 text-xs font-semibold ${scrolled ? 'bg-[#1e1e4a] border-white/10 text-white' : 'bg-white dark:bg-[#111129] border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white'}`}>
            <div className="px-3 py-2 border-b border-border/10 mb-1">
              <p className="font-bold truncate">{user.name || 'User'}</p>
              <p className={`text-[10px] truncate ${scrolled ? 'text-white/60' : 'text-muted-foreground'}`}>{user.email}</p>
            </div>
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className={`px-3 py-2 rounded transition-colors no-underline ${scrolled ? 'hover:bg-white/10' : 'hover:bg-muted'}`}
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/orders"
              onClick={() => setOpen(false)}
              className={`px-3 py-2 rounded transition-colors no-underline ${scrolled ? 'hover:bg-white/10' : 'hover:bg-muted'}`}
            >
              Orders
            </Link>
            <Link
              href="/dashboard/account"
              onClick={() => setOpen(false)}
              className={`px-3 py-2 rounded transition-colors no-underline ${scrolled ? 'hover:bg-white/10' : 'hover:bg-muted'}`}
            >
              Account Details
            </Link>
            <button
              onClick={handleSignOut}
              className={`px-3 py-2 rounded text-left transition-colors ${scrolled ? 'hover:bg-white/10' : 'hover:bg-muted'}`}
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
