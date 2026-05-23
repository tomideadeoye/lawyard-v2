import styles from "./page.module.css";
import Image from "next/image";
import Link from "next/link";
import { getLawyers, getChambers, getSpecialties, getArticles, getPodcasts } from "../lib/api";
import { HeroSearchBar } from "../components/HeroSearchBar";
import { Lawyer, Chamber, Specialty } from '@repo/api';

export const dynamic = 'force-dynamic';

export default async function Home() {
  let specialties: Specialty[] = [];
  let lawyers: Lawyer[] = [];
  let chambers: Chamber[] = [];
  let articles: any[] = [];
  let podcasts: any[] = [];

  try {
    [specialties, lawyers, chambers, articles, podcasts] = await Promise.all([
      getSpecialties(),
      getLawyers({ featured: true }),
      getChambers({ featured: true }),
      getArticles({ limit: 3 }),
      getPodcasts({ limit: 3 }),
    ]);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
  }

  return (
    <>
      {/* --- HERO SECTION --- */}
      <section className={styles.hero}>
        <div className={styles.heroOverlay} />
        <Image
          src="/hero-bg.jpg"
          alt="Legal gavel on law books"
          fill
          priority
          className={styles.heroBgImage}
          sizes="100vw"
        />
        <div className={styles.heroContent}>
          <h1>
            Experienced Lawyers Are<br />
            Ready To Help
          </h1>

          {/* Search Tabs */}
          <div className={styles.searchTabs}>
            <Link href="/search?type=chambers" className={styles.tab}>
              <Image src="/icon-chambers.png" alt="" width={28} height={28} />
              <span>Chambers</span>
            </Link>
            <Link href="/search?type=clients" className={styles.tab}>
              <Image src="/icon-clients.png" alt="" width={28} height={28} />
              <span>Clients</span>
            </Link>
            <Link href="/search?type=lawyers" className={`${styles.tab} ${styles.tabActive}`}>
              <Image src="/icon-lawyers.png" alt="" width={28} height={28} />
              <span>Lawyers</span>
            </Link>
          </div>

          <HeroSearchBar specialties={specialties} />

          {/* Quick Specialty Links */}
          <div className={styles.quickLinks}>
            <Link href="/search?specialty=dispute-resolution-law" className={styles.quickLink}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1L10 5.5H15L11 8.5L12.5 13L8 10L3.5 13L5 8.5L1 5.5H6L8 1Z" stroke="white" strokeWidth="1" fill="none"/></svg>
              Dispute Resolution Law
            </Link>
            <Link href="/search?specialty=commercial-law" className={styles.quickLink}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 13h12M4 13V7h2v6M7 13V5h2v8M10 13V3h2v10" stroke="white" strokeWidth="1" strokeLinecap="round"/></svg>
              Commercial Law
            </Link>
          </div>
        </div>
      </section>

      {/* --- FEATURED LAWYER LISTINGS --- */}
      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>Featured Lawyer Listings</h2>
          
          {lawyers.length > 0 ? (
            <div className={styles.listingsGrid}>
              {lawyers.map((l) => (
                <Link key={l.id} href={`/lawyer/${l.id}`} className={styles.listingCard}>
                  <div className={styles.listingAvatar}>
                    {l.image ? (
                      <Image src={l.image} alt={l.name} width={80} height={80} className={styles.avatarImg} />
                    ) : (
                      <span className={styles.avatarFallback}>{l.name[0]}</span>
                    )}
                  </div>
                  <div className={styles.listingInfo}>
                    <h3>{l.name}</h3>
                    <p className={styles.listingRole}>{l.role}</p>
                    <p className={styles.listingSpecialty}>{l.specialties.slice(0, 2).join(', ')}{l.specialties.length > 2 ? '...' : ''}</p>
                    <div className={styles.listingMeta}>
                      <span className={styles.listingRating}>⭐ {l.rating}</span>
                      <span className={styles.listingLocation}>📍 {l.location}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className={styles.emptyMessage}>No listings found.</p>
          )}
        </div>
      </section>

      {/* --- FEATURED CHAMBER LISTINGS --- */}
      <section className={`${styles.section} ${styles.sectionAlt}`}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>Featured Chamber Listings</h2>
          
          {chambers.length > 0 ? (
            <div className={styles.listingsGrid}>
              {chambers.map((c) => (
                <div key={c.id} className={styles.listingCard}>
                  <div className={styles.listingAvatar}>
                    {c.image ? (
                      <Image src={c.image} alt={c.name} width={80} height={80} className={styles.avatarImg} />
                    ) : (
                      <span className={styles.avatarFallback}>🏛️</span>
                    )}
                  </div>
                  <div className={styles.listingInfo}>
                    <h3>{c.name}</h3>
                    <p className={styles.listingRole}>{c.type}</p>
                    <p className={styles.listingSpecialty}>{c.focus}</p>
                    <div className={styles.listingMeta}>
                      <span className={styles.listingRating}>⭐ {c.rating}</span>
                      <span className={styles.listingLocation}>📍 {c.location}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.emptyMessage}>No listings found.</p>
          )}
        </div>
      </section>

      {/* --- LATEST LEGAL INSIGHTS & MEDIA --- */}
      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>Latest Legal Insights & Media</h2>
          
          {(articles.length > 0 || podcasts.length > 0) ? (
            <div className={styles.listingsGrid}>
              {articles.map((article: any) => (
                <Link key={article.id} href={`/knowledge/${article.slug}`} className={styles.listingCard}>
                  <div className={styles.listingAvatar} style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    ✍️
                  </div>
                  <div className={styles.listingInfo}>
                    <h3>{article.title}</h3>
                    <p className={styles.listingRole}>ARTICLE</p>
                    <p className={styles.listingSpecialty}>{article.excerpt}</p>
                    <div className={styles.listingMeta}>
                      <span>By {article.author?.full_name || 'Anonymous'}</span>
                    </div>
                  </div>
                </Link>
              ))}
              {podcasts.map((podcast: any) => (
                <a key={podcast.id} href={podcast.media_url} target="_blank" rel="noopener noreferrer" className={styles.listingCard}>
                  <div className={styles.listingAvatar} style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {podcast.media_type === 'video' ? '📺' : '🎙️'}
                  </div>
                  <div className={styles.listingInfo}>
                    <h3>{podcast.title}</h3>
                    <p className={styles.listingRole}>{podcast.media_type.toUpperCase()} PODCAST</p>
                    <p className={styles.listingSpecialty}>{podcast.description || 'No description available'}</p>
                    <div className={styles.listingMeta}>
                      <span>By {podcast.author?.full_name || 'Anonymous'}</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <p className={styles.emptyMessage}>No recent insights published yet.</p>
          )}
        </div>
      </section>

      {/* --- OUR LISTING TYPES --- */}
      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>Our Listing Types</h2>
          
          <div className={styles.typesGrid}>
            <div className={styles.typeCard}>
              <div className={styles.typeIcon}>👥</div>
              <h3>Client listings</h3>
              <p>Get a convenient way to find your closest law service provider that will help you in court</p>
            </div>
            <div className={styles.typeCard}>
              <div className={styles.typeIcon}>⚖️</div>
              <h3>Lawyer listings</h3>
              <p>Contact with lawyers and experts listed in the Lawyer Directory out of the listing of all lawyers across.</p>
            </div>
            <div className={styles.typeCard}>
              <div className={styles.typeIcon}>🏛️</div>
              <h3>Chamber listings</h3>
              <p>Have a sophisticated way to complete the case filing process to get things done effortlessly!</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- CLIENT NEED LISTINGS --- */}
      <section className={`${styles.section} ${styles.sectionAlt}`}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>Client Need Listings</h2>
          <p className={styles.emptyMessage}>No listings found.</p>
        </div>
      </section>

      {/* --- CTA BANNER --- */}
      <section className={styles.ctaBanner}>
        <div className={styles.ctaContent}>
          <p>
            This platform exists to provide you access to justices in Africa, lawyers of different practices and pay grade. 
            Choose of the ones you can afford that suit your need. This directory is part of the Lawyard brand.
          </p>
        </div>
      </section>
    </>
  );
}
