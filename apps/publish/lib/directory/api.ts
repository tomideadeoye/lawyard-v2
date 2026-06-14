import { createClient } from '@/lib/supabase/server';
import specialtiesData from '@/data/specialties.json';
import { Lawyer, Chamber, Specialty } from '@/lib/api';

const slugToName = new Map(specialtiesData.map(s => [s.slug, s.name]));

interface RawSpecialtyRelation {
  specialty?: { name?: string } | null;
  name?: string;
}

function parseSpecialtyNames(raw: unknown): string[] {
  if (!raw || !Array.isArray(raw)) return ['General Practice'];
  const names = (raw as RawSpecialtyRelation[])
    .map((s) => s.specialty?.name || s.name)
    .filter(Boolean) as string[];
  return names.length > 0 ? names : ['General Practice'];
}

interface RawSpecialty {
  id: string;
  name: string;
  slug: string;
  lawyer_count?: { count: number }[] | { count: number } | number | null;
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

  return (specialties as unknown as RawSpecialty[]).map((s) => {
    const countValue = Array.isArray(s.lawyer_count)
      ? s.lawyer_count[0]?.count
      : (typeof s.lawyer_count === 'object' && s.lawyer_count !== null ? (s.lawyer_count as { count: number }).count : (s.lawyer_count || 0));

    return {
      id: s.id,
      name: s.name,
      slug: s.slug,
      count: Number(countValue) || 0,
    };
  });
}

export async function getLawyers(options: {
  featured?: boolean;
  specialty?: string;
  location?: string;
  query?: string;
  rating?: number;
  priceRange?: string;
  experience?: string;
} = {}): Promise<Lawyer[]> {
  const supabase = await createClient();

  let query = supabase
    .from('lawyers')
    .select(`
      *,
      specialties:lawyer_specialties(
        specialty:specialties(name)
      )
    `);

  if (options.featured) query = query.eq('is_featured', true);
  if (options.location) query = query.ilike('location', `%${options.location}%`);
  if (options.rating) query = query.gte('rating', options.rating);
  if (options.priceRange) query = query.eq('price_range', options.priceRange);
  if (options.experience) query = query.eq('experience_level', options.experience);

  if (options.query) {
    query = query.or(`name.ilike.%${options.query}%,bio.ilike.%${options.query}%`);
  }

  const { data: lawyers, error } = await query;

  if (error) {
    console.error('Error fetching lawyers:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
    return [];
  }

  let formattedData = (lawyers as Record<string, unknown>[]).map((l) => {
    const allSpecs = parseSpecialtyNames(l.specialties);
    const rawImage = (l.image_url as string) || '';
    const image = rawImage.replace(/\.jpg$/i, '.svg');

    return {
      ...l,
      id: l.id as string,
      name: l.name as string,
      role: l.role as string,
      location: l.location as string,
      experience: Array.isArray(l.experience) ? ((l.experience as string[])[0] || '10+ years') : ((l.experience as string) || '10+ years'),
      priceRange: (l.price_range as string) || '₦₦₦',
      image,
      featured: (l.is_featured as boolean) || false,
      specialty: allSpecs[0],
      specialties: allSpecs,
      reviews: (l.reviews_count as number) || 0,
      rating: Number(l.rating) || 0,
      verified: (l.verification_status as string) === 'verified',
    } as Lawyer;
  });

  if (options.specialty && options.specialty !== 'all') {
    const targetName = slugToName.get(options.specialty.toLowerCase()) || options.specialty;
    formattedData = formattedData.filter((l) =>
      l.specialties.some((s: string) => s.toLowerCase().includes(targetName.toLowerCase()))
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

  const allSpecs = parseSpecialtyNames(lawyer.specialties);

  return {
    ...lawyer,
    image: lawyer.image_url || '',
    featured: lawyer.is_featured || false,
    specialty: allSpecs[0],
    specialties: allSpecs,
    reviews: lawyer.reviews_count || 0,
    rating: Number(lawyer.rating) || 0,
    experience: Array.isArray(lawyer.experience) ? (lawyer.experience[0] || '10+ years') : (lawyer.experience || '10+ years'),
    priceRange: '₦₦₦',
    verified: (lawyer.verification_status as string) === 'verified',
  } as Lawyer;
}

export async function getChambers(options: { featured?: boolean } = {}): Promise<Chamber[]> {
  const supabase = await createClient();

  let query = supabase.from('chambers').select('*');

  if (options.featured) query = query.eq('is_featured', true);

  const { data: chambers, error } = await query;

  if (error) {
    console.error('Error fetching chambers:', error);
    return [];
  }

  const formattedData = (chambers as Record<string, unknown>[]).map((c) => {
    const rawImage = (c.image_url as string) || '';
    return {
      ...c,
      id: c.id as string,
      name: c.name as string,
      image: rawImage.replace(/\.jpg$/i, '.svg'),
      featured: (c.is_featured as boolean) || false,
      rating: 4.8,
      type: 'Law Practice',
    } as Chamber;
  });

  if (options.featured) {
    return formattedData.filter(c => c.featured);
  }

  return formattedData;
}

export async function getArticles(options: { authorId?: string; limit?: number } = {}) {
  const supabase = await createClient();
  let query = supabase.from('articles').select('*, author:profiles(full_name)').eq('status', 'published').order('created_at', { ascending: false });
  if (options.authorId) query = query.eq('author_id', options.authorId);
  if (options.limit) query = query.limit(options.limit);
  const { data } = await query;
  return data || [];
}

export async function getPodcasts(options: { authorId?: string; limit?: number } = {}) {
  const supabase = await createClient();
  let query = supabase.from('podcasts').select('*, author:profiles(full_name)').eq('status', 'published').order('created_at', { ascending: false });
  if (options.authorId) query = query.eq('author_id', options.authorId);
  if (options.limit) query = query.limit(options.limit);
  const { data } = await query;
  return data || [];
}
