import styles from "./search.module.css";
import Link from "next/link";
import { getLawyers, getSpecialties } from "@/lib/directory/api";
import SearchFilters from "@/components/directory/search/SearchFilters";
import BookmarkButton from "@/components/directory/BookmarkButton";
import { Lawyer, Specialty } from '@/lib/api';
import { createClient } from '@/lib/supabase/server';

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

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: bookmarks } = await supabase
        .from('bookmarks')
        .select('lawyer_id')
        .eq('user_id', user.id)
      bookmarkedIds = bookmarks?.map(b => b.lawyer_id) ?? []
    }
  } catch {}

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
              <div key={res.id} className="premium-card">
                <div className={styles.cardHeader}>
                    <div className={styles.avatarMini}>{res.name[0]}</div>
                    <div className={styles.headerBadges}>
                      <div className={styles.badge}>{res.experience}</div>
                      {res.verified && <div className={styles.verifiedBadge}>✓ Verified</div>}
                    </div>
                </div>
                
                <div className={styles.cardContent}>
                  <div className={styles.flexTitle}>
                    <h3>{res.name}</h3>
                    <BookmarkButton lawyerId={res.id} initialBookmarked={bookmarkedIds.includes(res.id)} />
                  </div>
                  <p className={styles.resRole}>{res.role}</p>
                  <div className={styles.resSpecs}>
                    {res.specialties.slice(0, 3).map(s => (
                      <span key={s} className={styles.resSpecTag}>{s}</span>
                    ))}
                    {res.specialties.length > 3 && (
                      <span className={styles.resSpecTag}>+{res.specialties.length - 3}</span>
                    )}
                  </div>
                </div>

                <div className={styles.cardFooter}>
                  <div className={styles.resStats}>
                    ⭐ {res.rating} <span>({res.reviews})</span>
                  </div>
                  <div className={styles.resLocation}>
                    📍 {res.location}
                  </div>
                </div>

                <Link href={`/lawyer/${res.id}`} className={styles.profileLink}>
                  View Full Portfolio
                </Link>

              </div>
            )) : (
              <div className={styles.noResults}>
                <h3>No experts found</h3>
                <p>Try adjusting your filters or search terms.</p>
              </div>
            )}
          </div>
        </main>
      </div>
  );
}
