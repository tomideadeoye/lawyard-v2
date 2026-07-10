import Link from 'next/link'
import ResendButton from '@/components/directory/auth/ResendButton'

export default async function RegistrationSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  const resolvedParams = await searchParams
  const email = resolvedParams.email || 'your email'

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center p-6 bg-background text-foreground">
      <div className="glass max-w-md w-full p-8 rounded-2xl border border-border/50 bg-card/45 backdrop-blur-lg shadow-2xl text-center animate-fade-in">
        <div className="mb-6">
          <h1 className="gradient-text text-2xl font-bold tracking-tight">Registration Initiated</h1>
        </div>
        
        <div className="flex flex-col items-center gap-6">
          <div className="text-5xl mb-2 animate-pulse-slow">✉️</div>
          <p className="text-base text-muted-foreground leading-relaxed">
            The Lawyard Protocol has been initiated. We&apos;ve sent a verification link to your inbox.
          </p>

          <div className="bg-muted/30 p-4 rounded-xl border border-border/30 text-sm w-full">
            <p className="text-muted-foreground">
              Please verify <b className="text-foreground font-semibold">{email}</b> to complete your profile and access the directory dashboard.
            </p>
          </div>

          <div className="flex flex-col gap-3 w-full mt-4">
            <Link 
              href="/directory/login" 
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
            >
              Return to Login
            </Link>
            <ResendButton email={email === 'your email' ? '' : email} />
          </div>

          <p className="mt-6 text-xs text-muted-foreground/60">
            We look forward to seeing you soon.
          </p>
        </div>
      </div>
    </div>
  )
}
