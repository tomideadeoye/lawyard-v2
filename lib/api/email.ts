import {
  corporatePostReceived,
  paymentConfirmation,
  corporatePostApproved,
  corporatePostRejected,
  inquiryNotification,
  corporatePostInvoice,
  shopOrderConfirmation,
  adminNewSubmission,
} from './email-layout'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM = 'Lawyard <tobi@lawyard.org>'

function getResend() {
  if (!RESEND_API_KEY) return null
  const { Resend } = require('resend') as typeof import('resend')
  return new Resend(RESEND_API_KEY)
}

export async function sendCorporatePostReceived(email: string, brandName: string, tier: string) {
  const resend = getResend()
  if (!resend) return
  return resend.emails.send({
    from: FROM,
    to: email,
    subject: `Corporate Post Received — ${brandName}`,
    html: corporatePostReceived({ brandName, tier }),
  })
}

export async function sendPaymentConfirmation(email: string, brandName: string, tier: string) {
  const resend = getResend()
  if (!resend) return
  return resend.emails.send({
    from: FROM,
    to: email,
    subject: `Payment Confirmed — ${brandName}`,
    html: paymentConfirmation({ brandName, tier }),
  })
}

export async function sendCorporatePostApproved(email: string, brandName: string) {
  const resend = getResend()
  if (!resend) return
  return resend.emails.send({
    from: FROM,
    to: email,
    subject: `Corporate Post Published — ${brandName}`,
    html: corporatePostApproved({ brandName }),
  })
}

export async function sendCorporatePostRejected(email: string, brandName: string) {
  const resend = getResend()
  if (!resend) return
  return resend.emails.send({
    from: FROM,
    to: email,
    subject: `Corporate Post Update — ${brandName}`,
    html: corporatePostRejected({ brandName }),
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
    html: inquiryNotification(params),
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

export async function sendCorporatePostInvoice(email: string, params: {
  brandName: string
  contactName: string
  tierName: string
  amount: number
  reference: string
}) {
  const resend = getResend()
  if (!resend) return

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
    subject: `Invoice — Corporate Post (${params.reference})`,
    attachments: pdfAttachment ? [pdfAttachment] : undefined,
    html: corporatePostInvoice(params),
  })
}

export async function sendAdminNewSubmission(brandName: string, title: string) {
  const resend = getResend()
  if (!resend) return
  return resend.emails.send({
    from: FROM,
    to: process.env.ADMIN_EMAIL || 'contact@lawyard.org',
    subject: `New Corporate Post Submission — ${brandName}`,
    html: adminNewSubmission({ brandName, title }),
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

  return resend.emails.send({
    from: FROM,
    to: params.email,
    subject: `Order Confirmed — ${params.reference}`,
    html: shopOrderConfirmation({
      firstName: params.billingDetails?.firstName,
      reference: params.reference,
      amount: params.amount,
      items: params.items,
    }),
  })
}
