import Image from "next/image";
import Link from "next/link";
import styles from "./Footer.module.css";
import siteConfig from "../config/site-config.json";

export default function Footer() {
  const { socialLinks, navigation, brand } = siteConfig;

  return (
    <footer className={styles.footer}>
      <div className={styles.footerGrid}>
        <div className={styles.footerBrand}>
          <div className={styles.logoGroup} style={{ marginBottom: '1.5rem' }}>
             <Image 
               src="/lawyard-logo.png" 
               alt={`${brand.name} Logo`} 
               width={160} 
               height={40} 
               className={styles.footerLogo}
               style={{ objectFit: 'contain' }}
             />
          </div>
          <p>{brand.description}</p>
        </div>
        
        <div className={styles.footerLinks}>
          <h4>Directory</h4>
          {navigation.footer.directory.map(link => (
            <Link key={link.name} href={link.href}>{link.name}</Link>
          ))}
        </div>

        <div className={styles.footerLinks}>
          <h4>Resources</h4>
          {navigation.footer.resources.map(link => (
            <Link key={link.name} href={link.href}>{link.name}</Link>
          ))}
        </div>

        <div className={styles.footerLinks}>
          <h4>Connect</h4>
          {socialLinks.map(link => (
            <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer">
              {link.name}
            </a>
          ))}
          <a href="mailto:support@lawyard.org">Contact Us</a>
        </div>
      </div>
      <div className={styles.footerBottom}>
        <p>© 2026 {brand.name}. Architecture by Orion Horizon. All Strategic Rights Reserved.</p>
      </div>
    </footer>
  );
}
