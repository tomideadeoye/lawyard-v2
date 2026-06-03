import Image from "next/image";
import Link from "next/link";
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
    <header className="sticky top-0 w-full z-[100] bg-background/90 backdrop-blur-md border-b border-border/60 py-4">
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center gap-8">
        <div className="shrink-0">
          <Link href="/" className="flex items-center gap-3 no-underline cursor-pointer group">
            <Image 
              src="/lawyard-logo.png" 
              alt={`${siteConfig.brand.name} Logo`} 
              width={160} 
              height={40} 
              priority
              style={{ objectFit: 'contain' }}
              className="group-hover:scale-[1.02] transition-transform duration-300"
            />
            <span className="text-accent font-bold text-xs tracking-widest ml-2 pl-3 border-l border-border/60 uppercase">Directory</span>
          </Link>
        </div>
        
        <nav className="hidden lg:flex items-center gap-10">
          {navItems.map(item => (
             <NavDropdown key={item.name} item={item} />
          ))}
        </nav>
        
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-4 text-foreground/60">
            <ModeToggle />
            <Link href="/search" className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-muted hover:text-foreground no-underline transition-all" aria-label="Search">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/><path d="M13 13L16.5 16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </Link>
            {user ? (
              <Link href="/dashboard" className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-muted hover:text-foreground no-underline transition-all" aria-label="Dashboard">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="6" r="3.5" stroke="currentColor" strokeWidth="1.5"/><path d="M2.5 16.5c0-3.5 2.9-6 6.5-6s6.5 2.5 6.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </Link>
            ) : (
              <Link href="/login" className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-muted hover:text-foreground no-underline transition-all" aria-label="Login">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="6" r="3.5" stroke="currentColor" strokeWidth="1.5"/><path d="M2.5 16.5c0-3.5 2.9-6 6.5-6s6.5 2.5 6.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </Link>
            )}
          </div>
          <Link href="/add-listing" className="bg-accent text-foreground no-underline px-6 py-2.5 rounded-full font-bold text-sm hover:bg-accent/90 transition-all shadow-md hover:shadow-lg active:scale-95 cursor-pointer">
            + Add Listing
          </Link>
        </div>
      </div>
    </header>
  );
}
