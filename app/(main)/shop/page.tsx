import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { LEGISLATIONS } from "@/lib/legislations";
import { filterCatalogue, paginate, PAGE_SIZE } from "@/lib/shop/catalogue";
import { ShopGrid } from "@/components/shop/shop-grid";

export const dynamic = "force-dynamic";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

interface ShopParams {
  q?: string;
  letter?: string;
  availability?: string;
  sort?: string;
  page?: string;
}

function hrefFor(params: ShopParams, overrides: Partial<ShopParams>) {
  const merged = { ...params, ...overrides };
  const search = new URLSearchParams();
  if (merged.q) search.set("q", merged.q);
  if (merged.letter) search.set("letter", merged.letter);
  if (merged.availability === "available") search.set("availability", "available");
  if (merged.sort && merged.sort !== "title") search.set("sort", merged.sort);
  if (merged.page && merged.page !== "1") search.set("page", merged.page);
  const qs = search.toString();
  return qs ? `/shop?${qs}` : "/shop";
}

/**
 * Storefront.
 *
 * 420 titles in one grid made a 1 MB page; filters and paging now happen on the
 * server so the page stays small and every view is linkable.
 */
export default async function ShopPage({ searchParams }: { searchParams: Promise<ShopParams> }) {
  const params = await searchParams;

  let availableSlugs: string[] = [];
  let prices = new Map<string, number>();

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
      { auth: { persistSession: false } }
    );
    const { data } = await supabase.from("legislations").select("slug, price, file_path").limit(1000);
    for (const row of data ?? []) {
      prices.set(row.slug as string, Number(row.price));
      if (row.file_path) availableSlugs.push(row.slug as string);
    }
  } catch (error) {
    console.error("[shop] catalogue unavailable:", error);
  }

  const catalogue = LEGISLATIONS.map((item) => ({
    ...item,
    price: prices.get(item.slug) ?? item.price,
  }));

  const filtered = filterCatalogue(
    catalogue,
    {
      query: params.q,
      letter: params.letter,
      availability: params.availability === "available" ? "available" : "all",
      sort: (params.sort as "title" | "price-asc" | "price-desc") ?? "title",
    },
    new Set(availableSlugs)
  );

  const page = paginate(filtered, Number(params.page ?? 1));
  const lettersWithContent = new Set(catalogue.map((item) => item.title[0]?.toUpperCase()));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <header className="mb-10">
          <h1 className="text-4xl font-black font-serif tracking-tight">Legislations</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Nigerian statutes, downloadable as PDF. {availableSlugs.length > 0
              ? `${availableSlugs.length} available now; the rest are being prepared.`
              : "The archive is being prepared — titles appear here as their files are added."}
          </p>
        </header>

        <form method="get" className="mb-8 flex flex-wrap items-end gap-3 rounded-xl border border-border/60 bg-card/40 p-4">
          <label className="flex-1 min-w-[220px] text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Search
            <input
              type="search"
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Act name"
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal normal-case tracking-normal text-foreground"
            />
          </label>

          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Sort
            <select
              name="sort"
              defaultValue={params.sort ?? "title"}
              className="mt-1 block rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal normal-case tracking-normal text-foreground"
            >
              <option value="title">Title A–Z</option>
              <option value="price-asc">Price low → high</option>
              <option value="price-desc">Price high → low</option>
            </select>
          </label>

          <label className="flex items-center gap-2 pb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <input
              type="checkbox"
              name="availability"
              value="available"
              defaultChecked={params.availability === "available"}
              className="h-4 w-4 rounded border-border"
            />
            Available only
          </label>

          {params.letter && <input type="hidden" name="letter" value={params.letter} />}

          <button
            type="submit"
            className="rounded-lg bg-accent px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-accent-foreground hover:bg-accent/90"
          >
            Apply
          </button>
          {(params.q || params.letter || params.availability || params.sort) && (
            <Link href="/shop" className="pb-2 text-xs font-semibold text-muted-foreground hover:text-foreground">
              Reset
            </Link>
          )}
        </form>

        <nav aria-label="Filter by letter" className="mb-8 flex flex-wrap gap-1.5">
          <Link
            href={hrefFor(params, { letter: undefined, page: "1" })}
            className={`rounded px-2.5 py-1 text-[11px] font-bold uppercase ${
              !params.letter ? "bg-accent text-accent-foreground" : "border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            All
          </Link>
          {ALPHABET.map((letter) => {
            const enabled = lettersWithContent.has(letter);
            return enabled ? (
              <Link
                key={letter}
                href={hrefFor(params, { letter, page: "1" })}
                className={`rounded px-2.5 py-1 text-[11px] font-bold ${
                  params.letter === letter
                    ? "bg-accent text-accent-foreground"
                    : "border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {letter}
              </Link>
            ) : (
              <span key={letter} className="rounded px-2.5 py-1 text-[11px] font-bold text-muted-foreground/30">
                {letter}
              </span>
            );
          })}
        </nav>

        <p className="mb-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {page.total} {page.total === 1 ? "title" : "titles"}
          {params.letter ? ` starting with ${params.letter}` : ""}
          {params.q ? ` matching “${params.q}”` : ""}
        </p>

        {page.items.length === 0 ? (
          <div className="rounded-xl border border-border/60 bg-card p-12 text-center text-muted-foreground">
            Nothing matches those filters.
          </div>
        ) : (
          <ShopGrid products={page.items} availableSlugs={availableSlugs} />
        )}

        {page.totalPages > 1 && (
          <nav aria-label="Pagination" className="mt-16 flex items-center justify-center gap-2 text-xs font-bold">
            {page.page > 1 && (
              <Link href={hrefFor(params, { page: String(page.page - 1) })} className="rounded border border-border px-3 py-1.5">
                ← Previous
              </Link>
            )}
            <span className="px-2 text-muted-foreground">
              Page {page.page} of {page.totalPages}
            </span>
            {page.page < page.totalPages && (
              <Link href={hrefFor(params, { page: String(page.page + 1) })} className="rounded border border-border px-3 py-1.5">
                Next →
              </Link>
            )}
          </nav>
        )}

        <p className="mt-10 text-center text-[11px] text-muted-foreground">
          Showing up to {PAGE_SIZE} per page.
        </p>
      </div>
    </div>
  );
}
