'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  const currentPassword = formData.get('currentPassword') as string | null
  const newPassword = formData.get('newPassword') as string
  const confirmPassword = formData.get('confirmPassword') as string
  const isRecovery = formData.get('isRecovery') === 'true'

  // Validate
  if (!newPassword || newPassword.length < 8) {
    return { error: 'Password must be at least 8 characters' }
  }

  if (newPassword !== confirmPassword) {
    return { error: 'New passwords do not match' }
  }

  if (!isRecovery && currentPassword && newPassword === currentPassword) {
    return { error: 'New password must be different from your current password' }
  }

  // Build payload
  const payload: Record<string, string> = { password: newPassword }
  if (currentPassword) {
    payload.currentPassword = currentPassword
  }

  // Track password status for OAuth-first users who set a password
  // (updateUser doesn't create an email identity for them — known Supabase bug)
  const hasEmailIdentity = !!user.identities?.some(i => i.provider === 'email')
  const updateData: Record<string, string | Record<string, boolean>> = { ...payload }
  if (!hasEmailIdentity) {
    updateData.data = { has_password: true }
  }

  const { error } = await supabase.auth.updateUser(updateData)

  if (error) {
    if (error.code === 'reauthentication_needed') {
      return { reauthNeeded: true }
    }
    if (error.code === 'same_password') {
      return { error: 'New password must be different from your current password' }
    }
    if (error.code === 'weak_password') {
      return { error: `Password is too weak: ${error.message}` }
    }
    if (error.code === 'invalid_credentials') {
      return { error: 'Current password is incorrect' }
    }
    if (error.message?.includes('over_request_rate_limit')) {
      return { error: 'Too many attempts. Please wait a moment and try again.' }
    }
    return { error: error.message || 'Failed to update password' }
  }

  // Password change KILLS the session (GoTrue v2.149+).
  // Re-establish the session cookie so the user stays logged in.
  if (user.email) {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: newPassword,
    })
    if (signInError) {
      return {
        error: 'Password changed but session could not be refreshed. Please sign in again.',
        needsReAuth: true,
      }
    }
  }

  revalidatePath('/directory/dashboard/settings')
  return { success: true }
}

export async function reauthenticate() {
  const supabase = await createClient()
  const { error } = await supabase.auth.reauthenticate()
  if (error) {
    return { error: error.message }
  }
  return { success: true }
}
