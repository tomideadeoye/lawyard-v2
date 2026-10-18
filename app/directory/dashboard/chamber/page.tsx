import { redirect } from 'next/navigation';
import Link from 'next/link';
import { TERMS } from '@/lib/constants';
import { createClient } from '@/lib/supabase/server';
import ChamberForm from './chamber-form';
import PublishPressReleaseForm from './publish-press-release-form';
import { getPressReleasesForChamber } from '@/app/directory/actions/press-releases';

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

      <ChamberForm initial={chamber} />

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
