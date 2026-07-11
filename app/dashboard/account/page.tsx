'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AccountPage() {
  const router = useRouter()
  const supabase = createClient()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [loading, setLoading] = useState(false)

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'Password updated successfully.' })
      setCurrentPassword('')
      setNewPassword('')
    }
    setLoading(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black">Account Details</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account settings</p>
      </div>

      {message && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${
          message.type === 'success'
            ? 'border-green-200 bg-green-50 text-green-700'
            : 'border-red-200 bg-red-50 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <div className="rounded-xl border border-border bg-background p-6 space-y-4">
        <h2 className="font-bold">Change Password</h2>
        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-sm">
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium mb-1">New Password</label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !newPassword}
            className="rounded-lg bg-[var(--accent)] text-white px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-border bg-background p-6 space-y-4">
        <h2 className="font-bold">Sign Out</h2>
        <p className="text-sm text-muted-foreground">Sign out of your account on this device.</p>
        <button
          onClick={handleSignOut}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}
