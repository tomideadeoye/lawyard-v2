// Supabase Edge Function — called via cron to publish scheduled articles
// Deploy: supabase functions deploy publish-scheduled --no-verify-jwt
// Test:   curl https://<project>.supabase.co/functions/v1/publish-scheduled
// Cron:   supabase functions cron create "0 * * * *" --function publish-scheduled

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface Article {
  id: string
  title: string
  brand_name: string | null
  scheduled_date: string | null
}

serve(async (_req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const now = new Date().toISOString()

  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title, brand_name, scheduled_date')
    .eq('status', 'pending_review')
    .eq('payment_status', 'paid')
    .lte('scheduled_date', now)
    .neq('scheduled_date', null)

  if (error) {
    console.error('Query failed:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  if (!articles || articles.length === 0) {
    return new Response(JSON.stringify({ published: 0 }), { status: 200 })
  }

  const ids = articles.map((a: Article) => a.id)

  const { error: updateError } = await supabase
    .from('articles')
    .update({ status: 'published' })
    .in('id', ids)

  if (updateError) {
    console.error('Publish failed:', updateError)
    return new Response(JSON.stringify({ error: updateError.message }), { status: 500 })
  }

  console.log(`Published ${ids.length} scheduled articles`)

  // Send approval emails for scheduled publications
  for (const article of articles) {
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
              subject: `Brand Press Published — ${article.brand_name || 'Your Article'}`,
              html: `<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
                <h1>Published!</h1>
                <p>Your Brand Press <strong>${article.title}</strong> has been published on lawyard.org.</p>
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

  return new Response(JSON.stringify({ published: ids.length }), { status: 200 })
})
