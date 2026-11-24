import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getChamberById } from '@/lib/directory/api';
import { derivePracticeAreas, type PracticeArea } from '@/lib/directory/practice-areas';
import { chamberPublishCheck, chamberIndexCheck } from '@/lib/directory/publishability';
import { ListingAvatar } from '@/components/directory/ListingAvatar';
import RequestSeat from '@/components/directory/request-seat';
import ChamberInquiryForm from '@/components/directory/ChamberInquiryForm';
import FirmMatters, { type MatterRow } from '@/components/directory/FirmMatters';
import { TERMS } from '@/lib/constants';

interface ChamberLawyer {
  id: string;
  name: string;
  role: string | null;
  image_url: string | null;
  verification_status: string;
  rating: number;
  reviews_count: number;
  location: string | null;
  specialties: { specialty: { name: string; slug: string } | null }[];
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const chamber = await getChamberById(id);

  if (!chamber) return { title: 'Firm not found' };

  // Existing is not the same as worth indexing. A page with only firm details
  // is reachable by link but stays out of the index until it has substance.
  const supabase = await createClient();
  const { count } = await supabase
    .from('chamber_matters')
    .select('id', { count: 'exact', head: true })
    .eq('chamber_id', id)
    .neq('visibility', 'private');

  const indexable = chamber.published_at
    ? chamberIndexCheck({ ...chamber, matters: count ?? 0 }).ready
    : false;

  const title = chamber.focus ? `${chamber.name} — ${chamber.focus}` : chamber.name;
  const description =
    (chamber.description ?? '').trim().slice(0, 160) ||
    `${chamber.name}${chamber.location ? `, ${chamber.location}` : ''}. Practice areas and selected matters on Lawyard Directory.`;

  return {
    title,
    description,
    alternates: { canonical: `/chamber/${id}` },
    robots: indexable ? undefined : { index: false, follow: true },
    openGraph: { title, description, type: 'profile', url: `/chamber/${id}` },
  };
}

export default async function ChamberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const chamber = await getChamberById(id);
  if (!chamber) notFound();

  const isDraft = !chamber.published_at;

  const supabase = await createClient();

  const { data: lawyers } = await supabase
    .from('lawyers')
    .select(`
      id, name, role, image_url, verification_status, rating, reviews_count, location,
      specialties:lawyer_specialties(specialty:specialties(name, slug))
    `)
    .eq('chamber_id', id)
    .returns<ChamberLawyer[]>();

  // Practice areas are a relation now. `chambers.focus` is only the tagline, so
  // a firm with no members still gets areas — parsed from focus until an editor
  // saves the canonical list.
  const { data: areaRows } = await supabase
    .from('chamber_specialties')
    .select('specialty:specialties(name, slug)')
    .eq('chamber_id', id);

  const { data: matterRows } = await supabase
    .from('chamber_matters')
    .select('id, title, kind, court, suit_number, citation, year, role, side, outcome, summary, client_name, visibility, is_verified')
    .eq('chamber_id', id)
    .neq('visibility', 'private')
    .order('year', { ascending: false, nullsFirst: false })
    .order('sort_order', { ascending: true })
    .limit(20);

  const matters = (matterRows ?? []) as MatterRow[];


  const { data: pressReleases } = await supabase
    .from('articles')
    .select('id, title, slug, excerpt, created_at')
    .eq('chamber_id', id)
    .eq('article_type', 'press_release')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(6);

  // Join state for the viewer, so the firm page can offer "request to join"
  // without a second round trip on the client.
  const { data: { user } } = await supabase.auth.getUser()
  let seatState: 'guest' | 'eligible' | 'pending' | 'member' = 'guest'
  if (user) {
    const { data: seat } = await supabase
      .from('chamber_members')
      .select('status')
      .eq('chamber_id', id)
      .eq('lawyer_id', user.id)
      .in('status', ['pending', 'active'])
      .maybeSingle()

    seatState = seat?.status === 'active' ? 'member' : seat?.status === 'pending' ? 'pending' : 'eligible'
  }

  // Who is looking decides what the page tells them: an owner gets the way to
  // finish the listing, everyone else gets a claim route.
  let canEdit = false
  if (user) {
    if (chamber.user_id === user.id) {
      canEdit = true
    } else {
      const { data: adminRow } = await supabase
        .from('chamber_admins')
        .select('chamber_id')
        .eq('chamber_id', id)
        .eq('user_id', user.id)
        .maybeSingle()
      canEdit = !!adminRow
    }
  }

  // Practice areas come from three sources, in order of authority: the saved
  // relation, the tagline, then what the member lawyers actually practise.
  const areaMap = new Map<string, PracticeArea & { count: number }>();
  const addArea = (area: PracticeArea | null, count = 0) => {
    if (!area) return;
    const existing = areaMap.get(area.slug);
    if (existing) {
      existing.count += count;
      return;
    }
    areaMap.set(area.slug, { ...area, count });
  };

  (areaRows ?? []).forEach((row) => {
    const specialty = (row as unknown as { specialty?: { name: string; slug: string } | null }).specialty;
    if (specialty) addArea({ id: specialty.slug, name: specialty.name, slug: specialty.slug });
  });
  derivePracticeAreas(chamber.focus).forEach((area) => addArea(area));
  (lawyers ?? []).forEach((l) => {
    (l.specialties ?? []).forEach((s) => {
      const specialty = s.specialty;
      if (specialty) addArea({ id: specialty.slug, name: specialty.name, slug: specialty.slug }, 1);
    });
  });

  const areas = [...areaMap.values()];
  const verifiedCount = lawyers?.filter((l) => l.verification_status === 'verified').length ?? 0;

  const publishCheck = chamberPublishCheck({ ...chamber, matters: matters.length, practiceAreas: areas.length });
  const indexCheck = chamberIndexCheck({ ...chamber, matters: matters.length });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Banner */}
      <div className="h-48 md:h-64 bg-gradient-to-r from-[#a77c5c]/30 via-primary/5 to-[#a77c5c]/10 relative" />

      <div className="max-w-6xl mx-auto px-4 -mt-24 md:-mt-32 pb-10">
        {/* Back link */}
        <Link
          href="/search"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors font-semibold uppercase tracking-wider mb-6 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-border/30"
        >
          &larr; Back to Directory
        </Link>

        {/* Draft banner */}
        {isDraft && (
          <div className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-800 dark:text-amber-300">
            <span className="font-bold uppercase tracking-wider">Draft</span>
            <span>
              This profile is not published yet.
              {publishCheck.blockers.length > 0 && ` Still needed: ${publishCheck.blockers.join(', ')}.`}
            </span>
            <Link
              href={canEdit ? '/dashboard/chamber' : '/add-listing?category=chamber'}
              className="font-bold underline underline-offset-2 hover:no-underline"
            >
              {canEdit ? 'Complete it in your dashboard' : 'Is this your firm? Claim it'}
            </Link>
          </div>
        )}

        {/* Owner-only: live but not yet indexable */}
        {!isDraft && canEdit && !indexCheck.ready && (
          <div className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-border/40 bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
            <span className="font-bold uppercase tracking-wider">Not indexed yet</span>
            <span>Live on the directory. Search engines will index it once it has {indexCheck.blockers.join(' or ')}.</span>
            <Link href="/dashboard/chamber" className="font-bold underline underline-offset-2 hover:no-underline">
              Add detail
            </Link>
          </div>
        )}

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
              {(lawyers?.length ?? 0) > 0 && (
                <span className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm0 12c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z"/></svg>
                  {lawyers!.length} {lawyers!.length === 1 ? 'Lawyer' : 'Lawyers'}
                </span>
              )}
              {areas.length > 0 && (
                <span className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M4 0C4 2.2 5.8 4 8 4s4-1.8 4-4h2v16H2V0h2zm3 8H3v6h4V8zm6 0H9v6h4V8z"/></svg>
                  {areas.length} {areas.length === 1 ? 'Practice Area' : 'Practice Areas'}
                </span>
              )}
              {matters.length > 0 && (
                <span className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M2 1h12a1 1 0 011 1v2H1V2a1 1 0 011-1zM1 5h14v9a1 1 0 01-1 1H2a1 1 0 01-1-1V5zm4 3v2h6V8H5z"/></svg>
                  {matters.length} {matters.length === 1 ? 'Matter' : 'Matters'}
                </span>
              )}
              {verifiedCount > 0 && (
                <span className="text-emerald-600 font-semibold">{verifiedCount} Verified</span>
              )}
            </div>

            <div className="mt-4">
              <RequestSeat chamberId={id} state={seatState} />
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
            {areas.length > 0 && (
              <section className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-md p-6">
                <h2 className="text-sm uppercase tracking-wider font-bold text-muted-foreground mb-4">Practice Areas</h2>
                <div className="flex flex-wrap gap-2">
                  {areas.map((area) => (
                    <Link
                      key={area.slug}
                      href={`/search?specialty=${area.slug}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#a77c5c]/10 text-[#a77c5c] text-xs font-bold border border-[#a77c5c]/20 hover:bg-[#a77c5c]/20 transition-colors no-underline"
                    >
                      {area.name}
                      {area.count > 0 && <span className="text-[10px] opacity-60">({area.count})</span>}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Selected Matters */}
            <FirmMatters matters={matters} />

            {/* Intro Video */}
            {chamber.intro_video_url && (
              <section className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-md p-6">
                <h2 className="text-sm uppercase tracking-wider font-bold text-muted-foreground mb-4">Introductory Video</h2>
                <div className="aspect-video rounded-xl overflow-hidden bg-muted/20">
                  {/\.(mp4|webm|mov)(\?.*)?$/i.test(chamber.intro_video_url) || chamber.intro_video_url.includes('/intro-videos/') ? (
                    <video src={chamber.intro_video_url} controls className="w-full h-full" />
                  ) : (
                    <iframe src={chamber.intro_video_url.replace('watch?v=', 'embed/')} className="w-full h-full" allowFullScreen />
                  )}
                </div>
              </section>
            )}

            {/* Gallery */}
            {Array.isArray(chamber.gallery_images) && chamber.gallery_images.length > 0 && (
              <section className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-md p-6">
                <h2 className="text-sm uppercase tracking-wider font-bold text-muted-foreground mb-4">Gallery</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {chamber.gallery_images.map((url: string, i: number) => (
                    <div key={i} className="aspect-[4/3] rounded-lg overflow-hidden border border-border/30 bg-muted">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* FAQs */}
            {Array.isArray(chamber.faqs) && chamber.faqs.length > 0 && (
              <section className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-md p-6">
                <h2 className="text-sm uppercase tracking-wider font-bold text-muted-foreground mb-4">FAQs</h2>
                <div className="space-y-4">
                  {chamber.faqs.map((f: { question: string; answer: string }, i: number) => (
                    <div key={i}>
                      <p className="text-sm font-semibold">{f.question}</p>
                      <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{f.answer}</p>
                    </div>
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
                        href={`/lawyer/${l.id}`}
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

            {/* Announcements & Press */}
            {(pressReleases?.length ?? 0) > 0 && (
              <section className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-md p-6">
                <h2 className="text-sm uppercase tracking-wider font-bold text-muted-foreground mb-4">Announcements &amp; Press</h2>
                <div className="space-y-4">
                  {pressReleases!.map((pr) => (
                    <article key={pr.id} className="pb-4 border-b border-border/30 last:border-0 last:pb-0">
                      <Link href={`/insights/${pr.slug}`} className="group block no-underline">
                        <time className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                          {new Date(pr.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </time>
                        <h3 className="text-base font-semibold mt-1 group-hover:text-primary transition-colors">{pr.title}</h3>
                        {pr.excerpt && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{pr.excerpt}</p>
                        )}
                      </Link>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {/* No lawyers message */}
            {(!lawyers || lawyers.length === 0) && (
              <section className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-md p-8 text-center">
                <p className="text-sm text-muted-foreground">No {TERMS.lawyer.lowerPlural} listed for this {TERMS.firm.lower} yet.</p>
              </section>
            )}
          </div>

          {/* Right Sidebar */}
          <aside className="space-y-6">
            {/* Contact this firm — the primary action on the page */}
            <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-md p-6">
              <h3 className="text-sm font-bold mb-1">Contact this firm</h3>
              <p className="text-xs text-muted-foreground/70 mb-4">
                Send a message through Lawyard and we&rsquo;ll pass it to {chamber.name}.
              </p>
              <ChamberInquiryForm chamberId={id} firmName={chamber.name} />
            </div>

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

            {/* Working Hours */}
            {Array.isArray(chamber.working_hours) && chamber.working_hours.length > 0 && (
              <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-md p-6">
                <h3 className="text-sm font-bold mb-4">Working Hours</h3>
                <div className="space-y-2">
                  {chamber.working_hours.map((h: { day: string; hours: string }, i: number) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{h.day}</span>
                      <span className="font-medium">{h.hours}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Info Card */}
            <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-md p-6">
              <h3 className="text-sm font-bold mb-3">Quick Info</h3>
              <div className="space-y-3 text-sm">
                {(lawyers?.length ?? 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Lawyers</span>
                    <span className="font-medium">{lawyers!.length}</span>
                  </div>
                )}
                {verifiedCount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Verified</span>
                    <span className="font-medium text-emerald-600">{verifiedCount}</span>
                  </div>
                )}
                {areas.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Practice Areas</span>
                    <span className="font-medium">{areas.length}</span>
                  </div>
                )}
                {matters.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Matters listed</span>
                    <span className="font-medium">{matters.length}</span>
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
