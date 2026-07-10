import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

interface SendEmailPayload {
  user: {
    id: string
    email?: string
    phone?: string
    app_metadata?: Record<string, unknown>
    user_metadata?: Record<string, unknown>
  }
  email: {
    template: {
      subject: string
      content: string
      template_type: string
    }
    data: Record<string, string>
  }
}

const BREVO_SENDER_NAME = 'Lawyard'
const BREVO_SENDER_EMAIL = 'tobi@lawyard.org'

function verifySignature(payload: string, signature: string, secrets: string[]): boolean {
  return secrets.some((secret) => {
    const expected = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex')
    if (expected.length !== signature.length) return false
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  })
}

export async function POST(request: NextRequest) {
  const secrets = process.env.AUTH_SEND_EMAIL_HOOK_SECRET
  if (!secrets) {
    return NextResponse.json({ error: 'Hook not configured' }, { status: 500 })
  }
  const secretList = secrets.split(',').map((s) => s.trim()).filter(Boolean)

  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Brevo not configured' }, { status: 500 })
  }

  const rawBody = await request.text()

  const signature = request.headers.get('x-webhook-signature')
  if (!signature || !verifySignature(rawBody, signature, secretList)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let payload: SendEmailPayload
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { email: emailData, user } = payload
  const toEmail = user.email
  if (!toEmail || !emailData?.template?.subject || !emailData?.template?.content) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: BREVO_SENDER_NAME, email: BREVO_SENDER_EMAIL },
      to: [{ email: toEmail, name: user.user_metadata?.full_name as string || '' }],
      subject: emailData.template.subject,
      htmlContent: emailData.template.content,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('[auth/send-email] Brevo send failed:', err)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
