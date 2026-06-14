'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import styles from './search.module.css';
import { Specialty } from '@/lib/api';
import { Button } from "@/components/ui/button";

interface SearchFiltersProps {
  specialties: Specialty[];
}

export default function SearchFilters({ specialties }: SearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Local States sync'd with URL
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [specialty, setSpecialty] = useState(searchParams.get('specialty') || 'all');
  const [experience, setExperience] = useState(searchParams.get('experience') || '');
  const [priceRange, setPriceRange] = useState(searchParams.get('priceRange') || '');
  const [rating, setRating] = useState(searchParams.get('rating') || '');

  const handleApply = () => {
    const params = new URLSearchParams();
    if (location) params.set('location', location);
    if (specialty !== 'all') params.set('specialty', specialty);
    if (experience) params.set('experience', experience);
    if (priceRange) params.set('priceRange', priceRange);
    if (rating) params.set('rating', rating);
    
    // Preserve search query if exists
    const q = searchParams.get('q') || searchParams.get('query');
    if (q) params.set('q', q);

    router.push(`/search?${params.toString()}`);
  };

  return (
    <aside className={styles.filters}>
      <div className={styles.filterSection}>
        <h4>Location</h4>
        <input 
          type="text" 
          placeholder="e.g. Lagos, Abuja" 
          className={styles.sidebarInput}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>

      <div className={styles.filterSection}>
        <h4>Area of Specialty</h4>
        <select 
          className={styles.sidebarInput}
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
        >
          <option value="all">All Specialties</option>
          {specialties.map(s => (
            <option key={s.id} value={s.slug || s.name}>{s.name}</option>
          ))}
        </select>
      </div>

      <div className={styles.filterSection}>
        <h4>Minimum Rating</h4>
        <div className="flex gap-2 mt-2">
          {[3, 4, 4.5].map(r => (
            <button 
              key={r} 
              className={`${styles.priceBtn} ${rating === r.toString() ? styles.activePrice : ''}`}
              onClick={() => setRating(rating === r.toString() ? '' : r.toString())}
            >
              {r}+ ⭐
            </button>
          ))}
        </div>
      </div>

      <div className={styles.filterSection}>
        <h4>Experience Level</h4>
        <div className="space-y-2 mt-2 text-sm">
          {['Junior', 'Mid-Level', 'Senior', 'Partner'].map(level => (
            <label key={level} className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name="exp" 
                checked={experience === level}
                onChange={() => setExperience(level)}
              /> {level}
            </label>
          ))}
        </div>
      </div>

      <div className={styles.filterSection}>
        <h4>Price Range</h4>
        <div className={styles.priceToggles}>
          {['₦', '₦₦', '₦₦₦', '₦₦₦₦'].map(p => (
            <button 
              key={p} 
              className={`${styles.priceBtn} ${priceRange === p ? styles.activePrice : ''}`}
              onClick={() => setPriceRange(priceRange === p ? '' : p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <Button className="w-full mt-6" onClick={handleApply}>
        Apply Intelligence Filters
      </Button>

      <button 
        className="w-full text-xs opacity-50 hover:opacity-100 transition-opacity mt-4"
        onClick={() => router.push('/search')}
      >
        Reset Discovery Protocol
      </button>
    </aside>
  );
}
