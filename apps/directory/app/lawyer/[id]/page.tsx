import styles from "./profile.module.css";
import Link from "next/link";
import { getLawyerById, getArticles, getPodcasts } from "../../../lib/api";
import { notFound } from "next/navigation";

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [lawyer, articles, podcasts] = await Promise.all([
    getLawyerById(id),
    getArticles({ authorId: id }),
    getPodcasts({ authorId: id })
  ]);

  if (!lawyer) {
    notFound();
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
                {lawyer.verified && <span className={styles.verifiedBadge}>VERIFIED</span>}
              </div>
              <p className={styles.role}>{lawyer.role}</p>
              <p className={styles.specialty}>{lawyer.specialty}</p>
              <div className={styles.quickStats}>
                <span>⭐ {lawyer.rating} ({lawyer.reviews} Reviews)</span>
                <span>📍 {lawyer.location}</span>
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
              {lawyer.achievements.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </section>

          {/* PUBLISHED CONTENT SECTION */}
          {(articles.length > 0 || podcasts.length > 0) && (
            <section className={styles.insights}>
              <h2>Published <span className="gradient-text">Insights</span></h2>
              <div style={{ display: 'grid', gap: '1.5rem', marginTop: '1.5rem' }}>
                {articles.map((article: any) => (
                  <Link href={`/knowledge/${article.slug}`} key={article.id} className="premium-card" style={{ padding: '1.5rem' }}>
                    <div className={styles.insightTag}>ARTICLE</div>
                    <h4 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{article.title}</h4>
                    <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>{article.excerpt}</p>
                  </Link>
                ))}
                {podcasts.map((podcast: any) => (
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
