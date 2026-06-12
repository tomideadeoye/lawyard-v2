'use server'

import { createClient } from '@/lib/supabase/server'
import { initializeTransaction } from '@repo/api/paystack'
import crypto from 'crypto'

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

function generateReference(): string {
  return `SH-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
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

  // Calculate total price
  const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  if (totalAmount <= 0) {
    return { error: 'Invalid order amount.' }
  }

  const reference = generateReference()
  const planName = cartItems.map((item) => `${item.title} x ${item.quantity}`).join(", ").substring(0, 250)

  // Insert transaction as pending in Supabase
  const { error: dbError } = await supabase.from('transactions').insert({
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
  const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3002'}/shop/payment?reference=${reference}`
  
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
    await supabase.from('transactions').update({
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
