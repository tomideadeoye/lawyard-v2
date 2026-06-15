# Paystack Payment Integration

## Architecture

Paystack is integrated via **direct REST API calls** (no npm SDK). Two copies exist for historical reasons:

| File | Purpose |
|------|---------|
| `lib/api/paystack.ts` | Used by brand-press, shop, checkout |
| `lib/directory/paystack.ts` | Used by directory marketplace |

Both expose the same two functions.

## Core Functions

### `initializeTransaction(params)`
```typescript
{
  email: string
  amount: number          // in Naira (auto-multiplied by 100 to kobo internally)
  reference: string       // unique, e.g. BP-UUID8
  callback_url: string    // where Paystack redirects after payment
  metadata: Record<string, any>
}
// Returns: { status, message, data: { authorization_url, access_code, reference } }
```
- POST to `https://api.paystack.co/transaction/initialize`
- Auth: `Bearer ${PAYSTACK_SECRET_KEY}` from env

### `verifyTransaction(reference)`
```typescript
// Returns: { status, data: { status: 'success'|'failed', reference, amount, metadata } }
```
- GET to `https://api.paystack.co/transaction/verify/${reference}`

## Payment Flow Patterns

### 1. Standard Card Payment (Brand Press)
```
submitBrandPress() server action
  → creates article row (payment_status: 'pending', status: 'pending_review')
  → creates transaction row (status: 'pending')
  → calls initializeTransaction()
  → returns authorization_url to client
  → client does window.location.href = authorization_url
  → user pays on Paystack checkout
  → Paystack redirects to /brand-press/payment?reference=BP-XXXX
  → payment page verifies via verifyTransaction()
  → updates: transactions.status = 'success', articles.payment_status = 'paid'
  → sends confirmation email
```

### 2. Shop Payment
```
POST /checkout → createPayment()
  → creates orders + transactions
  → initializes Paystack
  → redirects to Paystack
  → callback at /shop/payment?reference=XX
  → verifies + updates order status
```

### 3. Directory Listing Payment
```
PaystackButton component in directory/pricing/
  → posts to createPayment action
  → redirects to Paystack
  → webhook handles: /directory/api/webhooks/paystack/route.ts
```

## Reference Generation

```typescript
// Brand press
function generateReference(): string {
  return `BP-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
}

// Shop uses order ID pattern
```

## Webhook

`/directory/api/webhooks/paystack/route.ts` — handles Paystack webhook events for directory listings.

## Env Variables

```
PAYSTACK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_SITE_URL=https://lawyard.org
```

## Tips
- Always `.catch(() => {})` on email sends after payment (non-critical)
- Amount stored in DB in Naira (kobo conversion only at Paystack API boundary)
- Use `callback_url` with reference query param for idempotent verification
- Transaction metadata should include all context needed for post-payment processing
