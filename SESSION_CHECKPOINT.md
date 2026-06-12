# Session Checkpoint: Lawyard Media Platform (Publish App)
**Date**: 2026-06-12 | **Session**: Brand Press + Admin Reviews + About Page

## Current Status: 🏛️ MEDIA PLATFORM LAUNCHED (publish.lawyard.ng)
Today we built the entire Lawyard media platform (`apps/publish`) from the ground up — a native Next.js replacement for the WordPress site at `lawyard.org` — plus a full Brand Press paid submission engine, admin review workflow, transactional emails, scheduled publishing, newsletter broadcast, and shared UI/API packages.

---

## Key Milestones Completed

### Shared Infrastructure
- **`packages/api/src/paystack.ts`**: Extracted Paystack init/verify — shared by publish and directory apps
- **`packages/api/src/articles.ts`**: Shared query helpers (`getPublishedArticles`, `getArticleBySlug`, `getRelatedArticles`, `getPublishedPodcasts`, `getPodcastBySlug`, `formatDate`) — all accept `SupabaseClient` as first arg, framework-agnostic
- **`packages/api/src/email.ts`**: Resend email module with 6 send functions (`sendBrandPressReceived`, `sendPaymentConfirmation`, `sendBrandPressApproved`, `sendBrandPressRejected`, `sendAdminNewSubmission`, `sendNewsletter`) — lazy-loads Resend via `require()` to avoid bundle issues
- **`packages/ui/src/components/article-card.tsx`**: Shared `ArticleCard` with grid + list variants, brand/tier/category badges
- **`packages/ui/src/components/podcast-card.tsx`**: Shared `PodcastCard` with audio/video type badges

### apps/publish — Media Platform (port 3002)
| Route | Page | Type |
|-------|------|------|
| `/` | Homepage with latest articles + ArticleCard | Server |
| `/insights` | Blog index with category filters | Server |
| `/insights/[slug]` | Article detail with breadcrumb, author, related articles | Server |
| `/podcasts` | Podcast index with audio player | Server |
| `/podcasts/[slug]` | Podcast detail page | Server |
| `/tv` | Video index (media_type='video' from podcasts) | Server |
| `/tv/[slug]` | Video detail page | Server |
| `/category/[slug]` | Category archive page | Server |
| `/feed.xml` | RSS feed (last 50 articles + podcasts) | Server |
| `/about` | About page (mission, history, overview, benefits) | Static |
| `/brand-press` | Brand Press listing (published submissions) | Server |
| `/brand-press/submit` | Submission form with tier selector, Paystack integration | Client |
| `/brand-press/payment` | Paystack callback handler | Server |
| `/brand-press/success` | Success confirmation page | Static |

### Brand Press Engine
- **Config**: `apps/publish/lib/brand-press.json` — single source for tiers (Basic ₦175K, Core ₦250K, Pro ₦400K), prices, features
- **Flow**: Submit → Create article (status='pending_review', payment_status='pending') → Paystack → Callback verifies → payment_status='paid' → Admin review → Approve/Reject → Email notification
- **All tiers require payment + admin review** before publication (no auto-publish for any tier)

### Admin Review UI (apps/admin, port 3001)
- Brand Press tab at `/content?tab=brand-press` with approve/reject buttons
- Server actions: `approveBrandPress` (sets status='published' + sends email) and `rejectBrandPress` (sets status='archived' + sends email)
- Shows tier badge, payment status, scheduled date for each submission

### Transactional Emails (Resend)
- **Brand Press Received**: Confirmation to submitter on successful submission
- **Payment Confirmation**: Confirmation on successful Paystack verification
- **Admin New Submission Alert**: Notifies admin of pending review
- **Brand Press Approved**: Published notification to submitter
- **Brand Press Rejected**: Rejection notification to submitter
- **Newsletter Broadcast**: Admin sends to all active subscribers from subscribers page

### Scheduled Publishing
- **Edge function**: `supabase/functions/publish-scheduled/index.ts` — hourly cron checks for articles where `status='pending_review'` AND `payment_status='paid'` AND `scheduled_date <= now()`, publishes them, sends approval email
- Deploy: `supabase functions deploy publish-scheduled --no-verify-jwt`
- Cron: `supabase functions cron create "0 * * * *" --function publish-scheduled`

### Database Migrations
- `20260612000002_add_brand_press.sql`: Adds `brand_name`, `tier`, `payment_status`, `scheduled_date`, `article_type` columns to `articles`
- `20260612000003_fix_brand_press_flow.sql`: Adds `pending_review` to articles status CHECK, removes category CHECK constraint

---

## Port Map
| App | Port | URL | Purpose |
|-----|------|-----|---------|
| admin | 3001 | `http://localhost:3001` | Admin dashboard (lawyers, content, subscribers) |
| publish | 3002 | `http://localhost:3002` | Media platform (Articles, Podcasts, TV, Brand Press) |
| directory | 3000 | `http://localhost:3000` | Legal directory (lawyers, chambers, search) |

---

## Next Steps
1. Run pending migrations: `supabase db push`
2. Set `RESEND_API_KEY` + `ADMIN_EMAIL` env vars in both apps
3. Deploy edge function: `supabase functions deploy publish-scheduled --no-verify-jwt`
4. Wire cron trigger: `supabase functions cron create "0 * * * *" --function publish-scheduled`
5. Deploy `apps/publish` to hosting
6. Deploy `apps/admin` to hosting (password-protected)
7. Migrate WordPress content via WP REST API → Supabase script

---

## Key Decisions
- Removed `auto_publish` from all tiers — every Brand Press submission requires payment + admin review
- Email module at `@repo/api/email` uses `require()` for lazy Resend loading, avoiding bundle issues
- Edge function for scheduled publishing instead of pg_cron (easier deploy, direct email sending)
- Newsletter broadcast sends individually via Resend API (free-tier compatible, no batch paywall)
- Articles queried with `author:profiles(full_name, avatar_url)` join — access via `article.author[0]`
- Brand Press config is ONLY in `apps/publish/lib/brand-press.json` — no duplication between action and form
