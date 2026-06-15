import { createClient } from './server'
import { redirect } from 'next/navigation'

export async function getAdminClient() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/admin/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/admin/login')
  }

  return { supabase, user }
}

export async function requireAdmin() {
  const { supabase, user } = await getAdminClient()
  return { supabase, user }
}
