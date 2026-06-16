'use client';

import { useState } from "react";
import ClientNeedForm from "@/components/directory/forms/ClientNeedForm";
import LawyerForm from "@/components/directory/forms/LawyerForm";
import ChamberForm from "@/components/directory/forms/ChamberForm";
import CorporateForm from "@/components/directory/forms/CorporateForm";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';

export default function AddListingPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: userRole } = useQuery({
    queryKey: ['userRole'],
    queryFn: async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      return profile?.role ?? null;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const isLawyer = userRole === 'lawyer';

  return (
    <main className="max-w-4xl mx-auto py-10 px-4 md:px-6 space-y-8 text-foreground animate-fade-in">
       <div className="flex justify-between items-center border-b border-border/40 pb-6 mb-6">
          <div className="flex gap-4 md:gap-8 flex-wrap">
            <div className={`text-xs font-mono uppercase tracking-widest ${!selectedCategory ? 'text-accent font-bold' : 'text-emerald-500 font-bold'}`}>1. Category</div>
            <div className={`text-xs font-mono uppercase tracking-widest ${selectedCategory ? 'text-accent font-bold' : 'text-muted-foreground'}`}>2. Details</div>
            <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">3. Verification</div>
            <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">4. Capitalize</div>
          </div>
       </div>

        {!selectedCategory ? (
          <>
            <section className="text-center space-y-3 mb-10">
              <h1 className="text-4xl font-extrabold tracking-tight">Join the <span className="gradient-text">Elite</span>.</h1>
              <p className="text-muted-foreground text-sm max-w-lg mx-auto">The Lawyard Directory is a curated platform for top-tier legal talent. Start your application below.</p>
            </section>

            <section className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
              {/* Individual Lawyer Selection */}
              <Card className="hover:-translate-y-1 hover:border-accent/40 hover:bg-card/60 transition-all duration-300 border-border/40 bg-card/30 backdrop-blur-md flex flex-col justify-between">
                <CardHeader className="text-center pb-2">
                  <div className="text-5xl mb-4">🎓</div>
                  <CardTitle className="text-xl font-bold tracking-tight text-foreground">Individual Lawyer</CardTitle>
                  <CardDescription className="text-sm">For independent practitioners, specialized solicitors, and legal engineers.</CardDescription>
                </CardHeader>
                <CardFooter className="pt-4 pb-6 flex justify-center">
                  <Button className="w-full max-w-[200px]" onClick={() => setSelectedCategory('lawyer')}>
                    Select Individual
                  </Button>
                </CardFooter>
              </Card>
 
              {/* Law Chamber Selection */}
              <Card className="hover:-translate-y-1 hover:border-accent/40 hover:bg-card/60 transition-all duration-300 border-border/40 bg-card/30 backdrop-blur-md flex flex-col justify-between">
                <CardHeader className="text-center pb-2">
                  <div className="text-5xl mb-4">🏛️</div>
                  <CardTitle className="text-xl font-bold tracking-tight text-foreground">Law Chamber / Firm</CardTitle>
                  <CardDescription className="text-sm">For established law firms, multi-partner practices, and specialized chambers.</CardDescription>
                </CardHeader>
                <CardFooter className="pt-4 pb-6 flex justify-center">
                  <Button className="w-full max-w-[200px]" onClick={() => setSelectedCategory('chamber')}>
                    Select Institution
                  </Button>
                </CardFooter>
              </Card>
 
              {/* Corporate Legal Dept Selection */}
              <Card className="hover:-translate-y-1 hover:border-accent/40 hover:bg-card/60 transition-all duration-300 border-border/40 bg-card/30 backdrop-blur-md flex flex-col justify-between">
                <CardHeader className="text-center pb-2">
                  <div className="text-5xl mb-4">💼</div>
                  <CardTitle className="text-xl font-bold tracking-tight text-foreground">Corporate Legal Dept</CardTitle>
                  <CardDescription className="text-sm">For in-house legal departments, compliance units, and legal counsels hiring external experts.</CardDescription>
                </CardHeader>
                <CardFooter className="pt-4 pb-6 flex justify-center">
                  <Button className="w-full max-w-[200px]" onClick={() => setSelectedCategory('corporate')}>
                    Select Corporate
                  </Button>
                </CardFooter>
              </Card>
  
              {/* Post Client Need Selection */}
              <Card className="hover:-translate-y-1 hover:border-accent/40 hover:bg-card/60 transition-all duration-300 border-border/40 bg-card/30 backdrop-blur-md flex flex-col justify-between">
                <CardHeader className="text-center pb-2">
                  <div className="text-5xl mb-4">🎯</div>
                  <CardTitle className="text-xl font-bold tracking-tight text-foreground">
                    {isLawyer ? 'Refer a Brief / Find Agent' : 'Post Client Need'}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {isLawyer 
                      ? 'For lawyers seeking to delegate briefs, collaborate with specialists, or hire local correspondent counsel.'
                      : 'For individuals, startups, or corporate groups seeking to broadcast a specific brief or query.'}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="pt-4 pb-6 flex justify-center">
                  <Button className="w-full max-w-[200px]" onClick={() => setSelectedCategory('need')}>
                    {isLawyer ? 'Select Referral' : 'Post Brief'}
                  </Button>
                </CardFooter>
              </Card>
            </section>
          </>
        ) : (
          <section className="max-w-2xl mx-auto space-y-6">
            <Button variant="ghost" size="sm" onClick={() => setSelectedCategory(null)} className="mb-2 text-muted-foreground hover:text-foreground">
              ← Back to Categories
            </Button>
            
            <div className="space-y-1 mb-6">
              <h2 className="text-2xl font-bold tracking-tight">
                {selectedCategory === 'need' 
                  ? (isLawyer ? 'Post a Referral or Seek Correspondent Counsel' : 'Tell us what you need') 
                  : 'Complete your listing details'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {selectedCategory === 'need' 
                  ? (isLawyer 
                      ? 'Describe the brief or agency requirement so other vetted practitioners can contact you.' 
                      : 'Describe your situation so our vetted experts can contact you.')
                  : 'Our verification team will review your details once submitted.'}
              </p>
            </div>

            <Card className="border border-border/40 bg-card/45 backdrop-blur-md p-6 sm:p-8">
              {selectedCategory === 'need' && <ClientNeedForm />}
              {selectedCategory === 'lawyer' && <LawyerForm />}
              {selectedCategory === 'chamber' && <ChamberForm />}
              {selectedCategory === 'corporate' && <CorporateForm />}
            </Card>
          </section>
        )}

        {!selectedCategory && (
          <div className="mt-10 p-6 bg-muted/20 border-l-4 border-accent rounded-r-xl space-y-3">
            <h4 className="font-bold text-sm uppercase tracking-wider text-accent">Why list with Lawyard?</h4>
            <ul className="space-y-2 text-sm text-muted-foreground list-none pl-0">
              <li className="flex gap-2">
                <span className="text-accent font-semibold">✦</span>
                Access to high-net-worth clients, global mandates, and corporate legal departments.
              </li>
              <li className="flex gap-2">
                <span className="text-accent font-semibold">✦</span>
                Verified status badge for enhanced professional trust on all search directories.
              </li>
              <li className="flex gap-2">
                <span className="text-accent font-semibold">✦</span>
                Direct integration with the Orion legal technology ecosystem and automated placement.
              </li>
            </ul>
          </div>
        )}
      </main>
    );
}
