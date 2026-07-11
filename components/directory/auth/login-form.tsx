"use client"

import { useState, useTransition, Suspense } from 'react'
import TurnstileWidget from '@/components/directory/auth/TurnstileWidget'
import { useSearchParams } from 'next/navigation'
import { login, loginWithMagicLink } from '@/app/directory/login/actions'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { AlertCircle, CheckCircle2, Sparkles, ArrowRight, Mail, KeyRound, Eye, EyeOff } from 'lucide-react'

// Hop 2 (Login variant) — same pattern as signup-form.tsx.
// Used when an unauthenticated user is redirected from add-listing and
// already has an account. Forwards redirect+category through all auth paths.
//
// The key difference from signup: the login server action (login/actions.ts:login)
// reads redirect+category from formData and uses them as the redirect destination
// instead of always sending to /directory/dashboard.

function LoginFormContent() {
  const [isPending, startTransition] = useTransition()
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [loginMethod, setLoginMethod] = useState<'password' | 'magic-link'>('password')
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [resetError, setResetError] = useState('')
  const [forgotToken, setForgotToken] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const message = searchParams.get('message')
  const successMessage = searchParams.get('success')
  const redirect = searchParams.get('redirect')
  const category = searchParams.get('category')

  // Build callback URL with redirect params preserved.
  // Same mechanism as signup-form — forwards through OAuth redirectTo
  // so auth/callback can return user to the add-listing page.
  const buildCallbackUrl = () => {
    const params = new URLSearchParams()
    if (redirect) params.set('next', redirect)
    if (category) params.set('category', category)
    const qs = params.toString()
    return `${window.location.origin}/auth/callback${qs ? `?${qs}` : ''}`
  }

  const handleCredentialsSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    if (redirect) formData.set('redirect', redirect)
    if (category) formData.set('category', category)
    startTransition(async () => {
      await login(formData)
    })
  }

  const handleMagicLinkSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set('redirectTo', buildCallbackUrl())
    startTransition(async () => {
      const res = await loginWithMagicLink(formData)
      if (res?.success) {
        setMagicLinkSent(true)
      }
    })
  }

  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const email = (formData.get('reset-email') as string) || (document.getElementById('email') as HTMLInputElement)?.value
    const forgotCaptchaToken = formData.get('forgotCaptchaToken') as string | null
    if (!email) {
      setResetError('Please enter your email address')
      return
    }
    setResetError('')
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?recovery=true&next=/dashboard/settings?tab=security`,
      captchaToken: forgotCaptchaToken || undefined,
    })
    if (error) {
      setResetError(error.message)
    } else {
      setResetSent(true)
    }
  }

  const handleGoogleLogin = () => {
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: buildCallbackUrl(),
        },
      })
      if (error) {
        window.location.href = `/login?message=${encodeURIComponent(error.message)}`
      }
    })
  }

  // const handleLinkedInLogin = () => {
  //   startTransition(async () => {
  //     const supabase = createClient()
  //     const { error } = await supabase.auth.signInWithOAuth({
  //       provider: 'linkedin_oidc',
  //       options: {
  //         redirectTo: buildCallbackUrl(),
  //       },
  //     })
  //     if (error) {
  //       window.location.href = `/login?message=${encodeURIComponent(error.message)}`
  //     }
  //   })
  // }

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

            {/* <Field>
              <Button
                variant="outline"
                type="button"
                className="w-full py-6 text-base font-semibold gap-3"
                onClick={handleLinkedInLogin}
                disabled={isPending}
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
                  <rect x="1" y="1" width="22" height="22" rx="4" fill="#0A66C2" />
                  <path d="M6.94 18.5V9.75H4.33V18.5H6.94Z" fill="white" />
                  <path d="M5.64 8.66C6.59 8.66 7.22 8 7.22 7.17C7.2 6.32 6.59 5.68 5.66 5.68C4.72 5.68 4.07 6.32 4.07 7.17C4.07 8 4.72 8.66 5.64 8.66Z" fill="white" />
                  <path d="M12.46 18.5V13.83C12.46 13.54 12.48 13.26 12.57 13.05C12.8 12.49 13.32 11.91 14.19 11.91C15.34 11.91 15.82 12.78 15.82 14.05V18.5H18.43V13.86C18.43 11.33 17.09 10.17 15.3 10.17C13.87 10.17 13.2 10.97 12.87 11.5V11.52H12.85L12.87 11.5V9.75H10.27C10.31 10.55 10.27 18.5 10.27 18.5H12.46Z" fill="white" />
                </svg>
                Login with LinkedIn
              </Button>
            </Field> */}

            <FieldSeparator>Or continue with</FieldSeparator>

            {/* Method toggle */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-muted/50 rounded-lg">
              {(['password', 'magic-link'] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => { setLoginMethod(method); setMagicLinkSent(false); setTurnstileToken(null) }}
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
                      <button
                        type="button"
                        onClick={() => { setShowForgotPassword(true); setForgotToken(null) }}
                        className="ml-auto text-sm underline-offset-4 hover:underline text-muted-foreground hover:text-foreground transition-colors bg-transparent border-0 cursor-pointer"
                      >
                        Forgot your password?
                      </button>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        disabled={isPending}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </Field>

                  <Field>
                    <input type="hidden" name="captchaToken" value={turnstileToken || ''} />
                    <TurnstileWidget onToken={setTurnstileToken} />
                    <Button
                      type="submit"
                      className="w-full py-6 text-base font-semibold gap-2"
                      disabled={isPending || !turnstileToken}
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
                        <input type="hidden" name="captchaToken" value={turnstileToken || ''} />
                        <TurnstileWidget onToken={setTurnstileToken} />
                        <Button
                          type="submit"
                          className="w-full py-6 text-base font-semibold gap-2"
                          disabled={isPending || !turnstileToken}
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

            {showForgotPassword && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowForgotPassword(false)}>
                <div className="bg-card p-6 rounded-2xl border border-border shadow-xl max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
                  <h3 className="text-lg font-semibold mb-2">Reset your password</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Enter your email and we&apos;ll send you a link to reset your password.
                  </p>
                  {resetSent ? (
                    <div className="flex flex-col items-center gap-3 py-4 text-center">
                      <KeyRound className="w-10 h-10 text-primary" />
                      <p className="text-sm text-muted-foreground">Check your inbox for the reset link.</p>
                      <Button variant="outline" size="sm" onClick={() => { setShowForgotPassword(false); setResetSent(false) }}>
                        Close
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleForgotPassword}>
                      <FieldGroup>
                        <Field>
                          <FieldLabel htmlFor="reset-email">Email</FieldLabel>
                          <Input id="reset-email" name="reset-email" type="email" placeholder="you@example.com" required />
                        </Field>
                        {resetError && <p className="text-sm text-destructive">{resetError}</p>}
                        <input type="hidden" name="forgotCaptchaToken" value={forgotToken || ''} />
                        <TurnstileWidget onToken={setForgotToken} />
                        <div className="flex gap-2">
                          <Button type="button" variant="outline" onClick={() => setShowForgotPassword(false)} className="flex-1">
                            Cancel
                          </Button>
                          <Button type="submit" className="flex-1" disabled={!forgotToken}>
                            Send Reset Link
                          </Button>
                        </div>
                      </FieldGroup>
                    </form>
                  )}
                </div>
              </div>
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
