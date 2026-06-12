'use client'

import { useFormStatus } from 'react-dom'

const styleId = 'login-spinner-keyframes'

if (typeof document !== 'undefined' && !document.getElementById(styleId)) {
  const style = document.createElement('style')
  style.id = styleId
  style.textContent = `@keyframes spin { to { transform: rotate(360deg) } }`
  document.head.appendChild(style)
}

export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="btn btn-primary"
      style={{
        padding: '12px', fontSize: '0.9rem', fontWeight: 600, width: '100%', marginTop: '4px',
        opacity: pending ? 0.7 : 1, cursor: pending ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
      }}
    >
      {pending ? (
        <>
          <span style={{
            width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)',
            borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite',
          }} />
          Signing in...
        </>
      ) : (
        children
      )}
    </button>
  )
}
