'use client';

import { useState, useTransition } from 'react';
import { replyAsClient } from '@/app/directory/actions/chamber-inquiries';
import { replyAsLawyerClient } from '@/app/directory/actions/inquiries';

export default function ClientReplyForm({
  token,
  kind,
}: {
  token: string;
  kind: 'chamber' | 'lawyer';
}) {
  const [body, setBody] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const send = () => {
    if (body.trim().length < 2) return;
    setError(null);
    startTransition(async () => {
      try {
        if (kind === 'chamber') {
          await replyAsClient(token, body);
        } else {
          await replyAsLawyerClient(token, body);
        }
        setBody('');
        // The server renders the thread; a reload picks up the new message.
        window.location.reload();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Message could not be sent.');
      }
    });
  };

  return (
    <div className="p-4">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        maxLength={4000}
        placeholder="Write a reply…"
        className="w-full resize-none rounded-lg border border-border/40 bg-muted/20 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#a77c5c]"
      />
      {error && <p className="mt-1 text-xs font-medium text-destructive">{error}</p>}
      <p className="mt-1 text-[10px] text-muted-foreground/60">
        Email addresses and phone numbers are blocked — keep the conversation here.
      </p>
      <div className="mt-2 flex justify-end">
        <button
          type="button"
          onClick={send}
          disabled={pending || body.trim().length < 2}
          className="rounded-lg bg-[#a77c5c] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#906b4e] disabled:opacity-50"
        >
          {pending ? 'Sending…' : 'Send'}
        </button>
      </div>
    </div>
  );
}
