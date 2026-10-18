import { NextRequest } from 'next/server'
import crypto from 'crypto'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { publishArticleToWordPress, publishCorporatePostToWordPress, publishPodcastToWordPress, updateWordPressPostStatus } from '@/lib/wordpress'

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
  try {
    const body = await request.text()
    const signature = request.headers.get('x-slack-signature') || ''
    const timestamp = request.headers.get('x-slack-request-timestamp') || ''

    if (!verifySignature(body, signature, timestamp)) {
      console.error('[Slack] Invalid signature')
      return new Response('Invalid signature', { status: 401 })
    }

    const payload = parsePayload(body)
    if (!payload) {
      console.error('[Slack] Invalid payload')
      return new Response('Invalid payload', { status: 400 })
    }

    if (payload.type !== 'block_actions') {
      return new Response('Ignored', { status: 200 })
    }

    const actions = payload.actions as Array<{ action_id: string; value: string }> | undefined
    if (!actions || actions.length === 0) {
      console.error('[Slack] No actions in payload')
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

    let wpPostId: number | null = null
    try {
      const wpResult = await publishArticleToWordPress({
        title: article.title,
        content: article.content,
        excerpt: article.excerpt || '',
        featured_image: article.featured_image,
        status: 'publish',
      })
      wpPostId = wpResult?.id ?? null
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

    const viewUrl = wpPostId ? `https://www.lawyard.org/wp-admin/post.php?post=${wpPostId}&action=edit` : null
    const buttonValue = wpPostId ? JSON.stringify({ a: articleId, w: wpPostId }) : articleId

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
                text: `✅ *Article Approved*\nApproved by ${userName}\nPublished to lawyard.org\nID: \`${articleId}\``,
              },
            },
            {
              type: 'actions',
              elements: [
                ...(viewUrl ? [{ type: 'button', text: { type: 'plain_text', text: '👁 View on WordPress', emoji: true }, url: viewUrl, action_id: 'view_wp_post' }] : []),
                { type: 'button', text: { type: 'plain_text', text: '↩ Rescind', emoji: true }, style: 'danger', value: buttonValue, action_id: 'rescind_article' },
              ],
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

  if (action_id === 'approve_corporate_post') {
    const { data: article, error: fetchError } = await sbAdmin
      .from('articles')
      .select('*')
      .eq('id', articleId)
      .single()

    if (fetchError || !article) {
      console.error('Failed to fetch corporate post:', fetchError)
      return new Response('Article not found', { status: 404 })
    }

    const isScheduled = !!article.scheduled_date
    const wpStatus = isScheduled ? 'future' : 'publish'

    const { data: tx } = await sbAdmin
      .from('transactions')
      .select('metadata')
      .eq('metadata->>article_id', articleId)
      .single()

    let contactEmail = (tx?.metadata as Record<string, unknown> | null)?.contact_email as string | undefined
    const submitterName = (tx?.metadata as Record<string, unknown> | null)?.submitter_name as string | undefined

    // If article has an author_id, try to use their profile email instead
    if (article.author_id && !contactEmail) {
      const { data: profile } = await sbAdmin
        .from('profiles')
        .select('email')
        .eq('id', article.author_id)
        .single()
      if (profile?.email) {
        contactEmail = profile.email
      }
    }

    let wpPostId: number | null = null
    try {
      const wpResult = await publishCorporatePostToWordPress({
        title: article.title,
        content: article.content,
        excerpt: article.excerpt || '',
        featured_image: article.featured_image,
        status: wpStatus,
        brand_name: article.brand_name,
        tier: article.tier,
        contact_email: contactEmail,
        submitter_name: submitterName,
        ...(isScheduled ? { date_gmt: new Date(article.scheduled_date).toISOString() } : {}),
      })
      wpPostId = wpResult?.id ?? null
    } catch (wpError) {
      const msg = wpError instanceof Error ? wpError.message : 'WordPress publish failed'
      console.error('Failed to publish corporate post to WordPress:', msg)
      if (responseUrl) {
        fetch(responseUrl, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            replace_original: true,
            blocks: [{ type: 'section', text: { type: 'mrkdwn', text: `❌ *Corporate Post Publish Failed*\n${msg}\nArticle remains in pending_review.` } }],
          }),
        }).catch(() => {})
      }
      return Response.json({ ok: false, error: msg })
    }

    const { error: updateError } = await sbAdmin
      .from('articles')
      .update({
        status: 'published',
        payment_status: 'paid',
        updated_at: new Date().toISOString(),
      })
      .eq('id', articleId)

    if (updateError) {
      console.error('Failed to update corporate post:', updateError)
      if (responseUrl) {
        fetch(responseUrl, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            replace_original: true,
            blocks: [{ type: 'section', text: { type: 'mrkdwn', text: `❌ *Database Error*\n${updateError.message}\nID: \`${articleId}\`` } }],
          }),
        }).catch(() => {})
      }
      return Response.json({ ok: false, error: updateError.message })
    }

    if (contactEmail) {
      const { sendCorporatePostApproved } = await import('@/lib/api/email')
      sendCorporatePostApproved(contactEmail, article.brand_name || 'Corporate Post').catch(() => {})
    }

    const viewUrl = wpPostId ? `https://www.lawyard.org/wp-admin/post.php?post=${wpPostId}&action=edit` : null
    const buttonValue = wpPostId ? JSON.stringify({ a: articleId, w: wpPostId }) : articleId

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
                text: `✅ *Corporate Post Approved*\nApproved by ${userName}\n${isScheduled ? `Scheduled for ${new Date(article.scheduled_date).toLocaleDateString()}` : 'Published to lawyard.org'}\nID: \`${articleId}\``,
              },
            },
            {
              type: 'actions',
              elements: [
                ...(viewUrl ? [{ type: 'button', text: { type: 'plain_text', text: '👁 View on WordPress', emoji: true }, url: viewUrl, action_id: 'view_wp_post' }] : []),
                { type: 'button', text: { type: 'plain_text', text: '↩ Rescind', emoji: true }, style: 'danger', value: buttonValue, action_id: 'rescind_corporate_post' },
              ],
            },
          ],
        }),
      }).catch((e) => console.error('Failed to update Slack message:', e))
    }

    return Response.json({ ok: true })
  }

  if (action_id === 'deny_corporate_post') {
    const { error } = await sbAdmin
      .from('articles')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('id', articleId)

    if (error) {
      console.error('Failed to deny corporate post:', error)
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
                text: `❌ *Corporate Post Denied*\nDenied by ${userName}\nID: \`${articleId}\``,
              },
            },
          ],
        }),
      }).catch((e) => console.error('Failed to update Slack message:', e))
    }

    return Response.json({ ok: true })
  }

  /* ── Link button handlers (acknowledge to prevent 400 in Slack) ── */
  if (['view_article', 'open_article', 'view_corporate_post', 'open_corporate_post', 'view_podcast', 'open_podcast', 'open_editor_bp', 'view_wp_post'].includes(action_id)) {
    return Response.json({ ok: true })
  }

  if (action_id === 'rescind_article') {
    let wpPostId: number | null = null
    let rescindId = articleId
    try {
      const parsed = JSON.parse(articleId)
      wpPostId = parsed.w ?? null
      rescindId = parsed.a ?? articleId
    } catch {}

    try {
      if (wpPostId) await updateWordPressPostStatus(wpPostId, 'draft')
    } catch (wpError) {
      console.error('Failed to rescind WordPress post:', wpError)
    }

    const { error: updateError } = await sbAdmin
      .from('articles')
      .update({ status: 'pending_review', updated_at: new Date().toISOString() })
      .eq('id', rescindId)

    if (updateError) {
      console.error('Failed to rescind article:', updateError)
      return new Response('Database error', { status: 500 })
    }

    if (responseUrl) {
      await fetch(responseUrl, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          replace_original: true,
          blocks: [{ type: 'section', text: { type: 'mrkdwn', text: `↩ *Article Rescinded*\nRescinded by ${userName}\nPost moved back to pending_review.${wpPostId ? '\nWordPress post reverted to draft.' : ''}\nID: \`${rescindId}\`` } }],
        }),
      }).catch((e) => console.error('Failed to update Slack message:', e))
    }

    return Response.json({ ok: true })
  }

  if (action_id === 'rescind_corporate_post') {
    let wpPostId: number | null = null
    let rescindArticleId = articleId
    try {
      const parsed = JSON.parse(articleId)
      wpPostId = parsed.w ?? null
      rescindArticleId = parsed.a ?? articleId
    } catch {}

    try {
      if (wpPostId) await updateWordPressPostStatus(wpPostId, 'draft')
    } catch (wpError) {
      console.error('Failed to rescind WordPress post:', wpError)
    }

    const { error: updateError } = await sbAdmin
      .from('articles')
      .update({ status: 'pending_review', updated_at: new Date().toISOString() })
      .eq('id', rescindArticleId)

    if (updateError) {
      console.error('Failed to rescind article:', updateError)
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
                text: `↩ *Corporate Post Rescinded*\nRescinded by ${userName}\nPost moved back to pending_review.${wpPostId ? '\nWordPress post reverted to draft.' : ''}\nID: \`${rescindArticleId}\``,
              },
            },
          ],
        }),
      }).catch((e) => console.error('Failed to update Slack message:', e))
    }

    return Response.json({ ok: true })
  }

  if (action_id === 'approve_podcast') {
    const { data: podcast, error: fetchError } = await sbAdmin
      .from('podcasts')
      .select('*')
      .eq('id', articleId)
      .single()

    if (fetchError || !podcast) {
      console.error('Failed to fetch podcast:', fetchError)
      return new Response('Podcast not found', { status: 404 })
    }

    let wpPostId: number | null = null
    try {
      const wpResult = await publishPodcastToWordPress({
        title: podcast.title,
        description: podcast.description || '',
        media_url: podcast.media_url,
        media_type: podcast.media_type,
        status: 'publish',
        authorName: null,
      })
      wpPostId = wpResult?.id ?? null
    } catch (wpError) {
      console.error('Failed to publish podcast to WordPress:', wpError)
    }

    const { error: updateError } = await sbAdmin
      .from('podcasts')
      .update({ status: 'published', updated_at: new Date().toISOString() })
      .eq('id', articleId)

    if (updateError) {
      console.error('Failed to approve podcast:', updateError)
      return new Response('Database error', { status: 500 })
    }

    const viewUrl = wpPostId
      ? `https://www.lawyard.org/wp-admin/post.php?post=${wpPostId}&action=edit`
      : `https://directory.lawyard.org/knowledge/${podcast.slug}`

    if (responseUrl) {
      await fetch(responseUrl, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          replace_original: true,
          blocks: [
            { type: 'section', text: { type: 'mrkdwn', text: `✅ *Podcast Approved*\nApproved by ${userName}\nID: \`${articleId}\`` } },
            {
              type: 'actions',
              elements: [
                { type: 'button', text: { type: 'plain_text', text: '👁 View on WordPress', emoji: true }, url: viewUrl, action_id: 'view_wp_post' },
                { type: 'button', text: { type: 'plain_text', text: '↩ Rescind', emoji: true }, style: 'danger', value: articleId, action_id: 'rescind_podcast' },
              ],
            },
          ],
        }),
      }).catch((e) => console.error('Failed to update Slack message:', e))
    }

    return Response.json({ ok: true })
  }

  if (action_id === 'deny_podcast') {
    const { error } = await sbAdmin
      .from('podcasts')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('id', articleId)

    if (error) {
      console.error('Failed to deny podcast:', error)
      return new Response('Database error', { status: 500 })
    }

    if (responseUrl) {
      await fetch(responseUrl, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          replace_original: true,
          blocks: [{ type: 'section', text: { type: 'mrkdwn', text: `❌ *Podcast Denied*\nDenied by ${userName}\nID: \`${articleId}\`` } }],
        }),
      }).catch((e) => console.error('Failed to update Slack message:', e))
    }

    return Response.json({ ok: true })
  }

  if (action_id === 'rescind_podcast') {
    const { error } = await sbAdmin
      .from('podcasts')
      .update({ status: 'pending_review', updated_at: new Date().toISOString() })
      .eq('id', articleId)

    if (error) {
      console.error('Failed to rescind podcast:', error)
      return new Response('Database error', { status: 500 })
    }

    if (responseUrl) {
      await fetch(responseUrl, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          replace_original: true,
          blocks: [{ type: 'section', text: { type: 'mrkdwn', text: `↩ *Podcast Rescinded*\nRescinded by ${userName}\nPost moved back to pending_review.\nID: \`${articleId}\`` } }],
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
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    const stack = err instanceof Error ? err.stack : ''
    console.error('[Slack] Unhandled error:', message, stack)
    return new Response(`Internal error: ${message}`, { status: 500 })
  }
}
