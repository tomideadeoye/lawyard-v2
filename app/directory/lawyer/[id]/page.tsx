import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getArticles, getPodcasts } from '@/lib/directory/api';
import specialtiesData from '@/data/specialties.json';
import BookmarkButton from '@/components/directory/BookmarkButton';
import InquiryForm from './inquiry-form';
import ReviewsSection from '@/components/directory/ReviewsSection';
import ProfileViewTracker from '@/components/directory/ProfileViewTracker';

interface Specialist {
  specialty?: { name: string } | null;
  name?: string;
}

interface LawyerRow {
  id: string;
  name: string;
  role: string | null;
  location: string | null;
  bio: string | null;
  brief_bio: string | null;
  image_url: string | null;
  rating: number;
  reviews_count: number;
  email: string | null;
  phone: string | null;
  website: string | null;
  education: string[] | null;
  awards: string[] | null;
  volunteer_pro_bono: string[] | null;
  faqs: { question: string; answer: string }[] | null;
  social_links: { platform: string; url: string }[] | null;
  working_hours: { day: string; hours: string }[] | null;
  gallery_images: string[] | null;
  intro_video_url: string | null;
  hide_contact_form: boolean;
  verification_status: string;
  calendly_url: string | null;
  price_range: string | null;
  address: string | null;
  enrollment_number: string | null;
  gender: string | null;
  age: number | null;
  specialties: Specialist[];
  chambers?: { name: string; location: string | null } | null;
}

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: lawyer, error } = await supabase
    .from('lawyers')
    .select(`
      *,
      specialties:lawyer_specialties(
        specialty:specialties(name)
      ),
      chambers(name, location)
    `)
    .eq('id', id)
    .single();

  if (error || !lawyer) notFound();

  const row = lawyer as unknown as LawyerRow;

  const specialtyNames = (row.specialties ?? [])
    .map((s: Specialist) => s.specialty?.name || s.name)
    .filter((n): n is string => !!n);

  const [articles, podcasts, reviews] = await Promise.all([
    getArticles({ authorId: id }),
    getPodcasts({ authorId: id }),
    supabase
      .from('reviews')
      .select('id, rating, title, content, created_at, user_id, reviewer:profiles(full_name)')
      .eq('lawyer_id', id)
      .order('created_at', { ascending: false }),
  ]);

  let isBookmarked = false;
  let bookmarkCount = 0;
  try {
    if (user) {
      const { data: bm } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', user.id)
        .eq('lawyer_id', id)
        .maybeSingle();
      isBookmarked = !!bm;
    }
    const { count } = await supabase
      .from('bookmarks')
      .select('*', { count: 'exact', head: true })
      .eq('lawyer_id', id);
    bookmarkCount = count ?? 0;
  } catch {}

  const init = row.name.charAt(0).toUpperCase();
  const verified = row.verification_status === 'verified';

  const priceLabels: Record<string, string> = {
    cheap: 'Cheap ($)',
    economy: 'Economy ($$)',
    moderate: 'Moderate ($$$)',
    ultra_high: 'Ultra High ($$$$)',
  };

  function SocialIcon({ platform }: { platform: string }) {
    const p = platform.toLowerCase();
    if (p.includes('linkedin')) return <span>in</span>;
    if (p.includes('twitter') || p.includes('x')) return <span>𝕏</span>;
    if (p.includes('instagram')) return <span>📷</span>;
    if (p.includes('facebook')) return <span>f</span>;
    if (p.includes('youtube')) return <span>▶</span>;
    if (p.includes('github')) return <span>&lt;/&gt;</span>;
    return <span>🔗</span>;
  }

  return (
    <>
      <ProfileViewTracker lawyerId={id} />
      <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-6 text-sm">
        <Link href="/search" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
          ← Back to Directory
        </Link>
        <span className="text-muted-foreground/30">/</span>
        <span className="text-foreground/80 truncate">{row.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
        {/* Main content */}
        <div className="space-y-8">
          {/* Hero card */}
          <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-md overflow-hidden">
            <div className="h-40 bg-gradient-to-r from-[#a77c5c]/20 to-primary/10 relative" />
            <div className="px-6 pb-6 -mt-14">
              <div className="flex items-end justify-between mb-4">
                <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-[#a77c5c] to-[#906b4e] flex items-center justify-center text-5xl font-black text-white shadow-lg border-4 border-card shrink-0 overflow-hidden">
                  {row.image_url && row.image_url.startsWith('http') ? (
                    <img src={row.image_url} alt="" className="w-full h-full object-cover rounded-[10px]" />
                  ) : (
                    <span>{init}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 pb-2">
                  {verified && (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider">
                      Verified
                    </span>
                  )}
                  <BookmarkButton lawyerId={id} initialBookmarked={isBookmarked} />
                </div>
              </div>

              <div className="space-y-1 mb-4">
                <h1 className="text-3xl font-black tracking-tight">{row.name}</h1>
                <p className="text-base text-muted-foreground/80">{row.role || 'Legal Practitioner'}</p>
                {row.brief_bio && (
                  <p className="text-sm text-muted-foreground/60 mt-2 max-w-xl">{row.brief_bio}</p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                {row.location && <span>📍 {row.location}</span>}
                {row.price_range && <span>💰 {priceLabels[row.price_range] || row.price_range}</span>}
                <span>⭐ {row.reviews_count > 0 ? row.rating : '0.0'} ({row.reviews_count || 0} reviews)</span>
                <span>🔖 {bookmarkCount}</span>
              </div>

              {specialtyNames.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {specialtyNames.map((s: string) => (
                    <span key={s} className="px-2.5 py-1 rounded-full bg-[#a77c5c]/10 text-[#a77c5c] text-[10px] font-bold uppercase tracking-wider border border-[#a77c5c]/20">
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Professional Bio */}
          {row.bio && (
            <section className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-md p-6">
              <h2 className="text-sm uppercase tracking-wider font-bold text-muted-foreground mb-3">Professional Biography</h2>
              <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{row.bio}</p>
            </section>
          )}

          {/* Contact info row */}
          <section className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-md p-6">
            <h2 className="text-sm uppercase tracking-wider font-bold text-muted-foreground mb-4">Contact & Location</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {row.email && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Email</span>
                  <p className="font-medium mt-0.5">
                    <a href={`mailto:${row.email}`} className="text-primary hover:underline">{row.email}</a>
                  </p>
                </div>
              )}
              {row.phone && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Phone</span>
                  <p className="font-medium mt-0.5">
                    <a href={`tel:${row.phone}`} className="hover:text-primary transition-colors">{row.phone}</a>
                  </p>
                </div>
              )}
              {row.website && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Website</span>
                  <p className="font-medium mt-0.5 truncate">
                    <a href={row.website} target="_blank" rel="noreferrer" className="text-primary hover:underline">{row.website}</a>
                  </p>
                </div>
              )}
              {row.address && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Address</span>
                  <p className="font-medium mt-0.5">{row.address}</p>
                </div>
              )}
            </div>
          </section>

          {/* Two column: Education + Awards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {row.education && row.education.length > 0 && (
              <section className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-md p-6">
                <h2 className="text-sm uppercase tracking-wider font-bold text-muted-foreground mb-3">Education</h2>
                <ul className="space-y-2">
                  {row.education.map((item, i) => (
                    <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                      <span className="text-[#a77c5c] mt-0.5 shrink-0">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {row.awards && row.awards.length > 0 && (
              <section className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-md p-6">
                <h2 className="text-sm uppercase tracking-wider font-bold text-muted-foreground mb-3">Awards & Recognition</h2>
                <ul className="space-y-2">
                  {row.awards.map((item, i) => (
                    <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                      <span className="text-[#a77c5c] mt-0.5 shrink-0">🏆</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {/* Volunteer / Pro Bono */}
          {row.volunteer_pro_bono && row.volunteer_pro_bono.length > 0 && (
            <section className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-md p-6">
              <h2 className="text-sm uppercase tracking-wider font-bold text-muted-foreground mb-3">Volunteer & Pro Bono</h2>
              <ul className="space-y-2">
                {row.volunteer_pro_bono.map((item, i) => (
                  <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                    <span className="text-[#a77c5c] mt-0.5 shrink-0">🤝</span>
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* FAQ */}
          {row.faqs && row.faqs.length > 0 && (
            <section className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-md p-6">
              <h2 className="text-sm uppercase tracking-wider font-bold text-muted-foreground mb-4">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {row.faqs.map((faq, i) => (
                  <div key={i} className="pb-4 border-b border-border/20 last:border-0 last:pb-0">
                    <h3 className="text-sm font-semibold text-foreground mb-1">{faq.question}</h3>
                    <p className="text-sm text-muted-foreground/80 leading-relaxed">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Reviews */}
          <ReviewsSection
            lawyerId={id}
            reviews={reviews.data ?? []}
            isAuthenticated={!!user}
            currentUserId={user?.id ?? null}
          />

          {/* Working Hours */}
          {row.working_hours && row.working_hours.length > 0 && (
            <section className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-md p-6">
              <h2 className="text-sm uppercase tracking-wider font-bold text-muted-foreground mb-4">Working Hours</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                {row.working_hours.map((wh, i) => (
                  <div key={i} className="flex justify-between py-1.5 px-3 rounded-lg bg-muted/20 border border-border/20">
                    <span className="font-medium">{wh.day}</span>
                    <span className="text-muted-foreground">{wh.hours}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Gallery */}
          {row.gallery_images && row.gallery_images.length > 0 && (
            <section className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-md p-6">
              <h2 className="text-sm uppercase tracking-wider font-bold text-muted-foreground mb-4">Gallery</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {row.gallery_images.map((url, i) => (
                  <div key={i} className="rounded-xl overflow-hidden aspect-[4/3] bg-muted/20 border border-border/20">
                    <img src={url} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Intro Video */}
          {row.intro_video_url && (
            <section className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-md p-6">
              <h2 className="text-sm uppercase tracking-wider font-bold text-muted-foreground mb-4">Introductory Video</h2>
              <div className="aspect-video rounded-xl overflow-hidden bg-muted/20">
                <iframe
                  src={row.intro_video_url.replace('watch?v=', 'embed/')}
                  className="w-full h-full"
                  allowFullScreen
                />
              </div>
            </section>
          )}

          {/* Published Content */}
          {(articles.length > 0 || podcasts.length > 0) && (
            <section className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-md p-6">
              <h2 className="text-sm uppercase tracking-wider font-bold text-muted-foreground mb-4">Published Insights</h2>
              <div className="space-y-4">
                {(articles as { id: string; slug: string; title: string; excerpt: string | null }[]).map((article) => (
                  <Link key={`a-${article.id}`} href={`/knowledge/${article.slug}`} className="block p-4 rounded-xl border border-border/30 bg-muted/10 hover:bg-muted/20 hover:border-[#a77c5c]/30 transition-all">
                    <span className="text-[10px] uppercase font-bold text-[#a77c5c] tracking-wider">Article</span>
                    <h3 className="text-sm font-semibold mt-1">{article.title}</h3>
                    {article.excerpt && <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-2">{article.excerpt}</p>}
                  </Link>
                ))}
                {(podcasts as { id: string; slug: string; title: string; description: string | null; media_type: string }[]).map((podcast) => (
                  <Link key={`p-${podcast.id}`} href={`/knowledge/${podcast.slug}`} className="block p-4 rounded-xl border border-border/30 bg-muted/10 hover:bg-muted/20 hover:border-[#a77c5c]/30 transition-all border-l-4 border-l-[#a77c5c]/40">
                    <span className="text-[10px] uppercase font-bold text-[#a77c5c] tracking-wider">{podcast.media_type.toUpperCase()} Podcast</span>
                    <h3 className="text-sm font-semibold mt-1">{podcast.title}</h3>
                    {podcast.description && <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-2">{podcast.description}</p>}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Social Links */}
          {row.social_links && row.social_links.length > 0 && (
            <section className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-md p-6">
              <h2 className="text-sm uppercase tracking-wider font-bold text-muted-foreground mb-4">Social Links</h2>
              <div className="flex flex-wrap gap-3">
                {row.social_links.map((sl, i) => (
                  <a
                    key={i}
                    href={sl.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border/30 bg-muted/10 hover:bg-[#a77c5c]/5 hover:border-[#a77c5c]/30 transition-all text-sm font-medium text-muted-foreground hover:text-foreground"
                  >
                    <SocialIcon platform={sl.platform} />
                    {sl.platform}
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Calendly Booking */}
          {row.calendly_url && (
            <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-md p-6 sticky top-24">
              <h3 className="text-sm font-bold mb-1">Book a Consultation</h3>
              <p className="text-xs text-muted-foreground/70 mb-4">Schedule directly on their calendar.</p>
              <a
                href={row.calendly_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center w-full px-4 py-2.5 rounded-lg bg-accent text-white text-sm font-bold hover:bg-accent/90 transition-colors"
              >
                Book via Calendly &rarr;
              </a>
            </div>
          )}

          {/* Inquiry Form */}
          {!row.hide_contact_form && (
            <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-md p-6 sticky top-24">
              <h3 className="text-sm font-bold mb-1">Request Consultation</h3>
              <p className="text-xs text-muted-foreground/70 mb-4">Send a direct message. Lawyers respond within 24 hours.</p>
              {user ? (
                <InquiryForm lawyerId={id} />
              ) : (
                <div className="text-center py-6 space-y-3">
                  <p className="text-sm text-muted-foreground">Sign in to send a message</p>
                  <Link href="/login" className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[#a77c5c] text-white text-sm font-bold hover:bg-[#906b4e] transition-colors">
                    Sign In
                  </Link>
                </div>
              )}
              <p className="text-[10px] text-muted-foreground/50 mt-4 text-center">By sending, you agree to our Privacy Policy.</p>
            </div>
          )}

          {/* Quick Info Card */}
          <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-md p-6">
            <h3 className="text-sm font-bold mb-3">Quick Info</h3>
            <div className="space-y-3 text-sm">
              {row.gender && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gender</span>
                  <span className="font-medium">{row.gender}</span>
                </div>
              )}
              {row.age && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Age</span>
                  <span className="font-medium">{row.age}</span>
                </div>
              )}
              {row.enrollment_number && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Enrollment No.</span>
                  <span className="font-medium">{row.enrollment_number}</span>
                </div>
              )}
              {row.price_range && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price Range</span>
                  <span className="font-medium">{priceLabels[row.price_range] || row.price_range}</span>
                </div>
              )}
              {row.chambers?.name && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Chambers</span>
                  <span className="font-medium text-right">{row.chambers.name}</span>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
    </>
  );
}
