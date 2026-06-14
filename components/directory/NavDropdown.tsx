"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface NavChild {
  name: string;
  href: string;
}

interface NavItem {
  name: string;
  href: string;
  children?: NavChild[];
}

export function NavDropdown({ item }: { item: NavItem }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!item.children || item.children.length === 0) {
    return <Link href={item.href} className="no-underline font-medium text-foreground/70 hover:text-foreground transition-opacity text-[0.95rem] bg-transparent border-none cursor-pointer font-[inherit] p-0 flex items-center gap-1">{item.name}</Link>;
  }

  return (
    <div
      className="relative"
      ref={ref}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        className="no-underline font-medium text-foreground/70 hover:text-foreground transition-opacity text-[0.95rem] bg-transparent border-none cursor-pointer font-[inherit] p-0 flex items-center gap-1"
        onClick={() => setOpen(prev => !prev)}
        aria-expanded={open}
      >
        {item.name}
        <svg className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M2.5 4L5 6.5L7.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 pt-3 z-[200]">
          <div className="bg-background border border-border rounded-xl py-2 min-w-[220px] shadow-lg animate-[dropIn_0.15s_ease-out]">
            {item.children.map(child => (
              <Link
                key={child.name}
                href={child.href}
                className="block px-5 py-2.5 no-underline text-foreground text-sm font-normal hover:bg-border/30 transition-colors whitespace-nowrap"
                onClick={() => setOpen(false)}
              >
                {child.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
