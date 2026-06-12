import { createClient } from '@/lib/supabase/server'
import { verifyTransaction } from '@repo/api/paystack'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ClearCart from '@/components/ClearCart'

export const dynamic = "force-dynamic"

export default async function ShopPaymentCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string }>
}) {
  const { reference } = await searchParams
  if (!reference) redirect('/shop')

  const supabase = await createClient()

  // Verify transaction with Paystack API
  const verify = await verifyTransaction(reference)
  const paid = verify.status && verify.data?.status === 'success'

  let items: any[] = []
  let amount = 0
  let createdAt = new Date().toISOString()
  let billingDetails: any = null

  if (paid) {
    // Retrieve metadata and transaction info from Supabase
    const { data: tx } = await supabase
      .from('transactions')
      .select('metadata, amount, created_at')
      .eq('reference', reference)
      .single()

    if (tx) {
      amount = tx.amount
      createdAt = tx.created_at
      if (tx.metadata) {
        items = tx.metadata.items || []
        billingDetails = tx.metadata.billing_details || null
      }
    }

    // Update transaction status to success in DB
    await supabase
      .from('transactions')
      .update({ status: 'success' })
      .eq('reference', reference)
  }

  // Format Date (e.g. June 12, 2026)
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric"
    })
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      {/* Dynamic Client Clear Cart component on Successful payment */}
      {paid && <ClearCart />}

      {/* Main receipt page container */}
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        
        {paid ? (
          /* Successful Payment UI */
          <div className="space-y-10 animate-in fade-in duration-500">
            {/* Checked circle icon */}
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto text-green-500 text-3xl font-bold">
              ✓
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-extrabold font-serif tracking-tight">Order Received</h1>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Thank you for your purchase. Your payment was verified successfully.
              </p>
            </div>

            {/* Order details parameters list */}
            <div className="bg-muted/15 border border-border/20 rounded-lg p-6 text-left text-xs font-semibold uppercase tracking-wider space-y-4 max-w-md mx-auto">
              <div className="flex justify-between items-center border-b border-border/10 pb-2.5">
                <span className="text-muted-foreground">Order number</span>
                <span className="font-bold text-foreground font-mono">{reference}</span>
              </div>
              <div className="flex justify-between items-center border-b border-border/10 pb-2.5">
                <span className="text-muted-foreground">Date</span>
                <span className="font-bold text-foreground">{formatDate(createdAt)}</span>
              </div>
              <div className="flex justify-between items-center border-b border-border/10 pb-2.5">
                <span className="text-muted-foreground">Total</span>
                <span className="font-bold text-foreground text-sm normal-case">₦{amount || verify.data?.amount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Payment method</span>
                <span className="font-bold text-foreground">Debit/Credit Cards</span>
              </div>
            </div>

            {/* List of acts purchased with download links */}
            {items.length > 0 && (
              <div className="space-y-4 text-left max-w-xl mx-auto pt-6">
                <h3 className="text-sm font-black uppercase tracking-wider text-muted-foreground border-b border-border/25 pb-2">
                  Purchased Legislations
                </h3>
                <div className="divide-y divide-border/10">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-4 gap-4">
                      <div className="min-w-0">
                        <h4 className="text-xs font-serif font-extrabold uppercase tracking-wide text-foreground leading-snug">
                          {item.title}
                        </h4>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Quantity: {item.quantity}
                        </p>
                      </div>
                      
                      {/* Premium mock download button */}
                      <a 
                        href="#"
                        className="bg-[#a77c5c] hover:bg-[#906b4e] text-white text-[10px] font-extrabold uppercase tracking-widest px-4 py-2.5 rounded shadow-sm transition-colors shrink-0 no-underline"
                      >
                        Download PDF
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-6">
              <Link
                href="/shop"
                className="bg-[#111129] hover:bg-[#1e1e4a] text-white font-extrabold text-xs uppercase tracking-widest px-8 py-3.5 rounded shadow-md transition-colors inline-block no-underline"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        ) : (
          /* Failed Payment UI */
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Error circle cross icon */}
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto text-destructive text-3xl font-bold">
              ✕
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-extrabold font-serif tracking-tight">Payment Failed</h1>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto leading-relaxed">
                Your payment transaction was not successful or has been canceled. Please try again.
              </p>
            </div>

            {reference && (
              <p className="text-xs font-mono text-muted-foreground bg-muted/20 p-2.5 rounded max-w-xs mx-auto border border-border/10">
                REF: {reference}
              </p>
            )}

            <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/checkout"
                className="bg-[#111129] hover:bg-[#1e1e4a] text-white font-extrabold text-xs uppercase tracking-widest px-8 py-3.5 rounded shadow-md transition-colors no-underline"
              >
                Return to Checkout
              </Link>
              <Link
                href="/shop"
                className="border border-border hover:bg-muted text-foreground font-extrabold text-xs uppercase tracking-widest px-8 py-3.5 rounded transition-all no-underline"
              >
                Back to Shop
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
