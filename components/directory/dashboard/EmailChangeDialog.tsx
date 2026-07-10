'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Mail } from 'lucide-react'

export default function EmailChangeDialog({ currentEmail }: { currentEmail: string }) {
  const [open, setOpen] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEmail || newEmail === currentEmail) {
      setError('Enter a different email address')
      return
    }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ email: newEmail })
    if (updateError) {
      setError(updateError.message)
      setLoading(false)
    } else {
      setSent(true)
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Input
          value={currentEmail}
          readOnly
          className="input-premium bg-muted/50 text-muted-foreground cursor-not-allowed flex-1"
          tabIndex={-1}
        />
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
          Change
        </Button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="bg-card p-6 rounded-2xl border border-border shadow-xl max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2">Change Email</h3>
            {sent ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <Mail className="w-10 h-10 text-primary" />
                <p className="text-sm text-muted-foreground">
                  We&apos;ve sent a confirmation email to <b className="text-foreground">{newEmail}</b>. Check both inboxes to confirm the change.
                </p>
                <Button variant="outline" size="sm" onClick={() => { setOpen(false); setSent(false); setNewEmail('') }}>
                  Close
                </Button>
              </div>
            ) : (
              <form onSubmit={handleChange}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Current Email</label>
                    <Input value={currentEmail} readOnly className="bg-muted/50" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">New Email</label>
                    <Input
                      type="email"
                      value={newEmail}
                      onChange={e => setNewEmail(e.target.value)}
                      placeholder="new@example.com"
                      required
                    />
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1" disabled={loading}>
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1" disabled={loading}>
                      {loading ? 'Sending...' : 'Send Confirmation'}
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
