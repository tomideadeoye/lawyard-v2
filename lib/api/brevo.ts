const BREVO_API_KEY = process.env.BREVO_API_KEY
const FROM_NAME = 'Lawyard'
const FROM_EMAIL = 'noreply@lawyard.org'

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

export async function sendSignupVerification(params: {
  email: string
  name: string
}) {
  return sendTransactionalEmail({
    to: [{ email: params.email, name: params.name }],
    subject: 'Welcome to Lawyard — Verify Your Email',
    htmlContent: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background: #a77c5c; padding: 32px 36px;">
          <h1 style="color: #fff; margin: 0; font-size: 22px; font-weight: 800;">Welcome to Lawyard</h1>
        </div>
        <div style="padding: 32px 36px;">
          <p style="font-size: 15px; margin: 0 0 16px;">Hi <strong>${params.name}</strong>,</p>
          <p style="font-size: 14px; color: #475569; margin: 0 0 20px; line-height: 1.6;">
            Your Lawyard account has been created. We've sent a confirmation link to <strong>${params.email}</strong> — 
            click it to verify your email and activate your account.
          </p>
          <p style="font-size: 14px; color: #475569; margin: 0 0 8px; line-height: 1.6;">
            Once verified, you can:
          </p>
          <ul style="font-size: 14px; color: #475569; line-height: 1.8; padding-left: 20px; margin: 0 0 24px;">
            <li>Browse legal professionals in our directory</li>
            <li>Manage your professional profile</li>
            <li>Connect with clients and legal experts</li>
          </ul>
          <p style="font-size: 13px; color: #94a3b8; margin: 24px 0 0; padding-top: 24px; border-top: 1px solid #e2e8f0;">
            Didn't request this? Ignore this email.
          </p>
        </div>
      </div>
    `,
  })
}
