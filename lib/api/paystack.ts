const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!
const PAYSTACK_API = 'https://api.paystack.co'

export interface PaystackInitResponse {
  status: boolean
  message: string
  data?: {
    authorization_url: string
    access_code: string
    reference: string
  }
}

export interface PaystackVerifyResponse {
  status: boolean
  message: string
  data?: {
    status: string
    reference: string
    amount: number
    currency: string
    paid_at: string
    metadata: any
    customer?: { email?: string }
  }
}

export async function initializeTransaction(params: {
  email: string
  amount: number
  reference: string
  callback_url: string
  metadata: Record<string, any>
}): Promise<PaystackInitResponse> {
  const res = await fetch(`${PAYSTACK_API}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: params.email,
      amount: params.amount * 100,
      reference: params.reference,
      metadata: params.metadata,
      callback_url: params.callback_url,
    }),
  })
  return res.json()
}

export async function verifyTransaction(reference: string): Promise<PaystackVerifyResponse> {
  const res = await fetch(`${PAYSTACK_API}/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
  })
  return res.json()
}
