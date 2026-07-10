# ✅ Lawyard v2 — Implemented Features

> Archive of completed tasks. Current backlog lives in `AGENT_TASKS.md`.

---

## TASK-10: Delayed Auth Gate for /directory/add-listing

**Problem**: `/directory/add-listing` was fully public — anyone could submit a listing without an account, which meant no identity to attach submissions to, no way to track edits, and no verification pipeline.

**Solution**: Delayed auth gate — users can browse the page freely, but must authenticate at category selection time. After auth, they're returned to the same page with their category pre-selected.

**Auth Chain (4 hops)**:

```
add-listing/page.tsx                    [Hop 1] — User clicks category, not authed
  ↓  redirect to /directory/signup?redirect=/directory/add-listing&category=X
signup-form.tsx / login-form.tsx        [Hop 2] — Forward redirect+category to OAuth callback URL
  ↓  OAuth provider redirects to /directory/auth/callback?next=...&category=...
auth/callback/route.ts                  [Hop 3] — Exchange OAuth code, append ?category=X to final URL
  ↓  redirect to /directory/add-listing?category=lawyer
add-listing/page.tsx                    [Hop 4] — Read ?category= from URL, auto-select, user is authed
```

**Files modified**:

| File | Role |
|------|------|
| `app/directory/add-listing/page.tsx` | Auth gate at category selection; restore from URL param or sessionStorage on return |
| `components/directory/auth/signup-form.tsx` | Reads `redirect`+`category` from URL, embeds in OAuth `redirectTo` and hidden form fields |
| `components/directory/auth/login-form.tsx` | Same pattern for login — forwards redirect params through all auth paths |
| `app/directory/auth/callback/route.ts` | Receives `?next=` and `?category=`, appends category to final redirect. `next` param takes priority over role-based routing |
| `app/directory/login/actions.ts` | `login()` uses `redirect`+`category` from formData as destination. `signup()` passes them via `emailRedirectTo` for email confirmation flow |

**How it works**:

1. **Unathenticated user** browses `/directory/add-listing`, picks "Individual Lawyer" → saved to `sessionStorage`, redirected to `/directory/signup?redirect=/directory/add-listing&category=lawyer`
2. **Signs up via Google** → OAuth `redirectTo` includes `?next=/directory/add-listing&category=lawyer`
3. **Auth callback** receives the code, exchanges for session, redirects to `/directory/add-listing?category=lawyer` (or `/directory/dashboard?category=lawyer` if the user has a profile-based route)
4. **Page mounts** → reads `?category=lawyer` from URL → sees user is authenticated → auto-selects "Individual Lawyer" → user fills and submits the form as an authenticated user
5. **Fallback**: `sessionStorage` also saves the category for browser-back or tab-restore scenarios where URL params may be lost

**Edge cases handled**:
- User cancels signup → returns to add-listing unauthenticated → category silently discarded
- User refreshes after auth callback → category param cleaned from URL via `history.replaceState`
- Email/password signup → confirmation email includes `emailRedirectTo` with redirect params
- Magic link login → `redirectTo` includes callback URL with `next`+`category`
- Existing user logs in normally (no `?next` param) → role-based routing to dashboard/search as before

---

## TASK-11: Fix Misleading Welcome Email

**Problem**: `sendSignupVerification` in `lib/api/brevo.ts` sent an email that said *"We've sent a confirmation link to your email — click it to verify"* but the email had **zero links** — no CTA, no confirmation button. Supabase had `enable_confirmations = false`, so no separate confirmation email existed either. Users received an email telling them to click something that doesn't exist.

**Solution**: Renamed to `sendWelcomeEmail`, rewritten as a proper welcome email:
- Subject: *"Your Account is Ready"* (instead of *"Verify Your Email"*)
- Removed all references to a nonexistent confirmation link
- Added a **"Go to Dashboard"** CTA button linking to `/directory/dashboard`
- Lists actual next steps (browse, manage profile, post needs)

**Files changed**:
| File | Change |
|------|--------|
| `lib/api/brevo.ts` | Renamed `sendSignupVerification` → `sendWelcomeEmail`, rewrote template with working dashboard CTA |
| `app/directory/login/actions.ts` | Updated import and call site |

**Design decision**: Kept `enable_confirmations = false` in Supabase config. Email/password users get immediate access (like OAuth users). If verification gates are needed later, they can be added at specific high-stakes actions (submitting a listing).

---

## TASK-01: Fix Chambers Featured Bug

**Files**: `lib/directory/api.ts`
**What**: `featured: (c.is_featured as boolean) || false` replaces hardcoded `false` in chamber mapping.
**Verified**: Line 216 — homepage "Featured Chamber Listings" now reads actual DB value.

---

## TASK-02: Wire Content Studio to Server Actions

**Files**:
- `components/directory/forms/PublishArticleForm.tsx`
- `components/directory/forms/PublishPodcastForm.tsx`
- `app/directory/actions/content.ts`

**What**: Both publish forms wired via TanStack Query `useMutation` calling `publishArticle()` / `publishPodcast()` server actions. Features:
- Slug auto-generation from title
- Controlled form state
- Loading states and error handling
- Header image upload (article)
- Category multiselect (practice areas)
- Scheduled date support
- Pending review workflow → Slack notification

---

## TASK-03: Fix `verified: true` Hardcode

**Files**: `lib/directory/api.ts`
**What**: `verified: (l.verification_status as string) === 'verified'` in both `getLawyers()` and `getLawyerById()`.
**Verified**: Lines 141 and 186 — pending lawyers no longer show verified badge.

---

## TASK-04: Update Metadata

| Page | Metadata |
|------|----------|
| `app/admin/layout.tsx` | `"Lawyard Admin \| Admin Portal"` + description + `noindex` |
| `app/directory/layout.tsx` | `"Lawyard Directory \| Legal Marketplace"` + description |
| `app/(main)/corporate-posts/layout.tsx` | Title template `"%s – Corporate Posts – Lawyard"` for all sub-pages |

---

## TASK-07: Build Admin — Lawyers Directory Page

**Files**:
- `app/admin/lawyers/page.tsx`
- `app/admin/lawyers/edit-dialog.tsx`
- `app/admin/lawyers/lawyers-filters.tsx`

**What**: Full CRUD — table with filters (status/search/pagination), verify/reject/revoke/reinstate actions, edit dialog. Unprotected (no auth guard yet).

---

## TASK-08: Build Admin — Subscribers Page

**Files**:
- `app/admin/subscribers/page.tsx`
- `app/admin/subscribers/subscribers-client.tsx`

**What**: Server component fetches subscribers, delegates to client component for rendering. Unprotected (no auth guard yet).
**Still needed**: CSV export, growth charts.

---

## TASK-09: Build Admin — Content Manager Page

**Files**:
- `app/admin/content/page.tsx`
- `app/admin/content/create-dialog.tsx`
- `app/admin/content/content-filter.tsx`
- `app/admin/content/delete-button.tsx`

**What**: Tabs for Articles, Podcasts, and Corporate Posts with:
- Status filters (all/draft/published/archived/pending_review)
- Publish/archive/delete actions
- Approve/reject for Corporate Posts
- Create dialog
- Full pagination
- Unprotected (no auth guard yet)

---

## Additional Completed Work

### Subscription Expiry Enforcement
- `subscription_expires_at` column on profiles, set on payment (webhook + verifyPayment)
- Expired listings filtered from featured sections
- Non-free tiers with null expiry require active subscription

### Chamber Subscription Model
- Extended chambers: `user_id`, `subscription_tier`, `subscription_status`, `subscription_expires_at`, contact fields
- Paystack webhook handles `type: 'chamber_subscription'`
- `getChambers()` filters by active subscription + expiry

### Chamber Detail Page + Management
- `/directory/chamber/[id]` — public detail page with name, focus, description, contact, member lawyers
- `/directory/dashboard/chamber/` — create/edit chamber, subscription badge, upgrade link

### Client Inquiry System
- `lawyer_inquiries` table with RLS
- Full CRUD server actions
- Listing detail page with live inquiry form
- Dashboard inbox with split-pane layout, auto-mark read

### Category Taxonomy Alignment
- Articles and podcasts categorized by legal practice areas (from `specialties.json`)
- `CategoryMultiselect` component for choosing practice areas

### Monorepo Flattening
- Collapsed three-app monorepo into single Next.js app
- Unified Supabase client library
- All imports rewritten `@repo/*` → `@/*`

## TASK-05: Add Error Boundaries for Supabase Failures

**Files**: `app/error.tsx` (new), `app/directory/error.tsx` (pre-existing), `app/not-found.tsx` (pre-existing)
**What**:
- Root error boundary catches crashes app-wide — shows "Something went wrong" with retry button
- Dev-mode expandable error details (name, message, digest, stack)
- API layer (`getLawyers`, `getChambers`, `getLawyerById`) returns `[]`/`null` on error — never throws
- `app/directory/page.tsx` and `app/directory/search/page.tsx` wrapped in try/catch
- Lawyer detail page calls `notFound()` on query failure

---

## TASK-06: Add Admin Auth Guard to Admin

**Files**: `middleware.ts` (replaces stale `proxy.ts`), `app/admin/login/page.tsx`, `app/admin/login/actions.ts`
**What**:
- `middleware.ts` intercepts all `/admin/*` requests
- Creates Supabase server client from cookies → calls `auth.getUser()`
- No user → redirects to `/admin/login`
- Not admin role → redirects to `/admin/login`
- Login page (pre-existing) with email/password + magic link auth
- JWT role claims synced via migration `20260615000004_sync_role_to_jwt.sql`
- **Lawyers, Content Manager, Subscribers pages are now protected**

---

### Corporate Posts + Shop
- Corporate Posts submission flow (3 tiers, Paystack payment, admin review, scheduled publishing)
- Shop order confirmation emails with branded receipt
- Invoice PDF generation via `@react-pdf/renderer`
- Paystack webhook handler with HMAC-SHA512 verification
- Transactions view in admin
- JWT role claims sync (`profiles.role` → `auth.users.raw_app_meta_data`)
