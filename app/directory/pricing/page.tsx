import { Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Minus, User, Users, Building } from "lucide-react";
import { getPlans } from "@/app/directory/actions/plans";
import { DirectoryRole } from "@/lib/api";
import { CURRENCY, formatNGN, parseAmount } from "@/lib/currency";
import { TERMS } from "@/lib/constants";
import { PaystackButton } from "@/components/directory/paystack-button";
import { PaymentMessage } from "./payment-message";
import Link from "next/link";

type Feature = {
  name: string;
  included: boolean;
};

const roles = [
  { label: TERMS.lawyer.plural, value: DirectoryRole.LAWYER, icon: User },
  { label: TERMS.client.plural, value: DirectoryRole.CLIENT, icon: Users },
  { label: TERMS.firm.plural, value: DirectoryRole.CHAMBER, icon: Building },
];

const FALLBACK_PLANS: Record<string, any[]> = {
  lawyer: [
    {
      name: "Premium (Package)",
      price: formatNGN(20),
      period: "/ 365 days",
      recommended: false,
      desc: `Best for a group of established ${TERMS.lawyer.lowerPlural} seeking the best online visibility.`,
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
      price: formatNGN(2),
      period: "/ 365 days",
      recommended: true,
      desc: `Best for established ${TERMS.lawyer.lowerPlural} seeking the best online visibility.`,
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
      price: formatNGN(0),
      period: "/ Lifetime",
      recommended: false,
      desc: `Plan for a ${TERMS.lawyer.lower} just getting started with achieving online visibility`,
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
    },
    {
      name: "Silver",
      price: formatNGN(0),
      period: "",
      recommended: false,
      comingSoon: true,
      desc: "Silver tier — contents & pricing to be confirmed.",
      features: []
    }
  ],
  client: [
    {
      name: "Premium (Single)",
      price: formatNGN(1),
      period: "/ 90 days",
      recommended: true,
      desc: `Best for ${TERMS.client.lowerPlural} actively in need of a ${TERMS.lawyer.lower}.`,
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
      price: formatNGN(3),
      period: "/ 90 days",
      recommended: false,
      desc: `Best for ${TERMS.client.lowerPlural} actively in need of a ${TERMS.lawyer.lower}.`,
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
      price: formatNGN(0),
      period: "/ 90 days",
      recommended: false,
      desc: `Best for a ${TERMS.client.lower} routinely looking for a ${TERMS.lawyer.lower}.`,
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
    },
    {
      name: "Silver",
      price: formatNGN(0),
      period: "",
      recommended: false,
      comingSoon: true,
      desc: "Silver tier — contents & pricing to be confirmed.",
      features: []
    }
  ],
  chamber: [
    {
      name: "Premium",
      price: formatNGN(2),
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
      price: formatNGN(0),
      period: "/ Lifetime",
      recommended: false,
      desc: `Best for a ${TERMS.firm.lower} just getting started with our product.`,
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
    },
    {
      name: "Silver",
      price: formatNGN(0),
      period: "",
      recommended: false,
      comingSoon: true,
      desc: "Silver tier — contents & pricing to be confirmed.",
      features: []
    }
  ]
};

function Price({ price, period, name }: { price: string; period: string; name: string }) {
  const amount = parseAmount(price)
  const subtext = name.toLowerCase().includes('package') ? 'Per package' : 'Per listing'
  // The price is the decision number on the page: biggest weight, quietest colour.
  // Everything around it (currency, period, unit) is muted so the figure lands first.
  return (
    <div className="mb-5 flex flex-col items-center gap-2">
      <div className="flex items-baseline justify-center gap-1">
        <span className="text-lg font-medium text-muted-foreground">{CURRENCY.symbol}</span>
        <span className="text-[2.75rem] font-semibold leading-none tracking-tight tabular-nums text-stone-900 dark:text-neutral-50">
          {amount.toLocaleString(CURRENCY.locale)}
        </span>
        {period && (
          <span className="text-xs font-medium text-muted-foreground">{period}</span>
        )}
      </div>
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {subtext}
      </span>
    </div>
  )
}

function FeatureItem({ name, included }: { name: string; included: boolean }) {
  // Excluded features use a muted dash, not a red cross: red means "error" in every
  // other product surface, and a plan simply not carrying something is not an error.
  return (
    <li className="flex items-start gap-2.5 text-[13px] leading-5">
      {included ? (
        <Check className="mt-[3px] h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" strokeWidth={2.75} />
      ) : (
        <Minus className="mt-[3px] h-3.5 w-3.5 shrink-0 text-stone-400 dark:text-neutral-600" strokeWidth={2.75} />
      )}
      <span className={included ? 'text-stone-700 dark:text-neutral-300' : 'text-stone-500 dark:text-neutral-400'}>
        {name}
      </span>
    </li>
  );
}

// The plans table is still seeded with the dollar-era figures ($2 for a
// 365-day premium listing), which format as ₦2. Until Tobi's NGN numbers land
// (Q2–Q6), a non-zero price below this floor is treated as a placeholder: the
// plan stays visible, but it cannot be bought. Real prices flip it back on.
const PRICE_PLACEHOLDER_FLOOR = 1000

function PricingCard({ tier, role }: { tier: any; role: string }) {
  const amount = parseAmount(tier.price)
  const priceUnset = amount > 0 && amount < PRICE_PLACEHOLDER_FLOOR
  const isPaid = amount > 0 && !priceUnset

  return (
    <Card
      className={`relative flex flex-col overflow-hidden rounded-xl border p-0 shadow-sm transition-all duration-300 md:hover:-translate-y-0.5 ${
        tier.recommended
          ? 'z-10 border-brand/70 ring-1 ring-brand/15 shadow-[0_18px_45px_-25px_rgba(138,98,71,0.45)]'
          : 'border-stone-200/90 hover:border-stone-300 dark:border-white/10 dark:hover:border-white/20'
      } bg-white dark:bg-neutral-900 dark:shadow-none`}
    >
      {tier.recommended && (
        <div className="bg-brand px-4 py-1.5 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-brand-foreground">
          Recommended
        </div>
      )}
      <CardHeader className="border-b border-stone-100 px-5 pb-5 pt-6 text-center dark:border-white/[0.07]">
        <CardTitle className="mb-4 text-[13px] font-semibold uppercase tracking-[0.12em] text-stone-500 dark:text-neutral-400">
          {tier.name}
        </CardTitle>
        {tier.comingSoon ? (
          <div className="flex flex-col items-center mb-5">
            <span className="text-xl font-semibold tracking-tight text-stone-500 dark:text-neutral-400">Coming soon</span>
          </div>
        ) : priceUnset ? (
          <div className="flex flex-col items-center mb-5">
            <span className="text-xl font-semibold tracking-tight text-stone-500 dark:text-neutral-400">Pricing under review</span>
          </div>
        ) : (
          <Price price={tier.price} period={tier.period} name={tier.name} />
        )}
        <p className="mx-auto mt-1 min-h-[40px] max-w-[240px] text-xs leading-relaxed text-muted-foreground">
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
        {tier.comingSoon ? (
          <span className="block w-full rounded-lg border border-stone-200 py-3 text-center text-sm font-semibold text-stone-400 dark:border-white/10 dark:text-neutral-500">
            Coming soon
          </span>
        ) : priceUnset ? (
          <Link
            href="/contact"
            className="block w-full rounded-lg border border-stone-300 py-3 text-center text-sm font-semibold text-stone-700 transition-colors hover:border-brand hover:text-brand-muted dark:border-white/15 dark:text-neutral-300 dark:hover:border-brand-muted dark:hover:text-brand-muted"
          >
            Enquire about this plan
          </Link>
        ) : isPaid ? (
          <PaystackButton
            amount={amount}
            planName={tier.name}
            planRole={role}
            recommended={tier.recommended}
          />
        ) : (
          <Link
            href="/dashboard"
            className="block w-full rounded-lg border border-stone-300 py-3 text-center text-sm font-semibold text-stone-700 transition-colors hover:border-brand hover:text-brand-muted dark:border-white/15 dark:text-neutral-300 dark:hover:border-brand-muted dark:hover:text-brand-muted"
          >
            Continue with Free
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}

export default async function PricingPage() {
  const pricingData = await getPlans()

  return (
    <div className="min-h-screen bg-stone-50 pb-24 dark:bg-neutral-950">
      {/* Hero is dark in both themes — it belongs to the site chrome, not to the theme. */}
      <div className="relative overflow-hidden border-b border-white/[0.06] bg-neutral-950 py-20 text-center md:py-24">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_72%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(167,124,92,0.18),transparent_62%)]" />
        <div className="relative z-10 px-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-muted">
            Lawyard Directory
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white md:text-5xl">
            Select your plan
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm font-medium text-neutral-400 md:text-base">
            Choose the listing tier that best fits your legal business needs.
          </p>
        </div>
      </div>

      <div className="relative z-10 mx-auto -mt-10 max-w-5xl px-6">
        <Suspense fallback={null}>
          <PaymentMessage />
        </Suspense>

        <div className="mb-10 mt-4 rounded-xl border border-stone-200/80 border-l-2 border-l-brand bg-white p-5 shadow-sm dark:border-white/10 dark:border-l-brand dark:bg-neutral-900">
          <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-muted">
            Notice &amp; guidelines
          </h3>
          <ol className="list-decimal list-inside space-y-1 text-xs leading-relaxed text-muted-foreground">
            <li><strong className="font-semibold text-stone-800 dark:text-neutral-200">{TERMS.client.plural}:</strong> {TERMS.client.plural} browse for free — no plan needed to search and contact {TERMS.lawyer.lowerPlural}.</li>
            <li><strong className="font-semibold text-stone-800 dark:text-neutral-200">{TERMS.lawyer.plural}:</strong> listing plans for {TERMS.lawyer.lower}/law professionals</li>
            <li><strong className="font-semibold text-stone-800 dark:text-neutral-200">{TERMS.firm.plural}:</strong> listing plans for {TERMS.firm.lowerPlural}</li>
            <li>Paid listing plans secure <strong className="font-semibold text-stone-800 dark:text-neutral-200">featured listings</strong> that receive the most user views, appear first, and rank higher in search results.</li>
          </ol>
        </div>

        <Tabs defaultValue="lawyer" className="w-full">
          <TabsList className="mx-auto mb-10 flex h-11 w-full max-w-md items-center gap-1 rounded-full border border-stone-200/80 bg-stone-100/80 p-1 dark:border-white/10 dark:bg-white/[0.04]">
            {roles.map((r) => {
              const Icon = r.icon;
              return (
                <TabsTrigger
                  key={r.value}
                  value={r.value}
                  className="flex h-full flex-1 items-center justify-center gap-2 rounded-full text-xs font-semibold text-stone-500 transition-colors hover:text-stone-800 data-[state=active]:bg-white data-[state=active]:text-stone-900 data-[state=active]:shadow-sm dark:text-neutral-400 dark:hover:text-neutral-200 dark:data-[state=active]:bg-neutral-800 dark:data-[state=active]:text-neutral-50"
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

            // Coming-soon tiers are a footnote, not a card: a fourth card in a
            // three-column grid orphans itself on the next row and reads as a bug.
            const buyableTiers = tiers.filter((t: any) => !t.comingSoon);
            const soonTiers = tiers.filter((t: any) => t.comingSoon);

            const gridClass = buyableTiers.length === 1 ? "md:grid-cols-1 max-w-sm mx-auto" : buyableTiers.length === 2 ? "md:grid-cols-2 max-w-3xl mx-auto" : "md:grid-cols-3";

            return (
              <TabsContent key={r.value} value={r.value} className="mt-0 outline-none">
                <div className={`grid grid-cols-1 ${gridClass} gap-6 items-start`}>
                  {buyableTiers.map((tier: any) => (
                    <PricingCard key={tier.name} tier={tier} role={r.value} />
                  ))}
                </div>
                {soonTiers.length > 0 && (
                  <p className="mt-8 text-center text-xs text-muted-foreground">
                    {soonTiers.map((t: any) => t.name).join(', ')} tier — coming soon.
                  </p>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </div>
  );
}
