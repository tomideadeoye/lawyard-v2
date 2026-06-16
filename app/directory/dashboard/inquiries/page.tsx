import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getInquiryStats } from '@/app/directory/actions/inquiries';
import InboxClient from './inbox-client';

export default async function InquiriesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/directory/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isLawyer = profile?.role === 'lawyer' || profile?.role === 'chamber';
  if (!isLawyer) redirect('/directory/dashboard');

  const statsResult = await getInquiryStats();

  const { data: inquiries, error } = await supabase
    .from('lawyer_inquiries')
    .select('*')
    .eq('lawyer_id', user.id)
    .order('created_at', { ascending: false });

  const stats = !statsResult.error ? statsResult : null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inquiries</h1>
          <p className="text-muted-foreground text-sm">
            Messages from clients requesting consultation.
          </p>
        </div>
        {stats && !stats.error && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              <strong className="text-foreground">{stats.total}</strong> total
            </span>
            {(stats as { unread: number }).unread > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-[#a77c5c]/10 text-[#a77c5c] text-[10px] font-bold uppercase tracking-wider border border-[#a77c5c]/20">
                {(stats as { unread: number }).unread} unread
              </span>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
          {error.message}
        </div>
      )}

      {inquiries && inquiries.length === 0 && (
        <div className="text-center py-16 space-y-4">
          <div className="text-5xl">📬</div>
          <h3 className="text-lg font-bold">No inquiries yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            When clients send you messages from your listing page, they&apos;ll appear here.
          </p>
          <Link href={`/directory/lawyer/${user.id}`} className="inline-block text-sm font-semibold text-primary hover:underline">
            View your listing page &rarr;
          </Link>
        </div>
      )}

      {inquiries && inquiries.length > 0 && <InboxClient inquiries={inquiries} />}
    </div>
  );
}
