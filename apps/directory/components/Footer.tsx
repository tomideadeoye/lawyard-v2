import Link from "next/link";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerGrid}>
        <div className={styles.footerBrand}>
          <div className={styles.logoGroup}>
             <span className={styles.logoIcon}>⚖️</span>
             <span className={styles.logoText}>LAWYARD</span>
          </div>
          <p>The definitive ecosystem for legal prestige and digital discovery in Africa.</p>
        </div>
        
        <div className={styles.footerLinks}>
          <h4>Directory</h4>
          <Link href="/search">Find a Lawyer</Link>
          <Link href="/search">Legal Chambers</Link>
          <Link href="/search">Corporate Counsel</Link>
          <Link href="/add-listing">Register Listing</Link>
        </div>

        <div className={styles.footerLinks}>
          <h4>Resources</h4>
          <Link href="/about">How it works</Link>
          <Link href="/about">Legal Insights</Link>
          <Link href="/about">Verification</Link>
          <Link href="/about">Privacy Policy</Link>
        </div>

        <div className={styles.footerLinks}>
          <h4>Connect</h4>
          <a href="#">Contact Us</a>
          <a href="#">Support Center</a>
          <a href="#">Twitter</a>
          <a href="#">LinkedIn</a>
        </div>
      </div>
      <div className={styles.footerBottom}>
        <p>© 2026 Lawyard. Architecture by Orion Horizon. All Strategic Rights Reserved.</p>
      </div>
    </footer>
  );
}
