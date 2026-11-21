'use client';

// DELAYED AUTH GATE — Entry point for the listing submission flow.
// Users can browse freely and select a category; only at category selection
// do we gate on auth. Unauthenticated users are redirected to /directory/signup
// with ?redirect=/directory/add-listing&category=X so they return here post-auth.
//
// Auth Chain (4 hops):
//   1. This page → /directory/signup?redirect=...&category=...
//   2. signup-form.tsx → forwards redirect+category to OAuth `redirectTo` (auth/callback)
//   3. auth/callback/route.ts → exchanges OAuth code, appends `?category=X` to final URL
//   4. This page restores category from URL params (or sessionStorage fallback)

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from 'next/navigation';
import ClientNeedForm from "@/components/directory/forms/ClientNeedForm";
import LawyerForm from "@/components/directory/forms/LawyerForm";
import ChamberForm from "@/components/directory/forms/ChamberForm";
import CorporateForm from "@/components/directory/forms/CorporateForm";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Scale, Landmark, Briefcase, Target, type LucideIcon } from 'lucide-react';

// One badge shape for every category: emoji rendered at four different weights and
// colours, so the grid read as four unrelated stickers instead of one set of choices.
function CategoryIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand/10 text-brand-muted">
      <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
    </div>
  )
}
import { createClient } from '@/lib/supabase/client';
import { TERMS } from "@/lib/constants";
import { useQuery } from '@tanstack/react-query';

function AddListingContent() {
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fetch the user's role (or null if not authenticated).
  // On OAuth return (Hop 4), this resolves to a non-null value
  // and triggers the useEffect below to restore the selected category.
  const { data: userRole, isLoading: roleLoading } = useQuery({
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
    staleTime: 1000 * 60 * 5,
  });

  const isLawyer = userRole === 'lawyer';

  // Hop 1: Category card clicked but not authenticated → save to sessionStorage
  // (belt-and-suspenders with URL params) and redirect to signup.
  // The category is passed both ways: URL param for the OAuth round-trip
  // and sessionStorage for browser-back or tab-restore scenarios.
  const handleCategorySelect = useCallback((category: string) => {
    if (userRole === null && !roleLoading) {
      sessionStorage.setItem('lawyard_listing_category', category);
      window.location.href = `/signup?redirect=${encodeURIComponent('/add-listing')}&category=${category}`;
      return;
    }
    setSelectedCategory(category);
  }, [userRole, roleLoading]);

  // Hop 4: Restore category selection after auth callback.
  // Two sources (checked in order):
  //   a) URL ?category= param (from auth/callback → appends it to redirect URL)
  //   b) sessionStorage (fallback — survives page refresh, manual navigation)
  // Both are cleared after use to prevent stale restores.
  // Category is only restored if user is now authenticated (userRole !== null).
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam && userRole !== undefined && !roleLoading) {
      if (userRole !== null) {
        setSelectedCategory(categoryParam);
      }
      sessionStorage.removeItem('lawyard_listing_category');
      const url = new URL(window.location.href);
      url.searchParams.delete('category');
      window.history.replaceState({}, '', url.toString());
      return;
    }

    const saved = sessionStorage.getItem('lawyard_listing_category');
    if (saved && userRole !== undefined && !roleLoading) {
      if (userRole !== null) {
        setSelectedCategory(saved);
      }
      sessionStorage.removeItem('lawyard_listing_category');
    }
  }, [searchParams, userRole, roleLoading]);

  // Show spinner while auth resolves — prevents flash of unauthed content
  // before redirect fires. userRole is undefined during initial fetch, null when no user.
  if (roleLoading && userRole === undefined) {
    return (
      <main className="max-w-4xl mx-auto py-10 px-4 md:px-6 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto py-10 px-4 md:px-6 space-y-8 text-foreground animate-fade-in">
       <div className="flex justify-between items-center border-b border-border/40 pb-6 mb-6">
          <div className="flex gap-4 md:gap-8 flex-wrap">
            <div className={`text-xs font-mono uppercase tracking-widest ${!selectedCategory ? 'text-brand-muted font-bold' : 'text-emerald-600 dark:text-emerald-500 font-bold'}`}>1. Category</div>
            <div className={`text-xs font-mono uppercase tracking-widest ${selectedCategory ? 'text-brand-muted font-bold' : 'text-muted-foreground'}`}>2. Details</div>
            <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">3. Verification</div>
            <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">4. Publish</div>
          </div>
       </div>

        {!selectedCategory ? (
          <>
            <section className="text-center space-y-3 mb-10">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Start your listing.</h1>
              <p className="text-muted-foreground text-sm max-w-lg mx-auto">
                Choose what you&rsquo;re listing: a practice, a firm, a legal team, or a brief you need
                counsel on.
              </p>
            </section>

            <section className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
              {/* Individual Lawyer Selection */}
              <Card className="hover:-translate-y-1 hover:border-accent/40 hover:bg-card/60 transition-all duration-300 border-border/40 bg-card/30 backdrop-blur-md flex flex-col justify-between">
                <CardHeader className="text-center pb-2">
                  <CategoryIcon icon={Scale} />
                  <CardTitle className="text-xl font-bold tracking-tight text-foreground">Individual {TERMS.lawyer.singular}</CardTitle>
                  <CardDescription className="text-sm">For independent practitioners, specialized solicitors, and legal engineers.</CardDescription>
                </CardHeader>
                <CardFooter className="pt-4 pb-6 flex justify-center">
                  <Button className="h-11 w-full max-w-[220px]" onClick={() => handleCategorySelect('lawyer')}>
                    Apply as a lawyer
                  </Button>
                </CardFooter>
              </Card>
 
              {/* Law Chamber Selection */}
              <Card className="hover:-translate-y-1 hover:border-accent/40 hover:bg-card/60 transition-all duration-300 border-border/40 bg-card/30 backdrop-blur-md flex flex-col justify-between">
                <CardHeader className="text-center pb-2">
                  <CategoryIcon icon={Landmark} />
                  <CardTitle className="text-xl font-bold tracking-tight text-foreground">{TERMS.firm.singular}</CardTitle>
                  <CardDescription className="text-sm">For established {TERMS.firm.lowerPlural}, multi-partner practices, and specialized {TERMS.firm.lowerPlural}.</CardDescription>
                </CardHeader>
                <CardFooter className="pt-4 pb-6 flex justify-center">
                  <Button className="h-11 w-full max-w-[220px]" onClick={() => handleCategorySelect('chamber')}>
                    Apply as a law firm
                  </Button>
                </CardFooter>
              </Card>
 
              {/* Corporate Legal Dept Selection */}
              <Card className="hover:-translate-y-1 hover:border-accent/40 hover:bg-card/60 transition-all duration-300 border-border/40 bg-card/30 backdrop-blur-md flex flex-col justify-between">
                <CardHeader className="text-center pb-2">
                  <CategoryIcon icon={Briefcase} />
                  <CardTitle className="text-xl font-bold tracking-tight text-foreground">Corporate Legal Dept</CardTitle>
                  <CardDescription className="text-sm">For in-house legal departments, compliance units, and legal counsels hiring external experts.</CardDescription>
                </CardHeader>
                <CardFooter className="pt-4 pb-6 flex justify-center">
                  <Button className="h-11 w-full max-w-[220px]" onClick={() => handleCategorySelect('corporate')}>
                    Apply as a legal team
                  </Button>
                </CardFooter>
              </Card>
  
              {/* Post Client Need Selection */}
              <Card className="hover:-translate-y-1 hover:border-accent/40 hover:bg-card/60 transition-all duration-300 border-border/40 bg-card/30 backdrop-blur-md flex flex-col justify-between">
                <CardHeader className="text-center pb-2">
                  <CategoryIcon icon={Target} />
                  <CardTitle className="text-xl font-bold tracking-tight text-foreground">
                    {isLawyer ? 'Refer a Brief / Find Agent' : 'Post Client Need'}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {isLawyer 
                      ? `For ${TERMS.lawyer.lowerPlural} seeking to delegate briefs, collaborate with specialists, or hire local correspondent counsel.`
                      : 'For individuals, startups, or corporate groups seeking to broadcast a specific brief or query.'}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="pt-4 pb-6 flex justify-center">
                  <Button className="h-11 w-full max-w-[220px]" onClick={() => handleCategorySelect('need')}>
                    {isLawyer ? 'Post a referral' : 'Post a brief'}
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
                Access to high-net-worth {TERMS.client.lowerPlural}, global mandates, and corporate legal departments.
              </li>
              <li className="flex gap-2">
                <span className="text-accent font-semibold">✦</span>
                Verified status badge for enhanced professional trust on all search directories.
              </li>
              <li className="flex gap-2">
                <span className="text-accent font-semibold">✦</span>
                Automated placement in the Lawyard directory and search results.
              </li>
            </ul>
          </div>
        )}
      </main>
    );
}

export default function AddListingPage() {
  return (
    <Suspense fallback={
      <main className="max-w-4xl mx-auto py-10 px-4 md:px-6 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </main>
    }>
      <AddListingContent />
    </Suspense>
  );
}
