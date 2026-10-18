import Link from 'next/link'
import { getCourses, getCoursePriceForCurrentUser } from '@/app/directory/actions/courses'
import { formatNGN } from '@/lib/currency'

export const metadata = {
  title: 'Lawyard Lens — Courses',
  description: 'Practical courses for legal professionals, with a subscriber discount for directory members.',
}

export const dynamic = 'force-dynamic'

export default async function LensPage() {
  const courses = await getCourses()
  const priced = await Promise.all(
    courses.map(async (c) => ({ course: c, ...(await getCoursePriceForCurrentUser(c)) }))
  )

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <div className="mb-12">
        <h1 className="text-4xl font-black mb-3">Lawyard Lens</h1>
        <p className="text-muted-foreground text-lg">
          Focused courses for legal professionals. Directory subscribers pay a reduced rate.
        </p>
      </div>

      {priced.length === 0 ? (
        <div className="text-center py-24 text-muted-foreground">
          <p className="text-lg">No courses available yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {priced.map(({ course, amount, discounted }) => (
            <Link key={course.id} href={`/lens/${course.slug}`} className="no-underline group">
              <article className="flex flex-col h-full p-6 bg-card border border-border/60 rounded-2xl hover:border-accent/50 hover:shadow-lg transition-all">
                {course.cover_image && (
                  <div className="aspect-video rounded-lg overflow-hidden bg-muted mb-4">
                    <img src={course.cover_image} alt={course.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <h2 className="text-xl font-bold group-hover:text-primary transition-colors">{course.title}</h2>
                {course.description && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-3 flex-1">{course.description}</p>
                )}
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-lg font-bold">{formatNGN(amount)}</span>
                  {discounted && (
                    <>
                      <span className="text-sm text-muted-foreground line-through">{formatNGN(course.price)}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-accent bg-accent/10 px-2 py-0.5 rounded">
                        Subscriber price
                      </span>
                    </>
                  )}
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
