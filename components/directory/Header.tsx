"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X, ChevronDown, LayoutDashboard, User, Settings, LogOut } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import siteConfig from "@/config/site-config.json";
import specialtiesData from "@/data/specialties.json";
import { ModeToggle } from "@/components/mode-toggle";
import { NavDropdown } from "./NavDropdown";
import { MobileDrawer } from "@/components/MobileDrawer";
import { cn } from "@/lib/utils";
import { signOut } from "@/app/directory/login/actions";

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

function UserMenu({ user, scrolled }: { user: SupabaseUser; scrolled: boolean }) {
  const triggerClasses = cn(
    "flex items-center justify-center w-9 h-9 rounded-full no-underline transition-all overflow-hidden cursor-pointer",
    scrolled ? "ring-2 ring-white/20 hover:ring-white/40" : "ring-2 ring-border/50 hover:ring-accent/30"
  );

  return (
    <div className="relative group">
      {/* Avatar trigger — hover anywhere in this group keeps the menu open */}
      <div className={triggerClasses}>
        {user.user_metadata?.avatar_url ? (
          <img src={user.user_metadata.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
        ) : (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="6" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M2.5 16.5c0-3.5 2.9-6 6.5-6s6.5 2.5 6.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        )}
      </div>

      {/* Dropdown — CSS-driven, no JS gap issue */}
      <div className={cn(
        "absolute right-0 top-full pt-1.5 z-50",
        "invisible opacity-0 group-hover:visible group-hover:opacity-100",
        "transition-all duration-150"
      )}>
        <div className="w-56 rounded-xl border shadow-xl overflow-hidden bg-popover text-popover-foreground border-border/50">
          {/* User info */}
          <div className="px-4 py-3 border-b border-border/30">
            <p className="text-sm font-semibold truncate">{user.email}</p>
            <p className="text-xs text-muted-foreground truncate">{user.user_metadata?.full_name || ""}</p>
          </div>

          {/* Links */}
          <div className="p-1.5 space-y-0.5">
            <DropdownItem href="/dashboard" icon={<LayoutDashboard className="h-4 w-4" />} label="Dashboard" />
            <DropdownItem href="/dashboard/profile" icon={<User className="h-4 w-4" />} label="My Profile" />
            <DropdownItem href="/dashboard/settings" icon={<Settings className="h-4 w-4" />} label="Settings" />
          </div>

          {/* Sign out */}
          <div className="border-t border-border/30 p-1.5">
            <form action={signOut}>
              <button
                type="submit"
                className="flex items-center gap-3 w-full px-3 py-2 text-sm rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function DropdownItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 w-full px-3 py-2 text-sm rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors no-underline"
    >
      {icon}
      {label}
    </Link>
  );
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

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openSections, setOpenSections] = useState<string[]>([]);
  const navItems = buildNavItems();

  function toggleSection(name: string) {
    setOpenSections(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  }

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
      "w-full sticky top-0 z-50 py-4 transition-[background-color,border-color,box-shadow] duration-300",
      scrolled 
        ? "bg-[#111129] border-b border-white/10 shadow-lg" 
        : "bg-background border-b border-border/50 shadow-sm"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex justify-between items-center gap-3 lg:gap-8">
        
        {/* Left Block: Hamburger + Logo & Badge */}
        <div className="shrink-0 flex items-center">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className={cn(
              "lg:hidden hover:opacity-80 transition-all p-1 mr-2",
              scrolled ? "text-white/90" : "text-foreground"
            )}
            aria-label="Open Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/" className="flex items-center gap-1.5 sm:gap-2.5 no-underline cursor-pointer group min-w-0">
            {/* Light Mode Logo (Blue) */}
            <img 
              src="/logo-blue.png" 
              alt="Lawyard Logo" 
              className={cn(
                "h-7 sm:h-9 w-auto max-w-[90px] sm:max-w-none object-contain group-hover:scale-[1.01] transition-transform duration-300",
                scrolled ? "hidden" : "block dark:hidden"
              )}
            />
            {/* Dark Mode / Scrolled Logo (White) */}
            <img 
              src="/logo-white.png" 
              alt="Lawyard Logo" 
              className={cn(
                "h-7 sm:h-9 w-auto max-w-[90px] sm:max-w-none object-contain group-hover:scale-[1.01] transition-transform duration-300",
                scrolled ? "block" : "hidden dark:block"
              )}
            />
            <span className="hidden sm:inline font-bold text-[10px] tracking-widest ml-2 pl-3 border-l border-white/20 uppercase text-[#a77c5c]">
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
        <div className="flex items-center gap-2 sm:gap-5">
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
              <UserMenu user={user} scrolled={scrolled} />
            ) : (
              <Link 
                href="/login" 
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
            href="/add-listing" 
            className={cn(
              "no-underline px-3 sm:px-5 py-1.5 sm:py-2 rounded-full font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-md active:scale-95 cursor-pointer text-white",
              "bg-[#a77c5c] hover:bg-[#906b4e] hover:shadow-lg",
              "max-sm:hidden" // hidden on mobile — available in drawer
            )}
          >
            + Add Listing
          </Link>
        </div>
      </div>

      {/* Mobile Drawer */}
      <MobileDrawer open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)}>
        <div className="flex flex-col h-full p-6">
          {/* Header: Logo + Close */}
          <div className="flex items-center justify-between pb-6 border-b border-border/10 shrink-0">
            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2.5 no-underline">
              <img
                src="/logo-blue.png"
                alt="Lawyard Logo"
                className="h-7 w-auto object-contain dark:hidden"
              />
              <img
                src="/logo-white.png"
                alt="Lawyard Logo"
                className="h-7 w-auto object-contain hidden dark:block"
              />
              <span className="font-bold text-[10px] tracking-widest ml-2 pl-3 border-l border-border/40 uppercase text-[#a77c5c]">
                Directory
              </span>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
              aria-label="Close Menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Nav items */}
          <div className="flex-1 overflow-y-auto py-6 space-y-1 select-none">
            <nav className="flex flex-col gap-1 text-xs font-bold uppercase tracking-widest text-foreground">
              {navItems.map(item =>
                item.children && item.children.length > 0 ? (
                  <div key={item.name} className="flex flex-col">
                    <button
                      onClick={() => toggleSection(item.name)}
                      className="flex items-center justify-between hover:text-primary transition-colors py-3 text-left w-full uppercase font-bold text-xs tracking-widest"
                    >
                      <span>{item.name}</span>
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition-transform duration-200 ${
                          openSections.includes(item.name) ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    <div
                      className={`pl-4 flex flex-col gap-2 normal-case font-semibold text-muted-foreground/90 overflow-hidden transition-all duration-300 ${
                        openSections.includes(item.name) ? 'max-h-[500px] mt-2 pb-2' : 'max-h-0'
                      }`}
                    >
                      {item.children.map(child => (
                        <Link
                          key={child.name}
                          href={child.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="hover:text-foreground transition-colors no-underline py-1.5"
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="hover:text-primary transition-colors py-3 no-underline uppercase font-bold text-xs tracking-widest"
                  >
                    {item.name}
                  </Link>
                )
              )}
            </nav>
          </div>

          {/* Footer: Auth + CTA */}
          <div className="pt-6 border-t border-border/10 flex flex-col gap-4 shrink-0">
            {user ? (
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 no-underline text-foreground hover:text-primary transition-colors"
              >
                {user.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                      <circle cx="9" cy="6" r="3.5" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M2.5 16.5c0-3.5 2.9-6 6.5-6s6.5 2.5 6.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </div>
                )}
                <span className="text-xs font-bold">Dashboard</span>
              </Link>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs font-bold text-foreground hover:text-primary transition-colors no-underline"
              >
                Sign In
              </Link>
            )}
            <Link
              href="/add-listing"
              onClick={() => setMobileMenuOpen(false)}
              className="text-center no-underline px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider bg-[#a77c5c] hover:bg-[#906b4e] text-white transition-colors shadow-md"
            >
              + Add Listing
            </Link>
          </div>
        </div>
      </MobileDrawer>
    </header>
  );
}
