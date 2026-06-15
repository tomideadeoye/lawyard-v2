'use server'

import { createServiceRoleClient } from '@/lib/supabase/server'
import { initializeTransaction } from '@/lib/api/paystack'
import { revalidatePath } from 'next/cache'
import crypto from 'crypto'
import brandPressConfig from '@/lib/brand-press.json'
import { sendBrandPressReceived, sendAdminNewSubmission } from '@/lib/api/email'
import { validateCoupon } from '@/app/actions/validate-coupon'
import { brandPressSchema } from '@/lib/validations/brand-press'

const GUEST_USER_ID = '6b80d2f0-31b6-4239-81ec-889c3fa0c4b0'

function generateReference(): string {
  return `BP-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
}

export async function submitBrandPress(formData: FormData) {
  const raw: Record<string, unknown> = Object.fromEntries(formData.entries())
  raw.accepted_terms = raw.accepted_terms === 'on' || raw.accepted_terms === 'true' ? true : undefined

  const parsed = brandPressSchema.safeParse(raw)
  if (!parsed.success) {
    const first = parsed.error.errors[0]
    return { error: first?.message || 'Validation failed' }
  }

  const data = parsed.data
  const tier = brandPressConfig.tiers.find(t => t.id === data.tier)
  if (!tier) return { error: 'Invalid tier' }

  let amount = tier.price
  let appliedCoupon: { code: string; discountPercent: number; discountAmount: number } | null = null
  if (data.coupon_code) {
    const validation = await validateCoupon(data.coupon_code, tier.price)
    if (validation.valid) {
      appliedCoupon = {
        code: validation.code,
        discountPercent: validation.discountPercent,
        discountAmount: validation.discountAmount,
      }
      amount = validation.finalPrice
    }
  }

  const slug = data.title
    .toLowerCase().trim()
    .replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .concat('-', crypto.randomUUID().slice(0, 6))

  const reference = generateReference()
  const sbAdmin = createServiceRoleClient()

  const { data: article, error: articleError } = await sbAdmin
    .from('articles')
    .insert({
      title: data.title,
      slug,
      content: data.content,
      excerpt: data.excerpt || data.content.substring(0, 160),
      featured_image: data.featured_image || null,
      author_id: GUEST_USER_ID,
      brand_name: data.brand_name,
      tier: tier.id,
      article_type: 'brand_press',
      payment_status: 'pending',
      scheduled_date: data.scheduled_date || null,
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
    brand_name: data.brand_name,
    type: 'brand_press',
    contact_email: data.email,
    contact_name: data.contact_name || data.brand_name,
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

  if (txError) {
    await sbAdmin.from('articles').delete().eq('id', article.id)
    return { error: 'Failed to record transaction' }
  }

  sendBrandPressReceived(data.email, data.brand_name, tier.name).catch(() => {})
  sendAdminNewSubmission(data.brand_name, data.title).catch(() => {})

  if (data.payment_method === 'transfer' || data.payment_method === 'invoice') {
    revalidatePath('/brand-press')
    return {
      success: true,
      message: data.payment_method === 'transfer'
        ? 'Your submission has been received. Please complete your bank transfer to activate your order.'
        : 'Your submission has been received. An invoice will be sent to your email.',
    }
  }

  const init = await initializeTransaction({
    email: data.email,
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
    email: data.email,
    amount,
  }
}
