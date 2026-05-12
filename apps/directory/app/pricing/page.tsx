import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle2, Zap, Crown, Shield, Scale, ArrowRight, Gem } from "lucide-react";

export default function PricingPage() {
  return (
    <div className="min-h-screen mesh-gradient px-6 py-24 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10 animate-pulse-slow"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[150px] -z-10 animate-pulse-slow"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-20 space-y-4 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border-accent/20 text-accent text-[10px] font-black tracking-[0.3em] uppercase glow-accent">
            <Shield className="w-3 h-3" />
            Membership Protocol
          </div>
          <h1 className="text-6xl md:text-7xl font-black tracking-tighter">
            Select Your <span className="gradient-text">Tier</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            Strategic visibility and elite authorization for Africa's premier legal professionals and institutions.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 mb-20 animate-fade-in">
          {['Lawyers', 'Clients', 'Chambers'].map((role, i) => (
            <button 
              key={role}
              className={`px-10 py-4 rounded-2xl font-black transition-all duration-300 flex items-center gap-2 ${
                i === 0 
                  ? "bg-primary text-primary-foreground shadow-2xl glow-primary scale-105" 
                  : "glass border-border/50 text-muted-foreground hover:border-primary/30 hover:text-primary"
              }`}
            >
              {role === 'Lawyers' && <Scale className="w-4 h-4" />}
              {role === 'Clients' && <Shield className="w-4 h-4" />}
              {role === 'Chambers' && <Gem className="w-4 h-4" />}
              {role}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch pb-12">
          {/* Free Tier */}
          <div className="premium-card group flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Zap className="w-24 h-24 text-primary" />
            </div>
            <div className="mb-8">
              <h3 className="text-2xl font-black mb-2 flex items-center gap-2">
                Discovery
              </h3>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black text-primary">$0</span>
                <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">/ Lifetime</span>
              </div>
            </div>
            <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
              Essential presence for emerging professionals seeking initial visibility within the network.
            </p>
            <ul className="space-y-4 mb-10 flex-grow">
              {['Standard Directory Listing', 'Social Link Integration', '3 High-Res Portfolios', 'Contact Intermediary', 'Basic Booking Module'].map((f) => (
                <li key={f} className="flex items-center text-sm font-medium text-foreground/80">
                  <CheckCircle2 className="w-4 h-4 text-primary/60 mr-3" /> 
                  {f}
                </li>
              ))}
            </ul>
            <Button variant="outline" className="w-full py-7 border-2 border-primary/20 hover:border-primary hover:bg-primary/5 rounded-2xl font-black transition-all">
              Begin Journey
            </Button>
          </div>

          {/* Premium Single */}
          <div className="premium-card flex flex-col border-accent/40 ring-4 ring-accent/5 scale-105 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.2)] relative z-20 group">
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground px-6 py-2 rounded-full text-[10px] font-black tracking-[0.25em] shadow-2xl glow-accent animate-pulse-slow">
              RECOMMENDED
            </div>
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Crown className="w-24 h-24 text-accent" />
            </div>
            <div className="mb-8">
              <h3 className="text-2xl font-black mb-2 flex items-center gap-2">
                Sovereign
              </h3>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black text-accent">$2</span>
                <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">/ Year</span>
              </div>
            </div>
            <p className="text-muted-foreground text-sm mb-8 leading-relaxed font-medium">
              Priority placement for established practitioners demanding elite presence and direct engagement.
            </p>
            <ul className="space-y-4 mb-10 flex-grow">
              {[
                'Featured Priority Placement',
                'HD Professional Video Intro',
                'Unlimited Portfolio Access',
                'Custom Link Architecture',
                'Live Terminal Interaction',
                'Protocol Verification Badge'
              ].map((f) => (
                <li key={f} className="flex items-center text-sm font-bold">
                  <CheckCircle2 className="w-4 h-4 text-accent mr-3" /> 
                  {f}
                </li>
              ))}
            </ul>
            <Button className="w-full py-8 bg-accent text-accent-foreground hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl font-black rounded-2xl text-lg flex items-center justify-center gap-2 glow-accent border-none">
              Initialize Premium
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Premium Package */}
          <div className="premium-card group flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Gem className="w-24 h-24 text-primary" />
            </div>
            <div className="mb-8">
              <h3 className="text-2xl font-black mb-2 flex items-center gap-2">
                Institutional
              </h3>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black text-primary">$20</span>
                <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">/ Year</span>
              </div>
            </div>
            <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
              Unrivaled scale for chambers and legal institutions seeking to dominate regional visibility.
            </p>
            <ul className="space-y-4 mb-10 flex-grow">
              {['15+ Featured Professional Slots', 'Institutional Verification', 'Advanced Strategic Analytics', '24/7 Protocol Support', 'Custom Media Production'].map((f) => (
                <li key={f} className="flex items-center text-sm font-medium text-foreground/80">
                  <CheckCircle2 className="w-4 h-4 text-primary/60 mr-3" /> 
                  {f}
                </li>
              ))}
            </ul>
            <Button variant="outline" className="w-full py-7 border-2 border-primary/20 hover:border-primary hover:bg-primary/5 rounded-2xl font-black transition-all">
              Enterprise Access
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}