import { createClient } from "@supabase/supabase-js";
import { ShopClient } from "./ShopClient";

export const dynamic = "force-dynamic";

/**
 * The shop lists the catalogue, but only legislation whose file exists is
 * purchasable. Availability comes from the database, so publishing a PDF is an
 * upload, not a deploy.
 */
export default async function ShopPage() {
  let availableSlugs: string[] = [];

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
      { auth: { persistSession: false } }
    );
    const { data } = await supabase
      .from("legislations")
      .select("slug")
      .not("file_path", "is", null)
      .limit(1000);
    availableSlugs = (data ?? []).map((row) => row.slug as string);
  } catch (error) {
    console.error("[shop] catalogue unavailable:", error);
  }

  return <ShopClient availableSlugs={availableSlugs} />;
}
