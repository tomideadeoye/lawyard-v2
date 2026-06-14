'use server'

import { createClient } from '@/lib/supabase/server'
import { initializeTransaction } from '@/lib/api/paystack'
import { revalidatePath } from 'next/cache'
import crypto from 'crypto'
import brandPressConfig from '@/lib/brand-press.json'
import { sendBrandPressReceived, sendAdminNewSubmission } from '@/lib/api/email'

function generateReference(): string {
  return `BP-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
}

export async function submitBrandPress(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be logged in' }

  const title = formData.get('title') as string
  const excerpt = formData.get('excerpt') as string
  const content = formData.get('content') as string
  const brandName = formData.get('brand_name') as string
  const tierId = formData.get('tier') as string
  const featuredImage = formData.get('featured_image') as string
  const scheduledDate = formData.get('scheduled_date') as string

  if (!title || !content || !brandName || !tierId) {
    return { error: 'Missing required fields' }
  }

  const tier = brandPressConfig.tiers.find(t => t.id === tierId)
  if (!tier) return { error: 'Invalid tier' }

  const slug = title
    .toLowerCase().trim()
    .replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .concat('-', crypto.randomUUID().slice(0, 6))

  const reference = generateReference()

  const { data: article, error: articleError } = await supabase
    .from('articles')
    .insert({
      title,
      slug,
      content,
      excerpt: excerpt || content.substring(0, 160),
      featured_image: featuredImage || null,
      author_id: user.id,
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

  const { error: txError } = await supabase.from('transactions').insert({
    user_id: user.id,
    reference,
    amount: tier.price,
    plan_name: `Brand Press ${tier.name}`,
    plan_role: `brand_press_${tier.id}`,
    status: 'pending',
    metadata: {
      article_id: article.id,
      tier: tier.id,
      brand_name: brandName,
      type: 'brand_press',
    },
  })

  if (txError) return { error: 'Failed to record transaction' }

  sendBrandPressReceived(user.email!, brandName, tier.name).catch(() => {})
  sendAdminNewSubmission(brandName, title).catch(() => {})

  const init = await initializeTransaction({
    email: user.email!,
    amount: tier.price,
    reference,
    callback_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3002'}/brand-press/payment?reference=${reference}`,
    metadata: {
      user_id: user.id,
      article_id: article.id,
      tier: tier.id,
      brand_name: brandName,
      type: 'brand_press',
    },
  })

  if (!init.status || !init.data) {
    return { error: init.message || 'Failed to initialize payment' }
  }

  await supabase.from('transactions').update({
    metadata: {
      article_id: article.id,
      tier: tier.id,
      brand_name: brandName,
      type: 'brand_press',
      authorization_url: init.data.authorization_url,
    },
  }).eq('reference', reference)

  return { authorization_url: init.data.authorization_url, reference }
}
