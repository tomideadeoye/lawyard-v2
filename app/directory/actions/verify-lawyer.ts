'use server'

import { createClient } from '@/lib/supabase/server'
import { postLawyerVerificationToSlack } from '@/lib/slack'
import { revalidatePath } from 'next/cache'

export type VerificationData = {
  full_name: string
  scn?: string
  year_of_call: number
  phone?: string
  firm_name?: string
}

export async function submitLawyerVerification(data: VerificationData) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  if (!data.full_name?.trim()) {
    return { error: 'Full name is required' }
  }

  if (!data.year_of_call || data.year_of_call < 1950 || data.year_of_call > new Date().getFullYear()) {
    return { error: 'Please enter a valid year of call to the bar' }
  }

  if (!data.scn?.trim()) {
    return { error: 'Supreme Court Number (SCN) is required' }
  }

  // Check if there's already a pending verification for this user
  const { data: existing } = await supabase
    .from('lawyer_verifications')
    .select('id, status')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing?.status === 'pending') {
    return { error: 'You already have a pending verification request' }
  }

  if (existing?.status === 'approved') {
    return { error: 'You are already verified as a lawyer' }
  }

  // Insert the verification request
  const { data: verification, error: insertError } = await supabase
    .from('lawyer_verifications')
    .insert({
      user_id: user.id,
      full_name: data.full_name.trim(),
      scn: data.scn?.trim() || null,
      year_of_call: data.year_of_call,
      phone: data.phone?.trim() || null,
      firm_name: data.firm_name?.trim() || null,
    })
    .select('id, full_name, scn, year_of_call, phone, firm_name')
    .single()

  if (insertError) {
    console.error('Verification insert error:', insertError)
    return { error: 'Failed to submit verification' }
  }

  // Notify Slack (non-blocking — don't fail the request if Slack is down)
  postLawyerVerificationToSlack({
    id: verification.id,
    full_name: verification.full_name,
    email: user.email ?? '',
    scn: verification.scn,
    year_of_call: verification.year_of_call,
    phone: verification.phone,
    firm_name: verification.firm_name,
  }).catch((e) => console.error('Slack notification failed:', e))

  revalidatePath('/directory/dashboard')
  return { success: true }
}

export async function getMyVerificationStatus() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return null

  const { data } = await supabase
    .from('lawyer_verifications')
    .select('id, full_name, status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return data
}
