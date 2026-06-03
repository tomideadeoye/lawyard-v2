import { signup } from "../login/actions";
import Link from "next/link";
import { Button } from "@repo/ui/components/button";
import { User, Mail, Lock, ShieldCheck, Scale, ArrowRight } from "lucide-react";

export default function SignupPage() {
  return (
    <div className="min-h-screen mesh-gradient flex items-center justify-center px-6 py-12">
      <div className="premium-card w-full max-w-lg space-y-8 animate-fade-in relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-primary/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-accent/10 rounded-full blur-3xl animate-pulse-slow"></div>
        
        <div className="text-center space-y-3 relative z-10">
          <div className="flex justify-center mb-2">
            <div className="p-3 bg-primary/10 rounded-2xl glow-primary">
              <Scale className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-black tracking-tighter">
            Create an account
          </h1>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto leading-relaxed">
            Join Lawyard to manage your professional profile.
          </p>
        </div>

        <form action={signup} className="space-y-6 relative z-10">
          <div className="space-y-5">
            <div className="group">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 group-focus-within:text-primary transition-colors">
                <User className="w-3.5 h-3.5" />
                Full Name
              </label>
              <input 
                name="fullName" 
                type="text" 
                placeholder="John Doe" 
                className="input-premium"
                required 
              />
            </div>

            <div className="group">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 group-focus-within:text-primary transition-colors">
                <Mail className="w-3.5 h-3.5" />
                Email Address
              </label>
              <input 
                name="email" 
                type="email" 
                placeholder="john@doe.com" 
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

            <div className="space-y-3">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                Identification
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="relative flex flex-col items-center justify-center p-6 border-2 border-border/50 rounded-2xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all has-[:checked]:border-primary has-[:checked]:bg-primary/5 group overflow-hidden">
                  <input type="radio" name="role" value="lawyer" className="sr-only" required />
                  <span className="text-sm font-black mb-1 group-has-[:checked]:text-primary">Lawyer</span>
                  <span className="text-[10px] text-muted-foreground group-has-[:checked]:text-primary/70">Verified Professional</span>
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary opacity-0 group-has-[:checked]:opacity-100 transition-opacity"></div>
                </label>
                <label className="relative flex flex-col items-center justify-center p-6 border-2 border-border/50 rounded-2xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all has-[:checked]:border-primary has-[:checked]:bg-primary/5 group overflow-hidden">
                  <input type="radio" name="role" value="client" className="sr-only" defaultChecked />
                  <span className="text-sm font-black mb-1 group-has-[:checked]:text-primary">Client</span>
                  <span className="text-[10px] text-muted-foreground group-has-[:checked]:text-primary/70">Legal Consumer</span>
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary opacity-0 group-has-[:checked]:opacity-100 transition-opacity"></div>
                </label>
              </div>
            </div>
          </div>

          <Button className="w-full py-7 text-lg shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all font-black bg-primary text-primary-foreground flex items-center justify-center gap-2 glow-primary rounded-2xl" type="submit">
            Initialize Account
            <ArrowRight className="w-5 h-5" />
          </Button>
        </form>

        <div className="text-center pt-6 border-t border-border/50 relative z-10">
          <p className="text-sm text-muted-foreground">
            Already part of the network?{" "}
            <Link href="/login" className="text-primary font-black hover:underline underline-offset-4">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}