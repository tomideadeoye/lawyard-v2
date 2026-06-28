import { NextRequest } from 'next/server'
import crypto from 'crypto'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { publishArticleToWordPress, publishBrandPressToWordPress } from '@/lib/wordpress'

const SIGNING_SECRET = process.env.DIRECTORY_SLACK_SIGNING_SECRET || ''

function verifySignature(
  body: string,
  signature: string,
  timestamp: string
): boolean {
  if (!SIGNING_SECRET || !signature || !timestamp) return false

  // Reject requests older than 5 minutes (prevents replay attacks)
  const now = Math.floor(Date.now() / 1000)
  if (Math.abs(now - parseInt(timestamp, 10)) > 300) return false

  const base = `v0:${timestamp}:${body}`
  const expected = `v0=${crypto
    .createHmac('sha256', SIGNING_SECRET)
    .update(base)
    .digest('hex')}`

  if (expected.length !== signature.length) return false
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}

function parsePayload(body: string): Record<string, unknown> | null {
  try {
    const params = new URLSearchParams(body)
    const payload = params.get('payload')
    return payload ? JSON.parse(payload) : null
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('x-slack-signature') || ''
  const timestamp = request.headers.get('x-slack-request-timestamp') || ''

  if (!verifySignature(body, signature, timestamp)) {
    return new Response('Invalid signature', { status: 401 })
  }

  const payload = parsePayload(body)
  if (!payload) {
    return new Response('Invalid payload', { status: 400 })
  }

  if (payload.type !== 'block_actions') {
    return new Response('Ignored', { status: 200 })
  }

  const actions = payload.actions as Array<{ action_id: string; value: string }> | undefined
  if (!actions || actions.length === 0) {
    return new Response('No actions', { status: 400 })
  }

  const action = actions[0]
  const { action_id, value: articleId } = action
  const user = payload.user as { id: string; username?: string; name?: string } | undefined
  const userName = user?.name || user?.username || 'Someone'
  const responseUrl = payload.response_url as string | undefined

  const sbAdmin = createServiceRoleClient()

  if (action_id === 'approve_article') {
    const { data: article, error: fetchError } = await sbAdmin
      .from('articles')
      .select('*')
      .eq('id', articleId)
      .single()

    if (fetchError || !article) {
      console.error('Failed to fetch article:', fetchError)
      return new Response('Article not found', { status: 404 })
    }

    try {
      await publishArticleToWordPress({
        title: article.title,
        content: article.content,
        excerpt: article.excerpt || '',
        featured_image: article.featured_image,
        status: 'draft',
      })
    } catch (wpError) {
      console.error('Failed to publish to WordPress:', wpError)
      return new Response('WordPress publish failed', { status: 500 })
    }

    const { error: updateError } = await sbAdmin
      .from('articles')
      .update({ status: 'published', updated_at: new Date().toISOString() })
      .eq('id', articleId)

    if (updateError) {
      console.error('Failed to update article status:', updateError)
      return new Response('Database error', { status: 500 })
    }

    if (responseUrl) {
      await fetch(responseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          replace_original: true,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `✅ *Article Approved*\nApproved by ${userName}\nPublished to lawyard.org as draft\nID: \`${articleId}\``,
              },
            },
          ],
        }),
      }).catch((e) => console.error('Failed to update Slack message:', e))
    }

    return Response.json({ ok: true })
  }

  if (action_id === 'deny_article') {
    const { error } = await sbAdmin
      .from('articles')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('id', articleId)

    if (error) {
      console.error('Failed to deny article:', error)
      return new Response('Database error', { status: 500 })
    }

    if (responseUrl) {
      await fetch(responseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          replace_original: true,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `❌ *Article Denied*\nDenied by ${userName}\nID: \`${articleId}\``,
              },
            },
          ],
        }),
      }).catch((e) => console.error('Failed to update Slack message:', e))
    }

    return Response.json({ ok: true })
  }

  if (action_id === 'approve_brand_press') {
    const { data: article, error: fetchError } = await sbAdmin
      .from('articles')
      .select('*')
      .eq('id', articleId)
      .single()

    if (fetchError || !article) {
      console.error('Failed to fetch brand press:', fetchError)
      return new Response('Article not found', { status: 404 })
    }

    try {
      await publishBrandPressToWordPress({
        title: article.title,
        content: article.content,
        excerpt: article.excerpt || '',
        featured_image: article.featured_image,
        status: 'draft',
      })
    } catch (wpError) {
      console.error('Failed to publish brand press to WordPress:', wpError)
      return new Response('WordPress publish failed', { status: 500 })
    }

    const { error: updateError } = await sbAdmin
      .from('articles')
      .update({
        payment_status: 'paid',
        updated_at: new Date().toISOString(),
      })
      .eq('id', articleId)

    if (updateError) {
      console.error('Failed to update brand press:', updateError)
      return new Response('Database error', { status: 500 })
    }

    const { data: profile } = await sbAdmin
      .from('profiles')
      .select('email')
      .eq('id', article.author_id)
      .single()

    if (profile?.email) {
      const { sendBrandPressApproved } = await import('@/lib/api/email')
      sendBrandPressApproved(profile.email, article.brand_name || 'Brand Press').catch(() => {})
    }

    if (responseUrl) {
      await fetch(responseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          replace_original: true,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `✅ *Brand Press Approved*\nApproved by ${userName}\nScheduled for ${article.scheduled_date ? new Date(article.scheduled_date).toLocaleDateString() : 'as soon as possible'}\nID: \`${articleId}\``,
              },
            },
          ],
        }),
      }).catch((e) => console.error('Failed to update Slack message:', e))
    }

    return Response.json({ ok: true })
  }

  if (action_id === 'deny_brand_press') {
    const { error } = await sbAdmin
      .from('articles')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('id', articleId)

    if (error) {
      console.error('Failed to deny brand press:', error)
      return new Response('Database error', { status: 500 })
    }

    if (responseUrl) {
      await fetch(responseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          replace_original: true,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `❌ *Brand Press Denied*\nDenied by ${userName}\nID: \`${articleId}\``,
              },
            },
          ],
        }),
      }).catch((e) => console.error('Failed to update Slack message:', e))
    }

    return Response.json({ ok: true })
  }

  /* ── Lawyer Verification ─────────────────────────────────── */

  if (action_id === 'approve_lawyer') {
    const { data: verification, error: fetchError } = await sbAdmin
      .from('lawyer_verifications')
      .select('*')
      .eq('id', articleId)
      .single()

    if (fetchError || !verification) {
      console.error('Failed to fetch verification:', fetchError)
      return new Response('Verification not found', { status: 404 })
    }

    const { error: updateError } = await sbAdmin
      .from('lawyer_verifications')
      .update({
        status: 'approved',
        reviewed_by: verification.user_id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', articleId)

    if (updateError) {
      console.error('Failed to approve verification:', updateError)
      return new Response('Database error', { status: 500 })
    }

    const { error: roleError } = await sbAdmin
      .from('profiles')
      .update({ role: 'lawyer' })
      .eq('id', verification.user_id)

    if (roleError) {
      console.error('Failed to upgrade user role:', roleError)
    }

    if (responseUrl) {
      await fetch(responseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          replace_original: true,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `✅ *Lawyer Verified*\nApproved by ${userName}\n*${verification.full_name}* is now a verified lawyer.\nID: \`${articleId}\``,
              },
            },
          ],
        }),
      }).catch((e) => console.error('Failed to update Slack message:', e))
    }

    return Response.json({ ok: true })
  }

  if (action_id === 'deny_lawyer') {
    const { data: verification, error: fetchError } = await sbAdmin
      .from('lawyer_verifications')
      .select('user_id, full_name')
      .eq('id', articleId)
      .single()

    if (fetchError || !verification) {
      console.error('Failed to fetch verification:', fetchError)
      return new Response('Verification not found', { status: 404 })
    }

    const { error: updateError } = await sbAdmin
      .from('lawyer_verifications')
      .update({
        status: 'rejected',
        reviewed_by: verification.user_id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', articleId)

    if (updateError) {
      console.error('Failed to deny verification:', updateError)
      return new Response('Database error', { status: 500 })
    }

    if (responseUrl) {
      await fetch(responseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          replace_original: true,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `❌ *Lawyer Verification Denied*\nDenied by ${userName}\n*${verification.full_name}* was not approved.\nID: \`${articleId}\``,
              },
            },
          ],
        }),
      }).catch((e) => console.error('Failed to update Slack message:', e))
    }

    return Response.json({ ok: true })
  }

  return new Response('Unknown action', { status: 400 })
}
