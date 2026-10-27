-- Product Owner board — pending product questions for Tobi Adebowale
-- Access: token-gated page (app/product-owner), no login required.
-- Reads/writes go server-side only via createServiceRoleClient().
create table if not exists public.product_questions (
  id uuid primary key default gen_random_uuid(),
  question_key text not null unique,
  title text not null,
  body text,
  options jsonb not null default '[]'::jsonb,
  answer_text text,
  answer_choice text,
  status text not null default 'open' check (status in ('open','answered','insight')),
  source text,
  created_at timestamptz not null default now(),
  answered_at timestamptz
);

alter table public.product_questions enable row level security;
-- deliberately NO anon policies: the board is reachable only through the
-- token-gated server route, which uses the service role client.

insert into public.product_questions (question_key, title, body, options, source) values
  ('Q1','Chamber subscription model — seat-based or flat?', 'Confirmed as per member lawyer (seat-based). Is that right, or flat per chamber?', '["Per member lawyer (seat-based)","Flat per chamber","Other — will type below"]'::jsonb,'C01'),
  ('Q2','Premium Single (Lawyer, 365d) — NGN price?', null, '[]'::jsonb,'pre-existing'),
  ('Q3','Premium Package (Lawyer, 365d) — NGN price?', null, '[]'::jsonb,'pre-existing'),
  ('Q4','Premium Single (Client, 90d) — NGN price?', null, '[]'::jsonb,'pre-existing'),
  ('Q5','Premium Package (Client, 90d) — NGN price?', null, '[]'::jsonb,'pre-existing'),
  ('Q6','Premium (Chamber, 365d) — NGN price?', null, '[]'::jsonb,'pre-existing'),
  ('Q7','Scrap the 60-minute corporate-post clash detection?', 'Currently disallows two corporate posts within the same 60-minute window around a scheduled date.', '["Keep it","Scrap it","Other — will type below"]'::jsonb,'pre-existing'),
  ('Q8','Silver category — which items stay vs get added?', null, '[]'::jsonb,'C21'),
  ('Q9','Enterprise / law-firm annual — exact NGN figure?', 'Range heard on the call was ₦3–5M. Confirm the exact figure.', '["₦3,000,000","₦4,000,000","₦5,000,000","Other — will type below"]'::jsonb,'C04'),
  ('Q10','"Take out the link to directory" — remove what exactly?', 'Remove the Link Directory feature itself, or a badge/attribution?', '["Remove Link Directory feature","Remove the badge/attribution","Other — will type below"]'::jsonb,'C13'),
  ('Q11','Booking fee amount (client → Lawyard before slot confirmed)', null, '[]'::jsonb,'C15')
on conflict (question_key) do nothing;
