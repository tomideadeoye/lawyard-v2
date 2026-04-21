const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function getLawyers(options: { featured?: boolean; specialty?: string } = {}) {
  const params = new URLSearchParams();
  if (options.featured) params.append('featured', 'true');
  if (options.specialty) params.append('specialty', options.specialty);

  const res = await fetch(`${BASE_URL}/lawyers?${params.toString()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch lawyers');
  return res.json();
}

export async function getLawyerById(id: string) {
  const res = await fetch(`${BASE_URL}/lawyers/${id}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

export async function getChambers(options: { featured?: boolean } = {}) {
  const params = new URLSearchParams();
  if (options.featured) params.append('featured', 'true');

  const res = await fetch(`${BASE_URL}/chambers?${params.toString()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch chambers');
  return res.json();
}

export async function getSpecialties() {
  const res = await fetch(`${BASE_URL}/specialties`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch specialties');
  return res.json();
}
