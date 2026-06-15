# Paystack Payment Integration

## Architecture

Paystack is integrated via **direct REST API calls** (no npm SDK). Two copies exist for historical reasons:

| File | Purpose |
|------|---------|
| `lib/api/paystack.ts` | Used by brand-press, shop, checkout |
| `lib/directory/paystack.ts` | Used by directory marketplace |

Both expose: `initializeTransaction()` and `verifyTransaction()`.

## Core Functions

### `initializeTransaction(params)`
```typescript
{
  email: string
  amount: number          // in Naira (auto-multiplied by 100 to kobo internally)
  reference: string
  callback_url: string
  metadata: Record<string, any>
}
// Returns: { status, message, data: { authorization_url, access_code, reference } }
```

### `verifyTransaction(reference)`
```typescript
// Returns: { status, data: { status: 'success'|'failed', reference, amount, metadata, customer: { email } } }
```

## Payment Flow Patterns

### 1. Inline Popup (Brand Press — no server init)

**Preferred pattern** — avoids "Duplicate Transaction Reference" entirely:

```
submitBrandPress() server action
  → creates article row (payment_status: 'pending')
  → creates transaction row (status: 'pending')
  → NO Paystack API call
  → returns { reference, email, amount } to client
  → client opens PaystackPop.setup({ key, email, amount: amt * 100, ref, callback, onClose })
  → Paystack SDK handles initialization internally
  → user pays in iframe
  → callback redirects to /brand-press/payment?reference=X
  → verifies via verifyTransaction()
  → updates: transactions.status = 'success', articles.payment_status = 'paid'
  → sends confirmation email
```

### 2. Redirect Flow (Shop — server init)

```
POST /checkout → initializeTransaction()
  → creates orders + transaction record
  → returns authorization_url
  → redirects user to Paystack
  → callback at /shop/payment?reference=XX
  → verifies + updates order status
```

### 3. Directory Listing Payment

```
PaystackButton component in directory/pricing/
  → posts to createPayment action
  → redirects to authorization_url
  → webhook handles at /directory/api/webhooks/paystack/route.ts
```

## Critical Pattern: Inline Popup

### DO (No server init)
```typescript
// 1. Server: create records, NO Paystack API call
// 2. Returns { reference, email, amount }

// 3. Client: let SDK initialize
const handler = window.PaystackPop.setup({
  key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
  email: result.email,
  amount: result.amount * 100,  // convert to kobo
  ref: result.reference,
  callback: () => { window.location.href = `/brand-press/payment?reference=${ref}` },
  onClose: () => { window.location.href = '/brand-press/submit?cancelled=true' },
})
handler.openIframe()
```

### DON'T
```typescript
// ❌ Passing access_code with ref causes Duplicate Transaction Reference
PaystackPop.setup({ key, access_code: result.access_code, ref: result.reference })
// ❌ Server-side init + access_code-only popup — "valid email" errors
PaystackPop.setup({ key, access_code: result.access_code })
```

**Root cause**: Server-side `initializeTransaction()` reserves the reference. Passing same `ref` (or `access_code` pointing to it) to the popup triggers duplicate detection. **Fix**: Skip server init, let SDK handle it.

## Invoice Email with PDF

When payment method is `invoice`, the server generates a PDF attachment:

```typescript
import { generateInvoicePdf } from '@/lib/api/invoice-pdf'
const pdfBuffer = await generateInvoicePdf({ contactName, brandName, tierName, amount, reference })
// Attach to Resend email
resend.emails.send({
  attachments: [{ filename: `invoice-${reference}.pdf`, content: pdfBuffer.toString('base64') }],
  html: '...',
})
```

Uses `@react-pdf/renderer` — works on Vercel serverless. Falls back to HTML-only if PDF generation fails.

## Webhook

### Brand Press Webhook

`/app/api/webhooks/paystack/route.ts`:
- HMAC-SHA512 signature verification
- Handles `charge.success` for `metadata.type === 'brand_press'`
- Idempotent: skips already-processed transactions
- Updates DB + sends confirmation email
- Configure at Paystack Dashboard → Webhooks:

### Directory Webhook

`/directory/api/webhooks/paystack/route.ts` — handles directory listing payments.

## Reference Generation

```typescript
// Brand press — collision-proof
function generateReference(): string {
  const ts = Date.now().toString(36).toUpperCase()
  const rand = crypto.randomUUID().slice(0, 8).toUpperCase()
  return `BP-${ts}-${rand}`
}
```

## Env Variables

```
PAYSTACK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_...
NEXT_PUBLIC_SITE_URL=https://lawyard.org
```

## Tips

- Always `.catch(() => {})` on email sends after payment (non-critical)
- Amount stored in DB in Naira; convert to kobo at Paystack boundary (`* 100`)
- Inline popup without server init: pass `{ key, email, amount, ref }` only
- Transaction metadata should include all context needed for post-payment processing
- Webhook is safety net for missed redirects — callback is primary flow
- PDF invoice generation is dynamically imported inside the email function to avoid loading `@react-pdf/renderer` on non-invoice requests
