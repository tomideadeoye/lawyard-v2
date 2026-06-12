# Lawyard Admin

Administrative backend for the Lawyard v2 legal directory platform.

## Stack

- **Framework**: Next.js 16.2 (App Router)
- **Auth**: Supabase Auth (email/password, Google OAuth)
- **Database**: Supabase Postgres (remote: `jayjejqjswxtksvwoqxp.supabase.co`)
- **UI**: Tailwind CSS v4 + Shadcn UI components from `@repo/ui`

## Getting Started

```bash
pnpm dev    # Starts on port 3000
```

## Login

- **URL**: http://localhost:3000/login
- **Admin email**: lawyardmtc@gmail.com
- **Password**: admin123

## Architecture

- `proxy.ts` — Auth guard middleware (enforces admin role check)
- `app/login/` — Login page + server actions
- `app/(dashboard)/` — Admin pages (lawyers, subscribers, content)
- `lib/supabase/` — Supabase client utilities (server, client, admin)

## Supabase Admin Access

- **Dashboard**: https://supabase.com/dashboard/project/jayjejqjswxtksvwoqxp
- **Service role key**: in `.env.local` (full admin access to DB)

## Troubleshooting

- **Login not working**: Check `proxy.ts` is active (rename to `middleware.ts` if Next.js stops picking it up)
- **Supabase paused**: Unpause at the Supabase dashboard
- **Port conflict**: `lsof -i :3000` then `kill -9 <PID>`
