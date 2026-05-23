import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/tabs";
import { CheckCircle2, Zap, Crown, Shield, Gem, ArrowRight, Scale } from "lucide-react";

const tiers = [
  {
    name: "Discovery",
    price: "$0",
    period: "/ Lifetime",
    desc: "Essential presence for emerging professionals seeking initial visibility within the network.",
    features: ["Standard Directory Listing", "Social Link Integration", "3 High-Res Portfolios", "Contact Intermediary", "Basic Booking Module"],
    icon: Zap,
    accent: false,
    cta: "Begin Journey",
    variant: "outline" as const,
  },
  {
    name: "Sovereign",
    price: "$2",
    period: "/ Year",
    desc: "Priority placement for established practitioners demanding elite presence and direct engagement.",
    features: ["Featured Priority Placement", "HD Professional Video Intro", "Unlimited Portfolio Access", "Custom Link Architecture", "Live Terminal Interaction", "Protocol Verification Badge"],
    icon: Crown,
    accent: true,
    cta: "Initialize Premium",
    variant: "default" as const,
  },
  {
    name: "Institutional",
    price: "$20",
    period: "/ Year",
    desc: "Unrivaled scale for chambers and legal institutions seeking to dominate regional visibility.",
    features: ["15+ Featured Professional Slots", "Institutional Verification", "Advanced Strategic Analytics", "24/7 Protocol Support", "Custom Media Production"],
    icon: Gem,
    accent: false,
    cta: "Enterprise Access",
    variant: "outline" as const,
  },
];

function PricingCard({ tier }: { tier: typeof tiers[number] }) {
  const Icon = tier.icon;

  return (
      <Card className={`group/card relative flex flex-col overflow-hidden ${tier.accent ? "border-accent/40 ring-4 ring-accent/5 scale-[1.02] shadow-[0_30px_70px_-15px_rgba(0,0,0,0.2)] z-20" : ""}`}>
      {tier.accent && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground px-5 py-1.5 rounded-full text-[10px] font-black tracking-[0.25em] shadow-2xl glow-accent z-10">
          RECOMMENDED
        </div>
      )}
      <div className="absolute top-0 right-0 p-6 opacity-[0.04] group-hover/card:opacity-10 transition-opacity pointer-events-none">
        <Icon className="w-24 h-24" />
      </div>
      <CardHeader>
        <CardTitle className="text-2xl font-black">{tier.name}</CardTitle>
        <div className="flex items-baseline gap-1 mt-2">
          <span className={`text-5xl font-black ${tier.accent ? "text-accent" : "text-primary"}`}>{tier.price}</span>
          <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{tier.period}</span>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <CardDescription className="text-sm mb-6 leading-relaxed">{tier.desc}</CardDescription>
        <ul className="space-y-3 flex-1">
          {tier.features.map((f) => (
            <li key={f} className={`flex items-center text-sm gap-3 ${tier.accent ? "font-bold" : "font-medium text-foreground/80"}`}>
              <CheckCircle2 className={`w-4 h-4 shrink-0 ${tier.accent ? "text-accent" : "text-primary/60"}`} />
              {f}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button
          variant={tier.variant}
          className={`w-full py-6 rounded-2xl font-black transition-all ${
            tier.accent
              ? "bg-accent text-accent-foreground hover:scale-[1.02] active:scale-[0.98] shadow-2xl glow-accent border-none text-lg"
              : "border-2 border-primary/20 hover:border-primary hover:bg-primary/5"
          }`}
        >
          {tier.cta}
          {tier.accent && <ArrowRight className="w-5 h-5" />}
        </Button>
      </CardFooter>
    </Card>
  );
}

const roles = [
  { value: "lawyers", label: "Lawyers", icon: Scale },
  { value: "clients", label: "Clients", icon: Shield },
  { value: "chambers", label: "Chambers", icon: Gem },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen mesh-gradient px-6 py-24 relative overflow-hidden">
      <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[150px] -z-10"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border-accent/20 text-accent text-[10px] font-black tracking-[0.3em] uppercase glow-accent">
            <Shield className="w-3 h-3" />
            Membership Protocol
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter">
            Select Your <span className="gradient-text">Tier</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            Strategic visibility and elite authorization for Africa&apos;s premier legal professionals and institutions.
          </p>
        </div>

        <Tabs defaultValue="lawyers" className="mb-12">
          <TabsList className="mx-auto w-fit h-auto p-1.5 rounded-2xl bg-muted/50 backdrop-blur-sm mb-12">
            {roles.map((r) => {
              const Icon = r.icon;
              return (
                <TabsTrigger
                  key={r.value}
                  value={r.value}
                  className="px-8 py-3.5 rounded-xl text-sm font-black data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:scale-105 transition-all duration-300 gap-2"
                >
                  <Icon className="w-4 h-4" />
                  {r.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {roles.map((r) => (
            <TabsContent key={r.value} value={r.value} className="mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
                {tiers.map((tier) => (
                  <PricingCard key={tier.name} tier={tier} />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
