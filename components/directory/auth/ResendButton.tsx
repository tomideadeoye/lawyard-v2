'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ResendButton({ email }: { email: string }) {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleResend = async () => {
    setError('')
    const supabase = createClient()
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email,
    })
    if (resendError) {
      setError(resendError.message)
    } else {
      setSent(true)
    }
  }

  return (
    <div>
      <button
        onClick={handleResend}
        disabled={sent}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors mt-2 bg-transparent border-0 cursor-pointer hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {sent ? 'Verification email sent!' : "Didn't receive the email? Resend"}
      </button>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  )
}
