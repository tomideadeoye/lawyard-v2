'use client'

import { Suspense, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel } from '@/components/ui/field';
import { login } from './actions'
import { SubmitButton } from './submit-button'

function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <Card className="w-full max-w-sm border-border/40 bg-card/45 backdrop-blur-md">
        <CardHeader className="text-center">
          <img src="/lawyard-logo.png" alt="Lawyard" className="h-12 w-auto mx-auto mb-4" />
          <CardTitle className="text-xl">Admin Dashboard</CardTitle>
          <CardDescription>Lawyard administration portal</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={login} className="space-y-4">
            <Field>
              <FieldLabel>Email</FieldLabel>
              <Input name="email" type="email" required placeholder="admin@lawyard.org" />
            </Field>
            <Field>
              <FieldLabel>Password</FieldLabel>
              <div className="relative">
                <Input name="password" type={showPassword ? 'text' : 'password'} required />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {showPassword ? (
                      <>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </>
                    ) : (
                      <>
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </>
                    )}
                  </svg>
                </button>
              </div>
            </Field>
            <SubmitButton>Sign In</SubmitButton>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-muted-foreground">Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}
