'use server'

import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { initializeTransaction } from '@/lib/api/paystack'
import { generatePaymentReference, getSiteUrl } from '@/lib/utils/payment'
import { isPaidTier } from '@/lib/directory/publishing'

export interface Course {
  id: string
  slug: string
  title: string
  description: string | null
  price: number
  subscriber_price: number
  cover_image: string | null
  video_url: string | null
}

export async function getCourses(): Promise<Course[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('courses')
    .select('id, slug, title, description, price, subscriber_price, cover_image, video_url')
    .eq('status', 'published')
    .order('sort_order', { ascending: true })
  return (data ?? []) as Course[]
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('courses')
    .select('id, slug, title, description, price, subscriber_price, cover_image, video_url')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()
  return (data as Course) || null
}

/** Price the caller pays — subscriber discount applies to paid directory tiers. */
export async function getCoursePriceForCurrentUser(course: Course): Promise<{ amount: number; discounted: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { amount: Number(course.price), discounted: false }

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', user.id)
    .maybeSingle()

  const discounted = isPaidTier(profile?.subscription_tier)
  return {
    amount: discounted ? Number(course.subscriber_price) : Number(course.price),
    discounted,
  }
}

export async function enrollInCourse(slug: string) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Please sign in to enrol' }

  const course = await getCourseBySlug(slug)
  if (!course) return { error: 'Course not found' }

  const { amount } = await getCoursePriceForCurrentUser(course)
  if (amount <= 0) return { error: 'This course is not available for purchase' }

  const reference = generatePaymentReference('LWY')

  const init = await initializeTransaction({
    email: user.email!,
    amount,
    reference,
    currency: 'NGN',
    callback_url: `${getSiteUrl()}/lens/${slug}?enrolled=1`,
    metadata: { type: 'course_enrollment', user_id: user.id, course_id: course.id, course_slug: slug },
  })

  if (!init.status || !init.data) {
    return { error: init.message || 'Failed to initialize payment' }
  }

  const sbAdmin = createServiceRoleClient()
  await sbAdmin.from('course_enrollments').insert({
    user_id: user.id,
    course_id: course.id,
    amount,
    reference,
    status: 'pending_payment',
  })
  await sbAdmin.from('transactions').insert({
    user_id: user.id,
    reference,
    amount,
    currency: 'NGN',
    plan_name: `Course: ${course.title}`,
    plan_role: 'client',
    status: 'pending',
    metadata: {
      authorization_url: init.data.authorization_url,
      type: 'course_enrollment',
      course_id: course.id,
      course_slug: slug,
    },
  })

  return { authorization_url: init.data.authorization_url, reference }
}

/** Mark an enrollment paid (called from webhook / verify). Idempotent. */
export async function confirmCourseEnrollment(reference: string) {
  const sbAdmin = createServiceRoleClient()
  const { data: enr } = await sbAdmin
    .from('course_enrollments')
    .select('id, status')
    .eq('reference', reference)
    .maybeSingle()
  if (!enr || enr.status === 'enrolled') return
  await sbAdmin
    .from('course_enrollments')
    .update({ status: 'enrolled', updated_at: new Date().toISOString() })
    .eq('id', enr.id)
}

export async function getMyEnrollments() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data } = await supabase
    .from('course_enrollments')
    .select('id, status, course:courses(slug, title)')
    .eq('user_id', user.id)
  return data ?? []
}
