import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getServiceRequestsForLawyer } from '@/app/directory/actions/service-requests';
import BookingsClient from './bookings-client';

export default async function BookingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isLawyer = profile?.role === 'lawyer' || profile?.role === 'chamber';
  if (!isLawyer) redirect('/dashboard');

  const result = await getServiceRequestsForLawyer();
  const requests = 'data' in result ? (result.data ?? []) : [];

  return (
    <div className="space-y-6 animate-fade-in px-4 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Service Requests</h1>
          <p className="text-muted-foreground text-sm">
            Paid, structured client briefs. Respond to confirm availability.
          </p>
        </div>
        <span className="text-sm text-muted-foreground">
          <strong className="text-foreground">{requests.length}</strong> total
        </span>
      </div>

      {'error' in result && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
          {String(result.error)}
        </div>
      )}

      {requests.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <div className="text-5xl">🗂️</div>
          <h3 className="text-lg font-bold">No service requests yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            When clients pay a booking fee and submit a brief from your listing page, it appears here.
          </p>
          <Link href={`/lawyer/${user.id}`} className="inline-block text-sm font-semibold text-primary hover:underline">
            View your listing page &rarr;
          </Link>
        </div>
      ) : (
        <BookingsClient requests={requests} />
      )}
    </div>
  );
}
