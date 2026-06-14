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
