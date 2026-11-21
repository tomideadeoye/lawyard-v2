'use server'

// Server-side save for a chamber (law firm) profile.
//
// The form used to write to `chambers` straight from the browser, which meant
// the gallery cap and the premium intro-video rule existed only as UI hints —
// any client could exceed them. Every rule now runs here, against the caller's
// own profile, so the browser can't opt out (D2).

import { revalidatePath } from 'next/cache'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { galleryCapFor, canUseIntroVideo } from '@/lib/directory/publishing'
import { chamberPublishCheck } from '@/lib/directory/publishability'

export interface ChamberFormInput {
  chamber_id?: string | null
  name: string
  location?: string
  focus?: string
  description?: string
  email?: string
  phone?: string
  website?: string
  working_hours?: { day: string; hours: string }[]
  faqs?: { question: string; answer: string }[]
  gallery_images?: string[]
  intro_video_url?: string
}

const MAX_TEXT = { name: 160, location: 160, focus: 300, description: 4000, email: 200, phone: 40, website: 300 }

export interface SaveChamberResult {
  error?: string
  /** Publish requirements still missing; the draft is saved regardless. */
  blockers?: string[]
}

export async function saveChamber(input: ChamberFormInput): Promise<SaveChamberResult> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Not authenticated' }

  const name = (input.name ?? '').trim()
  if (!name) return { error: 'Chamber name is required' }
  if (name.length > MAX_TEXT.name) return { error: 'Chamber name is too long' }

  for (const [field, limit] of Object.entries(MAX_TEXT)) {
    const value = (input as unknown as Record<string, unknown>)[field]
    if (typeof value === 'string' && value.length > limit) {
      return { error: `${field.replace('_', ' ')} is too long (max ${limit} characters)` }
    }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', user.id)
    .maybeSingle()

  // Editing an existing firm: its own subscription is the entitlement. Reading
  // the editor's personal plan meant an Enterprise firm whose owner had no
  // personal plan was capped at the free gallery ceiling (C22).
  let firmTier = profile?.subscription_tier
  if (input.chamber_id) {
    const { data: existingChamber } = await supabase
      .from('chambers')
      .select('subscription_tier, subscription_status, subscription_expires_at')
      .eq('id', input.chamber_id)
      .maybeSingle()

    const active =
      existingChamber?.subscription_status === 'active' &&
      (!existingChamber?.subscription_expires_at ||
        new Date(existingChamber.subscription_expires_at) > new Date())

    if (active && existingChamber?.subscription_tier) {
      firmTier = existingChamber.subscription_tier
    }
  }

  // Chambers are firm listings: they get the firm gallery ceiling.
  const galleryCap = galleryCapFor(firmTier, true)
  const gallery = Array.isArray(input.gallery_images) ? input.gallery_images : []
  if (gallery.some((url) => typeof url !== 'string' || !url.startsWith('http'))) {
    return { error: 'Gallery images must be uploaded files' }
  }

  const introVideo = canUseIntroVideo(firmTier)
    ? (input.intro_video_url || null)
    : null

  const draft = {
    name,
    description: input.description || null,
    location: input.location || null,
    focus: input.focus || null,
    email: input.email || null,
    phone: input.phone || null,
    website: input.website || null,
    image_url: null as string | null,
    gallery_images: gallery.slice(0, galleryCap),
  };
  const gate = chamberPublishCheck(draft);

  const payload = {
    name,
    location: input.location || null,
    focus: input.focus || null,
    description: input.description || null,
    email: input.email || null,
    phone: input.phone || null,
    website: input.website || null,
    working_hours: input.working_hours ?? [],
    faqs: input.faqs ?? [],
    gallery_images: gallery.slice(0, galleryCap),
    intro_video_url: introVideo,
  }

  if (input.chamber_id) {
    // Only an admin of this chamber may edit it.
    const { data: membership } = await supabase
      .from('chamber_admins')
      .select('role')
      .eq('chamber_id', input.chamber_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!membership) return { error: 'You do not have access to this chamber' }

    // user_id is the billing owner and must never move because a delegate admin
    // saved the form (it used to be written on every update).
    const { error } = await supabase.from('chambers').update(payload).eq('id', input.chamber_id)
    if (error) return { error: error.message }

    revalidatePath('/dashboard/chamber')
    revalidatePath('/chamber')
    return gate.ready ? {} : { blockers: gate.blockers }
  }

  const { data: created, error } = await supabase
    .from('chambers')
    .insert({ ...payload, user_id: user.id })
    .select('id')
    .single()

  if (error || !created) return { error: error?.message || 'Could not create the chamber' }

  // Membership tables are service-role-only by design: the browser must never be
  // able to write a seat or an admin row directly. The caller has just been
  // authorised as the creator, so the two bootstrap rows are safe to write here.
  const admin = createServiceRoleClient()

  // One open membership at a time: a lawyer cannot own a second firm while
  // holding a seat in another one. They have to leave first.
  const { data: openSeat } = await admin
    .from('chamber_members')
    .select('chamber_id, status')
    .eq('lawyer_id', user.id)
    .in('status', ['pending', 'active'])
    .maybeSingle()

  if (openSeat && openSeat.chamber_id !== created.id) {
    await supabase.from('chambers').delete().eq('id', created.id)
    return {
      error:
        openSeat.status === 'active'
          ? 'You already hold a seat in another firm. Leave it before creating a new firm page.'
          : 'You have a pending firm request. Resolve that before creating a new firm page.',
    }
  }

  await admin.from('chamber_admins').insert({
    chamber_id: created.id,
    user_id: user.id,
    role: 'owner',
  })

  // The owner occupies the firm's first seat, so the free tier's single seat is
  // used by the person who created the firm rather than sitting empty.
  await admin.from('chamber_members').insert({
    chamber_id: created.id,
    lawyer_id: user.id,
    seat_role: 'partner',
    status: 'active',
    joined_at: new Date().toISOString(),
  })

  // Link their listing if one already exists; if not, the row appears the first
  // time they submit a lawyer listing.
  await supabase
    .from('lawyers')
    .update({ chamber_id: created.id })
    .eq('id', user.id)

  revalidatePath('/dashboard/chamber')
  revalidatePath('/chamber')
  return gate.ready ? {} : { blockers: gate.blockers }
}
