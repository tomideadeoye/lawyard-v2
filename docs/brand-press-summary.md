# Brand Press — Feature Summary

## Overview
Brand Press submission system for lawyard.org, inspired by Techpoint Africa's model. Allows unauthenticated users to submit paid press releases with tiered pricing and Paystack payment.

## Architecture

```
app/
├── (main)/brand-press/
│   ├── page.tsx              — Landing page (tier overview)
│   ├── submit/page.tsx       — Form (RHF + Zod, 11 useStates)
│   ├── payment/page.tsx      — Paystack callback handler
│   └── success/page.tsx      — Success confirmation
├── actions/
│   ├── brand-press.ts        — Server action (service role, guest user)
│   └── validate-coupon.ts    — Coupon validation (LAUNCH10/LAUNCH20)
├── api/upload/brand-press/   — Image upload endpoint (no auth required)
components/
├── brand-press/
│   ├── rich-text-editor.tsx  — Tiptap editor (dynamic import, ssr: false)
│   ├── image-upload.tsx      — Drag-drop file upload
│   ├── date-picker.tsx       — Calendar + time picker
│   ├── order-summary.tsx     — Price breakdown sidebar
│   └── tier-comparison-modal.tsx
├── PricingCard.tsx           — Tier selection card
└── query-provider.tsx        — TanStack Query provider
lib/
└── supabase/server.ts        — Added createServiceRoleClient()
supabase/migrations/
├── 20260615000001_add_admin_rls_policies.sql
├── 20260615000002_create_brand_press_bucket.sql
└── 20260615000003_guest_brand_press.sql   — nullable author_id/user_id
```

## Key Decisions

| Area | Choice | Rationale |
|---|---|---|
| Auth | None (guest flow) | Matches Techpoint; lower friction for paying clients |
| Price validation | 100% server-side | Client-sent prices ignored; tier looked up from config, coupon re-validated |
| Payment | Paystack inline popup | Better UX than redirect; `PaystackPop.setup()` with `access_code` |
| State management | React Hook Form + Zod | 18 useStates → 11; schema-driven validation |
| Server state | TanStack Query | Caching layer for future data needs |
| DB access | Service role client | Bypasses RLS for guest inserts; key never exposed to client |
| File upload | Supabase Storage via API route | Random UUID filenames; no auth required |
| Rich text | Tiptap | Headless, extensible; loaded via `next/dynamic` with `ssr: false` |

## Security (Post-Review)

- **Price tampering:** `final_price`/`discount_amount` from formData are ignored. Server re-validates coupon against `brand-press.json` tier prices and computes the amount internally.
- **Service role key:** Only used in server actions (never client-side). No RLS bypass issue since the key is server-side only.
- **Upload path:** Uses `crypto.randomUUID()` — no user ID exposed in storage paths.
- **Tiptap SSR:** Dynamically imported with `ssr: false` to prevent `window`/`document` errors.

## Payment Flow

1. Guest fills form → submits
2. Server action: creates article + transaction (pending), validates coupon, initializes Paystack
3. Returns `{ access_code, reference, email, amount }` to client
4. Client opens `PaystackPop.setup({ access_code })` iframe
5. User pays → callback redirects to `/brand-press/success`
6. User closes → redirects to `/brand-press/submit?cancelled=true`

## Pricing Tiers

| Tier | Price | Homepage | Social | Priority |
|---|---|---|---|---|
| Basic | ₦175,000 | — | — | — |
| Core | ₦250,000 | Middle | ✓ | — |
| Pro | ₦400,000 | Featured top | ✓ | ✓ |

## Coupons
- `LAUNCH10` — 10% off
- `LAUNCH20` — 20% off

## Remaining Work
- Paystack webhook handler for brand-press payments
- Edge case: user closes Paystack popup without paying (article stuck in `pending_payment`)
- Navigation link to `/brand-press` in header/footer
- Invoice PDF generation for "Generate Invoice" method
