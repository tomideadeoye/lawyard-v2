'use client'

import { useState } from 'react'
import { selfIdentifyAsLawyer } from '@/app/directory/actions/profile'
import { Button } from '@/components/ui/button'
import { Loader2, ArrowRight } from 'lucide-react'

export default function SwitchToLawyerButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setError(null)

    const result = await selfIdentifyAsLawyer()
    if (result.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        onClick={handleClick}
        disabled={loading}
        size="sm"
        className="bg-[#a77c5c] hover:bg-[#906b4e] text-white shrink-0"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Switching...
          </>
        ) : (
          <>
            Switch to Lawyer Mode
            <ArrowRight className="h-4 w-4 ml-1.5" />
          </>
        )}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
