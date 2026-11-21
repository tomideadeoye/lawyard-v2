import styles from "./search.module.css";
import { getLawyers, getSpecialties } from "@/lib/directory/api";
import SearchFilters from "@/components/directory/search/SearchFilters";
import { LawyerCard } from "@/components/directory/LawyerCard";
import { Lawyer, Specialty } from '@/lib/api';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { TERMS } from '@/lib/constants';

export const dynamic = 'force-dynamic';

interface SearchPageProps {
  searchParams: Promise<{
    specialty?: string;
    location?: string;
    query?: string;
    q?: string;
    rating?: string;
    priceRange?: string;
    experience?: string;
  }>;
}

export default async function SearchPage(props: SearchPageProps) {
  const searchParams = await props.searchParams;
  let specialties: Specialty[] = [];
  let lawyers: Lawyer[] = [];

  let bookmarkedIds: string[] = []
  let isAuthenticated = false
  let hasAnyListing = false

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    isAuthenticated = !!user
    if (user) {
      const { data: bookmarks } = await supabase
        .from('bookmarks')
        .select('lawyer_id')
        .eq('user_id', user.id)
      bookmarkedIds = bookmarks?.map(b => b.lawyer_id) ?? []
    }
  } catch (e) {
    console.error('Failed to fetch bookmarks:', e)
  }

  try {
    const supabase = await createClient()
    const { count } = await supabase
      .from('lawyers')
      .select('id', { count: 'exact', head: true })
    hasAnyListing = (count ?? 0) > 0
  } catch {
    hasAnyListing = false
  }

  try {
    [specialties, lawyers] = await Promise.all([
      getSpecialties(),
      getLawyers({
        specialty: searchParams.specialty,
        location: searchParams.location,
        query: searchParams.q || searchParams.query,
        rating: searchParams.rating ? Number(searchParams.rating) : undefined,
        priceRange: searchParams.priceRange,
        experience: searchParams.experience
      })
    ]);
  } catch (error) {
    console.error('Error fetching search results:', error);
  }

  return (
    <div className={styles.layout}>
        {/* --- SIDEBAR FILTERS --- */}
        <SearchFilters specialties={specialties} />

        {/* --- MAIN RESULTS --- */}
        <main className={styles.results}>
          <div className={styles.resultsToolbar}>
            <div className={styles.sort}>
              Found <b>{lawyers.length}</b> experts {searchParams.location ? `in ${searchParams.location}` : ''}
            </div>
            <div className={styles.viewToggle}>
              <span>Grid</span> | <span>List</span>
            </div>
          </div>

          <div className={styles.resultsGrid}>
            {lawyers.length > 0 ? lawyers.map((res) => (
              <LawyerCard
                key={res.id}
                id={res.id}
                name={res.name}
                role={res.role}
                image={res.image}
                specialties={res.specialties}
                rating={res.rating}
                reviews={res.reviews}
                location={res.location}
                experience={res.experience}
                verified={res.verified}
                featured={res.featured}
                isAuthenticated={isAuthenticated}
                bookmarked={bookmarkedIds.includes(res.id)}
              />
            )) : (
              <div className={styles.noResults}>
                {hasAnyListing ? (
                  <>
                    <h3>Nothing matches that search yet</h3>
                    <p>Try a different practice area or location — or tell us what you need and we will route it to counsel.</p>
                    <Link href="/contact" className="mt-4 inline-block text-sm font-semibold text-accent hover:underline">
                      Send us a brief →
                    </Link>
                  </>
                ) : (
                  <>
                    <h3>The directory is filling up</h3>
                    <p>
                      No {TERMS.lawyer.lowerPlural} have been listed yet. If you practise law, claim a free listing and
                      you will appear here from launch day.
                    </p>
                    <Link
                      href="/add-listing?category=lawyer"
                      className="mt-4 inline-block rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-accent-foreground hover:bg-accent/90"
                    >
                      Claim your free listing
                    </Link>
                    <p className="mt-3 text-xs text-muted-foreground">
                      Looking for counsel instead?{" "}
                      <Link href="/contact" className="font-semibold text-accent hover:underline">
                        Send us a brief
                      </Link>
                      .
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
  );
}
