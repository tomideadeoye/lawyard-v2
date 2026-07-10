'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { deleteAccount } from '@/app/directory/actions/account'

export default function DeleteAccountDialog() {
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (confirm !== 'DELETE') return
    setIsDeleting(true)
    setError('')
    const result = await deleteAccount()
    if (result?.error) {
      setError(result.error)
      setIsDeleting(false)
    } else {
      router.push('/directory')
    }
  }

  return (
    <>
      <Button variant="destructive" onClick={() => setOpen(true)}>
        Delete Account
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="bg-card p-6 rounded-2xl border border-border shadow-xl max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-rose-600 mb-2">Delete Account</h3>
            <p className="text-sm text-muted-foreground mb-4">
              This will permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <p className="text-sm font-medium mb-2">
              Type <span className="font-bold text-rose-600">DELETE</span> to confirm:
            </p>
            <Input
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Type DELETE"
              className="mb-4"
            />
            {error && <p className="text-sm text-destructive mb-2">{error}</p>}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1" disabled={isDeleting}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                className="flex-1"
                disabled={confirm !== 'DELETE' || isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete My Account'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
