'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function MobileUserMenu({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<{ name?: string } | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
        })
      }
    })
  }, [supabase])

  async function handleSignOut() {
    await supabase.auth.signOut()
    onClose()
    router.push('/signin')
    router.refresh()
  }

  if (!user) {
    return (
      <Link href="/signin" onClick={onClose} className="hover:text-primary transition-colors py-1 no-underline">
        My Account
      </Link>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="text-xs text-muted-foreground font-semibold px-1">
        {user.name ? `Signed in as ${user.name}` : 'Signed in'}
      </div>
      <Link href="/dashboard" onClick={onClose} className="hover:text-primary transition-colors py-1 no-underline">
        Dashboard
      </Link>
      <Link href="/dashboard/orders" onClick={onClose} className="hover:text-primary transition-colors py-1 no-underline">
        Orders
      </Link>
      <Link href="/dashboard/account" onClick={onClose} className="hover:text-primary transition-colors py-1 no-underline">
        Account Details
      </Link>
      <button
        onClick={handleSignOut}
        className="text-left hover:text-primary transition-colors py-1 text-xs font-bold uppercase tracking-widest"
      >
        Sign Out
      </button>
    </div>
  )
}
