'use server'

import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { initializeTransaction } from '@/lib/api/paystack'
import { generatePaymentReference, getSiteUrl } from '@/lib/utils/payment'
import {
  isPaidTier,
  POST_CAP_DEFAULTS,
  type PublishingQuota,
} from '@/lib/directory/publishing'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

async function readSetting(supabase: SupabaseClient, key: string, fallback: number): Promise<number> {
  const { data } = await supabase.from('app_settings').select('value').eq('key', key).maybeSingle()
  const n = Number(data?.value)
  return Number.isFinite(n) ? n : fallback
}

/**
 * Count content posts (articles + podcasts) for an author, all-time or this month.
 * "Posts" for the cap = both Content Studio outputs combined (C05 decision).
 */
async function countPosts(supabase: SupabaseClient, userId: string, sinceISO?: string) {
  const articles = supabase
    .from('articles')
    .select('id', { count: 'exact', head: true })
    .eq('author_id', userId)
  const podcasts = supabase
    .from('podcasts')
    .select('id', { count: 'exact', head: true })
    .eq('author_id', userId)

  const [a, p] = await Promise.all([
    sinceISO ? articles.gte('created_at', sinceISO) : articles,
    sinceISO ? podcasts.gte('created_at', sinceISO) : podcasts,
  ])
  return (a.count ?? 0) + (p.count ?? 0)
}

async function creditBalance(supabase: SupabaseClient, userId: string): Promise<number> {
  const { data } = await supabase.from('post_credits').select('delta').eq('user_id', userId)
  return (data ?? []).reduce((sum, r) => sum + Number(r.delta), 0)
}

/** Resolve the caller's publishing quota. */
export async function getPublishingQuota(userId?: string): Promise<PublishingQuota | null> {
  const supabase = await createClient()
  const uid = userId ?? (await supabase.auth.getUser()).data.user?.id
  if (!uid) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', uid)
    .maybeSingle()

  const tier = (profile?.subscription_tier as string) || 'free'
  const paid = isPaidTier(tier)

  const [freeTotal, paidPerMonth, extraPostPrice] = await Promise.all([
    readSetting(supabase, 'post_cap_free_total', POST_CAP_DEFAULTS.freeTotal),
    readSetting(supabase, 'post_cap_paid_per_month', POST_CAP_DEFAULTS.paidPerMonth),
    readSetting(supabase, 'extra_post_price', POST_CAP_DEFAULTS.extraPostPrice),
  ])

  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const limit = paid ? paidPerMonth : freeTotal
  const used = paid ? await countPosts(supabase, uid, monthStart.toISOString()) : await countPosts(supabase, uid)
  const credits = await creditBalance(supabase, uid)
  const remaining = Math.max(0, limit - used)

  return {
    tier,
    paid,
    used,
    limit,
    remaining,
    credits,
    extraPostPrice,
    canPublish: remaining > 0 || credits > 0,
  }
}

/**
 * Gate a publish attempt: within the cap → allow; otherwise consume an
 * extra-post credit; otherwise reject. Uses the service role to write the
 * consumption so the ledger can't be tampered with client-side.
 */
export async function consumePostAllowance(
  userId: string
): Promise<{ allowed: boolean; error?: string }> {
  const quota = await getPublishingQuota(userId)
  if (!quota) return { allowed: false, error: 'Not authenticated' }

  if (quota.remaining > 0) return { allowed: true }

  if (quota.credits > 0) {
    const sbAdmin = createServiceRoleClient()
    const { error } = await sbAdmin
      .from('post_credits')
      .insert({ user_id: userId, delta: -1, reason: 'consume' })
    if (error) return { allowed: false, error: 'Could not apply your extra-post credit.' }
    return { allowed: true }
  }

  return {
    allowed: false,
    error:
      quota.paid
        ? `You've used all ${quota.limit} posts for this month. Buy an extra post or upgrade your plan to keep publishing.`
        : `You've used your ${quota.limit} free post. Upgrade to a paid plan or buy an extra post to publish more.`,
  }
}

/**
 * One-off Paystack charge for an extra post. On success (webhook / verify),
 * a +1 credit is written to post_credits.
 */
export async function purchaseExtraPost() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'You must be logged in to buy an extra post' }

  const amount = await readSetting(supabase, 'extra_post_price', POST_CAP_DEFAULTS.extraPostPrice)
  if (amount <= 0) return { error: 'Extra posts are not available right now' }

  const reference = generatePaymentReference('LWY')

  const init = await initializeTransaction({
    email: user.email!,
    amount,
    reference,
    currency: 'NGN',
    callback_url: `${getSiteUrl()}/dashboard/publish?payment=extra_post`,
    metadata: { type: 'extra_post', user_id: user.id },
  })

  if (!init.status || !init.data) {
    return { error: init.message || 'Failed to initialize payment' }
  }

  const sbAdmin = createServiceRoleClient()
  const { error: dbError } = await sbAdmin.from('transactions').insert({
    user_id: user.id,
    reference,
    amount,
    currency: 'NGN',
    plan_name: 'Extra Post',
    plan_role: 'lawyer',
    status: 'pending',
    metadata: { authorization_url: init.data.authorization_url, type: 'extra_post' },
  })

  if (dbError) return { error: 'Failed to record transaction' }

  return { authorization_url: init.data.authorization_url, reference }
}
