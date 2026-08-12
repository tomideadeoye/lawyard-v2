# Lawyard Content Workflow Documentation

## Architecture Overview

Three content types flow through a common Slack-based editorial approval pipeline:

1. **Articles** — Lawyers publish via dashboard → Slack approve → WordPress
2. **Corporate Posts** — Anyone with coupon submits via form → Slack approve → WordPress
3. **Podcasts** — Lawyers publish via dashboard → Slack approve → WordPress

All three converge on: **Supabase → Slack notification with Approve/Deny → WordPress publish**

---

## Content Type Details

### Articles (`/directory/dashboard/publish`)

| Step | File | What Happens |
|------|------|-------------|
| Submit | `components/directory/forms/PublishArticleForm.tsx` | Lawyer fills form with title, content, categories, image, schedule date (using DatePicker from corporate-posts), and a **coupon code** |
| Validate coupon | `app/actions/validate-coupon.ts` | Checks `coupons` table for valid `free` coupon (TEST, PARTNER1, PARTNER2) |
| Create | `app/directory/actions/content.ts` → `publishArticle()` | Inserts article into Supabase `articles` table with `author_id: user.id`, `status: pending_review` |
| Slack | `lib/slack.ts` → `postArticleToSlackWithButtons()` | Sends rich notification with View, Approve, Deny, Editor buttons |
| Approve | `app/api/slack/interactions/route.ts` → `approve_article` | Calls `publishArticleToWordPress()`, updates article to `published` |
| WordPress | `lib/wordpress.ts` → `publishArticleToWordPress()` | Creates WordPress post with meta `{ source: 'lawyard-v2-directory' }` |
| Deny | `app/api/slack/interactions/route.ts` → `deny_article` | Sets article status to `archived` |
| Rescind | `app/api/slack/interactions/route.ts` → `rescind_article` | Reverts WordPress post to draft, sets article back to `pending_review` |

**Key files:** `PublishArticleForm.tsx`, `content.ts`, `slack.ts`, `interactions/route.ts`, `wordpress.ts`

---

### Corporate Posts (`/corporate-posts/submit`)

| Step | File | What Happens |
|------|------|-------------|
| Submit | `app/directory/corporate-posts/submit/page.tsx` | Guest or lawyer fills form with title, content, brand name, tier, image, schedule date, coupon code, payment method |
| Auth detection | `app/actions/corporate-posts.ts` | Checks if user is logged in — captures `author_id`, `submitterName` for lawyers |
| Clash detection | `app/actions/corporate-posts.ts` | Checks 60-min window around scheduled date for conflicts |
| Coupon/Payment | `app/actions/corporate-posts.ts` | Validates coupon, routes to Paystack or free submission |
| Create | `app/actions/corporate-posts.ts` → `submitCorporatePost()` | Inserts article + transaction record, sends Slack notification |
| Slack | `lib/slack.ts` → `postCorporatePostToSlackWithButtons()` | Shows submitter name if lawyer, brand + tier info |
| Approve | `app/api/slack/interactions/route.ts` → `approve_corporate_post` | Calls `publishCorporatePostToWordPress()`, sends approval email |
| WordPress | `lib/wordpress.ts` → `publishCorporatePostToWordPress()` | Author: 4 (Lawyard Staff), Category: 7358 (Corporate Posts), Tags: `corporate-posts`, brand name, tier. Meta: `brand_name`, `tier`, `contact_email`, `author_name` |
| Image upload | `app/api/upload/corporate-posts/route.ts` | Uses `createServiceRoleClient()` (bypasses RLS) |
| Deny | `interactions/route.ts` → `deny_corporate_post` | Archives article |
| Rescind | `interactions/route.ts` → `rescind_corporate_post` | Reverts WordPress post to draft + article to `pending_review` |

**Key files:** `corporate-posts.ts`, `submit/page.tsx`, `slack.ts`, `interactions/route.ts`, `wordpress.ts`, `upload/corporate-posts/route.ts`

---

### Podcasts (`/directory/dashboard/publish`)

| Step | File | What Happens |
|------|------|-------------|
| Submit | `components/directory/forms/PublishPodcastForm.tsx` | Lawyer fills title, media URL, type (audio/video), description |
| Create | `app/directory/actions/content.ts` → `publishPodcast()` | Inserts into Supabase `podcasts` table, returns `id` |
| Slack | `lib/slack.ts` → `postPodcastToSlackWithButtons()` | Rich notification with View/Approve/Deny/Editor |
| Approve | `interactions/route.ts` → `approve_podcast` | Calls `publishPodcastToWordPress()`, updates podcast to `published` |
| WordPress | `lib/wordpress.ts` → `publishPodcastToWordPress()` | Embeds audio/video player, Category: 22 (Lawyard Podcasts), Tags: `podcast`, author name |
| Deny | `interactions/route.ts` → `deny_podcast` | Archives podcast |
| Rescind | `interactions/route.ts` → `rescind_podcast` | Sets podcast back to `pending_review` |

**Key files:** `PublishPodcastForm.tsx`, `content.ts`, `slack.ts`, `interactions/route.ts`, `wordpress.ts`

---

## Shared Infrastructure

### Slack Approval System

All content types use a shared `reviewActions()` helper (`lib/slack.ts:116`) that generates four buttons:

```
[View] [Approve] [Deny] [Editor]
```

Action IDs follow the pattern: `{action}_{type}` where type is `article`, `corporate_post`, or `podcast`.

After approval, the Slack message is updated with a "View on WordPress" link and "Rescind" button.

**Link button handlers** (`interactions/route.ts:323`): Return 200 immediately to prevent Slack showing 400 errors for URL buttons.

---

### WordPress Publishing (`lib/wordpress.ts`)

**Shared function:** `publishPostWithImage()` handles:
- Post creation with title, content, excerpt, status
- Image upload from remote URL to WordPress media library
- Tag creation (auto-creates tags if they don't exist via `ensureTag()`)
- Custom meta fields

**Type-specific publish functions:**

| Function | Author | Category | Tags | Meta |
|----------|--------|----------|------|------|
| `publishArticleToWordPress` | (none) | (none) | (none) | `source: lawyard-v2-directory` |
| `publishCorporatePostToWordPress` | ID 4 (Lawyard Staff) | 7358 (Corporate Posts) | `corporate-posts`, brand, tier | `source`, `brand_name`, `tier`, `contact_email`, `author_name` |
| `publishPodcastToWordPress` | ID 4 | 22 (Lawyard Podcasts) | `podcast`, author name | `source`, `media_type`, `media_url` |

**Post rescind:** `updateWordPressPostStatus(postId, 'draft')` reverts WordPress post to draft.

---

### Coupon System

| Coupon | Type | Limits | Description |
|--------|------|--------|-------------|
| `TEST` | free | Unlimited | Test code — free Corporate Post or Article |
| `PARTNER1` | free | 7-day cooldown | Partner post — one free per week |
| `PARTNER2` | free | 7-day cooldown | Partner post — one free per week |

**Validation:** `app/actions/validate-coupon.ts` checks the `coupons` table for matching code, active status, max uses, and frequency limits.

**Usage:**
- Corporate posts: Coupon code entered in submit form, validated in `submitCorporatePost()`
- Articles: Coupon code required in `PublishArticleForm`, validated in `publishArticle()`

---

### Auth Hooks (Password Reset / Magic Link / Signup Confirmation)

**Purpose:** Intercept Supabase Auth emails and send them through Brevo API with click tracking disabled.

**Flow:**
1. Supabase triggers Auth Hook → POST to `https://directory.lawyard.org/api/auth/hook`
2. Hook receives `{ user, email_data }` containing `token_hash`, `email_action_type`, `redirect_to`
3. Constructs confirmation URL: `{site_url}/auth/v1/verify?token={token_hash}&type={action_type}`
4. Generates email HTML with Lawyard branding and CTA button
5. Sends via Brevo API with `trackClicks: false`
6. Returns `{ sendEmail: false }` to prevent Supabase from sending duplicate via SMTP

**Format fix:** Site URL is sanitized to prevent double `/auth/v1` in the confirmation URL.

**Logo:** `https://www.lawyard.org/wp-content/uploads/2026/07/logo-blue.png`

**Email templates:** The hook generates HTML directly (not using the `email-layout.ts` functions) to ensure the confirmation link is embedded correctly.

---

### Image Uploads

| Bucket | Used By | Allowed MIME Types | Auth |
|--------|---------|-------------------|------|
| `brand-press` | Corporate posts | png, jpeg, gif, webp, svg+xml, vnd.microsoft.icon, bmp, tiff | Service role (no RLS) |
| `article-images` | Dashboard articles | png, jpeg, gif, webp, svg+xml, vnd.microsoft.icon, bmp, tiff | Authenticated users |

Both buckets allow up to 2MB for articles, 500KB for corporate posts.

---

### Lawyer Profile Page (`/directory/lawyer/[id]`)

- Fetches published articles via `getArticles({ authorId: id })` (Supabase, `status: published`)
- Fetches published podcasts via `getPodcasts({ authorId: id })`
- Displays in "Published Insights" section
- Articles link to `/knowledge/{slug}`
- Corporate posts with `author_id` set will also appear here

---

### Key Environment Variables

| Variable | Used By |
|----------|---------|
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Paystack popup |
| `PAYSTACK_SECRET_KEY` | Paystack verification |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin operations |
| `DIRECTORY_SLACK_WEBHOOK` | Slack Approve/Deny notifications |
| `DIRECTORY_SLACK_SIGNING_SECRET` | Slack request verification |
| `WP_API_URL` | WordPress REST API |
| `WP_USERNAME` | WordPress API auth |
| `WP_APP_PASSWORD` | WordPress API auth |
| `BREVO_API_KEY` | Brevo transactional emails |
| `AUTH_SEND_EMAIL_HOOK_SECRET` | Supabase Auth Hook secret (format: `v1,whsec_...`) |
| `NEXT_PUBLIC_SITE_URL` | Base URL for links |

---

### Storage Buckets in Supabase

- `brand-press` — Corporate post featured images
- `article-images` — Article featured images
- `coupons` — Coupon codes for publishing

---

### Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| Slack buttons return 400 | URL buttons with `action_id` hit unhandled route | Add action_id to link button handlers list |
| WordPress tags fail | Passing tag strings instead of integer IDs | Use `ensureTag()` to create/lookup tags by name |
| Email links broken | Brevo click tracking wraps Supabase confirmation URLs | Disable click tracking via `trackClicks: false` in Brevo API calls |
| Auth emails not sent | Supabase Auth Hook secret format wrong | Use `v1,whsec_<base64>` format (no space after comma) |
| Image upload RLS violation | Using anon key client instead of service role | Use `createServiceRoleClient()` for upload endpoints |
| Dashboard URL 404s | `/directory/dashboard` double-rewritten by middleware | Use `/dashboard` instead of `/directory/dashboard` |
| Category array error | Passing string instead of array | Use `['Category Name']` for `TEXT[]` columns |
