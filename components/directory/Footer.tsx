import Image from "next/image";
import Link from "next/link";
import siteConfig from "@/config/site-config.json";

export default function Footer() {
  const { socialLinks, navigation, brand, contact } = siteConfig;

  return (
    <footer className="px-6 pt-24 pb-12 bg-background border-t border-border mt-auto">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
        <div className="lg:col-span-2">
          <div className="flex items-center mb-6">
            <Image 
              src="/lawyard-logo.png" 
              alt={`${brand.name} Logo`} 
              width={160} 
              height={40} 
              style={{ objectFit: 'contain' }}
            />
          </div>
          <p className="text-muted-foreground max-w-[320px] leading-relaxed text-sm">
            {brand.description}
          </p>
        </div>
        
        <div className="flex flex-col gap-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-foreground mb-2">Directory</h4>
          {navigation.footer.directory.map(link => (
            <Link key={link.name} href={link.href} className="no-underline text-muted-foreground hover:text-primary text-sm transition-colors">{link.name}</Link>
          ))}
        </div>
        
        <div className="flex flex-col gap-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-foreground mb-2">Resources</h4>
          {navigation.footer.resources.map(link => (
            <Link key={link.name} href={link.href} className="no-underline text-muted-foreground hover:text-primary text-sm transition-colors">{link.name}</Link>
          ))}
        </div>
        
        <div className="flex flex-col gap-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-foreground mb-2">Connect</h4>
          {socialLinks.map(link => (
            <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer" className="no-underline text-muted-foreground hover:text-primary text-sm transition-colors">
              {link.name}
            </a>
          ))}
          <a href={`mailto:${contact.email}`} className="no-underline text-muted-foreground hover:text-primary text-sm transition-colors">Contact Us</a>
        </div>
      </div>
      <div className="max-w-6xl mx-auto pt-8 border-t border-border/60 text-center text-xs opacity-50">
        <p>© 2026 {brand.name}. Architecture by Orion Horizon. All Strategic Rights Reserved.</p>
      </div>
    </footer>
  );
}
