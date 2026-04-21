import styles from "./add-listing.module.css";
import Link from "next/link";

export default function AddListingPage() {
  return (
    <main className={styles.main}>
       <div className={styles.onboardingHeader}>
          <div className={styles.steps}>
            <div className={`${styles.step} ${styles.active}`}>1. Category</div>
            <div className={styles.step}>2. Details</div>
            <div className={styles.step}>3. Verification</div>
            <div className={styles.step}>4. Capitalize</div>
          </div>
       </div>
        <section className={styles.intro}>
          <h1>Join the <span className="gradient-text">Elite</span>.</h1>
          <p>The Lawyard Directory is a curated platform for top-tier legal talent. Start your application below.</p>
        </section>

        <section className={styles.selectionGrid}>
          <div className={styles.selectionCard}>
            <div className={styles.icon}>🎓</div>
            <h3>Individual Lawyer</h3>
            <p>For independent practitioners and legal engineers.</p>
            <button className="btn-primary">Select Individual</button>
          </div>

          <div className={styles.selectionCard}>
            <div className={styles.icon}>🏛️</div>
            <h3>Law Chamber / Firm</h3>
            <p>For established law firms and specialized chambers.</p>
            <button className="btn-primary">Select Institution</button>
          </div>

          <div className={styles.selectionCard}>
            <div className={styles.icon}>💼</div>
            <h3>Corporate Legal Dept</h3>
            <p>For in-house teams seeking external specialists.</p>
            <button className="btn-primary">Select Corporate</button>
          </div>
        </section>

        <div className={styles.infoBox}>
          <h4>Why list with Lawyard?</h4>
          <ul>
            <li>Access to high-net-worth clients and corporate mandates.</li>
            <li>Verified status badge for enhanced professional trust.</li>
            <li>Direct integration with the Orion legal tech ecosystem.</li>
          </ul>
        </div>
      </main>
    );
}
