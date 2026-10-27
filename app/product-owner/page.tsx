import { ProductOwnerBoard } from '@/components/product-owner/ProductOwnerBoard'
import { createServiceRoleClient } from '@/lib/supabase/server'

// Token-gated board for Tobi (product owner). No login — the link carries the token.
export const dynamic = 'force-dynamic'

export default async function ProductOwnerPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  if (!token || !process.env.PRODUCT_OWNER_TOKEN || token !== process.env.PRODUCT_OWNER_TOKEN) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-neutral-50 px-6">
        <p className="text-neutral-500">This page does not exist.</p>
      </main>
    )
  }

  const supabase = createServiceRoleClient()
  const { data: open } = await supabase
    .from('product_questions')
    .select('*')
    .eq('status', 'open')
    .order('created_at')
  const { data: answered } = await supabase
    .from('product_questions')
    .select('*')
    .in('status', ['answered', 'insight'])
    .order('answered_at', { ascending: false })
    .limit(20)

  return <ProductOwnerBoard token={token} initialOpen={open || []} initialAnswered={answered || []} />
}
