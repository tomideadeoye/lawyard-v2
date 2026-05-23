'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { login } from './actions'
import { SubmitButton } from './submit-button'

function LoginForm() {
  const searchParams = useSearchParams()
  const message = searchParams?.get('message')
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 50%, #F8FAFC 100%)',
      padding: '24px',
    }}>
      <div style={{
        background: '#FFFFFF', border: '1px solid #E2E8F0',
        borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '400px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img src="/lawyard-logo.png" alt="Lawyard" style={{
            height: '48px', width: 'auto',
            margin: '0 auto 16px', display: 'block',
          }} />
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#0F172A' }}>Admin Dashboard</h1>
          <p style={{ color: '#64748B', fontSize: '0.9rem', marginTop: '4px' }}>
            Lawyard administration portal
          </p>
        </div>

        {message && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 14px', borderRadius: '8px', marginBottom: '16px',
            background: 'var(--error-bg)', border: '1px solid var(--error-border)',
            color: 'var(--error)', fontSize: '0.85rem',
          }}>
            <span>⚠️</span> {message}
          </div>
        )}

        <form action={login} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label htmlFor="email" style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Email
            </label>
            <input
              id="email" name="email" type="email" required placeholder="admin@lawyard.org"
              style={{
                background: '#FFFFFF', border: '1px solid #E2E8F0',
                color: '#0F172A', padding: '10px 14px', borderRadius: '8px',
                fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none', width: '100%',
                boxSizing: 'border-box', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
                transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
              }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(30, 58, 95, 0.08)'; }}
              onBlur={(e) => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.02)'; }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label htmlFor="password" style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Password
            </label>
            <input
              id="password" name="password" type="password" required
              style={{
                background: '#FFFFFF', border: '1px solid #E2E8F0',
                color: '#0F172A', padding: '10px 14px', borderRadius: '8px',
                fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none', width: '100%',
                boxSizing: 'border-box', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
                transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
              }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(30, 58, 95, 0.08)'; }}
              onBlur={(e) => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.02)'; }}
            />
          </div>

          <SubmitButton>Sign In</SubmitButton>
        </form>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 50%, #F8FAFC 100%)',
        padding: '24px',
      }}>
        <div style={{ color: '#64748B', fontSize: '0.9rem' }}>Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
