// Product-owner board lives in the MerisLabs PM system (orion-horizon Supabase,
// multi-client). This page embeds it so Tobi accesses it from Lawyard's own
// domain — no visit to merislabs needed. Token is carried in the iframe src.
export const dynamic = 'force-dynamic'

const PM_ORIGIN = process.env.PM_BOARD_ORIGIN || 'https://merislabs-merislabs.vercel.app'
const PM_TOKEN = process.env.PM_BOARD_TOKEN || ''

export default function ProductOwnerPage() {
  if (!PM_TOKEN) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-neutral-50 px-6">
        <p className="text-neutral-500">This page does not exist.</p>
      </main>
    )
  }

  const src = `${PM_ORIGIN}/pm/b/lawyard?token=${PM_TOKEN}&embed=1`

  return (
    <main className="min-h-screen bg-neutral-50">
      <iframe
        src={src}
        title="Product questions"
        style={{ width: '100%', minHeight: '100vh', border: 0, display: 'block' }}
      />
    </main>
  )
}
