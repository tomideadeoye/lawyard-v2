import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getChamberById } from '@/lib/directory/api';
import { ListingAvatar } from '@/components/directory/ListingAvatar';

export default async function ChamberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const chamber = await getChamberById(id);
  if (!chamber) notFound();

  const supabase = await createClient();
  const { data: lawyers } = await supabase
    .from('lawyers')
    .select('id, name, role, image_url, verification_status, rating')
    .eq('chamber_id', id);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">
        {/* Back link */}
        <Link href="/directory" className="text-xs text-muted-foreground hover:text-foreground transition-colors font-semibold uppercase tracking-wider">
          &larr; Back to Directory
        </Link>

        {/* Hero */}
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="w-28 h-28 rounded-2xl overflow-hidden bg-muted border border-border/50 shrink-0 shadow-md">
            <ListingAvatar src={chamber.image_url || ''} name={chamber.name} type="chamber" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{chamber.name}</h1>
            <p className="text-base text-muted-foreground mt-2">{chamber.focus || 'Legal Practice'}</p>
            <div className="flex flex-wrap gap-4 mt-4 text-sm">
              {chamber.location && (
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <svg width="14" height="14" viewBox="0 0 12 12" fill="currentColor"><path d="M6 0C3.8 0 2 1.8 2 4c0 3 4 8 4 8s4-5 4-8c0-2.2-1.8-4-4-4zm0 5.5C5.2 5.5 4.5 4.8 4.5 4S5.2 2.5 6 2.5 7.5 3.2 7.5 4 6.8 5.5 6 5.5z"/></svg>
                  {chamber.location}
                </span>
              )}
              <span className="text-amber-600 font-semibold flex items-center gap-1">
                &#9733; 4.8
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        {chamber.description && (
          <section>
            <h2 className="text-lg font-bold mb-3">About</h2>
            <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{chamber.description}</p>
          </section>
        )}

        {/* Contact */}
        {(chamber.email || chamber.phone || chamber.website) && (
          <section>
            <h2 className="text-lg font-bold mb-4">Contact</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-xl bg-card/40 border border-border/40">
              {chamber.email && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Email</span>
                  <a href={`mailto:${chamber.email}`} className="block text-sm font-semibold text-primary hover:underline mt-1 truncate">{chamber.email}</a>
                </div>
              )}
              {chamber.phone && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Phone</span>
                  <a href={`tel:${chamber.phone}`} className="block text-sm font-semibold mt-1">{chamber.phone}</a>
                </div>
              )}
              {chamber.website && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Website</span>
                  <a href={chamber.website} target="_blank" rel="noreferrer" className="block text-sm font-semibold text-primary hover:underline mt-1 truncate">{chamber.website}</a>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Lawyers in Chamber */}
        {lawyers && lawyers.length > 0 && (
          <section>
            <h2 className="text-lg font-bold mb-4">Members ({lawyers.length})</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {lawyers.map((l) => (
                <Link
                  key={l.id}
                  href={`/directory/lawyer/${l.id}`}
                  className="flex items-center gap-4 p-4 rounded-xl bg-card/40 border border-border/40 hover:border-accent/30 hover:shadow-md transition-all"
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted shrink-0 border border-border/30">
                    <ListingAvatar src={l.image_url || ''} name={l.name} type="lawyer" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{l.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{l.role || 'Legal Practitioner'}</p>
                    <span className={`text-[10px] font-semibold uppercase mt-0.5 inline-block ${
                      l.verification_status === 'verified' ? 'text-emerald-500' : 'text-amber-500'
                    }`}>{l.verification_status}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
