import Image from "next/image";
import Link from "next/link";
import styles from "./Header.module.css";
import { createClient } from "@/lib/supabase/server";
import siteConfig from "../config/site-config.json";

export default async function Header() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <header className={styles.header}>
      <div className={styles.navInner}>
        <div className={styles.logoGroup}>
          <Link href="/" className={styles.logoLink}>
            <Image 
              src="/lawyard-logo.png" 
              alt={`${siteConfig.brand.name} Logo`} 
              width={140} 
              height={32} 
              priority
              style={{ objectFit: 'contain' }}
            />
            <span className={styles.dirTag}>DIRECTORY</span>
          </Link>
        </div>
        
        <nav className={styles.desktopNav}>
          {siteConfig.navigation.header.map(link => (
             <Link key={link.name} href={link.href}>{link.name}</Link>
          ))}
        </nav>

        <div className={styles.authGroup}>
          {user ? (
            <Link href="/dashboard" className={styles.loginBtn}>Dashboard</Link>
          ) : (
            <Link href="/login" className={styles.loginBtn}>Login</Link>
          )}
          <Link href="/add-listing" className={styles.addListingBtn}>Add Listing</Link>
        </div>
      </div>
    </header>
  );
}
