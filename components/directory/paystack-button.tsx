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
      className={`w-full py-6 text-base font-semibold transition-all ${
        recommended
          ? 'bg-slate-700 hover:bg-slate-800 text-white shadow-md'
          : 'bg-transparent border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
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
    <form
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
