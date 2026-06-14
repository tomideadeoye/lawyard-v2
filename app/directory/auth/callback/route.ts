import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/directory/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      let redirectTo = next

      if (user) {
        const createdAt = new Date(user.created_at).getTime()
        const lastSignInAt = user.last_sign_in_at ? new Date(user.last_sign_in_at).getTime() : createdAt
        
        // A user is considered "new" if they signed up within the last 10 minutes
        // or if their last sign-in is extremely close to creation time (OAuth/immediate verification)
        const isNewUser = (Date.now() - createdAt < 600000) || (Math.abs(lastSignInAt - createdAt) < 15000)
        
        if (isNewUser && next === '/dashboard') {
          redirectTo = '/directory/dashboard?welcome=true'
        }
      }

      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${redirectTo}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${redirectTo}`)
      } else {
        return NextResponse.redirect(`${origin}${redirectTo}`)
      }
    }
  }

  // return the user to the login page with an error message
  return NextResponse.redirect(`${origin}/directory/login?message=Could not authenticate user`)
}
