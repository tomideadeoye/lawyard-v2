'use client'

import { useState, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { updatePassword, reauthenticate } from '@/app/directory/actions/password'

function getStrength(password: string): { score: number; label: string; color: string } {
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++

  const map = [
    { score: 0, label: 'Very Weak', color: 'bg-red-500' },
    { score: 1, label: 'Weak', color: 'bg-orange-500' },
    { score: 2, label: 'Fair', color: 'bg-yellow-500' },
    { score: 3, label: 'Good', color: 'bg-lime-500' },
    { score: 4, label: 'Strong', color: 'bg-green-500' },
    { score: 5, label: 'Very Strong', color: 'bg-emerald-500' },
  ]
  return map[score]
}

const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong']

interface PasswordFormProps {
  userEmail: string
  /** True if user has an existing password (email identity or has_password flag) */
  hasPassword: boolean
}

export default function PasswordForm({ userEmail, hasPassword }: PasswordFormProps) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)

  const [state, setState] = useState<'idle' | 'loading' | 'reauth' | 'success'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [needsReAuth, setNeedsReAuth] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)

  const strength = useMemo(() => getStrength(newPassword), [newPassword])
  const canSubmit = newPassword.length >= 8

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setState('loading')
    setError(null)

    const formData = new FormData(e.currentTarget)
    const result = await updatePassword(formData)

    if (result.reauthNeeded) {
      setState('reauth')
      setError(null)
      await reauthenticate()
      return
    }

    if (result.needsReAuth) {
      setNeedsReAuth(true)
      setError(null)
      setState('idle')
      formRef.current?.reset()
      setNewPassword('')
      return
    }

    if (result.error) {
      setError(result.error)
      setState('idle')
      return
    }

    setState('success')
    formRef.current?.reset()
    setNewPassword('')
    setTimeout(() => setState('idle'), 4000)
    router.refresh()
  }

  async function handleOtpSubmit() {
    if (otpCode.length < 6) return

    setIsVerifyingOtp(true)
    setError(null)

    const formData = new FormData(formRef.current!)
    formData.set('nonce', otpCode)

    const result = await updatePassword(formData)

    if (result.error) {
      setError(result.error)
      setIsVerifyingOtp(false)
      return
    }

    setState('success')
    setIsVerifyingOtp(false)
    setOtpCode('')
    setTimeout(() => setState('idle'), 4000)
    router.refresh()
  }

  if (needsReAuth) {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="text-4xl">↩</div>
        <h3 className="font-semibold text-base">Password changed</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Your password was updated but your session needs to be refreshed. Please sign in again with your new password.
        </p>
        <Button onClick={() => router.push('/directory/login')}>Sign In Again</Button>
      </div>
    )
  }

  if (state === 'reauth') {
    return (
      <div className="space-y-6">
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm space-y-2">
          <p className="font-semibold text-amber-700 dark:text-amber-400">Re-authentication Required</p>
          <p className="text-muted-foreground text-xs">
            For security, we&apos;ve sent a one-time code to <strong>{userEmail}</strong>. Enter it below to confirm the password change.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 text-sm rounded-md">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="otp">One-Time Code</Label>
            <Input
              id="otp"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter 6-digit code"
              className="text-center text-lg tracking-[0.5em] font-mono input-premium"
              autoFocus
            />
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleOtpSubmit}
              disabled={otpCode.length < 6 || isVerifyingOtp}
              className="flex-1 glow-primary"
            >
              {isVerifyingOtp ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...</>
              ) : (
                'Confirm Password Change'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setState('idle')}
              disabled={isVerifyingOtp}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const isSettingPassword = !hasPassword
  const isChangingPassword = hasPassword

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 text-sm rounded-md">
          {error}
        </div>
      )}

      {state === 'success' && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-sm rounded-md">
          {isSettingPassword
            ? 'Password set successfully! You can now sign in with email and password.'
            : 'Password updated successfully!'}
        </div>
      )}

      {/* Set password info banner */}
      {isSettingPassword && (
        <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-sm rounded-md space-y-1">
          <p className="font-semibold">Add a password to your account</p>
          <p className="text-xs">
            You signed up with Google/LinkedIn. Setting a password lets you sign in with your email
            address as well — and disconnect your OAuth account later if you want.
          </p>
        </div>
      )}

      {/* Current Password — only show when changing existing password */}
      {isChangingPassword && (
        <>
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                name="currentPassword"
                type={showCurrent ? 'text' : 'password'}
                placeholder="Enter your current password"
                required
                className="input-premium pr-10"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <hr className="border-border/40" />
        </>
      )}

      {/* New Password */}
      <div className="space-y-2">
        <Label htmlFor="newPassword">
          {isSettingPassword ? 'Password' : 'New Password'}
        </Label>
        <div className="relative">
          <Input
            id="newPassword"
            name="newPassword"
            type={showNew ? 'text' : 'password'}
            placeholder="At least 8 characters"
            required
            minLength={8}
            className="input-premium pr-10"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowNew(!showNew)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={-1}
          >
            {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {newPassword.length > 0 && (
          <div className="space-y-1 pt-1">
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    i < strength.score ? strength.color : 'bg-border'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {strengthLabels[strength.score]}
              {strength.score < 3 && newPassword.length > 0 && (
                <span className="text-amber-600 dark:text-amber-400 ml-1">
                  — Try mixing uppercase, numbers, and symbols
                </span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Confirm Password */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">
          {isSettingPassword ? 'Confirm Password' : 'Confirm New Password'}
        </Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirm ? 'text' : 'password'}
            placeholder="Re-enter your password"
            required
            minLength={8}
            className="input-premium pr-10"
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={-1}
          >
            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="bg-muted/30 rounded-lg p-3 space-y-1.5">
        <p className="text-xs font-semibold">Password requirements:</p>
        <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
          <li className={newPassword.length >= 8 ? 'text-emerald-600' : ''}>
            At least 8 characters
          </li>
          <li className={/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword) ? 'text-emerald-600' : ''}>
            Mix of uppercase and lowercase letters
          </li>
          <li className={/\d/.test(newPassword) ? 'text-emerald-600' : ''}>
            At least one number
          </li>
          <li className={/[^a-zA-Z0-9]/.test(newPassword) ? 'text-emerald-600' : ''}>
            At least one symbol (!@#$%^&amp;*)
          </li>
        </ul>
      </div>

      <Button type="submit" disabled={!canSubmit || state === 'loading'} className="w-full glow-primary">
        {state === 'loading' ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
        ) : isSettingPassword ? (
          'Set Password'
        ) : (
          'Update Password'
        )}
      </Button>
    </form>
  )
}
