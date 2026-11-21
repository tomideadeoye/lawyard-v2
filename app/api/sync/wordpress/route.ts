import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { syncWordPress } from "@/lib/wordpress-sync";

/**
 * Scheduled WordPress → articles sync.
 *
 * Runs from a Vercel cron every 15 minutes, so a story published in WordPress is
 * on the new site within a quarter of an hour without anyone running a script.
 * Guarded by CRON_SECRET; Vercel sends it as a bearer token automatically.
 *
 * The sync is additive: it never overwrites a row that already exists.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  return header === `Bearer ${secret}`;
}

async function run(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncWordPress({ limit: 100 });
    if (result.inserted > 0) {
      // The front page and category pages are dynamic, but these two carry a
      // cache; drop it so new stories appear immediately.
      revalidatePath("/");
      revalidatePath("/insights");
    }
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[sync/wordpress]", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "sync failed" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}
