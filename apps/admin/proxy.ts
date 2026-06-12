import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();
  
  // Define public / auth path exclusions
  const isLoginPage = url.pathname === '/login';
  const isAuthCallback = url.pathname === '/auth/callback';
  const isStatic = url.pathname.includes('/_next/') || url.pathname.includes('/favicon.ico') || url.pathname.includes('/images/');

  // If not logged in and trying to access admin pages, redirect to login
  if (!user) {
    if (!isLoginPage && !isAuthCallback && !isStatic) {
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    return response;
  }

  // If logged in, check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    // Force sign out on the client and cookies if they are not admin
    await supabase.auth.signOut();
    
    url.pathname = '/login';
    url.searchParams.set('message', 'Unauthorized. Admin role required.');
    
    const redirectResponse = NextResponse.redirect(url);
    // Copy cookies (which contain cleared session from signOut) to redirectResponse
    response.cookies.getAll().forEach(cookie => {
      redirectResponse.cookies.set(cookie.name, cookie.value, {
        path: cookie.path,
        domain: cookie.domain,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        maxAge: cookie.maxAge,
        sameSite: cookie.sameSite,
      });
    });
    return redirectResponse;
  }

  // If logged in as admin and tries to go to login, redirect to root dashboard
  if (isLoginPage) {
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
