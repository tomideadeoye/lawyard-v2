import styles from "./page.module.css";
import Link from "next/link";
import { getLawyers, getChambers, getSpecialties } from "../lib/api";

export default async function Home() {
  const [specialties, lawyers, chambers] = await Promise.all([
    getSpecialties(),
    getLawyers({ featured: true }),
    getChambers({ featured: true })
  ]);

  const FEATURED_LAWYERS = lawyers;
  const FEATURED_CHAMBERS = chambers;
  const SPECIALTIES = specialties;
  return (
    <>
      {/* --- HERO SECTION --- */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.badge}>REBUILDING THE FUTURE</div>
          <h1 className="animate-fade-in">
            Find Your <span className="gradient-text">Elite</span> Legal Partner.
          </h1>
          <p className={styles.heroSub}>
            The premium gateway to Africa's top lawyers, specialized chambers, and legal engineering talent. 
            Built for speed, accuracy, and professional excellence.
          </p>

          {/* Search Console */}
          <div className={styles.searchConsole}>
            <div className={styles.searchTabs}>
              <button className={styles.activeTab}>Lawyers</button>
              <button>Chambers</button>
              <button>Client Needs</button>
            </div>
            
            <div className={styles.searchForm}>
              <div className={styles.inputGroup}>
                <label>Name</label>
                <input type="text" placeholder="e.g. Tomide Adeoye" />
              </div>
              <div className={styles.divider} />
              <div className={styles.inputGroup}>
                <label>Specialty</label>
                <select>
                  <option>Select Specialty</option>
                  {SPECIALTIES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className={styles.divider} />
              <div className={styles.inputGroup}>
                <label>Location</label>
                <input type="text" placeholder="Lagos, Nigeria" />
              </div>
              <Link href="/search" className={styles.searchBtn}>
                <span>🔍</span> Search
              </Link>
            </div>
          </div>
        </div>
        
        <div className={styles.heroVisual}>
           <div className={styles.floatingStats}>
              <div className={styles.statLine}>
                <span className={styles.statDot} />
                <b>1,200+</b> Verified Profiles
              </div>
              <div className={styles.statLine}>
                <span className={styles.statDot} />
                <b>$50M+</b> Capital Advised
              </div>
           </div>
        </div>
      </section>

      {/* --- SPECIALTY GRID --- */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Areas of <span className="gradient-text">Mastery</span></h2>
          <p>Browse directory listings by specialized legal practice areas.</p>
        </div>
        
        <div className={styles.specialtyGrid}>
          {SPECIALTIES.map((s, i) => (
            <div key={s.id} className={styles.specialtyCard} style={{ '--delay': `${i * 0.05}s` } as any}>
              <div className={styles.specIcon}>
                {i % 3 === 0 ? '🏛️' : i % 3 === 1 ? '💎' : '⚡'}
              </div>
              <h3>{s.name}</h3>
              <p>Explore {s.count} specialists</p>
              <div className={styles.specArrow}>→</div>
            </div>
          ))}
        </div>
      </section>

      {/* --- FEATURED SECTION --- */}
      <section className={styles.featuredSection}>
        <div className={styles.sectionHeader}>
          <h2>Featured Experts</h2>
          <button className={styles.viewAllBtn}>View All Listings →</button>
        </div>

        <div className={styles.profilesGrid}>
          {FEATURED_LAWYERS.map((l) => (
            <div key={l.id} className="premium-card">
              <div className={styles.cardTop}>
                <div className={styles.avatar}>
                  <span>{l.name[0]}</span>
                </div>
                {l.featured && <div className={styles.featuredBadge}>TOP PICK</div>}
              </div>
              
              <div className={styles.cardInfo}>
                <h3>{l.name}</h3>
                <p className={styles.role}>{l.role}</p>
                <p className={styles.specialty}>{l.specialty}</p>
              </div>

              <div className={styles.cardStats}>
                <div className={styles.rating}>
                  ⭐ {l.rating} <span>({l.reviews})</span>
                </div>
                <div className={styles.location}>
                  📍 {l.location}
                </div>
              </div>

              <Link href={`/lawyer/${l.id}`} className={styles.connectBtn}>
                View Full Portfolio
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* --- FEATURED CHAMBERS --- */}
      <section className={styles.section} style={{ background: 'var(--bg-glass)', borderRadius: 'var(--radius-lg)', margin: '4rem auto' }}>
        <div className={styles.sectionHeader}>
          <div className={styles.badge}>INSTITUTIONAL EXCELLENCE</div>
          <h2>Elite <span className="gradient-text">Chambers</span></h2>
          <p>Premium law firms and legal departments leading the continent's major transactions.</p>
        </div>
        
        <div className={styles.chambersGrid}>
          {FEATURED_CHAMBERS.map(c => (
            <div key={c.id} className={styles.chamberCard}>
              <div className={styles.chamberImage}>
                <div className={styles.placeholderImg}>🏛️</div>
              </div>
              <div className={styles.chamberInfo}>
                <div className={styles.chamberType}>{c.type}</div>
                <h3>{c.name}</h3>
                <p className={styles.chamberFocus}>{c.focus}</p>
                <div className={styles.location}>📍 {c.location}</div>
                <button className={styles.viewChamberBtn}>Explore Chamber</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --- LEGAL INSIGHTS --- */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.badge}>LEGAL MEDIA</div>
          <h2>Legal <span className="gradient-text">Insights</span></h2>
          <p>Developments at the intersection of African Law and Global Technology.</p>
        </div>
        
        <div className={styles.insightsGrid}>
          <div className={styles.insightCard}>
            <div className={styles.insightTag}>ANALYSIS</div>
            <h3>The Rise of Legal Engineering in Nigeria</h3>
            <p>How automation is reshaping the billable hour in top Lagos firms.</p>
            <div className={styles.insightMeta}>5 min read • by Adeoye Tomide</div>
          </div>
          <div className={styles.insightCard}>
            <div className={styles.insightTag}>REGULATORY</div>
            <h3>NDPR Compliance in 2026</h3>
            <p>Critical updates for tech startups operating in the West African market.</p>
            <div className={styles.insightMeta}>8 min read • by Data Protection Unit</div>
          </div>
        </div>
      </section>

      {/* --- HOW IT WORKS / SYSTEM PROTOCOL --- */}
      <section className={styles.section} id="how-it-works">
        <div className={styles.sectionHeader}>
          <h2>The Lawyard <span className="gradient-text">Protocol</span></h2>
          <p>A streamlined three-step architecture for legal discovery.</p>
        </div>
        
        <div className={styles.protocolGrid}>
          <div className={styles.stepCard}>
            <div className={styles.stepNumber}>01</div>
            <h4>Identify Need</h4>
            <p>Define your legal challenge or growth objective through our intelligent search console.</p>
          </div>
          <div className={styles.stepCard}>
            <div className={styles.stepNumber}>02</div>
            <h4>Filter Mastery</h4>
            <p>Connect with vetted experts who possess the specific specialty and experience required.</p>
          </div>
          <div className={styles.stepCard}>
            <div className={styles.stepNumber}>03</div>
            <h4>Execute Results</h4>
            <p>Initiate a direct consultation and begin the collaboration through our secure gateway.</p>
          </div>
        </div>
      </section>

      {/* --- CLIENT NEEDS (NEW) --- */}


      <section className={styles.actionBanner}>
        <div className={styles.bannerContent}>
          <h2>Got a legal emergency or a specific need?</h2>
          <p>Post your requirement and let top-tier lawyers reach out to you directly.</p>
          <div className={styles.bannerActions}>
            <Link href="/search" className="btn-primary">Post Client Need</Link>
            <a href="#how-it-works" className={styles.outlineBtn}>How it works</a>
          </div>

        </div>
      </section>
    </>
  );
}
