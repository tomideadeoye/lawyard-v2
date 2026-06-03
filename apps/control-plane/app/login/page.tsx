'use client'

import { Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@repo/ui/components/card';
import { Input } from '@repo/ui/components/input';
import { Button } from '@repo/ui/components/button';
import { Field, FieldLabel } from '@repo/ui/components/field';
import { login } from './actions'
import { SubmitButton } from './submit-button'

function LoginForm() {
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
              <Input name="password" type="password" required />
            </Field>
            <SubmitButton className="w-full glow-primary">Sign In</SubmitButton>
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
