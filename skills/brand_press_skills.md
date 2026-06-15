# Brand Press Submission System

Full paid content submission flow with tiered pricing, rich content editing, and Paystack inline popup payments. Guest flow (no auth), comparable to Techpoint Africa.

## Routes

| Path | File | Purpose |
|------|------|---------|
| `/brand-press` | `app/(main)/brand-press/page.tsx` | Published articles listing with "Submit Now" CTA |
| `/brand-press/submit` | `app/(main)/brand-press/submit/page.tsx` | Multi-section submission form with Paystack popup |
| `/brand-press/payment` | `app/(main)/brand-press/payment/page.tsx` | Paystack callback handler |
| `/brand-press/success` | `app/(main)/brand-press/success/page.tsx` | Post-submit confirmation |

## Architecture

### Server Actions

```
app/actions/
  brand-press.ts          — submitBrandPress(): Zod validation, service-role DB writes
  validate-coupon.ts      — validateCoupon(): coupon code map lookup, returns discount
```

### API Routes

```
app/api/
  upload/brand-press/route.ts          — file upload to Supabase Storage (no auth, random UUID paths)
  webhooks/paystack/route.ts           — Paystack webhook handler (HMAC verification, charge.success)
```

### Components

```
components/
  PricingCard.tsx                        — Tier selection card with features, recommended badge
  brand-press/
    rich-text-editor.tsx                 — Tiptap editor wrapper (loaded via next/dynamic ssr:false)
    image-upload.tsx                     — Drag-and-drop file upload with preview
    date-picker.tsx                      — Calendar grid + timezone selector
    tier-comparison-modal.tsx            — Side-by-side tier comparison table
    order-summary.tsx                    — Price breakdown with coupon discount
  query-provider.tsx                     — TanStack Query provider (60s stale, 5min GC)
```

### Config

```
lib/brand-press.json — 3 tiers: Basic (₦175K), Core (₦250K), Pro (₦400K)
```

## Key Patterns

### State Management

- **React Hook Form + Zod** for all form state (9 `useState` calls for non-form concerns)
- Shared Zod schema in `lib/validations/brand-press.ts` — validated client-side by `zodResolver` and server-side by `safeParse()`
- Custom components (Tiptap, ImageUpload) use `watch()`/`setValue()` via RHF Controller pattern — no duplicate `useState`
- `submitBrandPress` receives `FormData` (not JSON) for Paystack popup interaction

### TanStack Query

- `components/query-provider.tsx` wraps root layout
- 60s stale time, 5min garbage collection
- Ready for caching brand press listings or coupon lookups

### Payment Flow (Card)

1. Client validates form via Zod → `handleSubmit(onSubmit)`
2. Server action `submitBrandPress()` runs:
   - Zod `safeParse()` on form data
   - Looks up tier price from `brand-press.json` (never trusts client)
   - Re-validates coupon server-side
   - Creates `articles` row (`payment_status: 'pending'`)
   - Creates `transactions` row (`status: 'pending'`)
   - **No Paystack API call** — returns `{ reference, email, amount }`
3. Client opens Paystack popup:
   ```
   PaystackPop.setup({ key: PUBLIC_KEY, email: result.email, amount: result.amount * 100, ref: result.reference, callback, onClose })
   ```
   **Critical**: No server-side `initializeTransaction()`. Let the inline SDK handle the Paystack API call. Passing both `access_code` and `ref` causes "Duplicate Transaction Reference".
4. User pays in Paystack iframe
5. `callback` redirects to `/brand-press/payment?reference=X`
6. Payment page verifies via `verifyTransaction()` → updates DB + sends email
7. **Webhook** at `/api/webhooks/paystack` catches edge cases (popup closed after payment)

### Price Validation (Security)

- Client-sent `final_price`/`discount_amount` in FormData are **ignored** server-side
- Tier price looked up from `lib/brand-press.json` config using `data.tier`
- Coupon code re-validated server-side via `validateCoupon(data.coupon_code)`
- Amount computed server-side: `tier.price - (coupon?.discountAmount ?? 0)`

### Atomicity

- Article created first — if transaction insert fails, article is **deleted** explicitly
- No orphaned `pending_payment` articles without corresponding transactions

### Reference Generation

```typescript
function generateReference(): string {
  const ts = Date.now().toString(36).toUpperCase()
  const rand = crypto.randomUUID().slice(0, 8).toUpperCase()
  return `BP-${ts}-${rand}`
}
```

### Guest User Pattern

- Auth removed — guest submissions allowed
- `author_id` and `user_id` are `null` after migration `20260615000003`
- File upload uses `crypto.randomUUID()` for filenames (no user session)

### Invoice PDF

- Generated via `@react-pdf/renderer` — React PDF component at `lib/api/invoice-pdf.tsx`
- `sendBrandPressInvoice()` generates PDF buffer via `renderToBuffer()`
- Attached to Resend email as base64 attachment
- Falls back to HTML-only if PDF generation fails

### Webhook Handler

`app/api/webhooks/paystack/route.ts`:
- HMAC-SHA512 signature verification using `PAYSTACK_SECRET_KEY`
- Handles `charge.success` events with `metadata.type === 'brand_press'`
- Idempotent: checks if transaction already `success` before updating
- Updates `transactions.status` → `success`, `articles.payment_status` → `paid`
- Sends payment confirmation email
- Configure at Paystack Dashboard → Webhooks: `https://lawyard.org/api/webhooks/paystack`

### JWT Role Claims

- Migration `20260615000004_sync_role_to_jwt.sql` syncs `profiles.role` → `auth.users.raw_app_meta_data`
- Trigger function fires on INSERT/UPDATE of `profiles.role`
- `proxy.ts` reads `user.app_metadata.role` directly from JWT — no DB query on req

### Config Fixes (Next.js 16)

- `middleware.ts` renamed to `proxy.ts` (deprecated convention)
- `next.config.js` has `turbopack.root: process.cwd()` for lockfile disambiguation

## Database

### articles table (brand_press specific columns)

- `article_type` — `'brand_press'` (vs `'editorial'`)
- `brand_name` — TEXT, the brand/client name
- `tier` — TEXT, one of `basic`, `core`, `pro`
- `payment_status` — TEXT, `pending` | `paid` | `failed`
- `scheduled_date` — TIMESTAMPTZ, optional future publish date
- `status` — TEXT, includes `pending_review` for brand press
- `author_id` — UUID (nullable after migration, references auth.users)

### transactions table

- `reference` — unique `BP-{timestamp}-{random8}` format
- `amount` — tier price (or discounted price)
- `plan_name` — `"Brand Press {tier.name}"`
- `metadata` — JSON with `article_id`, `tier`, `brand_name`, `type: 'brand_press'`, optional `coupon_code`, `discount_amount`

### Service Role Client

- `createServiceRoleClient()` in `lib/supabase/server.ts` — bypasses RLS for DB writes
- Uses `SUPABASE_SERVICE_ROLE_KEY` — never exposed to client
- Only used for brand_press submission + admin operations

## Edge Cases Handled

1. **Duplicate transaction reference** — timestamp in ref, skip server init, let SDK handle
2. **Orphaned articles** — explicit delete on tx failure
3. **Price manipulation** — 100% server-side price lookup + coupon re-validation
4. **Hydration crash** — Tiptap dynamically imported ssr:false
5. **Double submit** — RHF `isSubmitting` disables submit button
6. **Popup closed after payment** — webhook catches missed redirects
7. **Guest auth** — pass null for author_id/user_id, random UUID filenames

## Migrations Applied

| Migration | Purpose |
|-----------|---------|
| `20260612000001_add_payment_tables.sql` | transactions table + articles payment columns |
| `20260615000001_add_admin_rls_policies.sql` | RLS policies for admin role |
| `20260615000002_create_brand_press_bucket.sql` | storage bucket + policies |
| `20260615000003_guest_brand_press.sql` | nullable author_id/user_id |
| `20260615000004_sync_role_to_jwt.sql` | sync profile role to JWT app_metadata |

## Env Variables

```
RESEND_API_KEY=re_...
ADMIN_EMAIL=...
PAYSTACK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_SITE_URL=https://lawyard.org
```

## Key Files

- `app/actions/brand-press.ts` — server action (validation, DB, coupon, email)
- `app/actions/validate-coupon.ts` — coupon logic (LAUNCH10/LAUNCH20)
- `app/(main)/brand-press/submit/page.tsx` — RHF + Zod + Paystack popup
- `app/(main)/brand-press/payment/page.tsx` — callback verification
- `app/api/webhooks/paystack/route.ts` — webhook handler
- `lib/api/invoice-pdf.tsx` — React PDF invoice component
- `lib/api/email.ts` — email functions (invoice PDF, confirmations)
- `lib/api/paystack.ts` — Paystack verify (no init for brand press)
- `lib/supabase/server.ts` — createClient + createServiceRoleClient
- `lib/validations/brand-press.ts` — shared Zod schema
- `proxy.ts` — admin auth via JWT role claim
