import Link from "next/link";
import styles from "./Header.module.css";

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.navInner}>
        <div className={styles.logoGroup}>
          <Link href="/" className={styles.logoLink}>
            <div className={styles.logoIcon}>⚖️</div>
            <div className={styles.logoText}>
              LAWYARD <span className={styles.dirTag}>DIRECTORY</span>
            </div>
          </Link>
        </div>
        
        <nav className={styles.desktopNav}>
          <Link href="/search">Browse Directory</Link>
          <Link href="/search">Chambers</Link>
          <Link href="/search">Clients</Link>
          <Link href="/about">About Us</Link>
        </nav>

        <div className={styles.authGroup}>
          <button className={styles.loginBtn}>Login</button>
          <Link href="/add-listing" className={styles.addListingBtn}>Add Listing</Link>
        </div>
      </div>
    </header>
  );
}
