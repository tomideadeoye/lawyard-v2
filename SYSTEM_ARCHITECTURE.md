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