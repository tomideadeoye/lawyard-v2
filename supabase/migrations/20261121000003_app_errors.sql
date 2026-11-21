-- Application error log.
--
-- Vercel Analytics shows traffic and Core Web Vitals, not exceptions. This table
-- is the record of what actually broke, written by the client error reporter and
-- by the server route handlers so failures stop being invisible.

create table if not exists public.app_errors (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  level text not null default 'error' check (level in ('error', 'warning')),
  source text not null default 'client' check (source in ('client', 'server')),
  message text not null,
  stack text,
  path text,
  method text,
  status integer,
  user_id uuid,
  user_agent text,
  digest text,
  context jsonb
);

create index if not exists app_errors_created_at_idx on public.app_errors (created_at desc);
create index if not exists app_errors_source_idx on public.app_errors (source);

alter table public.app_errors enable row level security;

-- Writes go through the service-role key in /api/errors. No public policy means
-- anon and authenticated users cannot read or write this table directly.
