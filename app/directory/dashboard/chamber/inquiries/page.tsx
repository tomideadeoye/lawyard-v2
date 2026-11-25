import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { TERMS } from '@/lib/constants';
import InquiryInbox, { type InboxThread } from '@/components/directory/InquiryInbox';

export default async function ChamberInquiriesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Own the firm, or are one of its admins.
  let chamber: { id: string; name: string } | null = null;

  const { data: owned } = await supabase
    .from('chambers')
    .select('id, name')
    .eq('user_id', user.id)
    .maybeSingle();

  if (owned) {
    chamber = owned;
  } else {
    const { data: adminRow } = await supabase
      .from('chamber_admins')
      .select('chamber_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (adminRow?.chamber_id) {
      const { data } = await supabase
        .from('chambers')
        .select('id, name')
        .eq('id', adminRow.chamber_id)
        .maybeSingle();
      chamber = data;
    }
  }

  if (!chamber) redirect('/dashboard/chamber');

  // Explicit columns: the firm has no SELECT grant on the client's email or
  // phone, so `*` would fail — by design.
  const { data } = await supabase
    .from('chamber_inquiries')
    .select(
      'id, name, read, created_at, last_activity_at, chamber_inquiry_messages(id, sender, sender_name, body, created_at)'
    )
    .eq('chamber_id', chamber.id)
    .order('last_activity_at', { ascending: false })
    .limit(100);

  const threads: InboxThread[] = ((data ?? []) as unknown as Record<string, unknown>[]).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    read: row.read as boolean,
    created_at: row.created_at as string,
    last_activity_at: row.last_activity_at as string,
    messages: (row.chamber_inquiry_messages ?? []) as InboxThread['messages'],
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 animate-fade-in">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Enquiries</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Conversations from {chamber.name}&rsquo;s page. Replies are sent from here — the
            client never sees your email, and you never see theirs until they share it.
          </p>
        </div>
        <Link
          href="/dashboard/chamber"
          className="text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          ← {TERMS.firm.singular} profile
        </Link>
      </div>

      <InquiryInbox kind="chamber" threads={threads} />
    </div>
  );
}
