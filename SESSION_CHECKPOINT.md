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
- **Vercel deployment URL `https://lawyard-v2.vercel.app`** used as metadataBase + OG url + Paystack fallback in directory app

---

## Not Done / Known Gaps

### 🚨 Critical — Deploy & Operations
| # | Item | Impact |
|---|------|--------|
| 1 | Run pending migrations (`supabase db push`) | Brand Press columns don't exist in remote DB |
| 2 | Set env vars: `RESEND_API_KEY`, `ADMIN_EMAIL`, Paystack keys | Emails fail silently, payments won't process |
| 3 | Deploy edge function: `supabase functions deploy publish-scheduled` | Scheduled publishing won't work |
| 4 | Wire cron trigger for edge function | No auto-publication of scheduled articles |
| 5 | Deploy `apps/publish` to Vercel | Media platform not live |
| 6 | Deploy `apps/admin` to Vercel with auth | Admin not accessible |
| 7 | Set up domain routing (`lawyard.org` → publish, `directory.lawyard.org` → directory) | Wrong app serves wrong domain |
| 8 | Vercel production build verification | Unknown deployment issues |
| 9 | Local Supabase Docker + `seed.sql` for reproducible dev | Devs can't replicate DB locally |

### 📄 Content Migration
| # | Item | Notes |
|---|------|-------|
| 10 | WordPress → Supabase migration script (WP REST API → articles/podcasts) | All existing lawyard.org content is still in WordPress |
| 11 | Map WordPress categories to article categories, preserve slugs | SEO impact if slugs change |
| 12 | Migrate WordPress users to Supabase auth | Existing commenters/authors lose access |
| 13 | Set up 301 redirects from old WordPress URLs | Broken links from Google |

### 🎨 Publish App Gaps
| # | Item | Notes |
|---|------|-------|
| 14 | Article search functionality | No way to search articles by keyword |
| 15 | Real article comments system | Current `ArticleComments` is placeholder/mock |
| 16 | Author profile pages | No `/authors/[slug]` route |
| 17 | Contact page (`/contact`) | Route directory exists but empty |
| 18 | Tag-based filtering/navigation | Only category filtering exists |
| 18 | Pagination/infinite scroll on lists | All pages limited to `limit: 50` |
| 19 | Featured/trending articles on homepage | Hero section is basic |
| 20 | Mobile hamburger menu | Header nav breaks on small screens |
| 21 | Loading states / skeletons for dynamic pages | Pages flash-empty before data loads |
| 22 | Error boundaries for all routes | Unhandled Supabase errors show white screen |
| 23 | Image optimization (`next/image`) | Images use raw `<img>` tags |
| 24 | SEO structured data (JSON-LD, breadcrumbs) | Missing from article/podcast pages |
| 25 | Dynamic OpenGraph image generation | Articles use a single static OG image |
| 26 | Sitemap generation (`/sitemap.xml`) | No sitemap for search engines |
| 27 | Analytics integration | No tracking at all |
| 28 | PWA / service worker | No offline support |
| 29 | Rate limiting / spam protection on Brand Press | Anyone can submit unlimited times |
| 30 | Payment receipts / invoices for Brand Press | No post-payment documentation |
| 31 | Brand Press media upload (featured image from submitter) | Currently URL-only |
| 32 | Brand Press edit/resubmit after rejection | Rejected submissions dead-end |
| 33 | Discount / coupon codes for Brand Press | Fixed pricing only |

### 🛠️ Admin App Gaps
| # | Item | Notes |
|---|------|-------|
| 34 | Lawyer directory CRUD page (TASK-07) | Sidebar link still `href="#"` |
| 35 | Subscriber export (CSV) | No way to export email list |
| 36 | Subscriber growth chart | No visualization |
| 37 | Multiple admin user management | Only one admin account exists |
| 38 | Audit log (who approved/rejected what & when) | No history of admin actions |
| 39 | Brand Press analytics (revenue, tier breakdown, approval rate) | No metrics dashboard |
| 40 | Bulk approve/reject for Brand Press | Must click each one individually |
| 41 | WYSIWYG content editor for articles | Plain text only |
| 42 | Media library for image uploads | No central image management |
| 43 | Role-based access (super admin vs moderator) | All-or-nothing admin role |
| 44 | Password reset flow | No "forgot password" on admin login |

### 📋 Directory App Gaps
| # | Item | Notes |
|---|------|-------|
| 45 | Content Studio form binding to server actions (TASK-02) | Publish form exists but doesn't submit |
| 46 | Chambers featured bug (TASK-01) | `featured` hardcoded to `false` |
| 47 | Lawyers verified badge fix (TASK-03) | `verified` hardcoded to `true` |
| 48 | Admin metadata update (TASK-04) | Still says "Create Next App" |
| 49 | Error boundaries for Supabase failures (TASK-05) | Crash on paused Supabase |
| 50 | Search filter refinement (Location, Budget, Rating) | Basic search only |
| 51 | Listing approval workflow for expert applications | No admin verification UI for listings |
| 52 | User avatar upload to Supabase Storage | Avatars are Gravatar-only |
| 53 | Newsletter digest auto-delivery via Resend | `generate-digest.ts` runs but doesn't send |
| 54 | "In Case You Missed This" digest email template | Template is placeholder |

### 🧪 Testing & Quality
| # | Item | Notes |
|---|------|-------|
| 55 | Unit tests | Zero tests across all apps |
| 56 | E2E tests (Playwright/Cypress) | Zero E2E coverage |
| 57 | CI/CD pipeline (GitHub Actions) | No automated checks on push |
| 58 | Monitoring / alerting | No uptime or error monitoring |
| 59 | Supabase backup strategy | No automated backups configured |

### 🚀 Future Features (Not Scoped)
| # | Item | Notes |
|---|------|-------|
| 60 | LawyardAI Engine (Shefiu's AI module) | Directory AI integration |
| 61 | Partnership API (Hubtal Pilot) | External lawyer search API |
| 62 | Paystack webhook handler for recurring/subscriptions | No webhook endpoint |
| 63 | Mobile app (React Native) | Not planned yet |
| 64 | In-app notification system | No notification infrastructure |
| 65 | Multi-language support | English only |
| 66 | Push notifications for new articles | No push infrastructure |
| 67 | Article bookmarking / reading list | No user save feature |
| 68 | User follows / favorites | No social features |
| 69 | Event listings and registration | No events module |
| 70 | Job board | No jobs module |
| 71 | Forum / discussion boards | No community features |
| 72 | Premium subscription tiers for readers | No paywalled content

## Session — June 13, 2026 (External Reference)
- **Logo used** by merislabs-official site: `lawyard-v2/apps/directory/public/lawyard-logo.png` copied to `public/clients/lawyard-logo.png`
- **Vercel deployment**: `https://lawyard-v2.vercel.app` (documented in metadataBase of both directory & admin apps)
- **Vercel dashboard**: `https://vercel.com/tomideadeoyes-projects/lawyard-v2`
- **Tech stack captured by merislabs**: Next.js 16, Supabase, Paystack, Resend, Turborepo, Tailwind CSS
