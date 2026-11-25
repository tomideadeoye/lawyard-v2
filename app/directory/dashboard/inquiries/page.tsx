import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import InquiryInbox, { type InboxThread } from '@/components/directory/InquiryInbox';

export default async function InquiriesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isLawyer = profile?.role === 'lawyer' || profile?.role === 'chamber';
  if (!isLawyer) redirect('/dashboard');

  // Explicit columns: the lawyer has no SELECT grant on the client's email or
  // phone, so `*` would fail — by design.
  const { data, error } = await supabase
    .from('lawyer_inquiries')
    .select(
      'id, name, read, created_at, last_activity_at, lawyer_inquiry_messages(id, sender, sender_name, body, created_at)'
    )
    .eq('lawyer_id', user.id)
    .order('last_activity_at', { ascending: false })
    .limit(100);

  const threads: InboxThread[] = ((data ?? []) as unknown as Record<string, unknown>[]).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    read: row.read as boolean,
    created_at: row.created_at as string,
    last_activity_at: row.last_activity_at as string,
    messages: (row.lawyer_inquiry_messages ?? []) as InboxThread['messages'],
  }));

  const unread = threads.filter((thread) => !thread.read).length;

  return (
    <div className="space-y-6 animate-fade-in px-4 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inquiries</h1>
          <p className="text-muted-foreground text-sm">
            Conversations from your listing. Replies are sent from here — the client never sees
            your email, and you never see theirs unless they share it.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {unread > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-[#a77c5c]/10 text-[#a77c5c] text-[10px] font-bold uppercase tracking-wider border border-[#a77c5c]/20">
              {unread} unread
            </span>
          )}
          <Link
            href={`/lawyer/${user.id}`}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            View listing &rarr;
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
          {error.message}
        </div>
      )}

      <InquiryInbox kind="lawyer" threads={threads} />
    </div>
  );
}
