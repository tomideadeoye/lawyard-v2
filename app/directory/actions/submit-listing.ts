'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface ListingFormData {
  name: string;
  role?: string;
  location?: string;
  brief_bio?: string;
  bio?: string;
  age?: number;
  gender?: string;
  enrollment_number?: string;
  enrollment_number_tx?: string;
  education?: string[];
  organization_memberships?: string[];
  publications?: string[];
  awards?: string[];
  volunteer_pro_bono?: string[];
  image_url?: string | null;
  intro_video_url?: string;
  gallery_images?: string[];
  email?: string;
  phone?: string;
  website?: string;
  zip_code?: string;
  address?: string;
  social_links?: { platform: string; url: string }[];
  chamber_id?: string;
  price_range?: string;
  hide_contact_form?: boolean;
  listing_type?: string;
  faqs?: { question: string; answer: string }[];
  working_hours?: any;
  specialties?: string[];
}

export async function submitLawyerListing(data: ListingFormData) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: 'Not authenticated' };
  }

  const {
    specialties,
    social_links,
    faqs,
    gallery_images,
    working_hours,
    ...lawyerFields
  } = data;

  try {
    const { error: upsertError } = await supabase
      .from('lawyers')
      .upsert({
        id: user.id,
        ...lawyerFields,
        social_links: social_links ?? [],
        faqs: faqs ?? [],
        gallery_images: gallery_images ?? [],
        working_hours: working_hours ?? [],
        verification_status: 'pending',
      });

    if (upsertError) throw upsertError;

    if (specialties && specialties.length > 0) {
      await supabase
        .from('lawyer_specialties')
        .delete()
        .eq('lawyer_id', user.id);

      const specsToInsert = specialties.map(s => ({
        lawyer_id: user.id,
        specialty_id: s,
      }));

      const { error: specError } = await supabase
        .from('lawyer_specialties')
        .insert(specsToInsert);

      if (specError) throw specError;
    }

    await supabase
      .from('profiles')
      .update({ role: 'lawyer' })
      .eq('id', user.id);

    revalidatePath('/directory/dashboard');
    revalidatePath('/directory/lawyer/[id]');

    return { success: true };
  } catch (err) {
    console.error('Listing submit error:', err);
    return { error: err instanceof Error ? err.message : 'Submission failed' };
  }
}
