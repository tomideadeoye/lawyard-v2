import Image from "next/image";
import Link from "next/link";
import styles from "./Header.module.css";
import { createClient } from "@/lib/supabase/server";
import siteConfig from "../config/site-config.json";
import specialtiesData from "../data/specialties.json";
import { ModeToggle } from "./mode-toggle";
import { NavDropdown } from "./NavDropdown";

interface NavItem {
  name: string;
  href: string;
  children?: { name: string; href: string }[];
}

interface ConfigNavItem {
  name: string;
  href: string;
  dataSource?: string;
  children?: { name: string; href: string }[];
}

function buildNavItems(): NavItem[] {
  return (siteConfig.navigation.header as ConfigNavItem[]).map(item => {
    if (item.dataSource === "specialties") {
      return {
        name: item.name,
        href: item.href,
        children: specialtiesData.map(s => ({
          name: s.name,
          href: `/search?specialty=${s.slug}`,
        })),
      };
    }
    return item as NavItem;
  });
}

export default async function Header() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const navItems = buildNavItems();

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
          {navItems.map(item => (
             <NavDropdown key={item.name} item={item} />
          ))}
        </nav>

        <div className={styles.authGroup}>
          <ModeToggle />
          <Link href="/search" className={styles.iconBtn} aria-label="Search">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/><path d="M13 13L16.5 16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </Link>
          {user ? (
            <Link href="/dashboard" className={styles.iconBtn} aria-label="Dashboard">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="6" r="3.5" stroke="currentColor" strokeWidth="1.5"/><path d="M2.5 16.5c0-3.5 2.9-6 6.5-6s6.5 2.5 6.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </Link>
          ) : (
            <Link href="/login" className={styles.iconBtn} aria-label="Login">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="6" r="3.5" stroke="currentColor" strokeWidth="1.5"/><path d="M2.5 16.5c0-3.5 2.9-6 6.5-6s6.5 2.5 6.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </Link>
          )}
          <Link href="/add-listing" className={styles.addListingBtn}>+ Add Listing</Link>
        </div>
      </div>
    </header>
  );
}
