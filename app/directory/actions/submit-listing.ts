'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { galleryCapFor } from '@/lib/directory/publishing';
import { resolveListingEntitlement } from '@/lib/directory/entitlements';

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
  hide_price?: boolean;
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
    chamber_id,
    ...lawyerFields
  } = data;

  try {
    // Enforce the plan gallery cap server-side (C10). A firm seat counts: the
    // entitlement is the better of the lawyer's own plan and the firm's plan.
    const entitlement = await resolveListingEntitlement(supabase, user.id);
    const isFirm = Boolean(entitlement.chamberId);
    const galleryCap = galleryCapFor(entitlement.tier, isFirm);

    // The firm link is owned by the membership table, not by this form. A lawyer
    // who holds an active seat keeps it; a lawyer with no seat cannot acquire one
    // by posting a chamber_id from the browser.
    const { data: existing } = await supabase
      .from('lawyers')
      .select('chamber_id, verification_status')
      .eq('id', user.id)
      .maybeSingle();

    const existingLink = existing?.chamber_id ?? null;
    const requestedLink = chamber_id && chamber_id === entitlement.chamberId ? chamber_id : null;
    const chamberLink = existingLink ?? requestedLink;

    const verified = existing?.verification_status === 'verified';

    const { error: upsertError } = await supabase
      .from('lawyers')
      .upsert({
        id: user.id,
        ...lawyerFields,
        chamber_id: chamberLink,
        social_links: social_links ?? [],
        faqs: faqs ?? [],
        gallery_images: (gallery_images ?? []).slice(0, galleryCap),
        working_hours: working_hours ?? [],
        // Editing a listing must not silently revoke a verification an admin
        // already granted — pending is the state of a new or rejected listing.
        verification_status: verified ? 'verified' : 'pending',
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
