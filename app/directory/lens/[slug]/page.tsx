import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCourseBySlug, getCoursePriceForCurrentUser, getMyEnrollments } from '@/app/directory/actions/courses'
import { verifyPayment } from '@/app/directory/actions/payments'
import { formatNGN } from '@/lib/currency'
import EnrollButton from './EnrollButton'

export const dynamic = 'force-dynamic'

interface CoursePageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ enrolled?: string; reference?: string; trxref?: string }>
}

export default async function CoursePage({ params, searchParams }: CoursePageProps) {
  const { slug } = await params
  const sp = await searchParams

  if (sp.enrolled && (sp.reference || sp.trxref)) {
    await verifyPayment((sp.reference || sp.trxref)!)
  }

  const course = await getCourseBySlug(slug)
  if (!course) notFound()

  const { amount, discounted } = await getCoursePriceForCurrentUser(course)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const enrollments = user ? await getMyEnrollments() : []
  const enrolled = enrollments.some(
    (e) => (e.course as { slug?: string } | null)?.slug === slug && e.status === 'enrolled'
  )

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <Link href="/lens" className="text-sm text-muted-foreground hover:text-foreground">
        ← All courses
      </Link>

      <h1 className="text-4xl font-black mt-6 mb-4">{course.title}</h1>

      {course.cover_image && (
        <div className="aspect-video rounded-2xl overflow-hidden bg-muted mb-8">
          <img src={course.cover_image} alt={course.title} className="w-full h-full object-cover" />
        </div>
      )}

      {course.description && (
        <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap mb-8">{course.description}</p>
      )}

      {enrolled ? (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6">
          <p className="font-semibold text-emerald-600">You&apos;re enrolled.</p>
          {course.video_url ? (
            <a href={course.video_url} target="_blank" rel="noreferrer" className="inline-block mt-2 text-sm font-semibold text-primary hover:underline">
              Open course content &rarr;
            </a>
          ) : (
            <p className="text-sm text-muted-foreground mt-1">We&apos;ll email you the course access shortly.</p>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-border/50 bg-card/45 p-6 space-y-4">
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold">{formatNGN(amount)}</span>
            {discounted && (
              <>
                <span className="text-muted-foreground line-through">{formatNGN(course.price)}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-accent bg-accent/10 px-2 py-0.5 rounded">
                  Subscriber price
                </span>
              </>
            )}
          </div>
          {!user && (
            <p className="text-xs text-muted-foreground">
              <Link href="/login" className="text-primary hover:underline">Sign in</Link> to enrol — directory subscribers pay less.
            </p>
          )}
          {user ? (
            <EnrollButton slug={course.slug} amount={amount} />
          ) : (
            <Link
              href="/login"
              className="inline-block px-8 py-3 rounded-lg bg-[#a77c5c] hover:bg-[#906b4e] text-white text-sm font-bold transition-colors"
            >
              Sign in to enrol
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
