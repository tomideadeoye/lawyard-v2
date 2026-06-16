import styles from "./profile.module.css";
import Link from "next/link";
import { getLawyerById, getArticles, getPodcasts } from "@/lib/directory/api";
import BookmarkButton from "@/components/directory/BookmarkButton";
import { createClient } from '@/lib/supabase/server';
import { notFound } from "next/navigation";

interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
}

interface Podcast {
  id: string;
  slug: string;
  media_type: string;
  title: string;
  description: string;
}

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let lawyer = null;
  let articles: Article[] = [];
  let podcasts: Podcast[] = [];

  try {
    const results = await Promise.all([
      getLawyerById(id),
      getArticles({ authorId: id }),
      getPodcasts({ authorId: id })
    ]);
    lawyer = results[0];
    articles = results[1] as Article[];
    podcasts = results[2] as Podcast[];
  } catch (error) {
    console.error('Error fetching lawyer profile:', error);
  }

  if (!lawyer) {
    notFound();
  }

  let isBookmarked = false
  let bookmarkCount = 0
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', user.id)
        .eq('lawyer_id', id)
        .maybeSingle()
      isBookmarked = !!data
    }
    const { count } = await supabase
      .from('bookmarks')
      .select('*', { count: 'exact', head: true })
      .eq('lawyer_id', id)
    bookmarkCount = count ?? 0
  } catch (e) {
    console.error('Failed to fetch bookmark state:', e)
  }

  return (
    <>
      <div className={styles.topBar}>
        <Link href="/search" className={styles.backBtn}>← Back to Results</Link>
      </div>

      <div className={styles.layout}>
        <main className={styles.content}>
          <section className={styles.profileHero}>
            <div className={styles.avatarLarge}>
               <span>{lawyer.name[0]}</span>
            </div>
            <div className={styles.heroInfo}>
              <div className={styles.nameHeader}>
                <h1>{lawyer.name}</h1>
                <BookmarkButton lawyerId={id} initialBookmarked={isBookmarked} className="relative top-0.5" />
                {lawyer.verified && <span className={styles.verifiedBadge}>VERIFIED</span>}
              </div>
              <p className={styles.role}>{lawyer.role}</p>
              <div className={styles.specialtiesList}>
                {lawyer.specialties.map((s: string) => (
                  <span key={s} className={styles.specialtyTag}>{s}</span>
                ))}
              </div>
              <div className={styles.quickStats}>
                <span>⭐ {lawyer.rating} ({lawyer.reviews} Reviews)</span>
                <span>📍 {lawyer.location}</span>
                <span>🔖 {bookmarkCount}</span>
              </div>
            </div>
          </section>

          <section className={styles.about}>
            <h2>Professional <span className="gradient-text">Biography</span></h2>
            <p>{lawyer.bio}</p>
          </section>

          <section className={styles.achievements}>
            <h2>Key <span className="gradient-text">Achievements</span></h2>
            <ul>
              {lawyer.achievements.map((a: string, i: number) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </section>

          {/* PUBLISHED CONTENT SECTION */}
          {(articles.length > 0 || podcasts.length > 0) && (
            <section className={styles.insights}>
              <h2>Published <span className="gradient-text">Insights</span></h2>
              <div style={{ display: 'grid', gap: '1.5rem', marginTop: '1.5rem' }}>
                {(articles as unknown as Article[]).map((article) => (
                  <Link href={`/knowledge/${article.slug}`} key={article.id} className="premium-card" style={{ padding: '1.5rem' }}>
                    <div className={styles.insightTag}>ARTICLE</div>
                    <h4 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{article.title}</h4>
                    <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>{article.excerpt}</p>
                  </Link>
                ))}
                {(podcasts as unknown as Podcast[]).map((podcast) => (
                  <Link href={`/knowledge/${podcast.slug}`} key={podcast.id} className="premium-card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--gold)' }}>
                    <div className={styles.insightTag}>{podcast.media_type.toUpperCase()} PODCAST</div>
                    <h4 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{podcast.title}</h4>
                    <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>{podcast.description}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </main>

        <aside className={styles.sidebar}>
          <div className={styles.bookingCard}>
            <h3>Request Consultation</h3>
            <p>Direct response within 24 hours.</p>
            
            <form className={styles.contactForm}>
              <div className={styles.formGroup}>
                <label>Your Name</label>
                <input type="text" placeholder="John Doe" />
              </div>
              <div className={styles.formGroup}>
                <label>Email Address</label>
                <input type="email" placeholder="john@example.com" />
              </div>
              <div className={styles.formGroup}>
                <label>Nature of Inquiry</label>
                <select>
                  <option>Commercial Advisory</option>
                  <option>Legal Engineering</option>
                  <option>Litigation Support</option>
                  <option>Other</option>
                </select>
              </div>
              <button className="btn-primary" style={{ width: '100%' }}>
                Send Secure Message
              </button>
            </form>
            
            <div className={styles.disclaimer}>
              By clicking send, you agree to our Privacy Policy.
            </div>
          </div>

          <div className={styles.shareProfile}>
            <button>Share Profile</button>
            <button>Download CV</button>
          </div>
        </aside>
      </div>
    </>
  );
}
