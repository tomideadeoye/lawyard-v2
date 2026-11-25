'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  markChamberInquiryRead,
  replyToChamberInquiry,
} from '@/app/directory/actions/chamber-inquiries';
import { markInquiryRead, replyToInquiry } from '@/app/directory/actions/inquiries';

// One inbox for both kinds of provider: a firm and a lawyer see the same
// thread UI, and only the action behind the buttons changes.

export interface InboxMessage {
  id: string;
  sender: string;
  sender_name: string | null;
  body: string;
  created_at: string;
}

export interface InboxThread {
  id: string;
  name: string;
  read: boolean;
  created_at: string;
  last_activity_at: string;
  messages: InboxMessage[];
}

function when(value: string) {
  return new Date(value).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function InquiryInbox({
  kind,
  threads,
}: {
  kind: 'chamber' | 'lawyer';
  threads: InboxThread[];
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(threads[0]?.id ?? null);
  const [body, setBody] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const mine = kind === 'chamber' ? 'firm' : 'lawyer';

  const sorted = useMemo(
    () =>
      threads
        .map((thread) => ({
          ...thread,
          messages: [...thread.messages].sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          ),
        }))
        .sort(
          (a, b) => new Date(b.last_activity_at).getTime() - new Date(a.last_activity_at).getTime()
        ),
    [threads]
  );

  const selected = sorted.find((thread) => thread.id === selectedId) ?? null;
  const unread = sorted.filter((thread) => !thread.read).length;

  const select = (thread: InboxThread) => {
    setSelectedId(thread.id);
    setBody('');
    setError(null);
    if (!thread.read) {
      startTransition(async () => {
        try {
          if (kind === 'chamber') await markChamberInquiryRead(thread.id);
          else await markInquiryRead(thread.id);
          router.refresh();
        } catch {
          // Reading is best-effort; the thread still opens.
        }
      });
    }
  };

  const send = () => {
    if (!selected || body.trim().length < 2) return;
    setError(null);
    startTransition(async () => {
      try {
        if (kind === 'chamber') await replyToChamberInquiry(selected.id, body);
        else await replyToInquiry(selected.id, body);
        setBody('');
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Reply could not be sent.');
      }
    });
  };

  if (sorted.length === 0) {
    return (
      <div className="rounded-2xl border border-border/40 bg-card/40 p-10 text-center">
        <p className="text-sm font-semibold">No enquiries yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Messages sent from your {kind === 'chamber' ? 'firm page' : 'profile'} land here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
      <div className="rounded-2xl border border-border/40 bg-card/40 overflow-hidden">
        <div className="flex items-center justify-between border-b border-border/30 px-4 py-3">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Inbox
          </span>
          <span className="text-[10px] font-semibold text-muted-foreground">
            {unread > 0 ? `${unread} unread` : `${sorted.length}`}
          </span>
        </div>
        <div className="divide-y divide-border/30 max-h-[560px] overflow-y-auto">
          {sorted.map((thread) => {
            const last = thread.messages[thread.messages.length - 1];
            return (
              <button
                key={thread.id}
                type="button"
                onClick={() => select(thread)}
                className={`w-full text-left px-4 py-3 transition-colors hover:bg-muted/20 ${
                  thread.id === selectedId ? 'bg-muted/30' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-sm font-semibold">
                    {!thread.read && <span className="h-1.5 w-1.5 rounded-full bg-[#a77c5c]" />}
                    {thread.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {when(thread.last_activity_at)}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {last?.sender === mine ? 'You: ' : ''}
                  {last?.body}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-border/40 bg-card/40 flex flex-col min-h-[420px]">
        {selected ? (
          <>
            <div className="border-b border-border/30 px-5 py-3">
              <p className="text-sm font-bold">{selected.name}</p>
              <p className="text-[11px] text-muted-foreground">
                Started {when(selected.created_at)} · contact details stay private until shared
              </p>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4 max-h-[420px]">
              {selected.messages.map((message) => (
                <div
                  key={message.id}
                  className={message.sender === mine ? 'flex justify-end' : 'flex justify-start'}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm ${
                      message.sender === mine
                        ? 'bg-[#a77c5c] text-white'
                        : 'bg-muted/30 text-foreground'
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{message.body}</p>
                    <p
                      className={`mt-1 text-[10px] ${
                        message.sender === mine ? 'text-white/60' : 'text-muted-foreground/60'
                      }`}
                    >
                      {message.sender === mine ? 'You' : selected.name} ·{' '}
                      {when(message.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border/30 p-4">
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={3}
                maxLength={4000}
                placeholder="Write a reply…"
                className="w-full resize-none rounded-lg border border-border/40 bg-muted/20 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#a77c5c]"
              />
              {error && <p className="mt-1 text-xs font-medium text-destructive">{error}</p>}
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={send}
                  disabled={pending || body.trim().length < 2}
                  className="rounded-lg bg-[#a77c5c] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#906b4e] disabled:opacity-50"
                >
                  {pending ? 'Sending…' : 'Send reply'}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center p-10 text-sm text-muted-foreground">
            Select an enquiry
          </div>
        )}
      </div>
    </div>
  );
}
