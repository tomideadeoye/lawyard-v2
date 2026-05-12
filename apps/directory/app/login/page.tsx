import { login } from './actions'
import Link from 'next/link'
import { LogIn, Mail, Lock, Scale, ArrowRight, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function LoginPage(props: {
  searchParams: Promise<{ message: string }>
}) {
  const searchParams = await props.searchParams;

  return (
    <div className="min-h-screen mesh-gradient flex items-center justify-center px-6 py-12">
      <div className="premium-card w-full max-w-lg space-y-8 animate-fade-in relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-primary/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-accent/10 rounded-full blur-3xl animate-pulse-slow"></div>
        
        <div className="text-center space-y-3 relative z-10">
          <div className="flex justify-center mb-2">
            <div className="p-3 bg-primary/10 rounded-2xl glow-primary">
              <LogIn className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-black tracking-tighter">
            Welcome <span className="gradient-text">Back</span>
          </h1>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto leading-relaxed">
            Re-authorize your access to Nigeria's premier legal intelligence network.
          </p>
        </div>

        {searchParams.message && (
          <div className="p-4 rounded-2xl bg-accent/10 border border-accent/20 text-accent-foreground text-sm text-center font-bold animate-pulse-slow relative z-10">
            {searchParams.message}
          </div>
        )}

        <form className="space-y-6 relative z-10">
          <div className="space-y-5">
            <div className="group">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 group-focus-within:text-primary transition-colors">
                <Mail className="w-3.5 h-3.5" />
                Email Address
              </label>
              <input 
                name="email" 
                type="email" 
                placeholder="tomide@lawyard.org" 
                className="input-premium"
                required 
              />
            </div>

            <div className="group">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 group-focus-within:text-primary transition-colors">
                <Lock className="w-3.5 h-3.5" />
                Password
              </label>
              <input 
                name="password" 
                type="password" 
                placeholder="••••••••"
                className="input-premium"
                required 
              />
            </div>
          </div>

          <div className="flex flex-col gap-6 pt-4">
            <Button 
              formAction={login}
              className="w-full py-8 text-lg font-black bg-primary text-primary-foreground flex items-center justify-center gap-2 rounded-xl shadow-lg"
            >
              Authorize Login
              <ArrowRight className="w-5 h-5" />
            </Button>
            
            <Button
              asChild
              variant="outline"
              className="w-full py-8 text-xs font-black uppercase tracking-widest rounded-xl border-border/50"
            >
              <Link href="/signup">
                <UserPlus className="w-4 h-4 mr-2" />
                Create New Identity
              </Link>
            </Button>
          </div>
        </form>

        <div className="text-center pt-6 border-t border-border/50 relative z-10">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-bold leading-loose">
            By authorizing, you align with the Lawyard<br />
            <span className="text-primary/60">Terms of Presence & Privacy Protocol</span>
          </p>
        </div>
      </div>
    </div>
  )
}
