import Link from "next/link";
import { getChambers } from "@/lib/directory/api";
import { ListingAvatar } from "@/components/directory/ListingAvatar";
import { TERMS } from "@/lib/constants";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Law Firms — Lawyard Directory`,
  description: `Browse ${TERMS.firm.lowerPlural} listed in the Lawyard legal directory.`,
};

export default async function ChamberIndexPage() {
  let chambers = [] as Awaited<ReturnType<typeof getChambers>>;

  try {
    chambers = await getChambers({});
  } catch (error) {
    console.error("Error loading chambers:", error);
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <header className="mb-10">
        <h1 className="text-3xl font-black tracking-tight text-foreground">{TERMS.firm.plural}</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          {chambers.length > 0
            ? `${chambers.length} ${chambers.length === 1 ? TERMS.firm.singular.toLowerCase() : TERMS.firm.lowerPlural} listed in the directory.`
            : `No ${TERMS.firm.lowerPlural} have been listed yet.`}
        </p>
      </header>

      {chambers.length === 0 ? (
        <div className="rounded-xl border border-border/60 bg-card p-10 text-center">
          <h2 className="text-lg font-bold text-foreground">Be the first firm listed</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            A firm page carries your practice areas, people, contact details and hours — and links your lawyers&apos;
            profiles together.
          </p>
          <Link
            href="/add-listing?category=chamber"
            className="mt-5 inline-block rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-accent-foreground hover:bg-accent/90"
          >
            List your firm
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {chambers.map((chamber) => (
            <Link
              key={chamber.id}
              href={`/chamber/${chamber.id}`}
              className="flex items-start gap-4 rounded-xl border border-border/60 bg-card p-5 no-underline transition-colors hover:border-accent/50"
            >
              <ListingAvatar name={chamber.name} type="chamber" src={(chamber as { image_url?: string | null }).image_url ?? undefined} />
              <div className="min-w-0">
                <h2 className="truncate font-bold text-foreground">{chamber.name}</h2>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{chamber.focus || chamber.location || "—"}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
