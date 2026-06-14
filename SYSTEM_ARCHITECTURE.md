# LAWYARD v2 SYSTEM ARCHITECTURE (Zero-Dependency Protocol)
**Status**: ACTIVE | **Phase**: 3 (Media Platform + Brand Press) | **Architecture**: Monorepo (Supabase-Native)

## 👤 KEY CONTACTS
- **Tobi Adebowale**: Primary Client / Decision Maker (+234 706 100 3969)
- **Shefiu**: AI Integration Lead (LawyardAI)
- **Tomide Adeoye**: Lead Architect & Senior Engineer (Legal Engineering)

## 💰 FINANCIALS
- **Phase 1 (Automation Engine)**: ₦450,000 (Targeting staff overhead reduction)
- **Phase 2 (Directory Portal Rebuild)**: ₦1,200,000
- **Deposit Strategy**: Target ₦200,000 - ₦250,000
- **Total Project Value**: ₦1,650,000

## 1. Stack Foundation
- **Framework**: Next.js 16 (App Router), Tailwind CSS v4.
- **Database/Auth**: Supabase (PostgreSQL + RLS).
- **UI System**: Tailwind CSS v4 + Custom Components (publish), Shadcn UI (directory/admin).
- **Email**: Resend for transactional emails (brand press lifecycle) and newsletter broadcasts.
- **Payments**: Paystack for Brand Press paid submissions.
- **Monorepo**: pnpm workspaces + Turborepo + Next.js 16.

## 2. Core Modules
- **/apps/directory**: Public-facing legal marketplace & discovery engine (port 3000).
- **/apps/admin**: Admin management & governance portal for directory + publish (port 3001).
- **/apps/publish**: Media platform — Lawyard's main site (lawyard.org) with articles, podcasts, TV, Brand Press (port 3002).
- **/packages/api**: Shared business logic
  - `src/articles.ts` — Query helpers: `getPublishedArticles`, `getArticleBySlug`, `getRelatedArticles`, `getPublishedPodcasts`, `getPodcastBySlug`, `formatDate`
  - `src/paystack.ts` — Paystack init/verify helpers (shared by publish + directory)
  - `src/email.ts` — Resend email module: 6 send functions for Brand Press lifecycle + newsletter
  - `src/index.ts` (legacy) — Zod schemas (ArticleSchema, PodcastSchema, NewsletterSubscriptionSchema)
- **/packages/ui**: Shared design system (Tailwind CSS v4)
  - `src/components/article-card.tsx` — ArticleCard with grid + list variants, brand/tier/category badges
  - `src/components/podcast-card.tsx` — PodcastCard with audio/video badges, duration, featured image
  - `src/components/cookie-consent.tsx` — Global cookie consent banner
  - `src/components/newsletter-popup.tsx` — Timed/scroll-triggered newsletter modal
  - `src/components/` — Shadcn components (button, card, tabs, checkbox, input, label, separator)
  - `src/lib/utils.ts` — Shared `cn()` utility
  - `src/styles/globals.css` — Single source of truth for `@theme {}` tokens, CSS custom properties, premium utilities

## 3. Data Flow (The Protocol)
- **Native Content Engine**: Replaced legacy WordPress with native `articles` and `podcasts` tables across publish + directory apps.
- **Brand Press Flow**: Submit → Create article (`status='pending_review'`, `payment_status='pending'`) → Paystack payment → Callback verifies → `payment_status='paid'` → Admin reviews → Approve (status='published') or Reject (status='archived') → Email notification at every step.
- **Scheduled Publishing**: Supabase edge function (hourly cron) queries articles where `status='pending_review'` AND `payment_status='paid'` AND `scheduled_date <= now()`, publishes them, sends approval email.
- **Newsletter Broadcast**: Admin sends subject + HTML body from subscribers page → Resend sends individually to all active subscribers.
- **Transactional Emails**: Resend handles 6 event types (submission received, payment confirmed, approved, rejected, admin alert, newsletter).
- **Onboarding**: Role-based signup (`lawyer` vs `client`) with automatic `profiles` synchronization via DB triggers (directory app).
- **Search Intelligence**: High-fidelity filtering (Location, Specialty, Rating, Price, Experience) in directory app.

## 4. Key Security & Compliance
- **Auth**: Row-Level Security (RLS) across all core tables.
- **Privacy**: Automated policy enforcement for data retention and user rights.
- **Newsletter**: Automated aggregation via the `generate-digest.ts` logic.

## 5. Deployment & Infrastructure
- **Vercel**: Automated CI/CD pipelines connected to GitHub.
  - **Vercel Dashboard**: https://vercel.com/tomideadeoyes-projects/lawyard-v2
  - **Live (Vercel)**: https://lawyard-v2.vercel.app
  - **Live (Custom Domain)**: https://directory.lawyard.org / https://www.lawyard.org
- **Supabase**: Hosted PostgreSQL, Edge Functions for CRON-job based Newsletter distribution, and Storage (buckets for media).
  - **Dashboard**: https://supabase.com/dashboard/project/jayjejqjswxtksvwoqxp
  - **API Endpoint**: https://jayjejqjswxtksvwoqxp.supabase.co
- **Database Management**: Migrations are handled via `supabase db push` / `query` for ad-hoc schema patches.

## 6. Configuration & Maintenance
- **Turbopack Workspace Root**: Explicitly configured in `apps/directory/next.config.js` and `apps/admin/next.config.js` via `experimental.turbopack.root` to prevent Next.js from resolving stray lockfiles outside the monorepo.
- **Tailwind v4 Monorepo Setup**:
  - Theme tokens (`@theme {}`, HSL variables, custom utilities) live once in `packages/ui/src/styles/globals.css`.
  - Each app's `globals.css` imports the shared CSS and uses `@source` to scan both local components and the shared UI package — ensuring Tailwind generates utility classes for all files regardless of which workspace they're in.
  - No `tailwind.config.*` files; all configuration is CSS-first via `@theme` and `@source` directives.
- **Proxy Routing**: Middleware via `proxy.ts` (Next.js 16 convention — exports a `proxy` function and `config.matcher`) in both `apps/directory/proxy.ts` and `apps/admin/proxy.ts`. If middleware stops working, ensure the file is named `middleware.ts` (Next.js standard).
- **Zero-Dependency**: Do not re-introduce external CMS (WordPress). All content is internal.
- **Theming**: Use `--primary` (Royal Blue) and `--accent` (Gold) for brand consistency. Never hardcode colors.
- **Authentication**: Always require `await` on Next.js 15 `searchParams` and `params`.
- **Ports**: 
    - Directory: 3000
    - Admin: 3001
    - Publish (Media Platform): 3002

## 7. Brand Press / Media Platform Additions (Phase 3 — 2026-06-12)
1. **Shared `@repo/api/articles.ts`**: Extracted `getPublishedArticles`, `getArticleBySlug`, `getRelatedArticles`, `getPublishedPodcasts`, `getPodcastBySlug`, `formatDate` — framework-agnostic helpers accepting SupabaseClient as first arg.
2. **Shared `@repo/api/paystack.ts`**: Extracted Paystack initialization and verification helpers used by both publish and directory apps.
3. **Shared `@repo/api/email.ts`**: Resend email module with 6 send functions for Brand Press lifecycle (received, payment confirmed, approved, rejected, admin alert) and newsletter broadcast.
4. **Shared `ArticleCard` + `PodcastCard`**: Reusable components in `@repo/ui` with grid/list variants, brand/tier/category badges, audio/video type badges.
5. **`apps/publish` (Media Platform)**: 14 routes — homepage, insights index/detail, podcasts index/detail, TV index/detail, category archive, RSS feed, Brand Press (submit, payment, success, listing), About page.
6. **Brand Press Engine**: Paid submission flow with 3 tiers (Basic ₦175K, Core ₦250K, Pro ₦400K), Paystack payment, admin review for ALL tiers (no auto-publish), transaction tracking.
7. **Admin Review UI**: Brand Press tab in admin content manager with approve/reject actions, tier/payment/status badges.
8. **Scheduled Publishing**: Supabase edge function (`publish-scheduled`) for cron-based publication of approved/pending articles.
9. **Newsletter Broadcast**: Admin subscriber management with send-to-all broadcast form.
10. **Database Migrations**: `20260612000002_add_brand_press.sql` (brand_name, tier, payment_status, scheduled_date, article_type columns) and `20260612000003_fix_brand_press_flow.sql` (pending_review status, category constraint removal).

## 8. Accomplished Transitions (WordPress-to-Supabase)
1. **Database Schema Evolution (`schema.sql`)**:
   - Created `articles` and `podcasts` tables to store subscriber content natively.
   - Created `newsletter_subscribers` table to handle subscriber lists.
   - Enabled Row Level Security (RLS) policies ensuring public read-only access for published content while restricting write access to authenticated authors.

2. **Shared API Layer Refactoring (`packages/api/src/index.ts`)**:
   - Removed the legacy `LawyardClient` (WordPress REST client).
   - Implemented strict Zod Schemas (`ArticleSchema`, `PodcastSchema`, `NewsletterSubscriptionSchema`) to enforce database-level structural integrity.

3. **Directory Fetching (`apps/directory/lib/api.ts`)**:
   - Implemented native `getArticles()` and `getPodcasts()` fetchers with optional filtering by author ID, ensuring profiles load extremely fast.

4. **Frontend Dynamic Integration (`apps/directory/app/page.tsx`)**:
   - Replaced static placeholder insights on the homepage with a dynamic feed of the latest subscriber articles and podcasts.

5. **Subscriber Portfolio Pages (`apps/directory/app/lawyer/[id]/page.tsx`)**:
   - Integrated a "Published Insights" section on individual lawyer profiles. Authenticated subscribers now showcase their articles and audio/video podcasts directly to potential clients.

6. **Newsletter Subscription (`Footer.tsx` & `Footer.module.css`)**:
   - Added a subscription form in the global footer connected to a server-side action that inserts emails directly into `newsletter_subscribers`.
   - Updated the grid styling to properly accommodate the new newsletter block.

7. **Friday Digest Automation (`apps/directory/scripts/generate-digest.ts`)**:
   - Created a weekly aggregator script that automatically compiles the titles, descriptions, and links of all articles and podcasts published over the last 7 days.

8. **Shared Popup System (`packages/ui/src/components/cookie-consent.tsx` & `packages/ui/src/components/newsletter-popup.tsx`)**:
   - Developed a reusable, responsive, and customizable Cookie Consent banner component.
   - Developed a timed and scroll-depth (30%) triggered Newsletter Popup modal component, decoupled from server logic using callback props (`onSubscribe`).
   - Integrated both components globally in `apps/publish/app/layout.tsx` and `apps/directory/app/layout.tsx`.

## 8. Feature Checklist
> ✅ = Done | 🔄 = In Progress | ❌ = Not Started

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1 | Subscriber-created articles appear on their profile page | ❌ | Needs Content Studio binding & live DB |
| 2 | Subscriber-created articles go live on the main website | ❌ | Needs homepage feed integration verified |
| 3 | Subscriber-created podcasts (audio/video) appear on homepage | ❌ | Needs podcast upload & homepage query |
| 4 | Subscriber-created podcasts (audio/video) appear on their profile | ❌ | Needs profile page integration |
| 5 | Weekly Friday digest auto-aggregates articles & podcasts | ✅ | `generate-digest.ts` script exists |
| 6 | Weekly digest auto-delivered to newsletter subscribers | ❌ | Script exists but email provider not wired |
| 7 | "In Case You Missed This" heading in digest email | ❌ | Needs Resend/SES integration |
| 8 | User photos displayed in directory (profiles) | ❌ | Needs avatar/storage integration |
| 9 | Header specialties pulled from data source (not hardcoded) | ✅ | `data/specialties.json` + dynamic NavDropdown |
| 10 | Header nav query params match search API (`?specialty=` not `?tag=`) | ✅ | All header links use `?specialty=` |
| 11 | Homepage hero specialty select navigates to filtered search | ✅ | `HeroSearchBar` client component with onChange |
| 12 | All specialties displayed per lawyer (not just first) | ✅ | `specialties: string[]` on Lawyer interface |
| 13 | Pricing page layout — full-width, no squish | ✅ | Fixed with `@theme {}` block enabling all Tailwind v4 color utilities |
| 14 | Pricing page role tabs — styled properly, no overlap | ✅ | Refactored with shadcn `Tabs` + `Card` components |
| 16 | Authentication (login, signup, session) | ✅ | Fully configured with Supabase Auth (Magic Link & Google OAuth) |
| 17 | Onboarding forms (Lawyer, Chamber, Corporate) | ✅ | Refactored to shared Shadcn components & Tailwind |
| 18 | Welcome message after signup/verification | ✅ | Implemented dashboard welcome overlay modal |
| 19 | Shared Cookie Consent Banner in monorepo | ✅ | Implemented in @repo/ui, integrated globally in publish/directory |
| 20 | Shared Newsletter Popup Modal in monorepo | ✅ | Implemented in @repo/ui, integrated globally in publish/directory |

## 9. Pending Roadmap
1. **Run Database Migrations**:
   - Run `supabase db push` to apply brand press migrations (20260612000002, 20260612000003) to the remote Supabase project.

2. **Set Environment Variables**:
   - Set `RESEND_API_KEY` and `ADMIN_EMAIL` in both `apps/publish` and `apps/admin` environments.
   - Set `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` and `PAYSTACK_SECRET_KEY` in `apps/publish`.

3. **Deploy Supabase Edge Function**:
   - Run `supabase functions deploy publish-scheduled --no-verify-jwt`
   - Wire cron trigger: `supabase functions cron create "0 * * * *" --function publish-scheduled`

4. **Deploy Hosting**:
   - Deploy `apps/publish` to Vercel/Netlify (points to lawyard.org).
   - Deploy `apps/admin` to Vercel/Netlify (password-protected or IP-restricted).
   - Set subdomain routing: `lawyard.org` → publish, `directory.lawyard.org` → directory.

5. **Migrate WordPress Content**:
   - Build script to pull articles/podcasts/categories from WordPress REST API → insert into Supabase tables.
   - Map WordPress categories to article categories, maintain slugs.

6. **Connect Content Studio Form Submissions**:
   - Bind form inputs on `apps/directory/app/dashboard/publish/page.tsx` to Supabase server actions for direct dashboard publishing.

7. **Implement Email Delivery for Friday Digest**:
   - Connect `generate-digest.ts` to Resend and configure a weekly cron job (Supabase Edge Function or GitHub Actions).

8. **Deploy LawyardAI Engine**:
   - Integrate with Shefiu's AI module to allow directory subscribers to auto-generate starting drafts for their legal articles.

9. **Expose Partnership API (Hubtal Pilot)**:
   - Securely expose vetted lawyer search endpoints for external integration to monetize the legal intelligence directory.

## 10. Troubleshooting
- **Port Conflicts**: Use `lsof -i :3000` to find hanging processes and `kill -9 <PID>` to clear. Ports: directory=3000, admin=3001, publish=3002.
- **Workspace Root Warning**: If Next.js warns about lockfile resolution, ensure `experimental.turbopack.root` is set in both `next.config.js` files to the monorepo root.
- **Supabase Fetch Errors (ENOTFOUND)**:
  - **Symptom**: `TypeError: fetch failed` with `getaddrinfo ENOTFOUND <project-id>.supabase.co`.
  - **Cause**: Remote Supabase project is paused (free tier auto-pauses after inactivity) or removed.
  - **Remote Fix**: Log into [Supabase Dashboard](https://supabase.com/dashboard/project/jayjejqjswxtksvwoqxp) and unpause/restore the project.
  - **Local Fix**: Start Docker daemon, run `pnpm supabase start`, and update `.env.local` to point to `http://127.0.0.1:54321`.
- **Migrations**: Always run `sed` filters to isolate schema changes when the remote DB is already populated.
- **Brand Press Payment Flow Not Working**:
  - Ensure `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` and `PAYSTACK_SECRET_KEY` are set in `apps/publish/.env.local`
  - Check Paystack callback URL: `${NEXT_PUBLIC_SITE_URL}/brand-press/payment?reference=BP-XXXX`
  - Verify the transaction row was created in the `transactions` table
  - If Paystack modal doesn't open, check browser console for JS errors
- **Transactional Emails Not Sending**:
  - Ensure `RESEND_API_KEY` is set in both `apps/publish/.env.local` and `apps/admin/.env.local`
  - Check `ADMIN_EMAIL` is set correctly
  - Emails silently fail on `.catch(() => {})` — check Resend dashboard for delivery status
  - Resend free tier: 100 emails/day, 3,000 emails/month limit
- **Edge Function Not Publishing**:
  - Deploy with: `supabase functions deploy publish-scheduled --no-verify-jwt`
  - Set `RESEND_API_KEY` in Supabase project's Function secrets
  - Verify cron trigger: `supabase functions cron list`
  - Edge function queries: `status='pending_review' AND payment_status='paid' AND scheduled_date <= now()`
- **Admin Dashboard Login**:
  - **URL**: `http://localhost:3001/login`
  - **Credentials**: The admin uses Supabase Auth. No default password exists — admins are managed in the `profiles` table.
  - **Existing Users** (from Supabase Auth):
    - `lawyardmtc@gmail.com` → profile role: `admin` (password set via Supabase Auth)
    - `tomideadeoye@gmail.com` → profile role: `client`
  - **To make a user admin**: Update the `profiles` table — `UPDATE profiles SET role = 'admin' WHERE id = '<user-uuid>';`
  - **To reset a password**: Use the Supabase dashboard Auth > Users > select user > Update Password, or use the service_role API via `supabase.auth.admin.updateUserById()`
  - **Role check**: The `proxy.ts` middleware enforces `profiles.role === 'admin'`. Non-admins are signed out and redirected.
- **Login Button Not Working**:
  - The `SubmitButton` component (`apps/admin/app/login/submit-button.tsx`) uses `className="btn btn-primary"` with inline styles instead of the `Button` component from `@repo/ui/components/button`. This is okay for now but inconsistent with the rest of the UI.
  - If the button doesn't respond, check the browser console for JS/hydration errors. The form uses a Next.js Server Action (`login` from `./actions.ts`).
- **Supabase Auth Users** (as of 2026-06-12):
  | Email | ID | Profile Role |
  |-------|-----|--------------|
  | lawyardmtc@gmail.com | `8251d905-...` | admin |
  | tomideadeoye@gmail.com | `db5eeb97-...` | client |
- **Publish App Dev Server**: `cd apps/publish && pnpm dev` — runs on port 3002
  - Edit page at `http://localhost:3002` and changes hot-reload
  - Build: `pnpm build --filter=publish` (all 14 routes build clean)
  - Tailwind v4 classes only — no shadcn UI in publish app (custom components)
- **Remote Supabase Instance**:
  - **URL**: `https://jayjejqjswxtksvwoqxp.supabase.co`
  - **Dashboard**: https://supabase.com/dashboard/project/jayjejqjswxtksvwoqxp
  - **Service role key**: stored in `apps/admin/.env.local` and `apps/directory/.env.local`
  - **Anon key**: stored in both `.env.local` files (safe for client-side use)
- **Local Supabase Setup**:
  - CLI is installed (v2.93.0 via pnpm) and `supabase/config.toml` is pre-configured.
  - Requires Docker. Run `pnpm supabase start` to spin up local Postgres + Auth + Storage + Studio.
  - Update both `.env.local` files to point to `http://127.0.0.1:54321` instead of the remote URL.
  - **No seed.sql exists** — local DB starts empty. Dump remote data first or run migrations.

*Document last updated by Orion Sovereign AI on 2026-06-12.*

# Lawyard v2 — Master Checklist

> **Context**: This monorepo builds three apps — `publish` (lawyard.org media platform), `directory` (directory.lawyard.org), `admin` (admin dashboard) — sharing one Supabase project. WordPress is the legacy platform at lawyard.org. 
> 
> **External systems**: 
> - **Newsletter Render app** at `newsletter-my9b.onrender.com` — standalone web app that fetches articles from WordPress, provides a web editor for curating newsletters, previews, approves, and sends via Brevo. Uses signed tokens (`v1.{base64_date}.{hmac}`) for edition access.
> - **Slack Bot** (separate system) — posts editor links to Slack, notifies when editions are ready for review.
> - **Brevo** (Sendinblue) — handles actual email campaign delivery.

---

## 🚨 1. Email Platform — Architecture Discovery

**Current state (what's actually running)**:

```
WordPress (content source)
    ↓ (WP REST API)
Newsletter Render App (newsletter-my9b.onrender.com)
    ↓ (fetches articles, generates HTML)
Web Editor (signed token → /newsletter/editor/{token})
    ↓ (Preview → Approve → Send Now)
Brevo API (campaign delivery)
    ↑ (Slack notifications about ready/sent editions)
Slack Bot
```

**The Render app** does:
1. `/newsletter/test-generate` — fetches articles from WordPress REST API by date range, selects via AI/LLM curation, creates a signed editor token
2. `/newsletter/editor/{token}` — web UI with:
   - TOP STORIES section (carousel)
   - WEEKLY UPDATES section (10 articles, drag-to-reorder)
   - AVAILABLE ARTICLES pool
   - Preview Email, Approve, Send Now buttons
3. On approve: creates Brevo campaign, schedules send
4. Article data embedded as JS variable with WordPress post IDs, URLs, titles, excerpts, categories

**New codebase has**: Resend configured via `packages/api/src/email.ts` with 6 transactional email functions. No Brevo integration.

**Needed**:
- [ ] **Decision**: Keep Brevo for newsletters (maintain Render app) OR replace everything with Resend + built-in admin campaign builder
- [ ] **If keeping Brevo**: 
  - [ ] Update Render app to fetch from OUR Supabase instead of WordPress
  - [ ] OR build a new Render API endpoint in our apps that the Render app can consume
  - [ ] Add Brevo SDK (`@getbrevo/brevo`) to packages/api for newsletter subscriber sync
- [ ] **If replacing**: 
  - [ ] Build newsletter campaign builder in admin dashboard
  - [ ] Port editor features: article selection, preview, approve/send workflow
  - [ ] Migrate existing Brevo contacts to newsletter_subscribers table
  - [ ] Retire Render app + Slack Bot dependency

---

## 🔐 2. Authentication & User Flows

**Current state**: Supabase Auth configured with Google OAuth. Admin login exists. No password flows implemented.

- [ ] **Forgot password / Reset password**: Supabase Auth has built-in `supabase.auth.resetPasswordForEmail()` — wire UI pages at `/auth/forgot-password` and `/auth/reset-password` in both publish and directory apps
- [ ] **Email verification flow**: Configure email templates in Supabase Auth dashboard, wire confirmation redirect
- [ ] **Magic link login**: Optional — add `signInWithOtp()` for passwordless email login
- [ ] **Multiple admin users**: Currently single admin. Need role-based access (supabase role). 
- [ ] **Admin password reset**: Add "forgot password" link on admin login page

---

## ✍️ 3. WYSIWYG Editor

**Current state**: No content editor exists. Articles are entered as plain text (or via DB directly).

- [ ] **Evaluate options**: Tiptap (ProseMirror), Slate, Quill, or TinyMCE
- [ ] **Tiptap recommended** (open-source, React-native, extensible, good with Next.js)
- [ ] **Install**: `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-image`, `@tiptap/extension-link`
- [ ] **Build components**: EditorToolbar, ImageUpload, Embed, Link dialog
- [ ] **Media library**: Supabase Storage bucket for article images; upload + browse UI
- [ ] **Wire to admin article create/edit pages**: Server action saves HTML content to `articles.content`
- [ ] **Render on frontend**: Use `dangerouslySetInnerHTML` (sanitized) in article detail page

---

## 📰 4. Newsletter System

**Current state**: Simple subscriber collection in `newsletter_subscribers` table. `sendNewsletter()` function in `@repo/api/email` sends individually via Resend. Slack Bot handles the full lifecycle externally.

### Phase 1 — Admin Campaign Builder
- [ ] Admin page at `/newsletters` with list of past campaigns
- [ ] **Compose campaign**: Subject line, HTML body editor (or auto-generate from recent articles)
- [ ] **Auto-generate from articles**: Fetch last N published articles, format into template
- [ ] **Preview**: Show rendered email before sending
- [ ] **Send to all active subscribers**: Batch via Resend (one-by-one, free tier 100/day)
- [ ] **Campaign history**: Store sent campaigns in a `newsletter_campaigns` table

### Phase 2 — Scheduled & Automated
- [ ] **Weekly digest cron**: Supabase edge function runs weekly, auto-generates digest from recent articles, sends to subscribers
- [ ] **Scheduled send**: Set a future date/time for a campaign
- [ ] **Brevo integration** (if keeping Brevo): Send via Brevo API (campaigns) instead of Resend

### Phase 3 — Slack Integration
- [ ] Incoming webhook in apps that the existing Slack Bot can POST to
- [ ] Endpoint receives: `{ subject, html, preview_text }`, stores as draft campaign
- [ ] Endpoint to approve/send: `POST /api/newsletter/approve` triggers send
- [ ] Or reverse: Build a Bolt Slack app that queries our Supabase for articles

---

## 🎙️ 5. Podcasts & Media Hosting

**Current state**: All media is externally linked (YouTube URLs, direct file URLs). No self-hosted audio/video.

### Podcast Options
- [ ] **Option A: Supabase Storage** — Store audio files in a `podcasts` bucket. 1GB free. Use signed URLs for access.
- [ ] **Option B: Cloudinary** — Optimized video/audio streaming, auto-transcoding, CDN. Free tier 25GB storage.
- [ ] **Option C: Mux** — Professional video hosting with adaptive bitrate streaming. Free tier has watermark.
- [ ] **Option D: AWS S3 + CloudFront** — Most scalable, cheapest at scale, more setup.
- [ ] **Option E: Keep YouTube embed** for video (current), use Supabase Storage for audio-only podcasts

### Needed
- [ ] **RSS feed for podcast distribution**: Generate podcast RSS feed at `/podcast.xml` for Apple Podcasts, Spotify, etc.
- [ ] **Audio player improvements**: Waveform visualizer, speed controls, skip forward/back
- [ ] **Video player improvements**: HLS streaming if using Mux/S3
- [ ] **Upload flow**: Admin → upload to storage → create podcast record
- [ ] **Podcast hosting migration**: Plan for moving existing externally-linked episodes to self-hosted

---

## 💳 6. Payment Integration

**Current state**: Paystack configured in all apps. Directory app has pricing tiers and webhook. Shop has cart + checkout flow. Brand Press has Paystack integration.

### Directory Payments
- [ ] **Verify webhook endpoint** at `apps/directory/app/api/webhooks/paystack/route.ts` is deployed and accessible
- [ ] **Test full flow**: Select tier → Paystack → callback → webhook → subscription tier updated
- [ ] **Handle webhook retries**: Idempotency key for Paystack events
- [ ] **Subscription expiry**: Add `subscription_end_date` to profiles, edge function to check/downgrade expired subs
- [ ] **Invoice/receipt generation**: After successful payment, send email receipt with details

### Shop Payments (Publish App)
- [ ] **Checkout page**: Currently `/checkout` exists — verify it works with Paystack
- [ ] **Payment callback**: `/shop/payment` exists — verify it processes correctly
- [ ] **PDF delivery**: After payment, grant access to download legislation PDF
- [ ] **PDF file hosting**: Where are the actual PDF files? Need Supabase Storage bucket for legislation PDFs
- [ ] **Download flow**: Authenticated + paid users can download; signed URLs with expiry

### Brand Press Payments
- [ ] **End-to-end test**: Submit → Paystack → callback → payment verified → admin review → publish/schedule
- [ ] **Payment receipts**: Send proper invoice/receipt email after payment
- [ ] **Refund flow**: Admin can refund via Paystack dashboard + update DB

---

## 📋 7. Directory App — Full Flow Audit

**Current state**: Lawyer directory with profiles, search, pricing, content publishing.

- [ ] **Lawyer signup flow**: Register → create profile → choose tier → pay → listing goes live
- [ ] **Chambers/Expert applications**: Application form → admin review → approval → listing
- [ ] **Listing verification**: 
  - [ ] `verified` field is hardcoded to `true` (TASK-03) — fix to reflect actual verification status
  - [ ] `featured` field is hardcoded to `false` (TASK-01) — wire to actual featured status
- [ ] **Content Studio**: Publish form exists but doesn't submit to server action (TASK-02) — wire it up
- [ ] **Search refinements**: Location filter, budget filter, rating filter, practice area filter
- [ ] **Lawyer CRUD in admin**: Sidebar link still `href="#"` (TASK-07, gap #34)
- [ ] **Admin metadata update**: Still says "Create Next App" (TASK-04)
- [ ] **Avatar upload to Supabase Storage**: Currently Gravatar-only
- [ ] **Listing approval workflow**: Admin verification UI for new lawyer/chamber applications

---

## 🌐 8. Domain & DNS Configuration

- [ ] **Primary domain**: `lawyard.org` → point to publish app hosting (Vercel)
- [ ] **Subdomain**: `directory.lawyard.org` → point to directory app hosting
- [ ] **Admin subdomain** (optional): `admin.lawyard.org` → point to admin app
- [ ] **DNS records**: 
  - [ ] `A` or `CNAME` records for each domain
  - [ ] `TXT` records for domain verification (Vercel, Google, Resend/Brevo)
  - [ ] `MX` records for email delivery
- [ ] **SSL certificates**: Auto via Vercel (Let's Encrypt)
- [ ] **WordPress redirects**: 301 redirects from old URLs to new ones (critical for SEO)
- [ ] **Vercel deployment**: 
  - [ ] `apps/publish` → `lawyard.org`
  - [ ] `apps/directory` → `directory.lawyard.org`
  - [ ] `apps/admin` → password-protected or VPN-only
  - [ ] Set all env vars in Vercel for each project

---

## 📱 9. Mobile Optimization

- [ ] **Audit all pages** on mobile viewport (320px, 375px, 414px)
- [ ] **Header**: Hamburger menu exists but verify on all breakpoints
- [ ] **Article cards**: Stack vertically on mobile (check `ArticleCard` grid variant)
- [ ] **Tables**: Legislation detail, shop — add horizontal scroll on mobile
- [ ] **Forms**: Contact, Brand Press submit, newsletter — full-width inputs on mobile
- [ ] **Navigation menus**: Category/Media/Features dropdowns — work on mobile?
- [ ] **Podcast/TV players**: Responsive width
- [ ] **Cart/Checkout**: Full-width on mobile
- [ ] **Images**: `next/image` with responsive `sizes` attribute
- [ ] **Touch targets**: Buttons/links at least 44x44px
- [ ] **Performance**: Lighthouse audit for mobile — target 90+ Performance score

---

## 🔄 10. WordPress Content Migration

**Current state**: 38MB `wp-posts.csv` file exists with exported WordPress data. `migrate-wp-posts.ts` script exists.

- [ ] **Audit migration script**: `apps/directory/scripts/migrate-wp-posts.ts` — test it against Supabase
- [ ] **Map categories**: WordPress categories → article categories, preserve slugs
- [ ] **Migrate users**: WordPress users → Supabase Auth (email + hashed password won't work — force password reset)
- [ ] **Migrate articles**: Title, content (HTML), excerpt, featured image, author, date, slug
- [ ] **Migrate podcasts**: Media URL, title, description, date
- [ ] **Migrate comments**: WordPress comments → new comments table
- [ ] **Migrate subscribers**: Newsletter subscribers from WordPress/Brevo → `newsletter_subscribers` table
- [ ] **301 redirects**: Old WordPress URLs (`/archives/123`, `/category/news/`) → new URLs (`/insights/slug`, `/category/news`)
- [ ] **SEO preservation**: Verify OG tags, meta descriptions, canonical URLs, sitemap submissions
- [ ] **Image migration**: WordPress media library → Supabase Storage or Cloudinary

---

## 🏷️ 11. Brand Press — Full Workflow

**Current state**: Payment → admin approve/reject in dashboard works. No Slack integration for approval.

- [ ] **Slack approval workflow**: 
  - [ ] When new Brand Press submitted, post notification to Slack channel
  - [ ] Slack approve/reject buttons via interactive components
  - [ ] Webhook receiver in apps to handle Slack button clicks
  - [ ] On approve: update status, send email, optionally schedule
- [ ] **Scheduled publishing**: Edge function `publish-scheduled` needs deploying
- [ ] **Media upload for Brand Press**: Featured image upload from submitter (currently URL-only)
- [ ] **Edit/resubmit after rejection**: Currently rejected submissions dead-end
- [ ] **Discount/coupon codes**: Fixed pricing only — add promo code system
- [ ] **Analytics**: Revenue by tier, approval rate, average time to review
- [ ] **Bulk approve/reject**: Multi-select in admin
- [ ] **Payment receipts**: Post-payment invoice email

---

## 🖼️ 12. SEO & Structured Data

- [ ] **JSON-LD** for articles (`NewsArticle` schema)
- [ ] **JSON-LD** for podcasts (`PodcastEpisode` schema)
- [ ] **JSON-LD** for organization (`LegalService` / `Organization` schema)
- [ ] **JSON-LD breadcrumbs** on article detail, category, legislation pages
- [ ] **Dynamic OG images**: Generate per-article OG images (Vercel OG or `@vercel/og`)
- [ ] **Meta descriptions**: All pages have them (check current — some pages may be missing)
- [ ] **Canonical URLs**: Prevent duplicate content issues
- [ ] **robots.txt**: Currently not present — create one
- [ ] **Sitemap submission**: Submit `/sitemap.xml` to Google Search Console + Bing Webmaster Tools

---

## 🛠️ 13. Admin App Gaps

- [ ] **Lawyer CRUD**: List/search lawyers, update profiles, approve/reject listings
- [ ] **Article CRUD**: WYSIWYG editor, manage all articles, create/edit/delete
- [ ] **Subscriber management**: 
  - [ ] List all subscribers with date subscribed
  - [ ] Export CSV
  - [ ] Growth chart (using recharts already in dependencies)
- [ ] **Newsletter campaign builder** (see section 4)
- [ ] **Brand Press management** (approve/reject done, but see section 11)
- [ ] **Audit log**: Who approved/rejected what, when
- [ ] **Analytics dashboard**: Article views, subscriber growth, revenue
- [ ] **Media library**: Upload + browse images for articles
- [ ] **Role-based access**: Super admin vs moderator
- [ ] **Password reset**: Forgot password on admin login page

---

## 🧪 14. Testing & Quality

- [ ] **Unit tests**: Jest/Vitest setup for shared packages (`@repo/api`, `@repo/ui`)
- [ ] **Component tests**: Storybook or Testing Library for UI components
- [ ] **E2E tests**: Playwright for critical flows (article browse → read, cart → checkout, brand press submit)
- [ ] **CI/CD**: GitHub Actions — lint → typecheck → test → build
- [ ] **Error monitoring**: Sentry or similar for all apps
- [ ] **Uptime monitoring**: Better Uptime or similar for lawyard.org

---

## 🏗️ 15. Infrastructure & Deploy

- [ ] **Supabase migrations**: Run `supabase db push` to apply pending migrations (brand_press + contact_messages)
- [ ] **Edge function deploy**: `supabase functions deploy publish-scheduled --no-verify-jwt`
- [ ] **Cron trigger**: `supabase functions cron create "0 * * * *" --function publish-scheduled`
- [ ] **Supabase secrets**: Set `RESEND_API_KEY` in Supabase project
- [ ] **Local dev setup**: Docker Compose for local Supabase, `seed.sql` for reproducible dev data
- [ ] **Vercel projects**: Create 3 projects (publish, directory, admin) in Vercel dashboard
- [ ] **Vercel env vars**: Add all .env.local vars to each Vercel project
- [ ] **Backup strategy**: Supabase backups (pro plan has daily backups)

---

## 🧠 Priority Recommendations

| Tier | What | Why |
|------|------|-----|
| **P0 — Now** | Domain DNS + Vercel deploy | Site not live without this |
| **P0 — Now** | Supabase migrations (`supabase db push`) | Brand Press columns don't exist in prod DB |
| **P0 — Now** | Edge function deploy + cron | Scheduled publishing won't work |
| **P0 — Now** | Email decision (Brevo vs Resend) | All email flows blocked without this |
| **P1 — This week** | Forgot password + auth flows | User-facing, basic feature |
| **P1 — This week** | WordPress content migration | All old content is in WordPress |
| **P1 — This week** | 301 redirects | Critical SEO — don't lose Google rankings |
| **P1 — This week** | WYSIWYG editor | Admin can't create articles |
| **P2 — This sprint** | Newsletter campaign builder | Replace Slack Bot dependency |
| **P2 — This sprint** | Full payment flow test + PDF delivery | Shop is not revenue-ready |
| **P2 — This sprint** | Brand Press Slack integration | They already use this workflow |
| **P3 — Next sprint** | Podcast hosting + RSS | Distribution to Apple/Spotify |
| **P3 — Next sprint** | Mobile audit + fixes | Broader UX pass |
| **P3 — Next sprint** | SEO (JSON-LD, OG images) | Search ranking improvements |
| **P4 — Backlog** | Admin analytics dashboard | Nice-to-have metrics |
| **P4 — Backlog** | Testing infrastructure | Important but not blocking launch |
| **P4 — Backlog** | PWA, notifications, comments | Future features |

---

## Quick Answers to Your Questions

### What email platform do they currently use?
**Brevo** (formerly Sendinblue). Confirmed by "Brevo Campaign ID: 3" in your Slack Bot output. The legacy WordPress site sends newsletters via Brevo API. Your new codebase has **Resend** configured instead.

### How does the current newsletter workflow work?
External **Slack Bot** (not in this repo) fetches articles from WordPress, generates a newsletter preview, posts it to Slack for approval. When approved (by shefiuam or you), it sends via Brevo API at 9:00 AM WAT. The bot tracks editions, prevents double-sends.

### How to connect this to our build?
Three options: (1) Build a new Slack app that queries our Supabase instead of WordPress, (2) Build webhook endpoints in our apps for the existing bot to call, (3) Replace the Slack workflow entirely with an admin dashboard newsletter builder.

### Forgot password?
Supabase Auth supports it natively: `supabase.auth.resetPasswordForEmail()`. Just need to wire the UI pages and configure email templates in Supabase Auth dashboard.

### Podcast/media hosting?
Recommend starting with **Supabase Storage** for audio (free 1GB) and keeping YouTube embed for video. Upgrade to **Cloudinary** or **Mux** when you outgrow it.

### Domain setup
Point `lawyard.org` → Vercel (publish app), `directory.lawyard.org` → Vercel (directory app). Set up SSL via Vercel. Create 301 redirects from old WordPress URLs before pointing DNS to avoid broken links.
