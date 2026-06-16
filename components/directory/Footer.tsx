import Link from "next/link";
import siteConfig from "@/config/site-config.json";

function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function TwitterIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
    </svg>
  );
}

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function YoutubeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
    </svg>
  );
}

function LinkedinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

const iconMap: Record<string, React.ComponentType<any>> = {
  Facebook: FacebookIcon,
  Twitter: TwitterIcon,
  Instagram: InstagramIcon,
  YouTube: YoutubeIcon,
  LinkedIn: LinkedinIcon
};

export default function Footer() {
  const { socialLinks, navigation, brand, contact } = siteConfig;

  return (
    <footer className="w-full bg-background border-t border-border mt-auto">
      {/* Upper Footer: Grid columns */}
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-12 gap-10">
        
        {/* Column 1: Brand details */}
        <div className="md:col-span-5 space-y-6">
          <h4 className="text-xs font-bold uppercase tracking-widest text-foreground border-b border-border/30 pb-2">
            Directory Services
          </h4>
          <div className="flex items-center">
            {/* Light Mode Logo */}
            <img 
              src="/logo-blue.png" 
              alt="Lawyard Logo" 
              className="h-9 w-auto object-contain block dark:hidden"
            />
            {/* Dark Mode Logo */}
            <img 
              src="/logo-white.png" 
              alt="Lawyard Logo" 
              className="h-9 w-auto object-contain hidden dark:block"
            />
            <span className="text-accent font-bold text-[10px] tracking-widest ml-2.5 pl-3 border-l border-border/60 uppercase">
              Directory
            </span>
          </div>
          <p className="text-muted-foreground text-xs leading-relaxed max-w-sm">
            {brand.description}
          </p>
        </div>

        {/* Column 2: Directory Specific Navigation */}
        <div className="md:col-span-3 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-foreground border-b border-border/30 pb-2">
            Explore Directory
          </h4>
          <div className="grid grid-cols-1 gap-2.5 text-xs font-semibold">
            {navigation.footer.directory.map(link => (
              <Link 
                key={link.name} 
                href={link.href} 
                className="no-underline text-muted-foreground hover:text-primary transition-colors py-0.5"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Column 3: Resource Links */}
        <div className="md:col-span-4 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-foreground border-b border-border/30 pb-2">
            Resources
          </h4>
          <div className="grid grid-cols-1 gap-2.5 text-xs font-semibold">
            {navigation.footer.resources.map(link => (
              <Link 
                key={link.name} 
                href={link.href} 
                className="no-underline text-muted-foreground hover:text-primary transition-colors py-0.5"
              >
                {link.name}
              </Link>
            ))}
            <a 
              href={`mailto:${contact.email}`} 
              className="no-underline text-muted-foreground hover:text-primary transition-colors py-0.5"
            >
              Contact Us
            </a>
          </div>
        </div>

      </div>

      {/* Lower Footer: Dark Bottom Utility Bar */}
      <div className="w-full bg-[#111129] text-white/80 py-10 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          {/* Left Block: Nav Links */}
          <div className="flex flex-wrap items-center gap-6 text-[10px] font-black uppercase tracking-widest text-white/90 justify-center md:justify-start">
            <Link href="/" className="hover:text-white transition-colors no-underline">Portal Home</Link>
            <Link href="/directory/search" className="hover:text-white transition-colors no-underline">Find Counsel</Link>
            <Link href="/directory/add-listing" className="hover:text-white transition-colors no-underline">Register Profile</Link>
            <Link href="/directory/dashboard" className="hover:text-white transition-colors no-underline">Dashboard</Link>
          </div>

          {/* Center Block: Logo Signature */}
          <div className="flex justify-center items-center">
            <Link href="/" className="flex items-center justify-center cursor-pointer">
              <img 
                src="/logo-white.png" 
                alt="Lawyard Logo" 
                className="h-8 w-auto object-contain"
              />
            </Link>
          </div>

          {/* Right Block: Social Icons */}
          <div className="flex items-center justify-center gap-4 text-white/90">
            {socialLinks.map(link => {
              const Icon = iconMap[link.name] || (() => null);
              return (
                <a 
                  key={link.name} 
                  href={link.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-white transition-colors" 
                  aria-label={link.name}
                >
                  <Icon className="h-4 w-4" />
                </a>
              );
            })}
          </div>

        </div>

        {/* Lower Row: Copyright Notice */}
        <div className="max-w-7xl mx-auto pt-6 mt-6 border-t border-white/5 text-center text-[8.5px] font-bold uppercase tracking-widest text-white/40">
          <p>© COPYRIGHT 2026 ALL RIGHTS RESERVED | DESIGNED BY RENIX CONSULTING | ARCHITECTURE BY ORION HORIZON</p>
        </div>
      </div>
    </footer>
  );
}
