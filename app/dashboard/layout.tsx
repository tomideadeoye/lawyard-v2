import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashNav } from '@/components/dashboard/nav'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/signin')

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <DashNav />
      <main className="flex-1 p-6 md:p-10 max-w-5xl">
        {children}
      </main>
    </div>
  )
}
