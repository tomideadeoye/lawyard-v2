# Session Checkpoint: Monorepo → Flat Single App
**Date**: 2026-06-15 | **Session**: Merge + Flatten

## Current Status: 🔄 Vercel build pending

The monorepo has been collapsed into a single Next.js app at repo root. Three route groups share one Vercel project.

---

## Key Milestones Completed

### Structural Changes
- **Full merge**: admin + directory merged into publish app as `/admin` and `/directory` route groups
- **Monorepo stripped**: `turbo.json`, `pnpm-workspace.yaml`, `apps/`, `packages/` all removed
- **Supabase unified**: single `lib/supabase/` (server.ts, client.ts, middleware.ts, admin.ts) replaces three separate instances
- **All imports rewritten**: `@repo/*` → `@/*` across 100+ files
- **Flattened to root**: `apps/publish/*` moved to repo root (app/, components/, lib/, config/, data/, package.json, tsconfig.json, next.config.js, vercel.json, postcss.config.js)
- **Local build succeeds**: `pnpm build` — TypeScript OK, 458+ pages

### Theme Fix
- **Globals.css**: Defined missing CSS custom properties (`--background`, `--foreground`, `--primary`, etc.) for both light and dark modes. `bg-background`/`text-foreground` now resolve correctly.
- **PostCSS**: Removed stale `base` path from monorepo nesting.

### Vercel Config
- Single project `lawyard-v2` (team `merislabs`)
- `rootDirectory=null`, `buildCommand=pnpm build`, `installCommand=pnpm install`
- Git push triggers auto-deploy (Hobby tier, slow builds)

### Docs Updated
- README.md — flat structure, single app commands
- project_structure.md — full rewrite
- system_architecture_read_me_reference_patterns_start_here.md — updated stack, modules, config, troubleshooting
- AGENT_TASKS.md — fixed file paths
- SESSION_CHECKPOINT.md — this file

---

## Route Map

| Route | Group | Purpose |
|-------|-------|---------|
| `/` | (main) | Media platform homepage |
| `/insights` | (main) | Blog index |
| `/admin` | admin | Dashboard |
| `/admin/login` | admin | Admin login |
| `/admin/content` | admin | Content manager |
| `/admin/lawyers` | admin | Lawyers CRUD |
| `/admin/subscribers` | admin | Subscriber management |
| `/directory` | directory | Legal marketplace |
| `/directory/search` | directory | Lawyer search |
| `/directory/lawyer/[id]` | directory | Lawyer profile |
| `/directory/dashboard` | directory | User dashboard |
| `/directory/login` | directory | Login |
| `/directory/signup` | directory | Signup |
| `/directory/pricing` | directory | Pricing tiers |

---

## Commands

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Dev server (port 3000) |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `vercel --prod` | Deploy to Vercel |

---

## Known Issues

1. **Vercel Hobby tier slow** — builds take 15-25 min. Consider upgrading to Pro ($20/mo) for faster builds.
2. **Missing env vars on Vercel** — only Supabase URL/anon key are set. Missing: `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAIL`, `RESEND_API_KEY`, `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`, `PAYSTACK_SECRET_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
3. **No auth middleware for admin** — admin routes are unprotected.
4. **Supabase migrations not pushed** — Brand Press columns don't exist in remote DB.
5. **Edge function not deployed** — `publish-scheduled` is local only.

---

## Next Steps

1. Wait for Vercel build to complete from git push
2. Verify /, /admin, /directory on live site
3. Add middleware for subdomain rewrites (admin.lawyard.org → /admin, directory.lawyard.org → /directory)
4. Set missing env vars on Vercel project
5. Push Supabase migrations
6. Deploy edge function
