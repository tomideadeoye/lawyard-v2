import { Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, User, Users, Building } from "lucide-react";
import { getPlans } from "@/app/directory/actions/plans";
import { DirectoryRole } from "@/lib/api";
import { PaystackButton } from "@/components/directory/paystack-button";
import { PaymentMessage } from "./payment-message";
import Link from "next/link";

type Feature = {
  name: string;
  included: boolean;
};

const roles = [
  { label: "Lawyers", value: DirectoryRole.LAWYER, icon: User },
  { label: "Clients", value: DirectoryRole.CLIENT, icon: Users },
  { label: "Chambers", value: DirectoryRole.CHAMBER, icon: Building },
];

const FALLBACK_PLANS: Record<string, any[]> = {
  lawyer: [
    {
      name: "Premium (Package)",
      price: "$20.00",
      period: "/ 365 days",
      recommended: false,
      desc: "Best for a group of established lawyers seeking the best online visibility.",
      features: [
        { name: "15 Featured Listings", included: true },
        { name: "Website", included: true },
        { name: "Social Profile Links", included: true },
        { name: "Introductory Video", included: true },
        { name: "Pricing", included: true },
        { name: "Select Images (Maximum of 6)", included: true },
        { name: "Link Directory (Maximum of 5)", included: true },
        { name: "Contact Owner", included: true },
        { name: "Allow Customer Review", included: true },
        { name: "Claim Badge Included", included: true },
        { name: "Booking Included", included: true },
        { name: "Live Chat Included", included: true }
      ]
    },
    {
      name: "Premium (Single)",
      price: "$2.00",
      period: "/ 365 days",
      recommended: true,
      desc: "Best for established lawyers seeking the best online visibility.",
      features: [
        { name: "Listing as featured", included: true },
        { name: "Website", included: true },
        { name: "Social Profile Links", included: true },
        { name: "Introductory Video", included: true },
        { name: "Pricing", included: true },
        { name: "Select Images (Maximum of 6)", included: true },
        { name: "Link Directory (Maximum of 5)", included: true },
        { name: "Contact Owner", included: true },
        { name: "Allow Customer Review", included: true },
        { name: "Claim Badge Included", included: true },
        { name: "Booking Included", included: true },
        { name: "Live Chat Included", included: true }
      ]
    },
    {
      name: "Free",
      price: "$0.00",
      period: "/ Lifetime",
      recommended: false,
      desc: "Plan for a lawyer just getting started with achieving online visibility",
      features: [
        { name: "Listing as featured", included: false },
        { name: "Website", included: false },
        { name: "Social Profile Links", included: false },
        { name: "Introductory Video", included: true },
        { name: "Pricing", included: false },
        { name: "Select Images (Maximum of 3)", included: true },
        { name: "Link Directory", included: false },
        { name: "Contact Owner", included: true },
        { name: "Allow Customer Review", included: false },
        { name: "Claim Badge Included", included: true },
        { name: "Booking Included", included: false },
        { name: "Live Chat Included", included: false }
      ]
    }
  ],
  client: [
    {
      name: "Premium (Single)",
      price: "$1.00",
      period: "/ 90 days",
      recommended: true,
      desc: "Best for clients actively in need of a lawyer.",
      features: [
        { name: "Listing as featured", included: true },
        { name: "Deadline Date", included: true },
        { name: "URL", included: true },
        { name: "Phone number", included: true },
        { name: "FAQs", included: true },
        { name: "Relevant images (Maximum of 6)", included: true },
        { name: "Contact Owner", included: true },
        { name: "Claim Badge Included", included: true },
        { name: "Live Chat Included", included: true }
      ]
    },
    {
      name: "Premium (Package)",
      price: "$3.00",
      period: "/ 90 days",
      recommended: false,
      desc: "Best for clients actively in need of a lawyer.",
      features: [
        { name: "Regular Listings", included: false },
        { name: "5 Featured Listings", included: true },
        { name: "Deadline Date", included: true },
        { name: "URL", included: true },
        { name: "Phone number", included: true },
        { name: "FAQs", included: true },
        { name: "Relevant images (Maximum of 6)", included: true },
        { name: "Contact Owner", included: true },
        { name: "Claim Badge Included", included: true },
        { name: "Live Chat Included", included: true }
      ]
    },
    {
      name: "Free",
      price: "$0.00",
      period: "/ 90 days",
      recommended: false,
      desc: "Best for a client routinely looking for a lawyer.",
      features: [
        { name: "Listing as featured", included: false },
        { name: "Deadline Date", included: false },
        { name: "URL", included: false },
        { name: "Phone number", included: false },
        { name: "FAQs", included: false },
        { name: "Relevant images (Maximum of 3)", included: true },
        { name: "Contact Owner", included: true },
        { name: "Claim Badge Included", included: false },
        { name: "Live Chat Included", included: false }
      ]
    }
  ],
  chamber: [
    {
      name: "Premium",
      price: "$2.00",
      period: "/ 365 days",
      recommended: true,
      desc: "Best for large agencies that have more than 50 members",
      features: [
        { name: "Listing as featured", included: true },
        { name: "Link Directory - Lawyers (Maximum of 15)", included: true },
        { name: "Working Hours", included: true },
        { name: "FAQs", included: true },
        { name: "Social Info", included: true },
        { name: "Website", included: true },
        { name: "Open Positions", included: true },
        { name: "Application Form", included: true },
        { name: "Select display picture (Maximum of 6)", included: true },
        { name: "Pricing", included: true },
        { name: "Contact Owner", included: true },
        { name: "Claim Badge Included", included: true },
        { name: "Booking Included", included: true },
        { name: "Live Chat Included", included: true }
      ]
    },
    {
      name: "Free",
      price: "$0.00",
      period: "/ Lifetime",
      recommended: false,
      desc: "Best for a law firm just getting started with our product.",
      features: [
        { name: "Listing as featured", included: false },
        { name: "Link Directory - Lawyers (Maximum of 1)", included: true },
        { name: "Working Hours", included: true },
        { name: "FAQs", included: false },
        { name: "Social Info", included: false },
        { name: "Website", included: false },
        { name: "Open Positions", included: false },
        { name: "Application Form", included: false },
        { name: "Select display picture (Maximum of 3)", included: true },
        { name: "Pricing", included: false },
        { name: "Contact Owner", included: true },
        { name: "Claim Badge Included", included: false },
        { name: "Booking Included", included: false },
        { name: "Live Chat Included", included: false }
      ]
    }
  ]
};

function Price({ price, period, name }: { price: string; period: string; name: string }) {
  const numeric = price.replace('$', '')
  const subtext = name.toLowerCase().includes('package') ? 'Per Package' : 'Per Listing'
  return (
    <div className="flex flex-col items-center mb-5">
      <div className="flex items-baseline justify-center gap-0.5">
        <span className="text-xl font-light text-slate-400 align-super">$</span>
        <span className="text-5xl font-bold text-slate-900 tracking-tight">{numeric}</span>
        <span className="text-sm font-medium text-slate-400 ml-1">{period}</span>
      </div>
      <div className="text-[10px] font-bold text-[#a77c5c] uppercase tracking-widest mt-2 bg-[#a77c5c]/5 px-2.5 py-0.5 rounded-full">
        {subtext}
      </div>
    </div>
  )
}

function FeatureItem({ name, included }: { name: string; included: boolean }) {
  return (
    <li className="flex items-center gap-3 text-xs leading-relaxed">
      {included ? (
        <span className="w-5 h-5 shrink-0 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
          <Check className="w-3 h-3" strokeWidth={3} />
        </span>
      ) : (
        <span className="w-5 h-5 shrink-0 rounded-full bg-rose-50/70 flex items-center justify-center text-rose-500">
          <X className="w-3 h-3" strokeWidth={3} />
        </span>
      )}
      <span className={included ? "text-slate-700 font-medium" : "text-slate-400 font-normal"}>
        {name}
      </span>
    </li>
  );
}

function PricingCard({ tier, role }: { tier: any; role: string }) {
  const amount = parseFloat(tier.price.replace('$', ''))
  const isPaid = amount > 0

  return (
    <Card className={`relative flex flex-col bg-white border overflow-hidden transition-all duration-300 hover:-translate-y-1 ${
      tier.recommended 
        ? 'border-orange-500 shadow-[0_20px_50px_rgba(249,115,22,0.1)] z-10 scale-[1.02] rounded-xl' 
        : 'border-slate-200/80 shadow-sm rounded-lg hover:shadow-lg hover:border-slate-300/80'
    }`}>
      {tier.recommended && (
        <div className="absolute top-0 inset-x-0 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-center py-1.5 text-[9px] font-black uppercase tracking-widest">
          Recommended
        </div>
      )}
      <CardHeader className={`text-center pb-4 px-5 border-b border-slate-100 ${tier.recommended ? 'pt-8' : 'pt-6'}`}>
        <CardTitle className="text-base font-bold text-slate-800 mb-4">{tier.name}</CardTitle>
        <Price price={tier.price} period={tier.period} name={tier.name} />
        <p className="text-[11px] text-slate-500 max-w-[240px] mx-auto min-h-[33px] mt-1 leading-relaxed">
          {tier.desc}
        </p>
      </CardHeader>

      <CardContent className="flex-1 px-5 py-5">
        <ul className="space-y-2.5">
          {tier.features.map((feature: Feature, i: number) => (
            <FeatureItem key={i} name={feature.name} included={feature.included} />
          ))}
        </ul>
      </CardContent>

      <CardFooter className="px-5 pb-6 pt-2">
        {isPaid ? (
          <PaystackButton
            amount={amount}
            planName={tier.name}
            planRole={role}
            recommended={true}
          />
        ) : (
          <Link
            href="/directory/dashboard"
            className="w-full py-3 text-center text-sm font-semibold rounded-lg bg-slate-700 hover:bg-slate-800 text-white shadow-sm transition-colors block"
          >
            Continue
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}

export default async function PricingPage() {
  const pricingData = await getPlans()

  return (
    <div className="min-h-screen bg-slate-50/60 pb-24">
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-24 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="absolute inset-0 bg-radial-gradient from-slate-900/50 to-slate-950/80" />
        <h1 className="text-4xl md:text-5xl font-bold text-white relative z-10 tracking-tight">
          Select Your Plan
        </h1>
        <p className="text-slate-400 mt-3 text-sm md:text-base max-w-lg mx-auto relative z-10 font-medium">
          Choose the listing tier that best fits your legal business needs.
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-6 -mt-10 relative z-10">
        <Suspense fallback={null}>
          <PaymentMessage />
        </Suspense>

        <div className="bg-white/80 backdrop-blur-md rounded-xl shadow-sm border border-slate-200/50 border-l-4 border-l-[#a77c5c] p-5 mb-10 mt-4">
          <h3 className="text-sm font-bold text-[#a77c5c] uppercase tracking-wider mb-2">Notice & Guidelines</h3>
          <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 font-medium">
            <li><strong className="text-slate-800">Clients:</strong> Clients browse for free — no plan needed to search and contact lawyers.</li>
            <li><strong className="text-slate-800">Lawyers:</strong> listing plans for lawyer/law professionals</li>
            <li><strong className="text-slate-800">Chambers:</strong> listing plans for law chambers</li>
            <li>Paid listing plans secure <strong className="text-slate-800">featured listings</strong> that receive the most user views, appear first, and rank higher in search results.</li>
          </ol>
        </div>

        <Tabs defaultValue="lawyer" className="w-full">
          <TabsList className="w-full max-w-md mx-auto flex h-11 items-center justify-between rounded-full bg-slate-100 p-1 mb-10 border border-slate-200/40">
            {roles.map((r) => {
              const Icon = r.icon;
              return (
                <TabsTrigger
                  key={r.value}
                  value={r.value}
                  className="flex-1 flex items-center justify-center gap-2 h-full rounded-full text-xs font-semibold text-slate-400 hover:text-slate-700 transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-[#a77c5c] data-[state=active]:shadow-sm"
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{r.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {roles.map((r) => {
            const dbTiers = (pricingData as Record<string, any[]>)[r.value] || [];
            const fallbackTiers = FALLBACK_PLANS[r.value] || [];

            const tiers = fallbackTiers.map((fallbackPlan) => {
              const dbPlan = dbTiers.find(
                (p) => p.name.toLowerCase().trim() === fallbackPlan.name.toLowerCase().trim()
              );
              if (dbPlan) {
                return {
                  ...fallbackPlan,
                  id: dbPlan.id,
                  price: dbPlan.price,
                  period: dbPlan.period,
                  recommended: dbPlan.recommended ?? fallbackPlan.recommended,
                };
              }
              return fallbackPlan;
            });

            const gridClass = tiers.length === 1 ? "md:grid-cols-1 max-w-sm mx-auto" : tiers.length === 2 ? "md:grid-cols-2 max-w-3xl mx-auto" : "md:grid-cols-3";

            return (
              <TabsContent key={r.value} value={r.value} className="mt-0 outline-none">
                <div className={`grid grid-cols-1 ${gridClass} gap-6 items-start`}>
                  {tiers.map((tier: any) => (
                    <PricingCard key={tier.name} tier={tier} role={r.value} />
                  ))}
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </div>
  );
}
