import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const adminRoutes = ['/admin']
const publicAdminRoutes = ['/admin/login', '/admin/auth/callback']
const NON_DIRECTORY_PREFIXES = ['/admin', '/_next', '/api', '/feed.xml', '/sitemap.xml']

const STATIC_EXT = /\.(png|jpg|jpeg|gif|ico|svg|css|js|woff2?|ttf|eot|pdf|webp|avif|mp4|webm|ogg|mp3|wav)$/i

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const host = request.headers.get('host') || ''
  const forwardedHost = request.headers.get('x-forwarded-host') || ''
  const isDirectoryHost = host === 'directory.lawyard.org' || host.endsWith('.directory.lawyard.org') || forwardedHost.includes('directory.lawyard.org')
  const isLocalDev = host.startsWith('localhost')

  if (STATIC_EXT.test(pathname)) return NextResponse.next()

  if (isDirectoryHost || isLocalDev) {
    if (NON_DIRECTORY_PREFIXES.some(p => pathname.startsWith(p))) return NextResponse.next()
    const url = request.nextUrl.clone()
    url.pathname = pathname === '/' ? '/directory' : `/directory${pathname}`
    url.search = search
    return NextResponse.rewrite(url)
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

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
