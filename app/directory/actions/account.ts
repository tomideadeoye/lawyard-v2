'use server'

import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteAccount() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  await supabase.auth.signOut()

  const serviceRole = createServiceRoleClient()
  const { error } = await serviceRole.auth.admin.deleteUser(user.id)
  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  return { success: true }
}
