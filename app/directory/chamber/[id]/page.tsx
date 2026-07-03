import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getChamberById } from '@/lib/directory/api';
import { ListingAvatar } from '@/components/directory/ListingAvatar';

interface ChamberLawyer {
  id: string;
  name: string;
  role: string | null;
  image_url: string | null;
  verification_status: string;
  rating: number;
  reviews_count: number;
  location: string | null;
  specialties: { specialty: { name: string } | null }[];
}

export default async function ChamberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const chamber = await getChamberById(id);
  if (!chamber) notFound();

  const supabase = await createClient();

  const { data: lawyers } = await supabase
    .from('lawyers')
    .select(`
      id, name, role, image_url, verification_status, rating, reviews_count, location,
      specialties:lawyer_specialties(specialty:specialties(name))
    `)
    .eq('chamber_id', id)
    .returns<ChamberLawyer[]>();

  // Aggregate practice areas across all member lawyers
  const practiceAreas = new Map<string, number>();
  const verifiedCount = lawyers?.filter((l) => l.verification_status === 'verified').length ?? 0;
  (lawyers ?? []).forEach((l) => {
    (l.specialties ?? []).forEach((s) => {
      const name = s.specialty?.name;
      if (name) practiceAreas.set(name, (practiceAreas.get(name) ?? 0) + 1);
    });
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Banner */}
      <div className="h-48 md:h-64 bg-gradient-to-r from-[#a77c5c]/30 via-primary/5 to-[#a77c5c]/10 relative" />

      <div className="max-w-6xl mx-auto px-4 -mt-24 md:-mt-32 pb-10">
        {/* Back link */}
        <Link
          href="/directory/search"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors font-semibold uppercase tracking-wider mb-6 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-border/30"
        >
          &larr; Back to Directory
        </Link>

        {/* Hero Card */}
        <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md overflow-hidden">
          <div className="px-6 md:px-8 pb-6 md:pb-8">
            <div className="flex flex-col md:flex-row gap-6 md:items-end -mt-14 md:-mt-16 mb-6">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden bg-muted border-4 border-card shadow-lg shrink-0">
                <ListingAvatar src={chamber.image_url || ''} name={chamber.name} type="chamber" />
              </div>
              <div className="flex-1 min-w-0 pt-2 md:pt-0 md:pb-1">
                <h1 className="text-2xl md:text-4xl font-black tracking-tight">{chamber.name}</h1>
                <p className="text-sm md:text-base text-muted-foreground mt-1">{chamber.focus || 'Legal Practice'}</p>
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {chamber.location && (
                <span className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 12 12" fill="currentColor"><path d="M6 0C3.8 0 2 1.8 2 4c0 3 4 8 4 8s4-5 4-8c0-2.2-1.8-4-4-4zm0 5.5C5.2 5.5 4.5 4.8 4.5 4S5.2 2.5 6 2.5 7.5 3.2 7.5 4 6.8 5.5 6 5.5z"/></svg>
                  {chamber.location}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm0 12c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z"/></svg>
                {lawyers?.length ?? 0} {(lawyers?.length ?? 0) === 1 ? 'Lawyer' : 'Lawyers'}
              </span>
              {practiceAreas.size > 0 && (
                <span className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M4 0C4 2.2 5.8 4 8 4s4-1.8 4-4h2v16H2V0h2zm3 8H3v6h4V8zm6 0H9v6h4V8z"/></svg>
                  {practiceAreas.size} {(practiceAreas.size === 1) ? 'Practice Area' : 'Practice Areas'}
                </span>
              )}
              {verifiedCount > 0 && (
                <span className="text-emerald-600 font-semibold">{verifiedCount} Verified</span>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 mt-8">
          {/* Left Column */}
          <div className="space-y-8">
            {/* About */}
            {chamber.description && (
              <section className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-md p-6">
                <h2 className="text-sm uppercase tracking-wider font-bold text-muted-foreground mb-3">About</h2>
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{chamber.description}</p>
              </section>
            )}

            {/* Practice Areas */}
            {practiceAreas.size > 0 && (
              <section className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-md p-6">
                <h2 className="text-sm uppercase tracking-wider font-bold text-muted-foreground mb-4">Practice Areas</h2>
                <div className="flex flex-wrap gap-2">
                  {[...practiceAreas.entries()].map(([name, count]) => (
                    <span
                      key={name}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#a77c5c]/10 text-[#a77c5c] text-xs font-bold border border-[#a77c5c]/20"
                    >
                      {name}
                      <span className="text-[10px] opacity-60">({count})</span>
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Our Lawyers */}
            {lawyers && lawyers.length > 0 && (
              <section className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm uppercase tracking-wider font-bold text-muted-foreground">
                    Our Lawyers <span className="text-foreground">({lawyers.length})</span>
                  </h2>
                </div>
                <div className="space-y-3">
                  {lawyers.map((l) => {
                    const lawyerSpecialties = (l.specialties ?? [])
                      .map((s) => s.specialty?.name)
                      .filter((n): n is string => !!n);
                    return (
                      <Link
                        key={l.id}
                        href={`/directory/lawyer/${l.id}`}
                        className="flex items-start gap-4 p-4 rounded-xl bg-muted/10 border border-border/30 hover:border-[#a77c5c]/30 hover:bg-[#a77c5c]/5 transition-all no-underline group"
                      >
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted shrink-0 border border-border/30">
                          <ListingAvatar src={l.image_url || ''} name={l.name} type="lawyer" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold group-hover:text-[#a77c5c] transition-colors">{l.name}</p>
                            {l.verification_status === 'verified' && (
                              <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 px-1.5 py-0.5 rounded">Verified</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{l.role || 'Legal Practitioner'}</p>
                          {lawyerSpecialties.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {lawyerSpecialties.slice(0, 3).map((s) => (
                                <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-[#a77c5c]/5 text-[#a77c5c] border border-[#a77c5c]/10">
                                  {s}
                                </span>
                              ))}
                              {lawyerSpecialties.length > 3 && (
                                <span className="text-[10px] text-muted-foreground">+{lawyerSpecialties.length - 3} more</span>
                              )}
                            </div>
                          )}
                        </div>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-muted-foreground/30 group-hover:text-[#a77c5c]/50 transition-colors mt-3 shrink-0">
                          <path d="M8 0L6.6 1.4 12.2 7H0v2h12.2l-5.6 5.6L8 16l8-8z"/>
                        </svg>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {/* No lawyers message */}
            {(!lawyers || lawyers.length === 0) && (
              <section className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-md p-8 text-center">
                <p className="text-sm text-muted-foreground">No lawyers listed for this chamber yet.</p>
              </section>
            )}
          </div>

          {/* Right Sidebar */}
          <aside className="space-y-6">
            {/* Contact Card */}
            {(chamber.email || chamber.phone || chamber.website || chamber.location) && (
              <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-md p-6">
                <h3 className="text-sm font-bold mb-4">Contact Information</h3>
                <div className="space-y-4">
                  {chamber.email && (
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Email</span>
                      <a href={`mailto:${chamber.email}`} className="block text-sm font-semibold text-primary hover:underline mt-0.5 truncate">{chamber.email}</a>
                    </div>
                  )}
                  {chamber.phone && (
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Phone</span>
                      <a href={`tel:${chamber.phone}`} className="block text-sm font-semibold mt-0.5">{chamber.phone}</a>
                    </div>
                  )}
                  {chamber.website && (
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Website</span>
                      <a href={chamber.website} target="_blank" rel="noreferrer" className="block text-sm font-semibold text-primary hover:underline mt-0.5 truncate">{chamber.website}</a>
                    </div>
                  )}
                  {chamber.location && (
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Location</span>
                      <p className="text-sm font-medium mt-0.5">{chamber.location}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick Info Card */}
            <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-md p-6">
              <h3 className="text-sm font-bold mb-3">Quick Info</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Lawyers</span>
                  <span className="font-medium">{lawyers?.length ?? 0}</span>
                </div>
                {verifiedCount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Verified</span>
                    <span className="font-medium text-emerald-600">{verifiedCount}</span>
                  </div>
                )}
                {practiceAreas.size > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Practice Areas</span>
                    <span className="font-medium">{practiceAreas.size}</span>
                  </div>
                )}
                {chamber.is_featured && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Featured</span>
                    <span className="font-medium text-amber-600">★ Yes</span>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
