// Main-domain safety net for Supabase email links (signup confirmation, magic
// link, password recovery).
//
// Why this exists: the canonical auth host is directory.lawyard.org — that is the
// only deployment with the callback handler (app/directory/auth/callback/route.ts,
// reached via the middleware rewrite). But Supabase emails do not always honour
// the `emailRedirectTo` we ask for: if the value is missing from the project's
// "Redirect URLs" allow-list, Supabase silently falls back to its configured
// Site URL. That URL is still https://www.lawyard.org, which today serves the old
// WordPress install — a 404 plus a WordPress search form. The user fills in the
// form and nobody ever receives it.
//
// So when an auth link lands on a host that isn't the directory, forward the
// whole query string (code / token_hash / type / next / category) to the
// directory and let the real handler run there. Fragments are preserved by the
// browser on a 3xx response, so implicit-flow tokens survive the hop too.
//
// Upstream: Supabase auth emails.
// Downstream: https://directory.lawyard.org/auth/callback → session exchange.

import { NextResponse } from 'next/server'

const DIRECTORY_ORIGIN = process.env.NEXT_PUBLIC_DIRECTORY_URL || 'https://directory.lawyard.org'

export async function GET(request: Request) {
  const { search } = new URL(request.url)
  const target = `${DIRECTORY_ORIGIN}/auth/callback${search}`

  console.warn('[auth/callback] Link landed on a non-directory host — forwarding to', target)
  return NextResponse.redirect(target, 302)
}
