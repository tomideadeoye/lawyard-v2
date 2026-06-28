# Timeline

## 2026-06-16

### Focus
Category taxonomy alignment, TanStack Query migration for publish forms

### What Changed
- **CategoryMultiselect** rewritten to load options from `specialties.json` — articles and podcasts now use the same practice area taxonomy as lawyer specialties
- **PublishPodcastForm** rewritten: `useMutation` replaces `useTransition`/`startTransition`; controlled state instead of raw FormData; matches `LawyerForm` pattern
- **PublishArticleForm** rewritten: same migration to `useMutation` + controlled state; old single-select category dropdown replaced with `CategoryMultiselect`
- **Migration default** changed from `'documentation'` to `'general-practice'` in `20260616000004_multiselect_categories.sql`

### Rationale
- Practice areas are what users search by; internal content categories were meaningless to readers
- TanStack Query provides consistent error/success/pending state across all directory forms

### Related Files
- `components/directory/forms/CategoryMultiselect.tsx`
- `components/directory/forms/PublishPodcastForm.tsx`
- `components/directory/forms/PublishArticleForm.tsx`
- `supabase/migrations/20260616000004_multiselect_categories.sql`

---

## 2026-06-16 (Second Session)

### Focus
Client inquiry system, listing detail page rewrite, inquiry inbox

### What Changed
- **Migration**: Created `lawyer_inquiries` table with RLS (anyone inserts, lawyers see their own, admins see all)
- **Server actions**: `submitInquiry`, `getInquiries`, `getInquiryStats`, `markInquiryRead`, `getAllInquiriesAdmin` — full CRUD for client-to-lawyer messaging
- **Listing detail page**: Complete rewrite of `/directory/lawyer/[id]/page.tsx` — Tailwind replaces CSS modules; shows all extended fields (education, awards, FAQs, working hours, social links, gallery, intro video, contact info, volunteer/pro bono); live contact form that submits to `lawyer_inquiries`; sticky sidebar with inquiry form and quick info card
- **Inquiry inbox**: New `app/directory/dashboard/inquiries/` page with split layout (list + detail panes), auto-marks as read when selected; linked from dashboard sidebar and stats card
- **Dashboard**: Inquiries stat card now shows live count + unread badge; Quick Actions now includes Inquiries card with badge

### Rationale
- Lawyers need to receive and manage client inquiries from their directory listing
- The listing detail page needed the full set of extended fields to match the live site's feature set
- Inbox follows the established dashboard layout pattern with sidebar navigation

### Related Files
- `supabase/migrations/20260616000005_create_lawyer_inquiries.sql`
- `app/directory/actions/inquiries.ts`
- `app/directory/lawyer/[id]/page.tsx`
- `app/directory/lawyer/[id]/inquiry-form.tsx`
- `app/directory/dashboard/inquiries/page.tsx`
- `app/directory/dashboard/inquiries/inbox-client.tsx`
- `app/directory/dashboard/page.tsx`
- `app/directory/dashboard/layout.tsx`

---

## 2026-06-16 (Session End)

### Blockers
Content pipeline integration is blocked pending clarification from Shefiu:

1. **API endpoint before Slack bot?** — URL to POST to when directory articles/podcasts are published, and when brand press payments clear
2. **Payload structure** — Expected JSON for article vs podcast vs brand press
3. **Auth method** — API key, HMAC, or IP whitelist
4. **Other entry points** — External sources (direct brand submissions, scrapers) feeding the pipeline
5. **Full data flow**: source → [?] → Slack bot → distribution

### Next Steps
1. Get answers from Shefiu on content pipeline
2. Wire publish flow to POST to endpoint after DB insert
3. Wire brand press webhook to same endpoint after Paystack confirmation
4. Rate limiting (Upstash Redis / Vercel Edge) + CAPTCHA (Cloudflare Turnstile) on directory forms

---

## 2026-06-22

### Focus
Subscription expiry enforcement, chamber subscription model, bug fixes

### What Changed
- **Subscription expiry**: Added `subscription_expires_at` column to profiles via migration. Both `verifyPayment` and Paystack webhook now set an expiry date (365 days from payment). Backfilled existing premium users. Expired listings are filtered from the featured lawyers section.
- **Chamber subscription model**: Extended chambers table with `user_id`, `subscription_tier`, `subscription_status`, `subscription_expires_at`, `email`, `phone`, `website`, `description`. Updated RLS policies. Deduplicated seed records (6 → 2). `getChambers()` now filters by active subscription + expiry. Paystack webhook + `verifyPayment` handle `type: 'chamber_subscription'`.
- **Chamber detail page**: `/directory/chamber/[id]` — public page showing name, focus, contact info, description, member lawyers. Featured chamber cards on homepage now link here.
- **Chamber management**: `/directory/dashboard/chamber/` — create/edit chamber form (consolidated FormState), subscription badge, upgrade link. Sidebar nav added.
- **Bug fixes**: Inbox read state now updates locally (no stale query cache). `submitInquiry`/`markInquiryRead` throw errors on DB failure so TanStack Query catches them. Paystack webhook handlers guard against null metadata. Server actions return `{ success: true }` instead of `redirect()` to prevent TanStack Query catching redirect errors in mutations.

### Rationale
Closing the loop on payments — subscriptions now have real expiry enforcement so featured listings degrade properly. Chambers get parity with lawyers: subscription-backed featured status, a public detail page, and owner management. Four bugs caught in a single review pass and fixed.

### Related files
- `supabase/migrations/20260616000007_subscription_expiry.sql`
- `supabase/migrations/20260622000001_extend_chambers.sql`
- `app/api/webhooks/paystack/route.ts`
- `app/directory/actions/payments.ts`
- `app/directory/actions/inquiries.ts`
- `app/directory/actions/content.ts`
- `lib/directory/api.ts`
- `app/directory/page.tsx`
- `app/directory/chamber/[id]/page.tsx`
- `app/directory/dashboard/chamber/page.tsx`
- `app/directory/dashboard/chamber/chamber-form.tsx`
- `app/directory/dashboard/layout.tsx`
- `app/directory/dashboard/inquiries/inbox-client.tsx`
- `components/directory/forms/PublishArticleForm.tsx`
- `components/directory/forms/PublishPodcastForm.tsx`
