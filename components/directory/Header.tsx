"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import siteConfig from "@/config/site-config.json";
import specialtiesData from "@/data/specialties.json";
import { ModeToggle } from "@/components/mode-toggle";
import { NavDropdown } from "./NavDropdown";
import { cn } from "@/lib/utils";

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
          href: `/directory/search?specialty=${s.slug}`,
        })),
      };
    }
    return item as NavItem;
  });
}

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navItems = buildNavItems();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <header className={cn(
      "w-full sticky top-0 z-50 transition-all duration-300",
      scrolled 
        ? "bg-[#111129] border-b border-white/10 shadow-lg py-3" 
        : "bg-background border-b border-border/50 shadow-sm py-4"
    )}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center gap-8">
        
        {/* Left Block: Logo & Badge */}
        <div className="shrink-0 flex items-center">
          <Link href="/directory" className="flex items-center gap-2.5 no-underline cursor-pointer group">
            {/* Light Mode Logo (Blue) */}
            <img 
              src="/logo-blue.png" 
              alt="Lawyard Logo" 
              className={cn(
                "h-9 w-auto object-contain group-hover:scale-[1.01] transition-transform duration-300",
                scrolled ? "hidden" : "block dark:hidden"
              )}
            />
            {/* Dark Mode / Scrolled Logo (White) */}
            <img 
              src="/logo-white.png" 
              alt="Lawyard Logo" 
              className={cn(
                "h-9 w-auto object-contain group-hover:scale-[1.01] transition-transform duration-300",
                scrolled ? "block" : "hidden dark:block"
              )}
            />
            <span className="font-bold text-[10px] tracking-widest ml-2 pl-3 border-l border-white/20 uppercase text-[#a77c5c]">
              Directory
            </span>
          </Link>
        </div>
        
        {/* Center Block: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-8">
          {navItems.map(item => (
             <NavDropdown key={item.name} item={item} scrolled={scrolled} />
          ))}
        </nav>
        
        {/* Right Block: Utilities & Action Button */}
        <div className="flex items-center gap-5">
          <div className={cn(
            "flex items-center gap-4 transition-colors duration-300",
            scrolled ? "text-white/70" : "text-muted-foreground"
          )}>
            <ModeToggle scrolled={scrolled} />
            
            <Link 
              href="/search" 
              className={cn(
                "flex items-center justify-center w-9 h-9 rounded-full no-underline transition-all",
                scrolled ? "hover:bg-white/10 hover:text-white" : "hover:bg-muted hover:text-foreground"
              )} 
              aria-label="Search"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M13 13L16.5 16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </Link>

            {user ? (
              <Link
                href="/directory/dashboard"
                className={cn(
                  "flex items-center justify-center w-9 h-9 rounded-full no-underline transition-all overflow-hidden",
                  scrolled ? "hover:ring-2 hover:ring-white/30" : "hover:ring-2 hover:ring-accent/30"
                )}
                aria-label="Dashboard"
              >
                {user.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
                ) : (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <circle cx="9" cy="6" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M2.5 16.5c0-3.5 2.9-6 6.5-6s6.5 2.5 6.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                )}
              </Link>
            ) : (
              <Link 
                href="/directory/login" 
                className={cn(
                  "flex items-center justify-center w-9 h-9 rounded-full no-underline transition-all",
                  scrolled ? "hover:bg-white/10 hover:text-white" : "hover:bg-muted hover:text-foreground"
                )} 
                aria-label="Login"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <circle cx="9" cy="6" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M2.5 16.5c0-3.5 2.9-6 6.5-6s6.5 2.5 6.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </Link>
            )}
          </div>

          <Link 
            href="/directory/add-listing" 
            className={cn(
              "no-underline px-5 py-2 rounded-full font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-md active:scale-95 cursor-pointer text-white",
              "bg-[#a77c5c] hover:bg-[#906b4e] hover:shadow-lg"
            )}
          >
            + Add Listing
          </Link>
        </div>
      </div>
    </header>
  );
}
