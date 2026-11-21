'use client'

import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { createPayment } from '@/app/directory/actions/payments'

function SubmitButton({ recommended }: { recommended: boolean }) {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      disabled={pending}
      className={`h-11 w-full rounded-lg text-sm font-semibold transition-colors ${
        recommended
          ? 'bg-brand text-brand-foreground hover:bg-brand/90'
          : 'border border-stone-300 bg-transparent text-stone-700 hover:border-brand hover:text-brand-muted dark:border-white/15 dark:text-neutral-300 dark:hover:border-brand-muted dark:hover:text-brand-muted'
      }`}
    >
      {pending ? 'Redirecting...' : 'Continue'}
    </Button>
  )
}

export function PaystackButton({
  planName,
  planRole,
  amount,
  recommended = false,
}: {
  planName: string
  planRole: string
  amount: number
  recommended?: boolean
}) {
  if (amount === 0) return null

  return (
    <form className="w-full"
      action={async (formData: FormData) => {
        const result = await createPayment(formData)
        if (result.authorization_url) {
          window.location.href = result.authorization_url
        }
      }}
    >
      <input type="hidden" name="plan_name" value={planName} />
      <input type="hidden" name="plan_role" value={planRole} />
      <input type="hidden" name="amount" value={amount} />
      <SubmitButton recommended={recommended} />
    </form>
  )
}
