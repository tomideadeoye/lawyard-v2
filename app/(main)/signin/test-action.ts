'use server'

import { createClient } from '@/lib/supabase/server'

export async function testLogin(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  console.log('[testLogin] email:', email, 'password.length:', password?.length)

  const supabase = await createClient()
  console.log('[testLogin] client created')

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  console.log('[testLogin] result:', error ? `ERROR` : `SUCCESS`)
  console.log('[testLogin] error details:', JSON.stringify({ message: error?.message, status: error?.status, code: (error as any)?.code }))
  console.log('[testLogin] user:', data?.user?.id)

  if (error) {
    return `Error: ${error.message} (${error.status})`
  }
  return `Success: ${data.user?.id}`
}
