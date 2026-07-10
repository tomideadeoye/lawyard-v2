import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const adminRoutes = ['/admin']
const publicAdminRoutes = ['/admin/login', '/admin/auth/callback']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  let supabaseResponse = NextResponse.next({ request })

  const forwardedHost = request.headers.get('x-forwarded-host')
  const isDirectoryHost = typeof forwardedHost === 'string' && forwardedHost.includes('directory.lawyard.org')

  if (isDirectoryHost) {
    if (pathname.startsWith('/directory')) {
      const cleanPath = pathname.replace(/^\/directory/, '') || '/'
      return NextResponse.rewrite(new URL(`${cleanPath}${request.nextUrl.search}`, request.url))
    }
    const response = NextResponse.rewrite(new URL(`/directory${pathname}${request.nextUrl.search}`, request.url))
    return response
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
