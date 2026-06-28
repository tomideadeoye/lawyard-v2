import type { Metadata } from 'next'
import { Sidebar } from '@/components/admin/sidebar'

export const metadata: Metadata = {
  title: 'Lawyard Admin | Admin Portal',
  description: 'Administrative dashboard for Lawyard v2 — lawyer verification, content management, and system monitoring.',
  robots: { index: false, follow: false },
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <main className="p-4 md:p-10">
        {children}
      </main>
    </div>
  )
}
