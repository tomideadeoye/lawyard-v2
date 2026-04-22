import { createClient } from './supabase/server';

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

export async function getLawyers(options: { featured?: boolean; specialty?: string } = {}): Promise<Lawyer[]> {
  const supabase = await createClient();
  
  let query = supabase
    .from('lawyers')
    .select(`
      *,
      specialties:lawyer_specialties(
        specialty:specialties(name)
      )
    `);

  if (options.featured) {
    query = query.eq('is_featured', true);
  }

  const { data: lawyers, error } = await query;

  if (error) {
    console.error('Error fetching lawyers:', error);
    return [];
  }

  let formattedData = lawyers.map((l: any) => {
    // Handle different possible structures for the specialty join
    let specialtyName = 'General Practice';
    if (l.specialties && Array.isArray(l.specialties) && l.specialties.length > 0) {
      const firstSpec = l.specialties[0];
      specialtyName = firstSpec.specialty?.name || firstSpec.name || specialtyName;
    }

    return {
      ...l,
      image: l.image_url || '',
      featured: l.is_featured || false,
      specialty: specialtyName,
      reviews: l.reviews_count || 0,
      rating: Number(l.rating) || 0,
      experience: Array.isArray(l.experience) ? (l.experience[0] || '10+ years') : (l.experience || '10+ years'),
      priceRange: '₦₦₦',
      verified: true,
    };
  });

  if (options.specialty) {
    formattedData = formattedData.filter((l: any) => 
      l.specialty.toLowerCase().includes(options.specialty!.toLowerCase())
    );
  }

  return formattedData;
}

export async function getLawyerById(id: string): Promise<Lawyer | null> {
  const supabase = await createClient();

  const { data: lawyer, error } = await supabase
    .from('lawyers')
    .select(`
      *,
      specialties:lawyer_specialties(
        specialty:specialties(name)
      )
    `)
    .eq('id', id)
    .single();

  if (error || !lawyer) {
    console.error('Error fetching lawyer by ID:', error || 'Lawyer not found');
    return null;
  }

  // Handle different possible structures for the specialty join
  let specialtyName = 'General Practice';
  if (lawyer.specialties && Array.isArray(lawyer.specialties) && lawyer.specialties.length > 0) {
    const firstSpec = lawyer.specialties[0];
    specialtyName = firstSpec.specialty?.name || firstSpec.name || specialtyName;
  }

  return {
    ...lawyer,
    image: lawyer.image_url || '',
    featured: lawyer.is_featured || false,
    specialty: specialtyName,
    reviews: lawyer.reviews_count || 0,
    rating: Number(lawyer.rating) || 0,
    experience: Array.isArray(lawyer.experience) ? (lawyer.experience[0] || '10+ years') : (lawyer.experience || '10+ years'),
    priceRange: '₦₦₦',
    verified: true,
  };
}

export async function getChambers(options: { featured?: boolean } = {}): Promise<Chamber[]> {
  const supabase = await createClient();
  
  const query = supabase.from('chambers').select('*');

  const { data: chambers, error } = await query;

  if (error) {
    console.error('Error fetching chambers:', error);
    return [];
  }

  const formattedData = chambers.map((c: any) => ({
    ...c,
    image: c.image_url || '',
    featured: false,
    rating: 4.8,
    type: 'Law Practice',
  }));

  if (options.featured) {
    return formattedData.filter(c => c.featured);
  }

  return formattedData;
}

export async function getSpecialties(): Promise<Specialty[]> {
  const supabase = await createClient();

  const { data: specialties, error } = await supabase
    .from('specialties')
    .select(`
      id,
      name,
      slug,
      lawyer_count:lawyer_specialties(count)
    `);

  if (error) {
    console.error('Error fetching specialties:', error);
    return [];
  }

  return specialties.map((s: any) => {
    // Supabase count query can return different structures depending on the join
    const countValue = Array.isArray(s.lawyer_count) 
      ? s.lawyer_count[0]?.count 
      : (s.lawyer_count?.count || s.lawyer_count || 0);
      
    return {
      id: s.id,
      name: s.name,
      count: Number(countValue) || 0,
    };
  });
}
