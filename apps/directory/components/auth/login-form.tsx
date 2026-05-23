"use client"

import { useState, useTransition, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { login, loginWithMagicLink } from '@/app/login/actions'
import { Button } from '@repo/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from '@repo/ui/components/field'
import { Input } from '@repo/ui/components/input'
import { createClient } from '@/lib/supabase/client'
import { AlertCircle, CheckCircle2, Sparkles, ArrowRight, Mail } from 'lucide-react'

function LoginFormContent() {
  const [isPending, startTransition] = useTransition()
  const [loginMethod, setLoginMethod] = useState<'password' | 'magic-link'>('password')
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const searchParams = useSearchParams()
  const message = searchParams.get('message')
  const successMessage = searchParams.get('success')

  const handleCredentialsSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      await login(formData)
    })
  }

  const handleMagicLinkSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set('redirectTo', `${window.location.origin}/auth/callback`)
    startTransition(async () => {
      const res = await loginWithMagicLink(formData)
      if (res?.success) {
        setMagicLinkSent(true)
      }
    })
  }

  const handleGoogleLogin = () => {
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) {
        window.location.href = `/login?message=${encodeURIComponent(error.message)}`
      }
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {message && (
        <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl text-sm font-semibold">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{message}</p>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-2xl text-sm font-semibold">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <p>{successMessage}</p>
        </div>
      )}

      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>
            Login with your Google account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <Button
                variant="outline"
                type="button"
                className="w-full py-6 text-base font-semibold gap-3"
                onClick={handleGoogleLogin}
                disabled={isPending}
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Login with Google
              </Button>
            </Field>

            <FieldSeparator>Or continue with</FieldSeparator>

            {/* Method toggle */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-muted/50 rounded-lg">
              {(['password', 'magic-link'] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => { setLoginMethod(method); setMagicLinkSent(false) }}
                  className={`py-2.5 text-sm font-semibold rounded-md transition-all ${
                    loginMethod === method
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {method === 'password' ? 'Password' : 'Magic Link'}
                </button>
              ))}
            </div>

            {loginMethod === 'password' ? (
              <form onSubmit={handleCredentialsSubmit}>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="m@example.com"
                      required
                      disabled={isPending}
                    />
                  </Field>

                  <Field>
                    <div className="flex items-center">
                      <FieldLabel htmlFor="password">Password</FieldLabel>
                      <a
                        href="#"
                        className="ml-auto text-sm underline-offset-4 hover:underline text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Forgot your password?
                      </a>
                    </div>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      required
                      disabled={isPending}
                    />
                  </Field>

                  <Field>
                    <Button
                      type="submit"
                      className="w-full py-6 text-base font-semibold gap-2"
                      disabled={isPending}
                    >
                      {isPending ? 'Signing in...' : 'Login'}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Field>
                </FieldGroup>
              </form>
            ) : (
              <>
                {magicLinkSent ? (
                  <div className="text-center py-8 px-4 bg-primary/5 border border-primary/10 rounded-2xl space-y-4">
                    <div className="w-14 h-14 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
                      <Sparkles className="w-7 h-7" />
                    </div>
                    <h3 className="text-lg font-semibold">Check your inbox</h3>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                      We&apos;ve sent you a magic link. Click it to sign in instantly.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleMagicLinkSubmit}>
                    <FieldGroup>
                      <Field>
                        <FieldLabel htmlFor="magic-email">Email</FieldLabel>
                        <Input
                          id="magic-email"
                          name="email"
                          type="email"
                          placeholder="m@example.com"
                          required
                          disabled={isPending}
                        />
                      </Field>

                      <Field>
                        <Button
                          type="submit"
                          className="w-full py-6 text-base font-semibold gap-2"
                          disabled={isPending}
                        >
                          {isPending ? 'Sending...' : 'Send Magic Link'}
                          <Mail className="w-4 h-4" />
                        </Button>
                      </Field>
                    </FieldGroup>
                  </form>
                )}
              </>
            )}

            <FieldDescription className="text-center">
              Don&apos;t have an account?{' '}
              <a href="/signup" className="font-semibold underline underline-offset-4 hover:text-primary transition-colors">
                Sign up
              </a>
            </FieldDescription>
          </FieldGroup>
        </CardContent>
      </Card>

      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our{' '}
        <a href="#" className="underline underline-offset-4 hover:text-primary transition-colors">Terms of Service</a>{' '}
        and{' '}
        <a href="#" className="underline underline-offset-4 hover:text-primary transition-colors">Privacy Policy</a>.
      </FieldDescription>
    </div>
  )
}

export default function LoginForm() {
  return (
    <Suspense fallback={<div className="animate-pulse space-y-6"><div className="h-10 bg-input/30 rounded-2xl" /><div className="h-20 bg-input/30 rounded-2xl" /></div>}>
      <LoginFormContent />
    </Suspense>
  )
}
