# LAWYARD v2 SYSTEM ARCHITECTURE (Zero-Dependency Protocol)
**Status**: ACTIVE | **Phase**: 2 (Directory Rebuild & Native Migration) | **Architecture**: Monorepo (Supabase-Native)

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
- **Framework**: Next.js 15+ (App Router), Tailwind CSS v4.
- **Database/Auth**: Supabase (PostgreSQL + RLS).
- **UI System**: Shadcn UI + Premium HSL Tokens (Royal Blue/Gold).
- **Architecture**: Monorepo (pnpm workspaces + Turborepo).

## 2. Core Modules
- **/apps/directory**: Public-facing marketplace & discovery engine.
- **/apps/control-plane**: Admin management & governance portal.
- **/packages/api**: Unified Zod schemas, database client, and business logic.
- **/packages/ui**: Shared design system (Tailwind CSS v4 + Shadcn UI).
  - `src/components/` — Centralized shadcn components (button, card, tabs, checkbox, input, label, separator).
  - `src/lib/utils.ts` — Shared `cn()` utility (clsx + tailwind-merge).
  - `src/styles/globals.css` — Single source of truth for `@theme {}` tokens, CSS custom properties, and premium utility classes (`.glass`, `.premium-card`, `.mesh-gradient`, etc.).

## 3. Data Flow (The Protocol)
- **Native Content Engine**: Replaced legacy WordPress with native `articles` and `podcasts` tables.
- **Onboarding**: Role-based signup (`lawyer` vs `client`) with automatic `profiles` synchronization via DB triggers.
- **Search Intelligence**: High-fidelity filtering (Location, Specialty, Rating, Price, Experience).

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
- **Turbopack Workspace Root**: Explicitly configured in `apps/directory/next.config.js` and `apps/control-plane/next.config.js` via `experimental.turbopack.root` to prevent Next.js from resolving stray lockfiles outside the monorepo.
- **Tailwind v4 Monorepo Setup**:
  - Theme tokens (`@theme {}`, HSL variables, custom utilities) live once in `packages/ui/src/styles/globals.css`.
  - Each app's `globals.css` imports the shared CSS and uses `@source` to scan both local components and the shared UI package — ensuring Tailwind generates utility classes for all files regardless of which workspace they're in.
  - No `tailwind.config.*` files; all configuration is CSS-first via `@theme` and `@source` directives.
- **Proxy Routing**: Middleware replaced with `proxy.ts` (Next.js 16+ convention) in `apps/directory/proxy.ts` for session handling.
- **Zero-Dependency**: Do not re-introduce external CMS (WordPress). All content is internal.
- **Theming**: Use `--primary` (Royal Blue) and `--accent` (Gold) for brand consistency. Never hardcode colors.
- **Authentication**: Always require `await` on Next.js 15 `searchParams` and `params`.
- **Ports**: 
    - Control Plane: 3000
    - Directory: 3001

## 7. Accomplished Transitions (WordPress-to-Supabase)
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


## 9. Pending Roadmap
1. **Resolve Local Port Conflicts**:
   - Fix persistent `EADDRINUSE` on port 3001 by configuring a script to auto-kill zombie Next.js/Node processes before booting the dev server.

2. **Connect Content Studio Form Submissions**:
   - Bind form inputs on `apps/directory/app/dashboard/publish/page.tsx` to Supabase server actions for direct dashboard publishing.

3. **Implement Email Delivery for Friday Digest**:
   - Connect `generate-digest.ts` to an email provider (Resend or AWS SES) and configure a weekly cron job (Supabase Edge Function or GitHub Actions) to blast the aggregated digest on Friday mornings.

4. **Deploy LawyardAI Engine**:
   - Integrate with Shefiu's AI module to allow directory subscribers to auto-generate starting drafts for their legal articles.

5. **Expose Partnership API (Hubtal Pilot)**:
   - Securely expose vetted lawyer search endpoints for external integration to monetize the legal intelligence directory.

## 10. Troubleshooting
- **Port Conflicts**: Use `lsof -i :3000` to find hanging processes and `kill -9 <PID>` to clear.
- **Workspace Root Warning**: If Next.js warns about lockfile resolution, ensure `experimental.turbopack.root` is set in both `next.config.js` files to the monorepo root.
- **Supabase Fetch Errors (ENOTFOUND)**:
  - **Symptom**: `TypeError: fetch failed` with `getaddrinfo ENOTFOUND <project-id>.supabase.co`.
  - **Cause**: Remote Supabase project is paused (free tier auto-pauses after inactivity) or removed.
  - **Remote Fix**: Log into [Supabase Dashboard](https://supabase.com/dashboard/project/jayjejqjswxtksvwoqxp) and unpause/restore the project.
  - **Local Fix**: Start Docker daemon, run `pnpm supabase start`, and update `.env.local` to point to `http://127.0.0.1:54321`.
- **Migrations**: Always run `sed` filters to isolate schema changes when the remote DB is already populated.

*Document last updated by Orion Sovereign AI on 2026-05-21.*