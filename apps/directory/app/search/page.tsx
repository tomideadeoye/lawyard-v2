import styles from "./search.module.css";
import Link from "next/link";
import { getLawyers, getSpecialties } from "../../lib/api";

export default async function SearchPage() {
  const [specialties, lawyers] = await Promise.all([
    getSpecialties(),
    getLawyers()
  ]);

  const SPECIALTIES = specialties;
  const MOCK_RESULTS = lawyers;
  return (
    <div className={styles.layout}>
        {/* --- SIDEBAR FILTERS --- */}
        <aside className={styles.filters}>
          <div className={styles.filterSection}>
            <h4>Category</h4>
            <div className={styles.filterOptions}>
              <label><input type="checkbox" defaultChecked /> Lawyers</label>
              <label><input type="checkbox" /> Chambers</label>
              <label><input type="checkbox" /> Client Needs</label>
            </div>
          </div>

          <div className={styles.filterSection}>
            <h4>Location</h4>
            <div className={styles.filterInput}>
              <input type="text" placeholder="State or City" className={styles.sidebarInput} />
            </div>
          </div>

          <div className={styles.filterSection}>
            <h4>Experience</h4>
            <div className={styles.filterOptions}>
              <label><input type="radio" name="exp" /> Under 5 Years</label>
              <label><input type="radio" name="exp" /> 5-10 Years</label>
              <label><input type="radio" name="exp" /> 10-20 Years</label>
              <label><input type="radio" name="exp" /> 20+ Years</label>
            </div>
          </div>

          <div className={styles.filterSection}>
            <h4>Price Range</h4>
            <div className={styles.priceToggles}>
              <button>$</button>
              <button>$$</button>
              <button className={styles.activePrice}>$$$</button>
              <button>$$$$</button>
            </div>
          </div>


          <div className={styles.filterSection}>
            <h4>Area of Specialty</h4>
            <div className={styles.specialtyList}>
              {SPECIALTIES.slice(0, 8).map(s => (
                <label key={s}><input type="checkbox" /> {s}</label>
              ))}
              <button className={styles.showMore}>+ View All</button>
            </div>
          </div>

          <div className={styles.filterSection}>
            <h4>Gender</h4>
            <div className={styles.filterOptions}>
              <label><input type="checkbox" /> Male</label>
              <label><input type="checkbox" /> Female</label>
            </div>
          </div>

          <button className="btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
            Apply Filters
          </button>
        </aside>

        {/* --- MAIN RESULTS --- */}
        <main className={styles.results}>
          <div className={styles.resultsToolbar}>
            <div className={styles.sort}>
              Sort by: <b>Most Relevant</b>
            </div>
            <div className={styles.viewToggle}>
              <span>Grid</span> | <span>List</span>
            </div>
          </div>

          <div className={styles.resultsGrid}>
            {MOCK_RESULTS.map((res) => (
              <div key={res.id} className="premium-card">
                <div className={styles.cardHeader}>
                    <div className={styles.avatarMini}>{res.name[0]}</div>
                    <div className={styles.headerBadges}>
                      <div className={styles.badge}>{res.experience}</div>
                      <div className={styles.verifiedBadge}>✓ Verified</div>
                    </div>
                </div>
                
                <div className={styles.cardContent}>
                  <div className={styles.flexTitle}>
                    <h3>{res.name}</h3>
                    <button className={styles.saveBtn} title="Save to Shortlist">🔖</button>
                  </div>
                  <p className={styles.resRole}>{res.role}</p>
                  <p className={styles.resSpec}>{res.specialty}</p>
                </div>

                <div className={styles.cardFooter}>
                  <div className={styles.resStats}>
                    ⭐ {res.rating} <span>({res.reviews})</span>
                  </div>
                  <div className={styles.resLocation}>
                    📍 {res.location}
                  </div>
                </div>

                <Link href={`/lawyer/${res.id}`} className={styles.profileLink}>
                  View Full Portfolio
                </Link>

              </div>
            ))}
          </div>
        </main>
      </div>
    );
}
