import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '../login/actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/card'
import { Button } from '@repo/ui/components/button'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>
}) {
  const resolvedParams = await searchParams
  const showWelcome = resolvedParams.welcome === 'true'

  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  const user = data?.user

  if (error || !user) {
    redirect('/login')
  }

  // 1. Fetch user profile data
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  // 2. Fetch associated lawyer listing (if any) and joined chamber details
  const { data: lawyer } = await supabase
    .from('lawyers')
    .select(`
      *,
      chambers (
        name,
        location
      )
    `)
    .eq('id', user.id)
    .maybeSingle()

  let initial = 'U'
  if (profile?.full_name?.[0]) {
    initial = profile.full_name[0]
  } else {
    const email = user.email
    if (email && email[0]) {
      initial = email[0].toUpperCase()
    }
  }

  return (
    <div className="relative min-h-[90vh] bg-background text-foreground py-10 px-4 md:px-6">
      
      {/* Premium Glassmorphic Welcome Overlay */}
      {showWelcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in">
          <div className="glass premium-card max-w-lg w-full flex flex-col items-center gap-6 text-center shadow-2xl relative overflow-hidden">
            {/* Ambient Background Glow inside modal */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-accent/15 rounded-full blur-3xl pointer-events-none" />

            <div className="text-6xl mb-2 animate-pulse-slow">✨</div>
            
            <div className="space-y-2">
              <h2 className="gradient-text text-3xl font-extrabold tracking-tight">Welcome to Lawyard</h2>
              <p className="text-sm text-muted-foreground uppercase tracking-widest font-semibold">Verification Initialized</p>
            </div>

            <div className="w-full h-px bg-border/40 my-1" />

            <div className="text-left w-full space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Your credentials are being processed. To get started with the directory, complete the onboarding steps below:
              </p>
              
              <div className="space-y-3 mt-4">
                <div className="flex gap-3 items-start">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">1</div>
                  <div>
                    <h4 className="text-sm font-semibold">Publish Practice Details</h4>
                    <p className="text-xs text-muted-foreground">List your location, credentials, bio, and hourly rates.</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-accent/10 text-accent text-xs font-bold shrink-0">2</div>
                  <div>
                    <h4 className="text-sm font-semibold">Admin Panel Review</h4>
                    <p className="text-xs text-muted-foreground">Our compliance officers verify your professional credentials.</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">3</div>
                  <div>
                    <h4 className="text-sm font-semibold">Receive Corporate Mandates</h4>
                    <p className="text-xs text-muted-foreground">Vetted listings receive direct placement briefs and inquiries.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full mt-4">
              <Link href="/add-listing" className="flex-1">
                <Button className="w-full glow-primary">
                  Configure Practice Listing
                </Button>
              </Link>
              <Link href="/dashboard" className="flex-1">
                <Button variant="outline" className="w-full">
                  Dismiss
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Dashboard Layout */}
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Dashboard</h1>
            <p className="text-muted-foreground text-sm">Manage your profile, credentials, and directories.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/add-listing">
              <Button variant="outline" size="sm">
                Add Listing
              </Button>
            </Link>
            <form action={signOut}>
              <Button variant="destructive" size="sm">
                Sign Out
              </Button>
            </form>
          </div>
        </div>

        {/* Profile Card Section */}
        <Card className="overflow-hidden border border-border/40 shadow-lg bg-card/40 backdrop-blur-md">
          <div className="h-32 bg-gradient-to-r from-primary to-accent opacity-85 relative" />
          
          <CardContent className="relative px-6 pb-6 pt-0">
            {/* Avatar block overlaying banner */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end -mt-12 mb-6 gap-4">
              <div className="flex items-end gap-4">
                <div className="w-24 h-24 rounded-full bg-background border-4 border-card flex items-center justify-center text-4xl font-extrabold shadow-md shrink-0">
                  {initial}
                </div>
                <div className="pb-1">
                  <h2 className="text-2xl font-bold tracking-tight">{profile?.full_name || 'Anonymous User'}</h2>
                  <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">{profile?.role || 'client'} profile</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="text-xs">
                Edit Profile
              </Button>
            </div>

            {/* User Account Info Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-border/40">
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Account Email</span>
                <p className="text-sm font-semibold truncate">{user.email}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Subscription Tier</span>
                <p className="text-sm font-semibold capitalize">{profile?.subscription_tier || 'free'}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Member Since</span>
                <p className="text-sm font-semibold">{new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Listing Details Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Main Listing View (2/3 col) */}
          <Card className="md:col-span-2 border border-border/40 bg-card/45 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-lg">My Professional Directory Listing</CardTitle>
              <CardDescription>This is your public listing information visible in the directory.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {lawyer ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-start pb-4 border-b border-border/30">
                    <div>
                      <h3 className="font-bold text-lg text-primary">{lawyer.name}</h3>
                      <p className="text-sm text-muted-foreground">{lawyer.role || 'Legal Practitioner'}</p>
                      {lawyer.chambers && (
                        <p className="text-xs text-muted-foreground font-semibold mt-1">🏛️ Firm: {lawyer.chambers.name}</p>
                      )}
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                      lawyer.verification_status === 'verified' 
                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                        : lawyer.verification_status === 'rejected'
                        ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                        : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                    }`}>
                      {lawyer.verification_status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-xs text-muted-foreground">Office Location</span>
                      <p className="font-medium">{lawyer.location || 'Not Specified'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Public Website</span>
                      <p className="font-medium truncate">{lawyer.website ? (
                        <a href={lawyer.website} target="_blank" rel="noreferrer" className="text-primary hover:underline">{lawyer.website}</a>
                      ) : 'None Listed'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Public Phone</span>
                      <p className="font-medium">{lawyer.phone || 'None Listed'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Public Contact Email</span>
                      <p className="font-medium">{lawyer.email || 'None Listed'}</p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <span className="text-xs text-muted-foreground">Professional Profile Bio</span>
                    <p className="text-sm text-foreground/80 leading-relaxed mt-1 whitespace-pre-wrap">{lawyer.bio || 'No bio submitted yet.'}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 space-y-4">
                  <div className="text-4xl">📂</div>
                  <div className="space-y-1">
                    <h4 className="font-semibold text-base">No active directory listing</h4>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">Create a profile to index your credentials, specialties, and location in the Lawyard network.</p>
                  </div>
                  <Link href="/add-listing" className="inline-block mt-2">
                    <Button size="sm" className="glow-primary">
                      Initialize Listing Path
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Side Info Box (1/3 col) */}
          <Card className="border border-border/40 bg-card/45 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wider font-bold text-muted-foreground">Onboarding Steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <span className="text-emerald-500 font-bold shrink-0">✓</span>
                  <div>
                    <h5 className="font-semibold text-foreground/90">Authentication Complete</h5>
                    <p className="text-muted-foreground">Your account has been registered and verified.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className={lawyer ? "text-emerald-500 font-bold shrink-0" : "text-amber-500 font-bold shrink-0"}>
                    {lawyer ? "✓" : "○"}
                  </span>
                  <div>
                    <h5 className={`font-semibold ${lawyer ? 'text-foreground/90' : 'text-muted-foreground'}`}>Directory Listing Form</h5>
                    <p className="text-muted-foreground">Submit professional parameters for vetting.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className={lawyer?.verification_status === 'verified' ? "text-emerald-500 font-bold shrink-0" : "text-muted-foreground font-bold shrink-0"}>
                    {lawyer?.verification_status === 'verified' ? "✓" : "○"}
                  </span>
                  <div>
                    <h5 className={`font-semibold ${lawyer?.verification_status === 'verified' ? 'text-foreground/90' : 'text-muted-foreground'}`}>Account Verification</h5>
                    <p className="text-muted-foreground">Compliance review checks bar and registration details.</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border/30 text-xs text-muted-foreground space-y-2">
                <h5 className="font-semibold text-foreground/80">Need compliance help?</h5>
                <p>Contact compliance support officers at <span className="text-primary font-medium">verify@lawyard.org</span> for credential verification questions.</p>
              </div>
            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  )
}
