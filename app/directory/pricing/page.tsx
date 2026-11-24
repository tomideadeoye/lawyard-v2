import { Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Users, Building } from "lucide-react";
import { getPlans } from "@/app/directory/actions/plans";
import { createClient } from "@/lib/supabase/server";
import { DirectoryRole } from "@/lib/api";
import { CURRENCY, formatNGN, parseAmount } from "@/lib/currency";
import { TERMS } from "@/lib/constants";
import { PaystackButton } from "@/components/directory/paystack-button";
import { SeatCheckout } from "@/components/directory/seat-checkout";
import { PaymentMessage } from "./payment-message";
import { PlanFeatures } from "./plan-features";
import Link from "next/link";

const roles = [
  { label: TERMS.lawyer.plural, value: DirectoryRole.LAWYER, icon: User },
  { label: TERMS.client.plural, value: DirectoryRole.CLIENT, icon: Users },
  { label: TERMS.firm.plural, value: DirectoryRole.CHAMBER, icon: Building },
];

/** What the pricing page needs to sell firm seats. */
type FirmSeats = { chamberId: string; seatLimit: number; seatsUsed: number }

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
      price: formatNGN(1000000),
      period: "/ 365 days",
      recommended: true,
      desc: "One annual fee for the firm. Lawyers under the plan are covered — no individual fee.",
      features: [
        { name: "Listing as featured", included: true },
        { name: "Your lawyers listed under the firm plan — no individual fees", included: true },
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
        { name: "One seat (the firm owner) included", included: true },
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

function Price({ price, period, name, role }: { price: string; period: string; name: string; role?: string }) {
  const amount = parseAmount(price)
  const subtext =
    role === 'chamber'
      ? amount === 0
        ? 'Owner seat included'
        : 'Per seat / year'
      : name.toLowerCase().includes('package')
        ? 'Per package'
        : 'Per listing'
  // The price is the decision number on the page: biggest weight, quietest colour.
  // Everything around it (currency, period, unit) is muted so the figure lands first.
  return (
    <div className="flex flex-col items-center gap-2">
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

// The plans table is still seeded with the dollar-era figures ($2 for a
// 365-day premium listing), which format as ₦2. Until Tobi's NGN numbers land
// (Q2–Q6), a non-zero price below this floor is treated as a placeholder: the
// plan stays visible, but it cannot be bought. Real prices flip it back on.
const PRICE_PLACEHOLDER_FLOOR = 1000

function PricingCard({ tier, role, collapseFrom, firm, memberFirm }: { tier: any; role: string; collapseFrom?: 'sm' | 'lg'; firm?: FirmSeats | null; memberFirm?: { name: string; chamberId: string } | null }) {
  const amount = parseAmount(tier.price)
  const priceUnset = amount > 0 && amount < PRICE_PLACEHOLDER_FLOOR
  const isPaid = amount > 0 && !priceUnset

  // The action sits directly under the positioning line, before the feature list —
  // the order OpenAI, Stripe and Notion all use. A button at the bottom of a
  // variable-length list can never line up across tiers; one under a fixed-height
  // header always does.
  const action = priceUnset ? (
    <Link
      href="/contact"
      className={
        tier.recommended
          ? 'block w-full rounded-lg border border-transparent bg-brand py-3 text-center text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand/90'
          : 'block w-full rounded-lg border border-stone-300 py-3 text-center text-sm font-semibold text-stone-700 transition-colors hover:border-brand hover:text-brand-muted dark:border-white/15 dark:text-neutral-300 dark:hover:border-brand-muted dark:hover:text-brand-muted'
      }
    >
      Contact sales
    </Link>
  ) : isPaid && role === 'chamber' ? (
    // A firm plan upgrades an existing firm listing and is priced per seat. With
    // no firm there is nothing to upgrade — sending them to Paystack would take
    // money and provision nothing.
    firm ? (
      <SeatCheckout
        planName={tier.name}
        seatPrice={amount}
        chamberId={firm.chamberId}
        currentSeats={firm.seatLimit}
        usedSeats={firm.seatsUsed}
        recommended={tier.recommended}
      />
    ) : memberFirm ? (
      // A seated lawyer cannot buy the firm's plan — the firm buys seats. Sending
      // them to Paystack would take their money and upgrade nothing.
      <div className="space-y-2">
        <p className="rounded-lg border border-stone-200 px-3 py-2 text-center text-[11px] leading-relaxed text-muted-foreground dark:border-white/10">
          Your firm ({memberFirm.name}) buys the seats. Ask an admin to add one for you.
        </p>
        <Link
          href={`/chamber/${memberFirm.chamberId}`}
          className="block w-full rounded-lg border border-stone-300 py-3 text-center text-sm font-semibold text-stone-700 transition-colors hover:border-brand hover:text-brand-muted dark:border-white/15 dark:text-neutral-300 dark:hover:border-brand-muted dark:hover:text-brand-muted"
        >
          View your firm
        </Link>
      </div>
    ) : (
      <Link
        href="/dashboard/chamber"
        className={
          tier.recommended
            ? 'block w-full rounded-lg border border-transparent bg-brand py-3 text-center text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand/90'
            : 'block w-full rounded-lg border border-stone-300 py-3 text-center text-sm font-semibold text-stone-700 transition-colors hover:border-brand hover:text-brand-muted dark:border-white/15 dark:text-neutral-300 dark:hover:border-brand-muted dark:hover:text-brand-muted'
        }
      >
        Create your firm page first
      </Link>
    )
  ) : isPaid ? (
    <PaystackButton amount={amount} planName={tier.name} planRole={role} recommended={tier.recommended} />
  ) : (
    <Link
      href={role === 'chamber' ? '/dashboard/chamber' : '/dashboard'}
      className="block w-full rounded-lg border border-stone-300 py-3 text-center text-sm font-semibold text-stone-700 transition-colors hover:border-brand hover:text-brand-muted dark:border-white/15 dark:text-neutral-300 dark:hover:border-brand-muted dark:hover:text-brand-muted"
    >
      {role === 'chamber' ? 'Create your firm page' : 'Get started free'}
    </Link>
  )

  // Phones get a divided list inside one surface (guide: P-01 — boxes become rows
  // once the box carries nothing the hairline doesn't). The card shell, border and
  // shadow return at sm, before two tiers can ever sit side by side.
  return (
    <Card
      className={`relative flex flex-col overflow-hidden p-0 transition-all duration-300 sm:hover:-translate-y-0.5 max-sm:rounded-none max-sm:border-0 max-sm:bg-transparent max-sm:shadow-none ${
        tier.recommended
          ? 'z-10 max-sm:border-l-2 max-sm:border-l-brand sm:rounded-xl sm:border sm:border-brand/70 sm:ring-1 sm:ring-brand/15 sm:shadow-[0_18px_45px_-25px_rgba(138,98,71,0.45)]'
          : 'max-sm:border-l-2 max-sm:border-l-transparent sm:rounded-xl sm:border sm:border-stone-200/90 sm:bg-white sm:shadow-sm sm:hover:border-stone-300 dark:sm:bg-neutral-900 dark:sm:border-white/10 dark:sm:hover:border-white/20'
      }`}
    >
      {tier.recommended ? (
        <div className="hidden h-[26px] items-center justify-center bg-brand px-4 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-brand-foreground sm:flex">
          Recommended
        </div>
      ) : (
        // Reserve the ribbon's height on every card, or the recommended tier's badge
        // pushes its whole column down and the buttons stop lining up.
        <div aria-hidden className="hidden h-[26px] sm:block" />
      )}
      <CardHeader className="border-b border-stone-100 px-0 pb-5 pt-0 text-center max-sm:pt-6 sm:px-5 sm:pt-6 dark:border-white/[0.07]">
        <CardTitle className="mb-3 flex min-h-[16px] flex-wrap items-center justify-center gap-2 text-[13px] font-semibold uppercase tracking-[0.12em] text-stone-500 sm:mb-4 dark:text-neutral-400">
          <span>{tier.name}</span>
          {tier.recommended && (
            <span className="rounded-full bg-brand px-2 py-0.5 text-[9px] font-bold tracking-[0.14em] text-brand-foreground sm:hidden">
              Recommended
            </span>
          )}
        </CardTitle>

        {/* Fixed-height price slot: a plan showing "Pricing under review" and a plan
            showing ₦0 must put their buttons on the same line. */}
        <div className="flex h-[4.75rem] items-center justify-center">
          {tier.comingSoon ? (
            <span className="text-xl font-semibold tracking-tight text-stone-500 dark:text-neutral-400">Coming soon</span>
          ) : priceUnset ? (
            <span className="text-xl font-semibold tracking-tight text-stone-500 dark:text-neutral-400">Pricing under review</span>
          ) : (
            <Price price={tier.price} period={tier.period} name={tier.name} role={role} />
          )}
        </div>

        <p className="mx-auto mt-1 min-h-[3.25rem] max-w-[260px] text-xs leading-relaxed text-muted-foreground">
          {tier.desc}
        </p>

        <div className="mt-4">{action}</div>
      </CardHeader>

      <CardContent className="flex-1 px-0 py-5 sm:px-5">
        {tier.features.length > 0 && (
          <>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400 dark:text-neutral-500">
              What&rsquo;s included
            </p>
            <PlanFeatures features={tier.features} collapseFrom={collapseFrom} />
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default async function PricingPage() {
  const pricingData = await getPlans()

  // Firm plans are sold per seat against an existing firm listing, so the page
  // needs to know whether this visitor already has one.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let firm: FirmSeats | null = null
  let memberFirm: { chamberId: string; name: string } | null = null
  if (user) {
    const { data: owned } = await supabase
      .from('chambers')
      .select('id, seat_limit')
      .eq('user_id', user.id)
      .maybeSingle()

    let chamber = owned
    if (!chamber) {
      const { data: adminRow } = await supabase
        .from('chamber_admins')
        .select('chamber_id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (adminRow?.chamber_id) {
        const { data: delegated } = await supabase
          .from('chambers')
          .select('id, seat_limit')
          .eq('id', adminRow.chamber_id)
          .maybeSingle()
        chamber = delegated
      }
    }

    if (chamber) {
      const { data: used } = await supabase.rpc('chamber_seats_used', { p_chamber_id: chamber.id })
      firm = {
        chamberId: chamber.id,
        seatLimit: chamber.seat_limit ?? 1,
        seatsUsed: Number(used ?? 0),
      }
    } else {
      // Seated lawyer, not a firm admin: they cannot buy for the firm.
      const { data: seat } = await supabase
        .from('chamber_members')
        .select('chamber_id, chambers:chambers(id, name)')
        .eq('lawyer_id', user.id)
        .eq('status', 'active')
        .maybeSingle()

      const seatFirm = Array.isArray(seat?.chambers) ? seat?.chambers[0] : seat?.chambers
      if (seatFirm?.id) {
        memberFirm = { chamberId: seatFirm.id, name: seatFirm.name ?? 'your firm' }
      }
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-24 dark:bg-neutral-950">
      {/* Hero is dark in both themes — it belongs to the site chrome, not to the theme. */}
      <div className="relative overflow-hidden border-b border-white/[0.06] bg-neutral-950 py-10 text-center sm:py-14 md:py-24">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_72%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(167,124,92,0.18),transparent_62%)]" />
        <div className="relative z-10 px-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-muted">
            Lawyard Directory
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-5xl">
            Select your plan
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm font-medium text-neutral-400 md:text-base">
            Choose the listing tier that best fits your legal business needs.
          </p>
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-6">
        {/* Phones: plans first, the guidelines footnote after them — the notice was
            pushing every price and every CTA below the fold. */}
        <div className="flex flex-col lg:block">
          <div className="order-2 mt-10 lg:order-none lg:-mt-10 lg:mb-10">
            <Suspense fallback={null}>
              <PaymentMessage />
            </Suspense>

            <div className="rounded-xl border border-stone-200/80 border-l-2 border-l-brand bg-white p-5 shadow-sm dark:border-white/10 dark:border-l-brand dark:bg-neutral-900">
              <h2 className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-muted">
                Notice &amp; guidelines
              </h2>
              <ol className="list-decimal list-inside space-y-1 text-xs leading-relaxed text-muted-foreground">
                <li><strong className="font-semibold text-stone-800 dark:text-neutral-200">{TERMS.client.plural}:</strong> {TERMS.client.plural} browse for free — no plan needed to search and contact {TERMS.lawyer.lowerPlural}.</li>
                <li><strong className="font-semibold text-stone-800 dark:text-neutral-200">{TERMS.lawyer.plural}:</strong> listing plans for {TERMS.lawyer.lower}/law professionals</li>
                <li><strong className="font-semibold text-stone-800 dark:text-neutral-200">{TERMS.firm.plural}:</strong> listing plans for {TERMS.firm.lowerPlural}</li>
                <li>Paid listing plans secure <strong className="font-semibold text-stone-800 dark:text-neutral-200">featured listings</strong> that receive the most user views, appear first, and rank higher in search results.</li>
              </ol>
            </div>
          </div>

          <div className="order-1 lg:order-none">
            <Tabs defaultValue="lawyer" className="w-full">
              <TabsList className="mx-auto mb-8 flex h-11 w-full max-w-md items-center gap-1 rounded-full border border-stone-200/80 bg-stone-100/80 p-1 md:mb-10 dark:border-white/10 dark:bg-white/[0.04]">
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

                // Three tiers hold 1-up until 1024px. At 768 three columns are 224px
                // wide and every feature label wraps to three lines; a capped single
                // column reads calmer and keeps the CTA full-width under a thumb.
                const gridClass =
                  buyableTiers.length === 1
                    ? 'mx-auto max-w-sm md:grid-cols-1'
                    : buyableTiers.length === 2
                      ? 'mx-auto max-w-md sm:max-w-none sm:grid-cols-2 md:mx-auto md:max-w-3xl'
                      : 'mx-auto max-w-md lg:mx-0 lg:max-w-none lg:grid-cols-3';

                return (
                  <TabsContent key={r.value} value={r.value} className="mt-0 outline-none">
                    <div
                      className={`grid grid-cols-1 gap-6 max-sm:gap-0 max-sm:divide-y max-sm:divide-stone-200 max-sm:overflow-hidden max-sm:rounded-2xl max-sm:border max-sm:border-stone-200 max-sm:bg-white max-sm:px-5 dark:max-sm:divide-white/10 dark:max-sm:border-white/10 dark:max-sm:bg-neutral-900 ${gridClass}`}
                    >
                      {buyableTiers.map((tier: any) => (
                        <PricingCard
                          key={tier.name}
                          tier={tier}
                          role={r.value}
                          firm={firm}
                          memberFirm={memberFirm}
                          collapseFrom={buyableTiers.length > 2 ? 'lg' : 'sm'}
                        />
                      ))}
                    </div>
                    {soonTiers.length > 0 && (
                      <p className="mt-6 text-center text-xs text-muted-foreground md:mt-8">
                        {soonTiers.map((t: any) => t.name).join(', ')} tier — coming soon.
                      </p>
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
