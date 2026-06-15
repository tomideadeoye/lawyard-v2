'use client'

import { useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AlertCircle, CheckCircle2, Sparkles, ArrowRight, Mail } from 'lucide-react'

function SignInContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const message = searchParams.get('message')
  const successEmail = searchParams.get('success')
  const [loginMethod, setLoginMethod] = useState<'password' | 'magic-link'>('password')
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    setError(null)

    const form = e.currentTarget
    const formData = new FormData(form)
    const email = (formData.get('email') as string).trim()
    const password = (formData.get('password') as string).trim()

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Invalid email or password')
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setIsPending(false)
    }
  }

  const handleGoogleLogin = () => {
    const supabase = createClient()
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  const handleMagicLinkSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const supabase = createClient()
    const { error: magicError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    setIsPending(false)
    if (magicError) {
      setError(magicError.message)
    } else {
      setMagicLinkSent(true)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-24">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <img src="/lawyard-logo.png" alt="Lawyard" className="h-8 w-auto" />
          </div>
          <p className="text-muted-foreground text-sm">
            Sign in to your account
          </p>
        </div>

        {(message || error) && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl text-sm font-semibold">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error || message}</p>
          </div>
        )}

        {successEmail && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-2xl text-sm font-semibold">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <p>Account created! Check <strong>{successEmail}</strong> for a confirmation email.</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Google Login */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isPending}
            className="w-full py-3.5 rounded-xl border border-border bg-background font-semibold text-sm flex items-center justify-center gap-3 hover:bg-muted transition-all disabled:opacity-50"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-4 text-muted-foreground font-semibold">Or continue with</span>
            </div>
          </div>

          {/* Method Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-xl">
            {(['password', 'magic-link'] as const).map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => { setLoginMethod(method); setMagicLinkSent(false) }}
                className={`py-2.5 text-sm font-semibold rounded-lg transition-all ${
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
            <form onSubmit={handlePasswordSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  placeholder="john@lawyard.ng"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                    required
                  />
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
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full py-3.5 rounded-xl bg-accent text-accent-foreground font-bold text-sm flex items-center justify-center gap-2 hover:bg-accent/90 transition-all disabled:opacity-50"
              >
                {isPending ? 'Signing in...' : 'Sign In'}
                <ArrowRight className="w-4 h-4" />
              </button>
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
                <form onSubmit={handleMagicLinkSubmit} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                      Email
                    </label>
                    <input
                      name="email"
                      type="email"
                      placeholder="john@lawyard.ng"
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full py-3.5 rounded-xl bg-accent text-accent-foreground font-bold text-sm flex items-center justify-center gap-2 hover:bg-accent/90 transition-all disabled:opacity-50"
                  >
                    {isPending ? 'Sending...' : 'Send Magic Link'}
                    <Mail className="w-4 h-4" />
                  </button>
                </form>
              )}
            </>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          Don&apos;t have an account?{' '}
          <a href="/signup" className="text-accent font-bold hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-pulse space-y-6 w-full max-w-md"><div className="h-10 bg-muted rounded-2xl" /><div className="h-20 bg-muted rounded-2xl" /></div></div>}>
      <SignInContent />
    </Suspense>
  )
}
