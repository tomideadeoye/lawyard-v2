import Image from "next/image";
import Link from "next/link";
import { getLawyers, getChambers, getSpecialties } from "@/lib/directory/api";
import { Lawyer, Chamber, Specialty } from "@/lib/api";
import { HeroSearchBar } from "@/components/directory/HeroSearchBar";
import { Building2 } from "lucide-react";
import { ListingAvatar } from "@/components/directory/ListingAvatar";

export const dynamic = "force-dynamic";

export default async function Home() {
  let specialties: Specialty[] = [];
  let lawyers: Lawyer[] = [];
  let chambers: Chamber[] = [];

  try {
    [specialties, lawyers, chambers] = await Promise.all([
      getSpecialties(),
      getLawyers({ featured: true }),
      getChambers({ featured: true }),
    ]);
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ============== HERO ============== */}
      <section className="relative w-full min-h-[760px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-slate-950 z-0" />

        <Image
          src="/hero-bg-v2.jpg"
          alt="Legal gavel on law books"
          fill
          priority
          className="object-cover object-center z-0 select-none pointer-events-none"
          sizes="100vw"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-900/55 to-slate-950/70 z-10" />

        {/* Ambient glow accents */}
        <div className="absolute -top-32 -left-32 w-[28rem] h-[28rem] bg-primary/15 rounded-full blur-[140px] pointer-events-none z-10" />
        <div className="absolute -bottom-32 -right-32 w-[28rem] h-[28rem] bg-accent/10 rounded-full blur-[140px] pointer-events-none z-10" />

        <div className="relative z-20 text-center px-6 max-w-5xl w-full flex flex-col items-center gap-8">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif italic font-bold text-white tracking-tight leading-[1.05] [text-shadow:0_4px_24px_rgba(0,0,0,0.45)]">
            Experienced Lawyers Are
            <br />
            <span className="text-accent dark:text-[#a77c5c]">Ready To Help</span>
          </h1>

          <p className="text-base md:text-lg text-white/80 max-w-2xl leading-relaxed">
            Nigeria's premier legal directory. Find verified lawyers, distinguished chambers, and trusted counsel across every practice area.
          </p>

          {/* Search Tabs */}
          <div className="flex items-center justify-center gap-8 md:gap-12 mt-2">
            <Link
              href="/directory/search?type=chambers"
              className="group flex flex-col items-center gap-2 text-white/80 hover:text-white transition-all"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M3 21V9L12 4L21 9V21H14V14H10V21H3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
              <span className="text-xs font-semibold tracking-wide uppercase relative pb-1">
                Chambers
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-0.5 w-0 bg-accent group-hover:w-full transition-all duration-300" />
              </span>
            </Link>
            <Link
              href="/directory/search?type=clients"
              className="group flex flex-col items-center gap-2 text-white/80 hover:text-white transition-all"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
                <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="17" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M14 14.5c2 .5 4 2 4 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span className="text-xs font-semibold tracking-wide uppercase relative pb-1">
                Clients
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-0.5 w-0 bg-accent group-hover:w-full transition-all duration-300" />
              </span>
            </Link>
            <Link
              href="/directory/search?type=lawyers"
              className="group flex flex-col items-center gap-2 text-white transition-all"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M12 3v18M5 7h14M5 7l-2 2v8a2 2 0 002 2h14a2 2 0 002-2V9l-2-2" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M9 7l3-4 3 4" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
              <span className="text-xs font-semibold tracking-wide uppercase relative pb-1">
                Lawyers
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-0.5 w-full bg-accent" />
              </span>
            </Link>
          </div>

          {/* Hero Search Bar */}
          <div className="w-full max-w-4xl mt-2">
            <HeroSearchBar specialties={specialties} />
          </div>

          {/* Quick Specialty Links */}
          <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 mt-2 text-sm text-white/80">
            <span className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <path d="M8 1L10 5.5H15L11 8.5L12.5 13L8 10L3.5 13L5 8.5L1 5.5H6L8 1Z" stroke="currentColor" strokeWidth="1.2" fill="none" />
              </svg>
              Dispute Resolution Law
            </span>
            <span className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <path d="M2 13h12M4 13V7h2v6M7 13V5h2v8M10 13V3h2v10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              Commercial Law
            </span>
          </div>
        </div>
      </section>

      {/* ============== TRUST METRICS BAR ============== */}
      <section className="relative -mt-16 z-30">
        <div className="max-w-7xl w-full mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border/30 rounded-2xl overflow-hidden shadow-2xl border border-border/40 bg-card">
            {[
              { value: "2,500+", label: "Verified Lawyers" },
              { value: "180+", label: "Chambers" },
              { value: "24", label: "Practice Areas" },
              { value: "6", label: "Cities Covered" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-card px-6 py-7 text-center hover:bg-accent/5 transition-colors"
              >
                <div className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                  {stat.value}
                </div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {lawyers.length > 0 && (
      <section className="py-24 md:py-28 bg-background">
        <div className="max-w-7xl w-full mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-serif italic text-foreground">
              Featured Lawyer Listings
            </h2>
            <p className="text-sm text-muted-foreground mt-3 max-w-xl mx-auto">
              Hand-picked practitioners with proven track records across Nigeria.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lawyers.map((l) => (
              <Link
                key={l.id}
                href={`/lawyer/${l.id}`}
                className="group flex flex-col gap-5 p-6 bg-card border border-border/60 rounded-xl hover:border-accent/50 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex items-center justify-center shrink-0 border border-border/50 shadow-sm">
                    <ListingAvatar src={l.image} name={l.name} type="lawyer" />
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors leading-tight">
                      {l.name}
                    </h3>
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-500 mt-1.5">
                      {l.role}
                    </p>
                  </div>
                </div>
                <p className="text-base text-muted-foreground leading-relaxed line-clamp-2">
                  {l.specialties.join(" · ")}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-border/50 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <span className="text-amber-500 text-base">★</span>
                    <span className="text-foreground">{l.rating}</span>
                  </span>
                  <span className="flex items-center gap-1.5 truncate ml-2">
                    <svg width="13" height="13" viewBox="0 0 12 12" fill="currentColor">
                      <path d="M6 0C3.8 0 2 1.8 2 4c0 3 4 8 4 8s4-5 4-8c0-2.2-1.8-4-4-4zm0 5.5C5.2 5.5 4.5 4.8 4.5 4S5.2 2.5 6 2.5 7.5 3.2 7.5 4 6.8 5.5 6 5.5z" />
                    </svg>
                    <span className="truncate">{l.location}</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      )}

      {chambers.length > 0 && (
      <section className="py-24 md:py-28 bg-muted/40 border-y border-border/40">
        <div className="max-w-7xl w-full mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-serif italic text-foreground">
              Featured Chamber Listings
            </h2>
            <p className="text-sm text-muted-foreground mt-3 max-w-xl mx-auto">
              Distinguished legal practices with deep institutional expertise.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {chambers.map((c) => (
              <Link
                key={c.id}
                href={`/directory/chamber/${c.id}`}
                className="group flex flex-col gap-5 p-6 bg-card border border-border/60 rounded-xl hover:border-primary/50 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex items-center justify-center shrink-0 border border-border/50 shadow-sm">
                    <ListingAvatar src={c.image} name={c.name} type="chamber" />
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors leading-tight">
                      {c.name}
                    </h3>
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-500 mt-1.5">
                      {c.type}
                    </p>
                  </div>
                </div>
                <p className="text-base text-muted-foreground leading-relaxed line-clamp-2">
                  {c.focus}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-border/50 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <span className="text-amber-500 text-base">★</span>
                    <span className="text-foreground">{c.rating}</span>
                  </span>
                  <span className="flex items-center gap-1.5 truncate ml-2">
                    <svg width="13" height="13" viewBox="0 0 12 12" fill="currentColor">
                      <path d="M6 0C3.8 0 2 1.8 2 4c0 3 4 8 4 8s4-5 4-8c0-2.2-1.8-4-4-4zm0 5.5C5.2 5.5 4.5 4.8 4.5 4S5.2 2.5 6 2.5 7.5 3.2 7.5 4 6.8 5.5 6 5.5z" />
                    </svg>
                    <span className="truncate">{c.location}</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* ============== LISTING TYPES ============== */}
      <section className="py-24 md:py-28 bg-background">
        <div className="max-w-7xl w-full mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-serif italic text-foreground">
              How Lawyard Works
            </h2>
            <p className="text-sm text-muted-foreground mt-3 max-w-xl mx-auto">
              Three ways to connect with the right legal professional.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group p-8 rounded-xl bg-card border border-border/60 shadow-sm hover:border-accent/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">For Clients</h3>
              <p className="text-base text-muted-foreground leading-relaxed">
                Find the right legal counsel for any matter, from corporate disputes to family law, with verified reviews and transparent pricing.
              </p>
            </div>

            <div className="group p-8 rounded-xl bg-card border border-border/60 shadow-sm hover:border-accent/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M12 3v18M5 7h14M5 7l-2 2v8a2 2 0 002 2h14a2 2 0 002-2V9l-2-2" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">For Lawyers</h3>
              <p className="text-base text-muted-foreground leading-relaxed">
                Build your professional presence. Get discovered by clients actively seeking your expertise and grow your practice.
              </p>
            </div>

            <div className="group p-8 rounded-xl bg-card border border-border/60 shadow-sm hover:border-accent/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M3 21V9L12 4L21 9V21H14V14H10V21H3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">For Chambers</h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  Showcase your firm's collective expertise, manage member profiles, and attract institutional clients at scale.
                </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============== CTA ============== */}
      <section className="py-20 md:py-24 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-foreground/5 via-transparent to-primary-foreground/5 pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 text-center relative space-y-6">
          <h2 className="text-4xl md:text-5xl font-serif italic font-bold">
            Ready to Join Nigeria's Premier Legal Network?
          </h2>
          <p className="text-lg md:text-xl font-medium leading-relaxed max-w-2xl mx-auto">
            Whether you're seeking counsel or building your practice, Lawyard connects you to the right people.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-6">
            <Link
              href="/directory/add-listing"
              className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-8 py-4 rounded-xl font-bold text-base hover:bg-accent/90 transition-all shadow-xl hover:shadow-accent/20 hover:-translate-y-0.5"
            >
              Add Your Listing
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <Link
              href="/directory/search"
              className="inline-flex items-center gap-2 bg-white/10 text-white backdrop-blur-md border border-white/20 px-8 py-4 rounded-xl font-bold text-base hover:bg-white/20 transition-all hover:-translate-y-0.5"
            >
              Browse Directory
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
