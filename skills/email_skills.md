# Email Infrastructure

## Provider

**Resend** (`resend` npm package). API key in `RESEND_API_KEY` env var. Lazy-imported to avoid bundling in client components.

## Core Pattern

```typescript
// lib/api/email.ts
const FROM = 'Lawyard <noreply@lawyard.org>'

function getResend() {
  if (!RESEND_API_KEY) return null
  const { Resend } = require('resend') as typeof import('resend')
  return new Resend(RESEND_API_KEY)
}
```

All send functions follow this contract:
- Call `getResend()` — returns `null` if key missing (no-op in dev)
- Build HTML inline (no template engine)
- Fire-and-forget with `.catch(() => {})` — emails never block the response

## Email Functions

All in `lib/api/email.ts`:

| Function | Trigger | Recipient |
|----------|---------|-----------|
| `sendBrandPressReceived(email, brandName, tier)` | After form submit + record creation | Customer |
| `sendPaymentConfirmation(email, brandName, tier)` | After successful Paystack verification | Customer |
| `sendBrandPressApproved(email, brandName)` | Admin approves article | Customer |
| `sendBrandPressRejected(email, brandName)` | Admin rejects/requests revisions | Customer |
| `sendAdminNewSubmission(brandName, title)` | New brand press submission | Admin (`ADMIN_EMAIL`) |
| `sendBrandPressInvoice(email, {brandName, contactName, tierName, amount, reference})` | Invoice payment method chosen | Customer |
| `sendNewsletter(emails[], subject, html)` | Bulk newsletter send | Subscriber list |
| `sendShopOrderConfirmation({email, reference, amount, items, billingDetails})` | Shop payment verified | Customer |

## Invoice PDF Pattern

```typescript
// Inside sendBrandPressInvoice()
try {
  const { generateInvoicePdf } = await import('@/lib/api/invoice-pdf')
  const pdfBuffer = await generateInvoicePdf(params)
  // attach as base64 to Resend email
} catch {
  // PDF generation failed — fall back to HTML-only email
}
```

Uses `@react-pdf/renderer` via dynamic `import()` to avoid bundling it on non-invoice requests. The PDF component lives in `lib/api/invoice-pdf.tsx`. Falls back to HTML-only on error (e.g., missing fonts in serverless).

## Webhook Pattern

`app/api/webhooks/paystack/route.ts` handles two payment types via a dispatcher:

```
POST /api/webhooks/paystack
  → HMAC-SHA512 signature verification
  → Parse event, filter charge.success only
  → Verify with Paystack API
  → Idempotency check (skip if status already 'success')
  → Dispatch by metadata.type:
      'brand_press'   → handleBrandPress()
      'shop_purchase' → handleShopPurchase()
```

HMAC verification:
```typescript
function verifySignature(body: string, signature: string): boolean {
  const expected = crypto.createHmac('sha512', SECRET_KEY).update(body).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}
```

### handleBrandPress()
- Updates `transactions.status = 'success'`
- Updates `articles.payment_status = 'paid'`, `articles.status = 'pending_review'`
- Sends `sendPaymentConfirmation()` fire-and-forget

### handleShopPurchase()
- Fetches transaction metadata (items, billing details)
- Updates `transactions.status = 'success'`
- Sends `sendShopOrderConfirmation()` fire-and-forget

## Callback Page Pattern

The callback page is a **server component** that:
1. Verifies the transaction via Paystack API
2. Updates the DB
3. Sends the confirmation email (fire-and-forget)
4. Renders a receipt UI

Example — shop payment callback at `app/(main)/shop/payment/page.tsx`:
```typescript
const verify = await verifyTransaction(reference)
if (paid) {
  // Update DB
  await supabase.from('transactions').update({ status: 'success' }).eq('reference', reference)
  // Send email (fire-and-forget)
  sendShopOrderConfirmation({ email, reference, amount, items, billingDetails }).catch(() => {})
}
```

## sendShopOrderConfirmation

The shop order confirmation uses a branded HTML template with:
- Brown header (`#a77c5c`) with reference number
- Greeting using `billingDetails.firstName`
- Itemised table (title, quantity, amount)
- Total line with heavy border
- Dashboard link for PDF downloads: `getSiteUrl() + '/dashboard/orders'`
- Lawyard footer

Uses dynamic import of `getSiteUrl()` from `lib/utils/payment` to avoid circular dependencies.

## Fire-and-Forget Convention

```typescript
sendPaymentConfirmation(email, name, tier).catch(() => {})
sendShopOrderConfirmation(params).catch(() => {})
```

Emails are non-critical — the primary flow (DB update, response to client) must never depend on email success. The `.catch(() => {})` silences unhandled rejections in the async background.

## Dashboard Link Pattern

Transactional emails link to `/dashboard/orders` for PDF downloads. The actual PDF download infrastructure (generation, storage, streaming) is not yet built — links use `href="#"` on the receipt page.
