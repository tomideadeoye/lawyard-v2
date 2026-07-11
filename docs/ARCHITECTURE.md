# Lawyard Directory — Architecture

## Overview
Legal directory + legal media platform for Nigeria. Dual-site on a single Vercel deployment:
- **Main site** (`lawyard.org`): Legal news, opinions, podcasts, TV, corporate posts, shop
- **Directory** (`directory.lawyard.org`): Searchable lawyer/chamber directory with subscriptions, payments, inquiries
- **Admin portal** (`/admin`): Content management, lawyer verification, transactions, coupons, settings

## Tech Stack
| Layer | Technology |
|---|---|
| Framework | Next.js 16.2 (App Router, Turbopack) |
| Language | TypeScript 5.9, React 19.2 |
| Styling | Tailwind CSS 4.2, shadcn/ui, Radix UI |
| Database | Supabase PostgreSQL (project: `jayjejqjswxtksvwoqxp`) |
| Auth | Supabase Auth (email/password, magic link, Google OAuth, LinkedIn OIDC) |
| Payments | Paystack (NGN) |
| Email | Resend (transactional), Brevo (marketing/SMTP) |
| CAPTCHA | Cloudflare Turnstile |
| Rich text | Tiptap |
| Client state | TanStack Query |
| Chat/Ops | Slack webhooks + interactive buttons |

## Domain Architecture
- Single Vercel project `lawyard-v2` serves both sites via host-based rewrites
- `vercel.json` routes `directory.lawyard.org/*` → `/directory/*`
- Middleware also handles host rewrite via `x-forwarded-host`
- Production URL: `https://directory.lawyard.org`

## Auth Flow
**4-hop Delayed Auth Chain** preserves user journey through signup:
1. `/directory/add-listing` → `/directory/signup?redirect=...&category=X`
2. `signup-form.tsx` builds callback with `window.location.origin`
3. `/directory/auth/callback` exchanges OAuth code, appends `?category=X`
4. Add-listing restores category from URL

**Auth client flavors:**
- Browser: `createBrowserClient()` — `'use client'` components
- Server: `createServerClient()` — server components, actions, handlers
- Service role: `createServiceRoleClient()` — bypass RLS, webhooks + admin

**Supabase Auth email webhook:** `/api/auth/send-email` (HMAC-SHA256 signed) handles magic link, confirmation, recovery emails via Brevo SMTP instead of Supabase built-in.

## External Services
| Service | Env Vars | Purpose |
|---------|----------|---------|
| Supabase | `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | DB, Auth, Storage, Edge Functions |
| Paystack | `PAYSTACK_SECRET_KEY`, `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Nigerian payments |
| Resend | `RESEND_API_KEY` | Transactional emails |
| Brevo | `BREVO_API_KEY`, `BREVO_PROD/TEST_LIST_ID` | Marketing, SMTP |
| Slack | `SLACK_WEBHOOK_*`, `DIRECTORY_SLACK_SIGNING_SECRET` | Notifications, approvals |
| WordPress | `WP_API_URL`, `WP_USERNAME`, `WP_APP_PASSWORD` | Article syndication |
| Google OAuth | — (GC Console: Directory Signin project) | Social login |
| Turnstile | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | CAPTCHA |

## Database
37+ tables across: directory listings (`profiles`, `lawyers`, `chambers`, `specialties`), content (`articles`, `podcasts`), payments (`transactions`, `plans`, `coupons`), engagement (`bookmarks`, `reviews`, `inquiries`, `verifications`), newsletter (`subscribers`, `campaigns`), system (`app_settings`).

**Triggers:** `handle_new_user()` creates profile on auth signup, `sync_profile_to_lawyer()` syncs profile fields, `sync_role_to_app_metadata()` puts role in JWT, `recalc_lawyer_rating()` updates rating on review changes.

## Deployment
- **Platform:** Vercel (auto-deploy from GitHub pushes to `main`)
- **Package manager:** pnpm
- **Build:** `pnpm build`
- **Supabase Edge Function:** `publish-scheduled` — hourly cron, publishes scheduled corporate posts + auto-approves stale articles

## Key Env Notes
- `NEXT_PUBLIC_SITE_URL` controls all canonical URLs, callback URLs, email logo URLs, Slack links
- Local: `http://localhost:3000` (`.env.local`)
- Production: `https://directory.lawyard.org` (Vercel env)

## Google OAuth (Google Cloud Console)
- **Project:** Directory Signin
- **Client:** "Lawyard Directory" (Web application)
- **JS origins:** `http://localhost:3000`, `https://directory.lawyard.org`
- **Redirect URIs:** Supabase callback + `/directory/auth/callback` for both localhost and production

## Supabase Auth URL Config
- **Site URL:** `https://directory.lawyard.org`
- **Redirect URLs:** `http://localhost:3000/**`, `https://directory.lawyard.org/**`
