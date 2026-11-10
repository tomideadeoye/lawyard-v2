'use server'

// Server-side save for a chamber (law firm) profile.
//
// The form used to write to `chambers` straight from the browser, which meant
// the gallery cap and the premium intro-video rule existed only as UI hints —
// any client could exceed them. Every rule now runs here, against the caller's
// own profile, so the browser can't opt out (D2).

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { galleryCapFor, canUseIntroVideo } from '@/lib/directory/publishing'

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

export async function saveChamber(input: ChamberFormInput): Promise<{ error?: string }> {
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

  // Chambers are firm listings: they get the firm gallery ceiling.
  const galleryCap = galleryCapFor(profile?.subscription_tier, true)
  const gallery = Array.isArray(input.gallery_images) ? input.gallery_images : []
  if (gallery.some((url) => typeof url !== 'string' || !url.startsWith('http'))) {
    return { error: 'Gallery images must be uploaded files' }
  }

  const introVideo = canUseIntroVideo(profile?.subscription_tier)
    ? (input.intro_video_url || null)
    : null

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
    user_id: user.id,
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

    const { error } = await supabase.from('chambers').update(payload).eq('id', input.chamber_id)
    if (error) return { error: error.message }

    revalidatePath('/dashboard/chamber')
    return {}
  }

  const { data: created, error } = await supabase
    .from('chambers')
    .insert(payload)
    .select('id')
    .single()

  if (error || !created) return { error: error?.message || 'Could not create the chamber' }

  await supabase.from('chamber_admins').insert({
    chamber_id: created.id,
    user_id: user.id,
    role: 'owner',
  })

  revalidatePath('/dashboard/chamber')
  return {}
}
