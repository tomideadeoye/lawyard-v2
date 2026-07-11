import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import ChamberForm from './chamber-form';

export default async function ChamberPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: chamber } = await supabase
    .from('chambers')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  const tier = chamber?.subscription_tier || 'free';
  const isActive = chamber?.subscription_status === 'active';
  const expiresAt = chamber?.subscription_expires_at;
  const isExpired = expiresAt ? new Date(expiresAt) <= new Date() : false;

  return (
    <div className="space-y-8 animate-fade-in px-4 sm:px-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Chamber</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {chamber ? 'Manage your chamber listing and subscription.' : 'Create a chamber listing for your law firm.'}
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
