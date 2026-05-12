# LAWYARD v2 SYSTEM ARCHITECTURE (Zero-Dependency Protocol)

## 1. Stack Foundation
- **Framework**: Next.js 15+ (App Router), Tailwind CSS v4.
- **Database/Auth**: Supabase (PostgreSQL + RLS).
- **UI System**: Shadcn UI + Premium HSL Tokens (Royal Blue/Gold).
- **Architecture**: Monorepo (pnpm workspaces + Turborepo).

## 2. Core Modules
- **/apps/directory**: Public-facing marketplace & discovery engine.
- **/apps/control-plane**: Admin management & governance portal.
- **/packages/api**: Unified Zod schemas, database client, and business logic.

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
  - **Deployment URL**: https://vercel.com/tomideadeoyes-projects/lawyard-v2
- **Supabase**: Hosted PostgreSQL, Edge Functions for CRON-job based Newsletter distribution, and Storage (buckets for media).
- **Database Management**: Migrations are handled via `supabase db push` / `query` for ad-hoc schema patches.

## 6. Maintenance & Operational Rules
- **Zero-Dependency**: Do not re-introduce external CMS (WordPress). All content is internal.
- **Theming**: Use `--primary` (Royal Blue) and `--accent` (Gold) for brand consistency. Never hardcode colors.
- **Authentication**: Always require `await` on Next.js 15 `searchParams` and `params`.
- **Ports**: 
    - Control Plane: 3000
    - Directory: 3001

## 7. Troubleshooting
- **Port Conflicts**: Use `lsof -i :3000` to find hanging processes and `kill -9 <PID>` to clear.
- **Connection Issues**: If `ENOTFOUND` occurs, check if the Supabase Project is paused in the dashboard.
- **Migrations**: Always run `sed` filters to isolate schema changes when the remote DB is already populated.