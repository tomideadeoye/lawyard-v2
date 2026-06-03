import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@repo/ui/components/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/tabs";
import { Check, X, Shield, Users, Landmark } from "lucide-react";
import pricingData from "../../config/pricing.json";
import { DirectoryRole } from "@repo/api";

type Feature = {
  name: string;
  included: boolean;
};

const roles = [
  { label: "Lawyers", value: DirectoryRole.LAWYER, icon: Shield },
  { label: "Clients", value: DirectoryRole.CLIENT, icon: Users },
  { label: "Chambers", value: DirectoryRole.CHAMBER, icon: Landmark },
];

function PricingCard({ tier }: { tier: any }) {
  return (
    <Card className={`relative flex flex-col bg-white border-border/50 overflow-hidden ${tier.recommended ? 'ring-2 ring-orange-500 shadow-xl z-10 scale-[1.02] rounded-xl' : 'shadow-sm rounded-lg hover:shadow-md transition-shadow'}`}>
      {tier.recommended && (
        <div className="bg-orange-500 text-white text-center py-2 text-sm font-bold tracking-wide">
          Recommended
        </div>
      )}
      <CardHeader className="text-center pt-8 pb-6 border-b border-border/40">
        <CardTitle className="text-xl font-medium text-slate-800 mb-6">{tier.name}</CardTitle>
        <div className="flex items-start justify-center gap-1 mb-6">
          <span className="text-xl font-medium text-slate-400 mt-1">$</span>
          <span className="text-6xl font-semibold text-slate-800">{tier.price.replace('$', '')}</span>
          <span className="text-sm font-medium text-slate-500 mt-auto mb-2 ml-1">{tier.period}</span>
        </div>
        <p className="text-sm text-slate-500 max-w-[250px] mx-auto min-h-[40px]">
          {tier.desc}
        </p>
      </CardHeader>
      
      <CardContent className="flex-1 px-6 py-8">
        <ul className="space-y-4">
          {tier.features.map((feature: Feature, i: number) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              {feature.included ? (
                <Check className="w-5 h-5 shrink-0 text-emerald-500" strokeWidth={2.5} />
              ) : (
                <X className="w-5 h-5 shrink-0 text-red-500" strokeWidth={2.5} />
              )}
              <span className={`${feature.included ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>
                {feature.name}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
      
      <CardFooter className="px-6 pb-8 pt-0">
        <Button 
          variant={tier.recommended ? "default" : "outline"} 
          className={`w-full py-6 text-base font-semibold transition-all ${
            tier.recommended 
              ? 'bg-slate-700 hover:bg-slate-800 text-white shadow-md' 
              : 'bg-transparent border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
          }`}
        >
          Continue
        </Button>
      </CardFooter>
    </Card>
  );
}



export default function PricingPage() {
  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Dark Navy Hero Section */}
      <div className="bg-slate-900 py-20 text-center">
        <h1 className="text-4xl md:text-5xl font-semibold text-white">
          Select Your Plan
        </h1>
      </div>

      <div className="max-w-5xl mx-auto px-6 -mt-8 relative z-10">
        {/* Notes Section */}
        <div className="bg-white rounded-lg shadow-sm border border-border/50 p-8 mb-12 mt-20">
          <h3 className="text-xl font-semibold text-slate-800 mb-4">Note:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-slate-600 font-medium">
            <li><strong className="text-slate-800">Clients:</strong> listing plans for people in search of lawyers</li>
            <li><strong className="text-slate-800">Lawyers:</strong> listing plans for lawyer/law professionals</li>
            <li><strong className="text-slate-800">Chambers:</strong> listing plans for law chambers</li>
            <li>Paid listing plans secure <strong className="text-slate-800">featured listings</strong> that receive the most user views, appear first, and rank higher in search results.</li>
          </ol>
        </div>

        <Tabs defaultValue="lawyers" className="w-full">
          <TabsList variant="line" className="w-full max-w-md mx-auto flex h-auto mb-12 border-b border-border/40 pb-0">
            {roles.map((r) => {
              const Icon = r.icon;
              return (
                <TabsTrigger
                  key={r.value}
                  value={r.value}
                  className="flex-1 flex-col gap-2 py-4 px-2 text-slate-500 data-[state=active]:text-slate-900 font-semibold"
                >
                  <Icon className="w-5 h-5" />
                  {r.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {roles.map((r) => {
            const tiers = (pricingData as Record<string, any[]>)[r.value] || [];
            const gridClass = tiers.length === 1 ? "md:grid-cols-1 max-w-sm mx-auto" : tiers.length === 2 ? "md:grid-cols-2 max-w-3xl mx-auto" : "md:grid-cols-3";

            return (
            <TabsContent key={r.value} value={r.value} className="mt-0 outline-none">
              <div className={`grid grid-cols-1 ${gridClass} gap-8 items-start`}>
                {tiers.map((tier: any) => (
                  <PricingCard key={tier.name} tier={tier} />
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
