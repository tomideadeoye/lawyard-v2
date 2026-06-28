// Supabase Edge Function — called via cron to publish scheduled articles
// Deploy: supabase functions deploy publish-scheduled --no-verify-jwt
// Test:   curl https://<project>.supabase.co/functions/v1/publish-scheduled
// Cron:   supabase functions cron create "0 * * * *" --function publish-scheduled
//
// Does two things:
//   1. Publishes Brand Press articles when their scheduled_date has passed
//      (payment_status = 'paid', status = 'pending_review', scheduled_date <= now)
//   2. Auto-approves articles that have been pending_review longer than auto_approve_hours
//      (status = 'pending_review', not brand_press, created_at > threshold)
//
// Requires Supabase env vars: WP_API_URL, WP_USERNAME, WP_APP_PASSWORD

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface Article {
  id: string
  title: string
  brand_name: string | null
  scheduled_date: string | null
  content?: string
  excerpt?: string
  featured_image?: string | null
  article_type?: string
}

function getWpAuth(): string | null {
  const url = Deno.env.get('WP_API_URL')
  const user = Deno.env.get('WP_USERNAME')
  const pass = Deno.env.get('WP_APP_PASSWORD')
  if (!url || !user || !pass) return null
  return `Basic ${btoa(`${user}:${pass.replace(/\s/g, '')}`)}`
}

async function publishToWordPress(article: Article, status: 'draft' | 'publish'): Promise<boolean> {
  const wpUrl = Deno.env.get('WP_API_URL')
  const auth = getWpAuth()
  if (!wpUrl || !auth) return false

  try {
    const body: Record<string, unknown> = {
      title: article.title,
      content: article.content || '',
      excerpt: article.excerpt || '',
      status,
      meta: { source: article.article_type === 'brand_press' ? 'lawyard-v2-brand-press' : 'lawyard-v2-directory' },
    }

    if (article.article_type === 'brand_press') {
      body.categories = []
      body.tags = ['brand-press']
    }

    if (article.featured_image) {
      body.featured_media = article.featured_image
    }

    const res = await fetch(`${wpUrl}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': auth,
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      console.error(`WP publish failed for ${article.id}: ${res.status} ${await res.text()}`)
      return false
    }
    return true
  } catch (e) {
    console.error(`WP publish error for ${article.id}:`, e)
    return false
  }
}

async function sendPublishEmail(supabase: ReturnType<typeof createClient>, article: Article) {
  const { data: tx } = await supabase
    .from('transactions')
    .select('user_id')
    .eq('metadata->>article_id', article.id)
    .single()

  if (tx?.user_id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', tx.user_id)
      .single()

    if (profile?.email) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Lawyard <noreply@lawyard.org>',
            to: profile.email,
            subject: `Published on Lawyard — ${article.brand_name || article.title}`,
            html: `<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
              <h1>Published!</h1>
              <p>Your article <strong>${article.title}</strong> has been published on lawyard.org.</p>
              <p style="color: #64748B; font-size: 14px; margin-top: 24px;">— Lawyard Team</p>
            </div>`,
          }),
        })
        if (!res.ok) console.error('Email send failed for', profile.email)
      } catch (e) {
        console.error('Email error for', profile.email, e)
      }
    }
  }
}

serve(async (_req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const now = new Date().toISOString()

  // ── Read auto_approve_hours from settings ──
  let autoApproveHours = 24
  try {
    const { data: setting } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'auto_approve_hours')
      .single()
    if (setting?.value) autoApproveHours = parseInt(setting.value, 10) || 24
  } catch {
    // table may not exist yet, use default
  }

  const cutoffDate = new Date(Date.now() - autoApproveHours * 60 * 60 * 1000).toISOString()
  const publishedIds: string[] = []

  // ── 1. Publish scheduled Brand Press ──
  const { data: scheduledArticles, error: schedError } = await supabase
    .from('articles')
    .select('id, title, brand_name, scheduled_date, content, excerpt, featured_image, article_type')
    .eq('status', 'pending_review')
    .eq('payment_status', 'paid')
    .lte('scheduled_date', now)
    .neq('scheduled_date', null)

  if (schedError) {
    console.error('Scheduled query failed:', schedError)
  }

  if (scheduledArticles && scheduledArticles.length > 0) {
    for (const article of scheduledArticles) {
      // Publish to WordPress live
      await publishToWordPress(article, 'publish')
      // Send email notification
      await sendPublishEmail(supabase, article)
    }

    const ids = scheduledArticles.map((a: Article) => a.id)
    const { error: updateError } = await supabase
      .from('articles')
      .update({ status: 'published' })
      .in('id', ids)

    if (updateError) {
      console.error('Scheduled publish update failed:', updateError)
    } else {
      publishedIds.push(...ids)
      console.log(`Published ${ids.length} scheduled Brand Press articles`)
    }
  }

  // ── 2. Auto-approve stale articles (not brand_press) ──
  const { data: staleArticles, error: staleError } = await supabase
    .from('articles')
    .select('id, title, brand_name, scheduled_date, content, excerpt, featured_image, article_type')
    .eq('status', 'pending_review')
    .neq('article_type', 'brand_press')
    .lte('created_at', cutoffDate)

  if (staleError) {
    console.error('Stale articles query failed:', staleError)
  }

  if (staleArticles && staleArticles.length > 0) {
    for (const article of staleArticles) {
      // Publish to WordPress as draft
      await publishToWordPress(article, 'draft')
    }

    const ids = staleArticles.map((a: Article) => a.id)
    const { error: updateError } = await supabase
      .from('articles')
      .update({ status: 'published' })
      .in('id', ids)

    if (updateError) {
      console.error('Auto-approve update failed:', updateError)
    } else {
      publishedIds.push(...ids)
      console.log(`Auto-approved ${ids.length} stale articles`)
    }
  }

  if (publishedIds.length === 0) {
    return new Response(JSON.stringify({ published: 0 }), { status: 200 })
  }

  return new Response(JSON.stringify({ published: publishedIds.length }), { status: 200 })
})
