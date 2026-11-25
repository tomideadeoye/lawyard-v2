import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { ownsLegislation } from "@/lib/shop/entitlement";

/**
 * Signed download for a purchased legislation.
 *
 * Three gates, in order: signed in → paid for this act → file exists. The bucket
 * is private, so the URL we hand back expires and cannot be shared usefully.
 */
export const dynamic = "force-dynamic";

const LINK_TTL_SECONDS = 120;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const site = process.env.NEXT_PUBLIC_SITE_URL || "https://directory.lawyard.org";
    return NextResponse.redirect(`${site}/login?message=${encodeURIComponent("Sign in to download your purchase.")}`);
  }

  const admin = createServiceRoleClient();

  const { data: legislation } = await admin
    .from("legislations")
    .select("slug, title, file_path")
    .eq("slug", slug)
    .maybeSingle();

  if (!legislation) {
    return NextResponse.json({ error: "Unknown legislation" }, { status: 404 });
  }

  if (!legislation.file_path) {
    return NextResponse.json(
      { error: "This legislation has no file yet. Contact support for a copy." },
      { status: 409 }
    );
  }

  const { data: purchases } = await admin
    .from("transactions")
    .select("status, plan_role, metadata")
    .eq("user_id", user.id)
    .eq("status", "success")
    .eq("plan_role", "legislation_buyer");

  if (!ownsLegislation(purchases ?? [], slug)) {
    return NextResponse.json({ error: "No purchase found for this legislation" }, { status: 403 });
  }

  const { data: signed, error } = await admin.storage
    .from("legislations")
    .createSignedUrl(legislation.file_path, LINK_TTL_SECONDS, {
      download: `${legislation.title}.pdf`,
    });

  if (error || !signed?.signedUrl) {
    console.error("[legislation download] signing failed:", error?.message);
    return NextResponse.json({ error: "Could not prepare the download" }, { status: 500 });
  }

  return NextResponse.redirect(signed.signedUrl);
}
