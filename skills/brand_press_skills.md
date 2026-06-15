# Brand Press Submission System

Full paid content submission flow with tiered pricing, rich content editing, and Paystack payments.

## Routes

| Path | File | Purpose |
|------|------|---------|
| `/brand-press` | `app/(main)/brand-press/page.tsx` | Published articles listing with "Submit Now" CTA |
| `/brand-press/submit` | `app/(main)/brand-press/submit/page.tsx` | Multi-section submission form |
| `/brand-press/payment` | `app/(main)/brand-press/payment/page.tsx` | Paystack callback handler |
| `/brand-press/success` | `app/(main)/brand-press/success/page.tsx` | Post-submit confirmation |

## Architecture

### Server Actions

```
app/actions/
  brand-press.ts          — submitBrandPress(): creates article + transaction, initializes Paystack
  validate-coupon.ts      — validateCoupon(): checks coupon code against map, returns discount
```

### API Routes

```
app/api/upload/brand-press/route.ts — file upload to Supabase Storage bucket 'brand-press'
```

### Components

```
components/
  PricingCard.tsx                        — Tier selection card with features, recommended badge
  brand-press/
    rich-text-editor.tsx                 — Tiptap editor wrapper
    image-upload.tsx                     — Drag-and-drop file upload with preview
    date-picker.tsx                      — Calendar grid + timezone selector
    tier-comparison-modal.tsx            — Side-by-side tier comparison table
    order-summary.tsx                    — Price breakdown with coupon discount
```

### Config

```
lib/brand-press.json — 3 tiers: Basic (₦175K), Core (₦250K), Pro (₦400K)
```

## Key Patterns

### Form Structure
- Client component with `useState` for all interactive state
- Sections: Article Details, Issuer Information, Tier Selection, Schedule, Payment Method, Coupon
- Sidebar with Order Summary + Best Practices
- Grid layout: `lg:grid-cols-3` (form spans 2, sidebar is 1)

### Payment Flow
1. Card → `submitBrandPress()` initializes Paystack → redirects to `authorization_url`
2. Paystack callback → `/brand-press/payment` → verifies via `verifyTransaction()` → updates `articles.payment_status` + `transactions.status`
3. Bank Transfer — disabled for now (UI shows "Soon" badge)
4. Invoice — returns success message (no PDF generation yet)

### Rich Text Editor (Tiptap)
- Installed: `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-link`, `@tiptap/extension-placeholder`, `@tiptap/extension-image`
- Custom toolbar: H1, H2, Bold, Italic, BulletList, OrderedList, Blockquote, Link, Image, Undo/Redo
- Content stored as HTML, passed via `onChange(html)` callback

### Image Upload
- Drag-and-drop zone + click-to-browse
- Validates: type (image/\*), size (max 500KB)
- Uploads to Supabase Storage bucket `brand-press` via API route `POST /api/upload/brand-press`
- Returns public URL, stored in `articles.featured_image`

### Coupon Validation
- Server action checks code against map `VALID_COUPONS`
- Returns discount amount + final price
- Applied to order summary in real-time

### Date Picker
- Custom calendar with month navigation, day grid
- Disables past dates (allows today)
- Timezone select dropdown (14 common timezones)
- Uses `date-fns` for date manipulation

## Database

### articles table columns (brand_press specific)
- `article_type` — `'brand_press'` (vs `'editorial'`)
- `brand_name` — TEXT, the brand/client name
- `tier` — TEXT, one of `basic`, `core`, `pro`
- `payment_status` — TEXT, `pending` | `paid` | `failed`
- `scheduled_date` — TIMESTAMPTZ, optional future publish date
- `status` — TEXT, includes `pending_review` for brand press

### transactions table
- `reference` — unique BP-XXXXX format
- `amount` — tier price (or discounted price)
- `plan_name` — `"Brand Press {tier.name}"`
- `metadata` — JSON with `article_id`, `tier`, `brand_name`, `type: 'brand_press'`, optional `coupon_code`, `discount_amount`
