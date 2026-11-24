import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const adminRoutes = ['/admin']
const publicAdminRoutes = ['/admin/login', '/admin/auth/callback']
// Files served from the app root on every host. Without these the directory
// rewrite turns /robots.txt into /directory/robots.txt and it 404s.
const NON_DIRECTORY_PREFIXES = ['/admin', '/_next', '/api', '/ads', '/feed.xml', '/sitemap.xml', '/robots.txt', '/ads.txt', '/product-owner']
const STATIC_EXT = /\.(?:png|jpg|jpeg|gif|ico|svg|css|js|woff2?|ttf|eot|pdf|webp|avif|mp4|webm|ogg|mp3|wav)$/i

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const host = request.headers.get('host') || ''
  const forwardedHost = request.headers.get('x-forwarded-host') || ''
  // preview.lawyard.org serves the same directory for stakeholder review, but is
  // never indexed: a demo appearing in search results is a support problem.
  const isPreviewHost = host.startsWith('preview.') || forwardedHost.startsWith('preview.')
  const isDirectoryHost =
    host === 'directory.lawyard.org' ||
    host.endsWith('.directory.lawyard.org') ||
    forwardedHost.includes('directory.lawyard.org') ||
    isPreviewHost
  const isLocalDev = host.startsWith('localhost')

  // Any host that is not a canonical public address must stay out of the index:
  // a review copy of the news site competing with WordPress is duplicate content.
  const isReviewHost = isPreviewHost || host.endsWith('.vercel.app') || forwardedHost.endsWith('.vercel.app')

  const noIndex = (response: NextResponse) => {
    if (isReviewHost) response.headers.set('x-robots-tag', 'noindex, nofollow')
    return response
  }

  if (isPreviewHost && pathname.startsWith('/directory/')) {
    // Keep the unprefixed path as the public address on the review host.
    const url = request.nextUrl.clone()
    url.pathname = pathname.replace(/^\/directory/, '') || '/'
    url.search = search
    return noIndex(NextResponse.rewrite(url))
  }

  if (STATIC_EXT.test(pathname)) return NextResponse.next()

  if (isDirectoryHost || isLocalDev) {
    if (NON_DIRECTORY_PREFIXES.some(p => pathname.startsWith(p))) return noIndex(NextResponse.next())
    const url = request.nextUrl.clone()
    url.pathname = pathname === '/' ? '/directory' : `/directory${pathname}`
    url.search = search
    return noIndex(NextResponse.rewrite(url))
  }

  let supabaseResponse = NextResponse.next({ request })

  if (pathname.startsWith('/directory')) {
    const url = `https://directory.lawyard.org${pathname.replace(/^\/directory/, '') || '/'}${search}`
    return NextResponse.redirect(url)
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))
  const isPublicAdminRoute = publicAdminRoutes.some(route => pathname.startsWith(route))

  if (isAdminRoute && !isPublicAdminRoute) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      return NextResponse.redirect(url)
    }

    if (user.app_metadata?.role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      return NextResponse.redirect(url)
    }
  }

  return noIndex(supabaseResponse)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
