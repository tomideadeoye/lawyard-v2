// Selected matters for a firm page.
//
// This is the section that carries a profile with no narrative: a court, a
// year, the side acted for and the outcome are verifiable facts, so they give
// a sparse firm page substance without anyone writing a biography.

export interface MatterRow {
  id: string;
  title: string;
  kind: string;
  court: string | null;
  suit_number: string | null;
  citation: string | null;
  year: number | null;
  role: string | null;
  side: string | null;
  outcome: string | null;
  summary: string | null;
  client_name: string | null;
  visibility: string;
  is_verified: boolean;
}

const KIND_LABELS: Record<string, string> = {
  litigation: 'Litigation',
  arbitration: 'Arbitration',
  advisory: 'Advisory',
  transaction: 'Transaction',
  regulatory: 'Regulatory',
  pro_bono: 'Pro bono',
};

const ROLE_LABELS: Record<string, string> = {
  lead_counsel: 'Lead counsel',
  co_counsel: 'Co-counsel',
  supporting: 'Supporting counsel',
  sole: 'Sole counsel',
};

const SIDE_LABELS: Record<string, string> = {
  claimant: 'for the claimant',
  defendant: 'for the defendant',
  appellant: 'for the appellant',
  respondent: 'for the respondent',
  applicant: 'for the applicant',
};

const OUTCOMES: Record<string, { label: string; className: string }> = {
  in_favour: { label: 'In favour', className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  against: { label: 'Against', className: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' },
  settled: { label: 'Settled', className: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20' },
  pending: { label: 'Pending', className: 'bg-muted text-muted-foreground border-border/40' },
  dismissed: { label: 'Dismissed', className: 'bg-muted text-muted-foreground border-border/40' },
  withdrawn: { label: 'Withdrawn', className: 'bg-muted text-muted-foreground border-border/40' },
};

export default function FirmMatters({ matters }: { matters: MatterRow[] }) {
  if (matters.length === 0) return null;

  return (
    <section className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-md p-6">
      <div className="flex items-baseline justify-between gap-4 mb-4">
        <h2 className="text-sm uppercase tracking-wider font-bold text-muted-foreground">
          Selected Matters
        </h2>
        <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/60">
          {matters.length} {matters.length === 1 ? 'matter' : 'matters'}
        </span>
      </div>

      <div className="divide-y divide-border/30">
        {matters.map((m) => {
          const outcome = m.outcome ? OUTCOMES[m.outcome] : undefined;
          const meta = [m.court, m.suit_number, m.citation].filter(Boolean);
          const people = [ROLE_LABELS[m.role ?? ''], SIDE_LABELS[m.side ?? '']]
            .filter(Boolean)
            .join(' ');
          const client =
            m.visibility === 'public' && m.client_name ? m.client_name : null;

          return (
            <article key={m.id} className="py-4 first:pt-0 last:pb-0">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-[#a77c5c]/10 text-[#a77c5c] text-[10px] font-bold uppercase tracking-wider border border-[#a77c5c]/20">
                      {KIND_LABELS[m.kind] ?? m.kind}
                    </span>
                    {m.year && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {m.year}
                      </span>
                    )}
                    {m.is_verified && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        ✓ Lawyard-verified
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-semibold text-foreground">{m.title}</h3>

                  {meta.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">{meta.join(' · ')}</p>
                  )}
                  {people && (
                    <p className="text-xs text-muted-foreground/80 mt-0.5">{people}</p>
                  )}
                  {client && (
                    <p className="text-xs text-muted-foreground/80 mt-0.5">Acted for {client}</p>
                  )}
                  {m.summary && (
                    <p className="text-sm text-foreground/80 leading-relaxed mt-2">{m.summary}</p>
                  )}
                </div>

                {outcome && (
                  <span className={`shrink-0 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${outcome.className}`}>
                    {outcome.label}
                  </span>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
