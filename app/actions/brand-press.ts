'use server'

import { createServiceRoleClient } from '@/lib/supabase/server'
import { initializeTransaction } from '@/lib/api/paystack'
import { revalidatePath } from 'next/cache'
import crypto from 'crypto'
import brandPressConfig from '@/lib/brand-press.json'
import { sendBrandPressReceived, sendAdminNewSubmission } from '@/lib/api/email'
import { validateCoupon } from '@/app/actions/validate-coupon'

const GUEST_USER_ID = '6b80d2f0-31b6-4239-81ec-889c3fa0c4b0'

function generateReference(): string {
  return `BP-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
}

export async function submitBrandPress(formData: FormData) {
  const sbAdmin = createServiceRoleClient()

  const title = formData.get('title') as string
  const excerpt = formData.get('excerpt') as string
  const content = formData.get('content') as string
  const brandName = formData.get('brand_name') as string
  const tierId = formData.get('tier') as string
  const featuredImage = formData.get('featured_image') as string
  const scheduledDate = formData.get('scheduled_date') as string
  const couponCode = formData.get('coupon_code') as string
  const email = formData.get('email') as string
  const contactName = formData.get('contact_name') as string

  if (!title || !content || !brandName || !tierId || !email) {
    return { error: 'Missing required fields' }
  }

  const tier = brandPressConfig.tiers.find(t => t.id === tierId)
  if (!tier) return { error: 'Invalid tier' }

  // Server-side price computation — never trust client-sent prices
  let amount = tier.price
  let appliedCoupon: { code: string; discountPercent: number; discountAmount: number } | null = null
  if (couponCode) {
    const validation = await validateCoupon(couponCode, tier.price)
    if (validation.valid) {
      appliedCoupon = {
        code: validation.code,
        discountPercent: validation.discountPercent,
        discountAmount: validation.discountAmount,
      }
      amount = validation.finalPrice
    }
  }

  const slug = title
    .toLowerCase().trim()
    .replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .concat('-', crypto.randomUUID().slice(0, 6))

  const reference = generateReference()

  const { data: article, error: articleError } = await sbAdmin
    .from('articles')
    .insert({
      title,
      slug,
      content,
      excerpt: excerpt || content.substring(0, 160),
      featured_image: featuredImage || null,
      author_id: GUEST_USER_ID,
      brand_name: brandName,
      tier: tier.id,
      article_type: 'brand_press',
      payment_status: 'pending',
      scheduled_date: scheduledDate || null,
      status: 'pending_review',
      category: 'Brand Press',
    })
    .select('id')
    .single()

  if (articleError || !article) {
    return { error: 'Failed to create article' }
  }

  const txMetadata: Record<string, any> = {
    article_id: article.id,
    tier: tier.id,
    brand_name: brandName,
    type: 'brand_press',
    contact_email: email,
    contact_name: contactName || brandName,
  }

  if (appliedCoupon) {
    txMetadata.coupon_code = appliedCoupon.code
    txMetadata.discount_amount = appliedCoupon.discountAmount
    txMetadata.discount_percent = appliedCoupon.discountPercent
  }

  const { error: txError } = await sbAdmin.from('transactions').insert({
    user_id: GUEST_USER_ID,
    reference,
    amount,
    plan_name: `Brand Press ${tier.name}`,
    plan_role: `brand_press_${tier.id}`,
    status: 'pending',
    metadata: txMetadata,
  })

  if (txError) return { error: 'Failed to record transaction' }

  sendBrandPressReceived(email, brandName, tier.name).catch(() => {})
  sendAdminNewSubmission(brandName, title).catch(() => {})

  const paymentMethod = formData.get('payment_method') as string
  if (paymentMethod === 'transfer' || paymentMethod === 'invoice') {
    revalidatePath('/brand-press')
    return {
      success: true,
      message: paymentMethod === 'transfer'
        ? 'Your submission has been received. Please complete your bank transfer to activate your order.'
        : 'Your submission has been received. An invoice will be sent to your email.',
    }
  }

  const init = await initializeTransaction({
    email,
    amount,
    reference,
    callback_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3002'}/brand-press/payment?reference=${reference}`,
    metadata: txMetadata,
  })

  if (!init.status || !init.data) {
    return { error: init.message || 'Failed to initialize payment' }
  }

  await sbAdmin.from('transactions').update({
    metadata: {
      ...txMetadata,
      authorization_url: init.data.authorization_url,
    },
  }).eq('reference', reference)

  return {
    access_code: init.data.access_code,
    authorization_url: init.data.authorization_url,
    reference,
    email,
    amount,
  }
}
