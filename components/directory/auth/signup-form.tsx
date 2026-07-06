"use client"

import { useState, useTransition, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { signup } from '@/app/directory/login/actions'
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
import { AlertCircle, ArrowRight, User, ShieldCheck } from 'lucide-react'

function SignupFormContent() {
  const [isPending, startTransition] = useTransition()
  const searchParams = useSearchParams()
  const message = searchParams.get('message')

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      await signup(formData)
    })
  }

  const handleGoogleSignup = () => {
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/directory/auth/callback`,
        },
      })
      if (error) {
        window.location.href = `/directory/login?message=${encodeURIComponent(error.message)}`
      }
    })
  }

  const handleLinkedInSignup = () => {
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'linkedin_oidc',
        options: {
          redirectTo: `${window.location.origin}/directory/auth/callback`,
        },
      })
      if (error) {
        window.location.href = `/directory/login?message=${encodeURIComponent(error.message)}`
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

      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Create an account</CardTitle>
          <CardDescription>
            Sign up with your Google account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <Button
                variant="outline"
                type="button"
                className="w-full py-6 text-base font-semibold gap-3"
                onClick={handleGoogleSignup}
                disabled={isPending}
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign up with Google
              </Button>
            </Field>

            <Field>
              <Button
                variant="outline"
                type="button"
                className="w-full py-6 text-base font-semibold gap-3"
                onClick={handleLinkedInSignup}
                disabled={isPending}
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
                  <rect x="1" y="1" width="22" height="22" rx="4" fill="#0A66C2" />
                  <path d="M6.94 18.5V9.75H4.33V18.5H6.94Z" fill="white" />
                  <path d="M5.64 8.66C6.59 8.66 7.22 8 7.22 7.17C7.2 6.32 6.59 5.68 5.66 5.68C4.72 5.68 4.07 6.32 4.07 7.17C4.07 8 4.72 8.66 5.64 8.66Z" fill="white" />
                  <path d="M12.46 18.5V13.83C12.46 13.54 12.48 13.26 12.57 13.05C12.8 12.49 13.32 11.91 14.19 11.91C15.34 11.91 15.82 12.78 15.82 14.05V18.5H18.43V13.86C18.43 11.33 17.09 10.17 15.3 10.17C13.87 10.17 13.2 10.97 12.87 11.5V11.52H12.85L12.87 11.5V9.75H10.27C10.31 10.55 10.27 18.5 10.27 18.5H12.46Z" fill="white" />
                </svg>
                Sign up with LinkedIn
              </Button>
            </Field>

            <FieldSeparator>Or continue with</FieldSeparator>

            <form onSubmit={handleSubmit}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="fullName">
                    <User className="w-3.5 h-3.5" />
                    Full Name
                  </FieldLabel>
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="John Doe"
                    required
                    disabled={isPending}
                  />
                </Field>

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
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    disabled={isPending}
                  />
                </Field>

                <Field>
                  <FieldLabel>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Identification
                  </FieldLabel>
                  <div className="grid grid-cols-2 gap-3 mt-1">
                    <label className="relative flex flex-col items-center justify-center p-4 border-2 border-border/50 rounded-xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all has-[:checked]:border-primary has-[:checked]:bg-primary/5 group">
                      <input type="radio" name="role" value="lawyer" className="sr-only" required />
                      <span className="text-sm font-bold mb-0.5 group-has-[:checked]:text-primary">Lawyer</span>
                      <span className="text-[10px] text-muted-foreground group-has-[:checked]:text-primary/70">Verified Professional</span>
                    </label>
                    <label className="relative flex flex-col items-center justify-center p-4 border-2 border-border/50 rounded-xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all has-[:checked]:border-primary has-[:checked]:bg-primary/5 group">
                      <input type="radio" name="role" value="client" className="sr-only" defaultChecked />
                      <span className="text-sm font-bold mb-0.5 group-has-[:checked]:text-primary">Client</span>
                      <span className="text-[10px] text-muted-foreground group-has-[:checked]:text-primary/70">Legal Consumer</span>
                    </label>
                  </div>
                </Field>

                <Field>
                  <Button
                    type="submit"
                    className="w-full py-6 text-base font-semibold gap-2"
                    disabled={isPending}
                  >
                    {isPending ? 'Creating account...' : 'Initialize Account'}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Field>
              </FieldGroup>
            </form>

            <FieldDescription className="text-center">
              Already part of the network?{' '}
              <a href="/directory/login" className="font-semibold underline underline-offset-4 hover:text-primary transition-colors">
                Login here
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

export default function SignupForm() {
  return (
    <Suspense fallback={<div className="animate-pulse space-y-6"><div className="h-10 bg-input/30 rounded-2xl" /><div className="h-20 bg-input/30 rounded-2xl" /></div>}>
      <SignupFormContent />
    </Suspense>
  )
}
