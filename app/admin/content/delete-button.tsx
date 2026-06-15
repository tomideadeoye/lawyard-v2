'use client'

import { useFormStatus } from 'react-dom'

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn btn-reject"
      onClick={(e) => {
        if (pending) e.preventDefault()
      }}
      style={{
        padding: '5px 10px', fontSize: '0.7rem',
        opacity: pending ? 0.6 : 1,
        cursor: pending ? 'not-allowed' : 'pointer',
      }}
    >
      {pending ? 'Deleting…' : label}
    </button>
  )
}

export function DeleteButton({
  action,
  id,
  label,
  confirmMessage,
}: {
  action: (formData: FormData) => void
  id: string
  label: string
  confirmMessage: string
}) {
  return (
    <form action={action} style={{ display: 'inline' }} onSubmit={(e) => {
      if (!confirm(confirmMessage)) e.preventDefault()
    }}>
      <input type="hidden" name="id" value={id} />
      <SubmitButton label={label} />
    </form>
  )
}
