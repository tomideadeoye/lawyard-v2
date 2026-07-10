import { welcomeEmail } from './email-layout'

const BREVO_API_KEY = process.env.BREVO_API_KEY
const FROM_NAME = 'Lawyard'
const FROM_EMAIL = 'tobi@lawyard.org'

function apiHeaders() {
  return {
    'api-key': BREVO_API_KEY!,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
}

export async function sendTransactionalEmail(params: {
  to: { email: string; name?: string }[]
  subject: string
  htmlContent: string
}) {
  if (!BREVO_API_KEY) return { error: 'Brevo not configured' }

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify({
      sender: { name: FROM_NAME, email: FROM_EMAIL },
      to: params.to,
      subject: params.subject,
      htmlContent: params.htmlContent,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('[Brevo] Email failed:', err)
    return { error: err }
  }

  return await res.json()
}

export async function addContact(params: {
  email: string
  name?: string
  listId: number
  attributes?: Record<string, string>
}) {
  if (!BREVO_API_KEY) return { error: 'Brevo not configured' }

  const res = await fetch('https://api.brevo.com/v3/contacts', {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify({
      email: params.email,
      attributes: {
        FULLNAME: params.name || '',
        ...params.attributes,
      },
      listIds: [params.listId],
      updateEnabled: true,
    }),
  })

  if (!res.ok && res.status !== 409) {
    const err = await res.text()
    console.error('[Brevo] Add contact failed:', err)
    return { error: err }
  }

  return { success: true }
}

export async function sendWelcomeEmail(params: {
  email: string
  name: string
}) {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/directory/dashboard`

  return sendTransactionalEmail({
    to: [{ email: params.email, name: params.name }],
    subject: 'Welcome to Lawyard — Your Account is Ready',
    htmlContent: welcomeEmail({ name: params.name, dashboardUrl }),
  })
}
