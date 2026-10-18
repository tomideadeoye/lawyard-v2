import { NextRequest, NextResponse } from 'next/server'
import { sendTransactionalEmail } from '@/lib/api/brevo'

const SITE_URL = 'https://directory.lawyard.org'
const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jayjejqjswxtksvwoqxp.supabase.co').replace(/\/$/, '')

function buildConfirmationUrl(emailData: Record<string, any>): string {
  const tokenHash = emailData.token_hash
  const type = emailData.email_action_type || ''
  const redirectTo = emailData.redirect_to || SITE_URL
  if (!tokenHash) return ''
  return `${SUPABASE_URL}/auth/v1/verify?token=${tokenHash}&type=${type}&redirect_to=${encodeURIComponent(redirectTo)}`
}

function buildEmail(actionType: string, confirmationUrl: string, _siteUrl: string): { subject: string; html: string } {
  const titles: Record<string, string> = {
    signup: 'Confirm your account',
    invite: 'You\'ve been invited',
    recovery: 'Reset your password',
    magiclink: 'Your magic link',
    email_change: 'Confirm your email change',
  }
  const subject = titles[actionType] || 'Action required'
  const actionLabels: Record<string, string> = {
    signup: 'Confirm Account',
    invite: 'Accept Invite',
    recovery: 'Reset Password',
    magiclink: 'Sign In',
    email_change: 'Confirm Email',
  }
  const label = actionLabels[actionType] || 'Continue'

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;"><tr><td align="center" style="padding:40px 16px;">
<table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">
<tr><td style="padding:0 0 24px;text-align:center;">
<img src="https://www.lawyard.org/wp-content/uploads/2026/07/logo-blue.png" alt="Lawyard" width="140" style="display:inline-block;border:0;" />
</td></tr>
<tr><td style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr><td style="background:#a77c5c;padding:28px 36px;">
<h1 style="color:#fff;margin:0;font-size:20px;font-weight:800;">${subject}</h1>
</td></tr>
<tr><td style="padding:32px 36px;font-size:14px;color:#1e293b;line-height:1.6;">
 <p style="font-size:15px;color:#475569;margin:0 0 24px;">A verification link has been sent to your email. Click the button below to continue.</p>
<div style="text-align:center;margin:28px 0;">
<a href="${confirmationUrl}" style="display:inline-block;background:#a77c5c;color:#fff;padding:14px 36px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:700;">${label}</a>
</div>
<p style="font-size:12px;color:#94a3b8;padding-top:20px;border-top:1px solid #e2e8f0;">Didn't request this? Ignore this email.</p>
</td></tr>
</table></td></tr>
<tr><td style="padding:24px 16px 0;text-align:center;">
<p style="font-size:12px;color:#94a3b8;margin:16px 0 0;">Lawyard &mdash; Legal news, insights, and directory for Africa.<br/><a href="${SITE_URL}" style="color:#a77c5c;text-decoration:none;font-weight:600;">lawyard.org</a></p>
</td></tr>
</table></td></tr></table></body></html>`

  return { subject, html }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const userEmail = payload?.user?.email
    const emailData = payload?.email_data

    if (!userEmail || !emailData) {
      return NextResponse.json({ error: 'Missing user.email or email_data' }, { status: 400 })
    }

    const actionType = emailData.email_action_type || 'signup'
    const confirmationUrl = buildConfirmationUrl(emailData)

    if (!confirmationUrl) {
      console.error('[AuthHook] No token_hash available for', actionType)
      return NextResponse.json({ sendEmail: false })
    }

    const { subject, html } = buildEmail(actionType, confirmationUrl, emailData.site_url || SITE_URL)
    if (!html) {
      console.error('[AuthHook] Unknown action type:', actionType)
      return NextResponse.json({ sendEmail: false })
    }

    const result = await sendTransactionalEmail({
      to: [{ email: userEmail }],
      subject,
      htmlContent: html,
      trackClicks: false,
    })

    if (result.error) {
      console.error('[AuthHook] Brevo error:', result.error)
    }

    return NextResponse.json({ sendEmail: false })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[AuthHook] error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
