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
import { sendTransactionalEmail } from './brevo'

export async function sendCorporatePostReceived(email: string, brandName: string, tier: string) {
  return sendTransactionalEmail({
    to: [{ email }],
    subject: `Corporate Post Received — ${brandName}`,
    htmlContent: corporatePostReceived({ brandName, tier }),
  })
}

export async function sendPaymentConfirmation(email: string, brandName: string, tier: string) {
  return sendTransactionalEmail({
    to: [{ email }],
    subject: `Payment Confirmed — ${brandName}`,
    htmlContent: paymentConfirmation({ brandName, tier }),
  })
}

export async function sendCorporatePostApproved(email: string, brandName: string) {
  return sendTransactionalEmail({
    to: [{ email }],
    subject: `Corporate Post Published — ${brandName}`,
    htmlContent: corporatePostApproved({ brandName }),
  })
}

export async function sendCorporatePostRejected(email: string, brandName: string) {
  return sendTransactionalEmail({
    to: [{ email }],
    subject: `Corporate Post Update — ${brandName}`,
    htmlContent: corporatePostRejected({ brandName }),
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
  return sendTransactionalEmail({
    to: [{ email: params.lawyerEmail, name: params.lawyerName }],
    subject: `New Consultation Request — ${params.clientName}`,
    htmlContent: inquiryNotification(params),
  })
}

export async function sendNewsletter(emails: string[], subject: string, html: string) {
  const results = await Promise.allSettled(
    emails.map(email =>
      sendTransactionalEmail({
        to: [{ email }],
        subject,
        htmlContent: html,
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
  let attachment: { name: string; content: string } | undefined

  try {
    const { generateInvoicePdf } = await import('@/lib/api/invoice-pdf')
    const pdfBuffer = await generateInvoicePdf(params)
    attachment = {
      name: `invoice-${params.reference}.pdf`,
      content: pdfBuffer.toString('base64'),
    }
  } catch {
    // PDF generation failed — fall back to HTML-only email
  }

  return sendTransactionalEmail({
    to: [{ email }],
    subject: `Invoice — Corporate Post (${params.reference})`,
    htmlContent: corporatePostInvoice(params),
    ...(attachment ? { attachment: [attachment] } : {}),
  } as any)
}

export async function sendAdminNewSubmission(brandName: string, title: string) {
  return sendTransactionalEmail({
    to: [{ email: process.env.ADMIN_EMAIL || 'contact@lawyard.org' }],
    subject: `New Corporate Post Submission — ${brandName}`,
    htmlContent: adminNewSubmission({ brandName, title }),
  })
}

export async function sendShopOrderConfirmation(params: {
  email: string
  reference: string
  amount: number
  items: { id: string; title: string; quantity: number }[]
  billingDetails?: { firstName?: string } | null
}) {
  return sendTransactionalEmail({
    to: [{ email: params.email }],
    subject: `Order Confirmed — ${params.reference}`,
    htmlContent: shopOrderConfirmation({
      firstName: params.billingDetails?.firstName,
      reference: params.reference,
      amount: params.amount,
      items: params.items,
    }),
  })
}
