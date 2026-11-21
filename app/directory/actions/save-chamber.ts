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
import { PRACTICE_AREAS, resolvePracticeArea } from '@/lib/directory/practice-areas'

export interface MatterInput {
  title: string
  kind?: string
  practice_area_id?: string | null
  court?: string | null
  suit_number?: string | null
  citation?: string | null
  year?: number | string | null
  role?: string | null
  side?: string | null
  outcome?: string | null
  summary?: string | null
  client_name?: string | null
  client_consent?: boolean
  visibility?: string | null
}

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
  practice_area_ids?: string[]
  matters?: MatterInput[]
}

const MAX_TEXT = { name: 160, location: 160, focus: 300, description: 4000, email: 200, phone: 40, website: 300 }

const AREA_IDS = new Set(PRACTICE_AREAS.map((a) => a.id))
const MATTER_KINDS = new Set(['litigation', 'arbitration', 'advisory', 'transaction', 'regulatory', 'pro_bono'])
const MATTER_ROLES = new Set(['lead_counsel', 'co_counsel', 'supporting', 'sole'])
const MATTER_SIDES = new Set(['claimant', 'defendant', 'appellant', 'respondent', 'applicant'])
const MATTER_OUTCOMES = new Set(['in_favour', 'against', 'settled', 'pending', 'dismissed', 'withdrawn'])
const MATTER_VISIBILITY = new Set(['public', 'anonymised', 'private'])
const MAX_MATTERS = 25

function clip(value: string | null | undefined, limit: number): string | null {
  const trimmed = (value ?? '').trim()
  return trimmed ? trimmed.slice(0, limit) : null
}

/**
 * Validate matters server-side. The form is a hint; a firm could post anything.
 * Client names are dropped unless consent is recorded, which is also enforced
 * by a database constraint.
 */
function sanitiseMatters(input: MatterInput[] | undefined): { rows?: Record<string, unknown>[]; error?: string } {
  if (input === undefined) return {}
  if (!Array.isArray(input)) return { error: 'Matters must be a list' }
  if (input.length > MAX_MATTERS) return { error: `A firm can list up to ${MAX_MATTERS} matters` }

  const rows: Record<string, unknown>[] = []

  for (const [index, matter] of input.entries()) {
    const title = (matter.title ?? '').trim()
    if (!title) return { error: `Matter ${index + 1} needs a title` }
    if (title.length > 200) return { error: `Matter ${index + 1}: title is too long (max 200 characters)` }

    const rawYear = matter.year === null || matter.year === undefined || matter.year === '' ? null : Number(matter.year)
    if (rawYear !== null && (!Number.isInteger(rawYear) || rawYear < 1900 || rawYear > 2100)) {
      return { error: `Matter ${index + 1}: enter a year between 1900 and 2100` }
    }

    const consent = matter.client_consent === true
    const clientName = clip(matter.client_name, 200)

    rows.push({
      kind: MATTER_KINDS.has(matter.kind ?? '') ? matter.kind : 'advisory',
      title,
      practice_area_id: matter.practice_area_id && AREA_IDS.has(matter.practice_area_id) ? matter.practice_area_id : null,
      court: clip(matter.court, 200),
      suit_number: clip(matter.suit_number, 120),
      citation: clip(matter.citation, 200),
      year: rawYear,
      role: MATTER_ROLES.has(matter.role ?? '') ? matter.role : null,
      side: MATTER_SIDES.has(matter.side ?? '') ? matter.side : null,
      outcome: MATTER_OUTCOMES.has(matter.outcome ?? '') ? matter.outcome : null,
      summary: clip(matter.summary, 1200),
      client_name: consent ? clientName : null,
      client_consent: consent && !!clientName,
      visibility: MATTER_VISIBILITY.has(matter.visibility ?? '') ? matter.visibility : 'anonymised',
      sort_order: index,
    })
  }

  return { rows }
}

/**
 * Replace the firm's practice areas and matters.
 *
 * Deletes first: the form posts the whole list, so a removed row must actually
 * disappear. That also resets `is_verified` on an edited matter, which is the
 * intended behaviour — an edited claim has to be re-checked.
 */
async function saveFirmRelations(
  client: Awaited<ReturnType<typeof createClient>>,
  chamberId: string,
  practiceAreaIds: string[] | undefined,
  matterRows: Record<string, unknown>[] | undefined
) {
  if (practiceAreaIds !== undefined) {
    // Accept the raw taxonomy slug, and also whatever a firm typed into the
    // "other category" box ("Corporate" → corporate-law).
    const ids = [
      ...new Set(
        practiceAreaIds
          .map((raw) => (AREA_IDS.has(raw) ? raw : resolvePracticeArea(raw)?.id))
          .filter((id): id is string => Boolean(id))
      ),
    ];
    const { error: clearError } = await client.from('chamber_specialties').delete().eq('chamber_id', chamberId)
    if (clearError) console.error('Could not clear practice areas:', clearError.message)
    if (ids.length > 0) {
      const { error } = await client
        .from('chamber_specialties')
        .insert(ids.map((specialty_id) => ({ chamber_id: chamberId, specialty_id })))
      if (error) console.error('Could not save practice areas:', error.message)
    }
  }

  if (matterRows !== undefined) {
    const { error: clearError } = await client.from('chamber_matters').delete().eq('chamber_id', chamberId)
    if (clearError) console.error('Could not clear matters:', clearError.message)
    if (matterRows.length > 0) {
      const { error } = await client
        .from('chamber_matters')
        .insert(matterRows.map((row) => ({ ...row, chamber_id: chamberId })))
      if (error) console.error('Could not save matters:', error.message)
    }
  }
}

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

  const areas = input.practice_area_ids === undefined
    ? undefined
    : Array.isArray(input.practice_area_ids)
      ? input.practice_area_ids
      : []
  const matterResult = sanitiseMatters(input.matters)
  if (matterResult.error) return { error: matterResult.error }

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
    matters: matterResult.rows?.length ?? 0,
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

    await saveFirmRelations(supabase, input.chamber_id, areas, matterResult.rows)

    revalidatePath('/dashboard/chamber')
    revalidatePath('/chamber')
    revalidatePath(`/chamber/${input.chamber_id}`)
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

  await saveFirmRelations(supabase, created.id, areas, matterResult.rows)

  revalidatePath('/dashboard/chamber')
  revalidatePath('/chamber')
  return gate.ready ? {} : { blockers: gate.blockers }
}
