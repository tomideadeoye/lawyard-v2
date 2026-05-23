'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import styles from '../app/page.module.css';
import { Specialty } from '@repo/api';

export function HeroSearchBar({ specialties }: { specialties: Specialty[] }) {
  const router = useRouter();
  const [specialty, setSpecialty] = useState('');

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (specialty) params.set('specialty', specialty);
    router.push(`/search?${params.toString()}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className={styles.searchBar}>
      <div className={styles.searchField}>
        <input
          type="text"
          placeholder="Search"
          onKeyDown={handleKeyDown}
        />
      </div>
      <div className={styles.searchDivider} />
      <div className={styles.searchField}>
        <select
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
        >
          <option value="">Areas of expertise</option>
          {specialties.map(s => (
            <option key={s.id} value={s.slug || s.id}>{s.name}</option>
          ))}
        </select>
        <svg className={styles.chevron} width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
      <div className={styles.searchDivider} />
      <div className={styles.searchField}>
        <select defaultValue="">
          <option value="" disabled>Location</option>
          <option value="lagos">Lagos</option>
          <option value="abuja">Abuja</option>
          <option value="port-harcourt">Port Harcourt</option>
          <option value="ibadan">Ibadan</option>
          <option value="kano">Kano</option>
        </select>
        <svg className={styles.chevron} width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
      <button onClick={handleSearch} className={styles.searchBtn}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5.5" stroke="white" strokeWidth="1.5"/><path d="M11 11L14.5 14.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
        Search
      </button>
    </div>
  );
}
