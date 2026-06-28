import { createClient } from '@/lib/supabase/server'
import { verifyTransaction } from '@/lib/api/paystack'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { sendPaymentConfirmation } from '@/lib/api/email'
import { postBrandPressToSlackWithButtons } from '@/lib/slack'

export default async function PaymentCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string }>
}) {
  const { reference } = await searchParams
  if (!reference) redirect('/brand-press/submit')

  const supabase = await createClient()

  const verify = await verifyTransaction(reference)
  const paid = verify.status && verify.data?.status === 'success'

  if (paid) {
    const { data: tx } = await supabase
      .from('transactions')
      .select('metadata')
      .eq('reference', reference)
      .single()

    await supabase
      .from('transactions')
      .update({ status: 'success' })
      .eq('reference', reference)

    if (tx?.metadata?.article_id) {
      await supabase
        .from('articles')
        .update({
          payment_status: 'paid',
          status: 'pending_review',
        })
        .eq('id', tx.metadata.article_id)

      const { data: article } = await supabase
        .from('articles')
        .select('id, title, slug, excerpt, brand_name, tier')
        .eq('id', tx.metadata.article_id)
        .single()

      if (article) {
        postBrandPressToSlackWithButtons({
          id: article.id,
          title: article.title,
          slug: article.slug,
          brandName: article.brand_name || 'Unknown',
          excerpt: article.excerpt || '',
          tier: article.tier || tx.metadata.tier || '',
        }).catch(() => {})
      }
    }

    if (tx?.metadata?.brand_name) {
      const customerEmail = verify.data?.customer?.email || ''
      sendPaymentConfirmation(
        customerEmail,
        tx.metadata.brand_name,
        tx.metadata.tier || ''
      ).catch(() => {})
    }
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-24 text-center">
      {paid ? (
        <>
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl text-green-500">✓</span>
          </div>
          <h1 className="text-3xl font-black mb-3">Payment Successful!</h1>
          <p className="text-muted-foreground mb-8">
            Your Brand Press has been submitted. We will review and publish it shortly.
          </p>
          <Link
            href="/"
            className="inline-block bg-accent text-accent-foreground px-8 py-3 rounded-xl font-bold hover:bg-accent/90"
          >
            Go to Lawyard
          </Link>
        </>
      ) : (
        <>
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl text-destructive">✕</span>
          </div>
          <h1 className="text-3xl font-black mb-3">Payment Failed</h1>
          <p className="text-muted-foreground mb-8">
            Your payment did not complete. Please try again.
          </p>
          <Link
            href="/brand-press/submit"
            className="inline-block bg-primary text-primary-foreground px-8 py-3 rounded-xl font-bold hover:bg-primary/90"
          >
            Try Again
          </Link>
        </>
      )}
    </div>
  )
}
