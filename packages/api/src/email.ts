const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM = 'Lawyard <noreply@lawyard.org>'

function getResend() {
  if (!RESEND_API_KEY) return null
  // dynamic import to avoid bundling Resend where it's not used
  const { Resend } = require('resend') as typeof import('resend')
  return new Resend(RESEND_API_KEY)
}

export async function sendBrandPressReceived(email: string, brandName: string, tier: string) {
  const resend = getResend()
  if (!resend) return
  return resend.emails.send({
    from: FROM,
    to: email,
    subject: `Brand Press Received — ${brandName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="font-size: 24px; margin-bottom: 8px;">Submission Received</h1>
        <p>Your Brand Press for <strong>${brandName}</strong> (${tier} tier) has been received.</p>
        <p>Once payment is confirmed, we will review your submission.</p>
        <p style="color: #64748B; font-size: 14px; margin-top: 24px;">— Lawyard Team</p>
      </div>
    `,
  })
}

export async function sendPaymentConfirmation(email: string, brandName: string, tier: string) {
  const resend = getResend()
  if (!resend) return
  return resend.emails.send({
    from: FROM,
    to: email,
    subject: `Payment Confirmed — ${brandName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="font-size: 24px; margin-bottom: 8px;">Payment Confirmed</h1>
        <p>Payment for your <strong>${tier}</strong> Brand Press on <strong>${brandName}</strong> has been confirmed.</p>
        <p>Your submission is now under review. We will notify you once it's published.</p>
        <p style="color: #64748B; font-size: 14px; margin-top: 24px;">— Lawyard Team</p>
      </div>
    `,
  })
}

export async function sendBrandPressApproved(email: string, brandName: string) {
  const resend = getResend()
  if (!resend) return
  return resend.emails.send({
    from: FROM,
    to: email,
    subject: `Brand Press Published — ${brandName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="font-size: 24px; margin-bottom: 8px;">Published!</h1>
        <p>Your Brand Press on <strong>${brandName}</strong> has been published on lawyard.org.</p>
        <p style="color: #64748B; font-size: 14px; margin-top: 24px;">— Lawyard Team</p>
      </div>
    `,
  })
}

export async function sendBrandPressRejected(email: string, brandName: string) {
  const resend = getResend()
  if (!resend) return
  return resend.emails.send({
    from: FROM,
    to: email,
    subject: `Brand Press Update — ${brandName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="font-size: 24px; margin-bottom: 8px;">Submission Update</h1>
        <p>Your Brand Press submission for <strong>${brandName}</strong> requires revisions.</p>
        <p>Please contact us at contact@lawyard.org for more details.</p>
        <p style="color: #64748B; font-size: 14px; margin-top: 24px;">— Lawyard Team</p>
      </div>
    `,
  })
}

export async function sendNewsletter(emails: string[], subject: string, html: string) {
  const resend = getResend()
  if (!resend) return { error: 'Resend not configured' }

  // Resend sends in batches, so we send individually for now
  const results = await Promise.allSettled(
    emails.map(email =>
      resend.emails.send({
        from: FROM,
        to: email,
        subject,
        html,
      })
    )
  )

  const sent = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length
  return { sent, failed }
}

export async function sendAdminNewSubmission(brandName: string, title: string) {
  const resend = getResend()
  if (!resend) return
  return resend.emails.send({
    from: FROM,
    to: process.env.ADMIN_EMAIL || 'contact@lawyard.org',
    subject: `New Brand Press Submission — ${brandName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="font-size: 24px; margin-bottom: 8px;">New Submission</h1>
        <p><strong>Brand:</strong> ${brandName}</p>
        <p><strong>Title:</strong> ${title}</p>
        <p>Review it in the admin dashboard.</p>
        <p style="color: #64748B; font-size: 14px; margin-top: 24px;">— Lawyard Bot</p>
      </div>
    `,
  })
}
