export interface Lawyer {
  id: string;
  name: string;
  role: string;
  specialty: string;
  image: string;
  location: string;
  rating: number;
  reviews: number;
  experience: string;
  priceRange: string;
  bio: string;
  achievements: string[];
  verified: boolean;
  featured: boolean;
}

export interface Chamber {
  id: string;
  name: string;
  type: string;
  focus: string;
  location: string;
  rating: number;
  image: string;
  featured: boolean;
}

export interface Specialty {
  id: string;
  name: string;
  count: number;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function getLawyers(options: { featured?: boolean; specialty?: string } = {}): Promise<Lawyer[]> {
  const params = new URLSearchParams();
  if (options.featured) params.append('featured', 'true');
  if (options.specialty) params.append('specialty', options.specialty);

  const res = await fetch(`${BASE_URL}/lawyers?${params.toString()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch lawyers');
  return res.json();
}

export async function getLawyerById(id: string): Promise<Lawyer | null> {
  const res = await fetch(`${BASE_URL}/lawyers/${id}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

export async function getChambers(options: { featured?: boolean } = {}): Promise<Chamber[]> {
  const params = new URLSearchParams();
  if (options.featured) params.append('featured', 'true');

  const res = await fetch(`${BASE_URL}/chambers?${params.toString()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch chambers');
  return res.json();
}

export async function getSpecialties(): Promise<Specialty[]> {
  const res = await fetch(`${BASE_URL}/specialties`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch specialties');
  return res.json();
}
