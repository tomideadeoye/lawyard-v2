import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * Error sink.
 *
 * Accepts a small JSON payload from the client reporter and from server route
 * handlers, and writes one row to `app_errors`. Rate-limited per instance so a
 * render loop cannot fill the table; the route is deliberately tolerant — an
 * error log that fails loudly is worse than one that drops a duplicate.
 */
export const runtime = "nodejs";

const MAX_PER_MINUTE = 40;
const seen = new Map<string, { count: number; resetAt: number }>();

function overBudget(key: string): boolean {
  const now = Date.now();
  const entry = seen.get(key);
  if (!entry || now > entry.resetAt) {
    seen.set(key, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_PER_MINUTE;
}

const trim = (value: unknown, max: number) =>
  typeof value === "string" ? value.slice(0, max) : undefined;

export async function POST(request: Request) {
  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const message = trim(payload.message, 2000);
  if (!message) return NextResponse.json({ ok: false }, { status: 400 });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (overBudget(ip)) return NextResponse.json({ ok: true, dropped: true });

  const supabase = createServiceRoleClient();

  const { error } = await supabase.from("app_errors").insert({
    level: payload.level === "warning" ? "warning" : "error",
    source: payload.source === "server" ? "server" : "client",
    message,
    stack: trim(payload.stack, 8000),
    path: trim(payload.path, 500),
    method: trim(payload.method, 12),
    status: typeof payload.status === "number" ? payload.status : null,
    digest: trim(payload.digest, 200),
    user_agent: trim(request.headers.get("user-agent"), 500),
    context: typeof payload.context === "object" && payload.context !== null ? payload.context : null,
  });

  if (error) {
    // The table is provisioned by migration 20261121000001_app_errors.sql. Until
    // it is applied, drop the write quietly: a missing log must never surface as
    // a second error to the user, and the console line keeps it visible to us.
    const missingTable = error.code === "42P01" || /does not exist/i.test(error.message);
    console.error(`[api/errors] insert failed${missingTable ? " (apply 20261121000001_app_errors.sql)" : ""}:`, error.message);
    return NextResponse.json({ ok: true, stored: false }, { status: 200 });
  }

  return NextResponse.json({ ok: true });
}
