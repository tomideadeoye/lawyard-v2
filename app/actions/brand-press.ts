'use server'

import { createServiceRoleClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import brandPressConfig from '@/lib/brand-press.json'
import { sendBrandPressReceived, sendAdminNewSubmission, sendBrandPressInvoice } from '@/lib/api/email'
import { validateCoupon } from '@/app/actions/validate-coupon'
import { brandPressSchema } from '@/lib/validations/brand-press'
import { generatePaymentReference } from '@/lib/utils/payment'

export async function submitBrandPress(formData: FormData) {
  const raw: Record<string, unknown> = Object.fromEntries(formData.entries())
  raw.accepted_terms = raw.accepted_terms === 'true'

  const parsed = brandPressSchema.safeParse(raw)
  if (!parsed.success) {
    const first = parsed.error.errors[0]
    return { error: first?.message || 'Validation failed' }
  }

  const data = parsed.data
  const tier = brandPressConfig.tiers.find(t => t.id === data.tier)
  if (!tier) return { error: 'Invalid tier' }

  // Clash detection: enforce minimum gap between Brand Press scheduled dates
  if (data.scheduled_date) {
    const sbAdmin = createServiceRoleClient()
    const { data: clashWindow } = await sbAdmin
      .from('app_settings')
      .select('value')
      .eq('key', 'brand_press_clash_window_minutes')
      .single()

    const windowMinutes = parseInt(clashWindow?.value || '60', 10)
    const scheduledMs = new Date(data.scheduled_date).getTime()

    if (!isNaN(scheduledMs)) {
      const windowMs = windowMinutes * 60 * 1000
      const fromTime = new Date(scheduledMs - windowMs).toISOString()
      const toTime = new Date(scheduledMs + windowMs).toISOString()

      const { count } = await sbAdmin
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('article_type', 'brand_press')
        .in('status', ['pending_review', 'published'])
        .gte('scheduled_date', fromTime)
        .lte('scheduled_date', toTime)

      if (count && count > 0) {
        return {
          error: `Another Brand Press is scheduled within ${windowMinutes} minutes of your selected time. Please choose a different date or time.`,
        }
      }
    }
  }

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

  const reference = generatePaymentReference('BP')
  const sbAdmin = createServiceRoleClient()

  const { data: article, error: articleError } = await sbAdmin
    .from('articles')
    .insert({
      title: data.title,
      slug,
      content: data.content,
      excerpt: data.excerpt || data.content.substring(0, 160),
      featured_image: data.featured_image || null,
      author_id: null,
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
    user_id: null,
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
    if (data.payment_method === 'invoice') {
      sendBrandPressInvoice(data.email, {
        brandName: data.brand_name,
        contactName: data.contact_name || data.brand_name,
        tierName: tier.name,
        amount,
        reference,
      }).catch(() => {})
    }
    revalidatePath('/brand-press')
    return {
      success: true,
      message: data.payment_method === 'transfer'
        ? 'Your submission has been received. Please complete your bank transfer to activate your order.'
        : 'Your submission has been received. An invoice will be sent to your email.',
    }
  }

  return { reference, email: data.email, amount }
}
