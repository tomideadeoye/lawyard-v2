import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface BookmarkLawyer {
  id: string
  name: string
  role: string
  location: string | null
  image_url: string | null
  rating: number | null
  reviews_count: number | null
  verification_status: string | null
}

export const metadata = {
  title: 'Bookmarks — Lawyard Dashboard',
}

export default async function FavoritesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/directory/login')

  const { data: bookmarks } = await supabase
    .from('bookmarks')
    .select(`
      created_at,
      lawyer:lawyers(id, name, role, location, image_url, rating, reviews_count, verification_status)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const items = bookmarks ?? []

  return (
    <div className="space-y-8 animate-fade-in px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bookmarks</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Lawyers and chambers you&apos;ve saved for later.
          </p>
        </div>
        <Link href="/directory/search">
          <Button variant="outline" size="sm">Browse Directory</Button>
        </Link>
      </div>

      {items.length === 0 ? (
        <Card className="border border-border/40 bg-card/45 backdrop-blur-md">
          <CardContent className="text-center py-16 space-y-4">
            <div className="text-5xl">♡</div>
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">No bookmarks yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Search the directory and save lawyers or chambers you&apos;re interested in.
              </p>
            </div>
            <Link href="/directory/search">
              <Button>Find Lawyers</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((bm: { created_at: string; lawyer: BookmarkLawyer | BookmarkLawyer[] }) => {
            const bl = Array.isArray(bm.lawyer) ? bm.lawyer[0] : bm.lawyer
            if (!bl) return null
            return (
              <Link
                key={bm.created_at}
                href={`/directory/lawyer/${bl.id}`}
                className="no-underline"
              >
                <Card className="border border-border/40 bg-card/45 backdrop-blur-md hover:shadow-md hover:border-accent/30 transition-all h-full">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-lg font-bold shrink-0">
                        {bl.name?.[0] || 'L'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold truncate">{bl.name}</h3>
                        <p className="text-xs text-muted-foreground">{bl.role || 'Legal Practitioner'}</p>
                        {bl.location && (
                          <p className="text-xs text-muted-foreground mt-1">{bl.location}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          Saved {new Date(bm.created_at).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
