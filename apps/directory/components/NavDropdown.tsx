"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import styles from "./Header.module.css";

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
    return <Link href={item.href} className={styles.navLink}>{item.name}</Link>;
  }

  return (
    <div
      className={styles.navDropdownWrapper}
      ref={ref}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        className={styles.navLink}
        onClick={() => setOpen(prev => !prev)}
        aria-expanded={open}
      >
        {item.name}
        <svg className={styles.navChevron} width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M2.5 4L5 6.5L7.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className={styles.dropdownMenu}>
          {item.children.map(child => (
            <Link
              key={child.name}
              href={child.href}
              className={styles.dropdownItem}
              onClick={() => setOpen(false)}
            >
              {child.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
