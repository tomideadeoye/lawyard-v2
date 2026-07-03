const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM = 'Lawyard <noreply@lawyard.org>'

function getResend() {
  if (!RESEND_API_KEY) return null
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

export async function sendInquiryNotification(params: {
  lawyerEmail: string
  lawyerName: string
  clientName: string
  clientEmail: string
  clientPhone?: string
  message: string
}) {
  const resend = getResend()
  if (!resend) return
  return resend.emails.send({
    from: FROM,
    to: params.lawyerEmail,
    subject: `New Consultation Request — ${params.clientName}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background: #a77c5c; padding: 24px 32px;">
          <h1 style="color: #fff; margin: 0; font-size: 20px; font-weight: 800;">New Consultation Request</h1>
        </div>
        <div style="padding: 24px 32px; font-size: 14px; color: #1e293b;">
          <p>Hi <strong>${params.lawyerName}</strong>,</p>
          <p>Someone has requested a consultation through your Lawyard profile.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr><td style="padding: 6px 0; color: #64748B; width: 100px;">Name</td><td style="padding: 6px 0; font-weight: 600;">${params.clientName}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748B;">Email</td><td style="padding: 6px 0; font-weight: 600;">${params.clientEmail}</td></tr>
            ${params.clientPhone ? `<tr><td style="padding: 6px 0; color: #64748B;">Phone</td><td style="padding: 6px 0; font-weight: 600;">${params.clientPhone}</td></tr>` : ''}
          </table>
          <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0 0 8px; font-weight: 600; font-size: 13px;">Message</p>
            <p style="margin: 0; color: #475569; font-size: 13px; line-height: 1.6;">${params.message}</p>
          </div>
          <p style="color: #94A3B8; font-size: 12px; margin-top: 24px;">
            Respond to the client directly at <a href="mailto:${params.clientEmail}" style="color: #a77c5c;">${params.clientEmail}</a>
          </p>
        </div>
      </div>
    `,
  })
}

export async function sendNewsletter(emails: string[], subject: string, html: string) {
  const resend = getResend()
  if (!resend) return { error: 'Resend not configured' }

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

export async function sendBrandPressInvoice(email: string, params: {
  brandName: string
  contactName: string
  tierName: string
  amount: number
  reference: string
}) {
  const resend = getResend()
  if (!resend) return

  const issuedDate = new Date().toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
  const fmtAmount = `₦${params.amount.toLocaleString()}`

  let pdfAttachment: { filename: string; content: string } | undefined

  try {
    const { generateInvoicePdf } = await import('@/lib/api/invoice-pdf')
    const pdfBuffer = await generateInvoicePdf(params)
    pdfAttachment = {
      filename: `invoice-${params.reference}.pdf`,
      content: pdfBuffer.toString('base64'),
    }
  } catch {
    // PDF generation failed — fall back to HTML-only email
  }

  return resend.emails.send({
    from: FROM,
    to: email,
    subject: `Invoice — Brand Press (${params.reference})`,
    attachments: pdfAttachment ? [pdfAttachment] : undefined,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background: #a77c5c; padding: 32px 36px;">
          <h1 style="color: #fff; margin: 0; font-size: 22px; font-weight: 800;">INVOICE</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 13px;">${params.reference}</p>
        </div>

        <div style="padding: 32px 36px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; color: #64748B; width: 100px;">Issued</td>
              <td style="padding: 6px 0; font-weight: 600;">${issuedDate}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748B;">Bill To</td>
              <td style="padding: 6px 0; font-weight: 600;">${params.contactName} (${params.brandName})</td>
            </tr>
          </table>

          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />

          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <th style="text-align: left; padding: 10px 0; color: #64748B; font-weight: 600; font-size: 12px; text-transform: uppercase;">Description</th>
                <th style="text-align: right; padding: 10px 0; color: #64748B; font-weight: 600; font-size: 12px; text-transform: uppercase;">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 12px 0;">Brand Press — ${params.tierName} Tier</td>
                <td style="padding: 12px 0; text-align: right; font-weight: 600;">${fmtAmount}</td>
              </tr>
            </tbody>
          </table>

          <hr style="border: none; border-top: 2px solid #1e293b; margin: 12px 0;" />

          <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: 800; padding: 8px 0;">
            <span>Total Due</span>
            <span>${fmtAmount}</span>
          </div>

          <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin-top: 24px; font-size: 13px; color: #475569;">
            <p style="margin: 0 0 8px; font-weight: 600;">Payment Instructions</p>
            <p style="margin: 0 0 4px;">Bank transfer to:</p>
            <p style="margin: 0; font-family: monospace; font-weight: 600;">Lawyard Publishing Ltd<br/>GTBank · 0123456789</p>
            <p style="margin: 12px 0 0; font-size: 12px; color: #94A3B8;">Use reference <strong>${params.reference}</strong> as payment narration.</p>
          </div>

          <p style="color: #94A3B8; font-size: 12px; margin-top: 24px; text-align: center;">
            Lawyard.org — Legal news and insights for Africa
          </p>
        </div>
      </div>
    `,
  })
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

export async function sendShopOrderConfirmation(params: {
  email: string
  reference: string
  amount: number
  items: { id: string; title: string; quantity: number }[]
  billingDetails?: { firstName?: string } | null
}) {
  const resend = getResend()
  if (!resend) return

  const { getSiteUrl } = await import('@/lib/utils/payment')
  const date = new Date().toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
  const fmtAmount = `₦${params.amount.toLocaleString()}`
  const itemsHtml = params.items.map(item =>
    `<tr>
      <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-size: 13px;">${item.title}</td>
      <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: right;">₦${(item.quantity * 500).toLocaleString()}</td>
    </tr>`
  ).join('')

  return resend.emails.send({
    from: FROM,
    to: params.email,
    subject: `Order Confirmed — ${params.reference}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background: #a77c5c; padding: 32px 36px;">
          <h1 style="color: #fff; margin: 0; font-size: 22px; font-weight: 800;">Order Confirmed</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 13px;">${params.reference}</p>
        </div>

        <div style="padding: 32px 36px;">
          <p style="font-size: 14px; margin: 0 0 20px;">
            ${params.billingDetails?.firstName ? `Hi ${params.billingDetails.firstName},` : 'Thanks for your purchase!'}
          </p>
          <p style="font-size: 13px; color: #475569; margin: 0 0 20px;">
            Your payment of <strong>${fmtAmount}</strong> was successful. Here's a summary of your order:
          </p>

          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <thead>
              <tr style="background: #f8fafc;">
                <th style="text-align: left; padding: 10px; font-weight: 600; font-size: 11px; text-transform: uppercase; color: #64748B;">Item</th>
                <th style="text-align: center; padding: 10px; font-weight: 600; font-size: 11px; text-transform: uppercase; color: #64748B;">Qty</th>
                <th style="text-align: right; padding: 10px; font-weight: 600; font-size: 11px; text-transform: uppercase; color: #64748B;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="text-align: right; font-size: 16px; font-weight: 800; padding: 12px 0 0; margin-top: 8px; border-top: 2px solid #1e293b;">
            Total: ${fmtAmount}
          </div>

          <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin-top: 24px; font-size: 13px; color: #475569;">
            <p style="margin: 0 0 8px; font-weight: 600;">Download Your Legislations</p>
            <p style="margin: 0;">Visit your <a href="${getSiteUrl()}/dashboard/orders" style="color: #a77c5c; font-weight: 600;">Orders Dashboard</a> to download the PDF files for each purchased legislation.</p>
          </div>

          <p style="color: #94A3B8; font-size: 12px; margin-top: 24px; text-align: center;">
            Lawyard.org — Legal news and insights for Africa
          </p>
        </div>
      </div>
    `,
  })
}
