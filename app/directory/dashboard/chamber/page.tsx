import { redirect } from 'next/navigation';
import Link from 'next/link';
import { TERMS } from '@/lib/constants';
import { createClient } from '@/lib/supabase/server';
import ChamberForm from './chamber-form';
import PublishPressReleaseForm from './publish-press-release-form';
import { getPressReleasesForChamber } from '@/app/directory/actions/press-releases';
import { leaveFirm, declineFirmSeat } from '@/app/directory/actions/chamber-members';

export default async function ChamberPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Own the firm, or are one of its admins (C17: multiple users per chamber).
  let { data: chamber } = await supabase
    .from('chambers')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  let isDelegateAdmin = false;
  if (!chamber) {
    const { data: membership } = await supabase
      .from('chamber_admins')
      .select('chamber_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();
    if (membership?.chamber_id) {
      const res = await supabase
        .from('chambers')
        .select('*')
        .eq('id', membership.chamber_id)
        .maybeSingle();
      chamber = res.data;
      isDelegateAdmin = !!res.data;
    }
  }

  const pressReleases = chamber ? await getPressReleasesForChamber(chamber.id) : [];

  // Practice areas and matters live in their own tables, so the form has to be
  // handed them alongside the chamber row.
  const [areaRows, matterRows] = chamber
    ? await Promise.all([
        supabase.from('chamber_specialties').select('specialty_id').eq('chamber_id', chamber.id),
        supabase.from('chamber_matters').select('*').eq('chamber_id', chamber.id).order('sort_order'),
      ])
    : [{ data: [] as { specialty_id: string }[] }, { data: [] as Record<string, unknown>[] }];

  const initialAreas = (areaRows.data ?? []).map((row) => row.specialty_id as string);
  const initialMatters = (matterRows.data ?? []).map((row) => {
    const matter = row as Record<string, unknown>;
    return {
      title: (matter.title as string) ?? '',
      kind: (matter.kind as string) ?? 'advisory',
      practice_area_id: (matter.practice_area_id as string) ?? '',
      court: (matter.court as string) ?? '',
      suit_number: (matter.suit_number as string) ?? '',
      citation: (matter.citation as string) ?? '',
      year: matter.year == null ? '' : String(matter.year),
      role: (matter.role as string) ?? '',
      side: (matter.side as string) ?? '',
      outcome: (matter.outcome as string) ?? '',
      summary: (matter.summary as string) ?? '',
      client_name: (matter.client_name as string) ?? '',
      client_consent: matter.client_consent === true,
      visibility: (matter.visibility as string) ?? 'anonymised',
    };
  });

  // A lawyer who holds a seat but does not manage the firm gets a member view,
  // not "create a firm" — the seat is theirs, the page is not.
  if (!chamber) {
    const { data: seat } = await supabase
      .from('chamber_members')
      .select('id, status, seat_role, joined_at, chambers:chambers(id, name, location, subscription_tier, subscription_status)')
      .eq('lawyer_id', user.id)
      .in('status', ['pending', 'active'])
      .maybeSingle()

    if (seat && seat.status === 'pending') {
      const firm = Array.isArray(seat.chambers) ? seat.chambers[0] : seat.chambers
      return (
        <div className="mx-auto max-w-2xl space-y-6 px-4 py-10 sm:px-6 animate-fade-in">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-600">Request pending</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              Waiting on {firm?.name ?? 'the firm'}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your request to join as a {seat.seat_role.replace('_', ' ')} is with the firm. You
              appear on their page once they approve and a seat is available.
            </p>
          </div>
          <form action={declineFirmSeat}>
            <input type="hidden" name="member_id" value={seat.id} />
            <button
              type="submit"
              className="rounded-lg border border-border/60 px-4 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-destructive"
            >
              Withdraw request
            </button>
          </form>
        </div>
      )
    }

    if (seat) {
      const firm = Array.isArray(seat.chambers) ? seat.chambers[0] : seat.chambers
      return (
        <div className="mx-auto max-w-2xl space-y-6 px-4 py-10 sm:px-6 animate-fade-in">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-muted">
              {TERMS.lawyer.singular} seat
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">You&rsquo;re at {firm?.name ?? 'a firm'}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your listing appears on the firm page as{' '}
              <span className="font-medium text-foreground">{seat.seat_role.replace('_', ' ')}</span>.
              The firm manages the page; you keep your own profile.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {firm?.id && (
              <Link
                href={`/chamber/${firm.id}`}
                className="rounded-lg border border-border/60 px-4 py-2 text-sm font-semibold transition-colors hover:bg-muted/20"
              >
                View firm page &rarr;
              </Link>
            )}
            <Link
              href="/dashboard/listings"
              className="rounded-lg border border-border/60 px-4 py-2 text-sm font-semibold transition-colors hover:bg-muted/20"
            >
              My listing
            </Link>
          </div>

          <form action={leaveFirm} className="pt-4">
            <input type="hidden" name="member_id" value={seat.id} />
            <button
              type="submit"
              className="rounded-lg border border-destructive/40 px-4 py-2 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/5"
            >
              Leave {firm?.name ?? 'this firm'}
            </button>
            <p className="mt-2 text-xs text-muted-foreground">
              Leaving keeps your listing live at your own plan&rsquo;s limits. Firm-only features
              (extra gallery images, the firm tier) stop applying.
            </p>
          </form>
        </div>
      )
    }
  }

  const tier = chamber?.subscription_tier || 'free';
  const isActive = chamber?.subscription_status === 'active';
  const expiresAt = chamber?.subscription_expires_at;
  const isExpired = expiresAt ? new Date(expiresAt) <= new Date() : false;

  return (
    <div className="space-y-8 animate-fade-in px-4 sm:px-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My {TERMS.firm.singular}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {chamber ? `Manage your ${TERMS.firm.lower} listing and subscription.` : `Create a ${TERMS.firm.lower} listing for your ${TERMS.firm.lower}.`}
        </p>
      </div>

      {chamber && (
        <div className="flex flex-wrap gap-4">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${
            tier === 'enterprise'
              ? 'bg-violet-500/10 text-violet-500 border-violet-500/20'
              : 'bg-slate-500/10 text-slate-500 border-slate-500/20'
          }`}>
            {tier === 'enterprise' ? 'Enterprise' : 'Free'}
          </span>
          {isActive && !isExpired && expiresAt && (
            <span className="text-xs text-muted-foreground">
              Expires {new Date(expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          )}
          {isExpired && (
            <span className="text-xs text-destructive font-semibold">Expired — renew to keep featured status</span>
          )}
        </div>
      )}

      <ChamberForm initial={chamber ? { ...chamber, practice_area_ids: initialAreas, matters: initialMatters } : null} />

      {chamber && (
        <div className="pt-8 border-t border-border/40 space-y-5">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Announcements &amp; Press</h2>
            <p className="text-muted-foreground text-xs mt-1">
              Published posts appear on the public {TERMS.firm.lower} page and are reviewed by an editor first.
              {isDelegateAdmin ? ' You manage this listing on behalf of the firm.' : ''}
            </p>
          </div>
          <PublishPressReleaseForm chamberId={chamber.id} />
          {pressReleases.length > 0 && (
            <ul className="space-y-2 max-w-2xl">
              {pressReleases.map((pr) => (
                <li key={pr.id} className="flex items-center justify-between gap-4 px-3 py-2 rounded-lg bg-muted/20 border border-border/30">
                  <span className="text-sm truncate">{pr.title}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                    pr.status === 'published' ? 'text-emerald-600' : 'text-amber-600'
                  }`}>
                    {pr.status === 'published' ? 'Published' : 'In review'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}


      {chamber && (
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/chamber/team"
            className="px-4 py-2 rounded-lg border border-border/40 text-xs font-semibold hover:bg-muted/20 transition-colors"
          >
            Team &amp; seats
          </Link>
          <Link
            href="/pricing"
            className="px-4 py-2 rounded-lg bg-[#a77c5c] hover:bg-[#906b4e] text-white text-xs font-bold transition-colors"
          >
            {tier === 'enterprise' ? 'Manage Subscription' : 'Upgrade to Enterprise'}
          </Link>
          <Link
            href={`/chamber/${chamber.id}`}
            className="px-4 py-2 rounded-lg border border-border/40 text-xs font-semibold hover:bg-muted/20 transition-colors"
          >
            View Public Page &rarr;
          </Link>
        </div>
      )}
    </div>
  );
}
