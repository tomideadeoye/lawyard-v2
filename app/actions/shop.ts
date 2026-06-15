'use server'

import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { initializeTransaction } from '@/lib/api/paystack'
import { LEGISLATIONS } from '@/lib/legislations'
import { generatePaymentReference, getSiteUrl } from '@/lib/utils/payment'

export interface BillingDetails {
  firstName: string
  lastName: string
  country: string
  phone: string
  email: string
  notes?: string
}

export interface PurchaseItem {
  id: string
  title: string
  price: number
  quantity: number
}

export async function initializeShopPayment(
  billingDetails: BillingDetails,
  cartItems: PurchaseItem[]
) {
  if (!cartItems || cartItems.length === 0) {
    return { error: 'Your cart is empty.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'You must be logged in to complete checkout.' }
  }

  // Calculate total price based on server config to prevent client-side manipulation
  let totalAmount = 0
  for (const item of cartItems) {
    const dbItem = LEGISLATIONS.find((l) => l.id === item.id)
    if (!dbItem) {
      return { error: `Invalid item: ${item.title}` }
    }
    totalAmount += dbItem.price * item.quantity
  }

  if (totalAmount <= 0) {
    return { error: 'Invalid order amount.' }
  }

  const reference = generatePaymentReference('SH')
  const planName = cartItems.map((item) => `${item.title} x ${item.quantity}`).join(", ").substring(0, 250)

  const sbAdmin = createServiceRoleClient()

  // Insert transaction as pending in Supabase (using service role to bypass RLS restrictions)
  const { error: dbError } = await sbAdmin.from('transactions').insert({
    user_id: user.id,
    reference,
    amount: totalAmount,
    currency: 'NGN',
    plan_name: planName,
    plan_role: 'legislation_buyer',
    status: 'pending',
    metadata: {
      type: 'shop_purchase',
      items: cartItems,
      billing_details: billingDetails,
    },
  })

  if (dbError) {
    console.error("Failed to insert transaction in DB:", dbError)
    return { error: 'Failed to record transaction. Please try again.' }
  }

  // Initialize Paystack transaction
  const callbackUrl = `${getSiteUrl()}/shop/payment`
  
  try {
    const paystackResponse = await initializeTransaction({
      email: billingDetails.email || user.email!,
      amount: totalAmount,
      reference,
      callback_url: callbackUrl,
      metadata: {
        user_id: user.id,
        type: 'shop_purchase',
        reference,
        billing_details: billingDetails,
        items: cartItems,
      },
    })

    if (!paystackResponse.status || !paystackResponse.data) {
      console.error("Paystack initialization failed:", paystackResponse.message)
      return { error: paystackResponse.message || 'Failed to initialize payment gateway.' }
    }

    // Update transaction metadata with the authorization URL
    await sbAdmin.from('transactions').update({
      metadata: {
        type: 'shop_purchase',
        items: cartItems,
        billing_details: billingDetails,
        authorization_url: paystackResponse.data.authorization_url,
      },
    }).eq('reference', reference)

    return { authorization_url: paystackResponse.data.authorization_url, reference }
  } catch (err) {
    console.error("Payment action error:", err)
    return { error: 'An error occurred while connecting to the payment gateway.' }
  }
}
