import { Sidebar } from '../sidebar'

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
