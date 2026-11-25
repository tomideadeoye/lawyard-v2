import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { loadThreadByToken } from '@/lib/directory/inquiry-server';
import { loadLawyerThreadByToken } from '@/lib/directory/lawyer-inquiry-server';
import ClientReplyForm from './reply-form';

// The token is the credential, so this page must never be indexed or shared.
export const metadata: Metadata = {
  title: 'Your conversation',
  robots: { index: false, follow: false, nocache: true },
};

function when(value: string) {
  return new Date(value).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface ViewMessage {
  id: string;
  mine: boolean;
  body: string;
  created_at: string;
}

export default async function InquiryThreadPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // One link shape for both kinds of provider.
  const chamberThread = await loadThreadByToken(token);
  const lawyerThread = chamberThread ? null : await loadLawyerThreadByToken(token);
  if (!chamberThread && !lawyerThread) notFound();

  const providerName = chamberThread ? chamberThread.firmName : lawyerThread!.lawyerName;
  const kind = chamberThread ? 'chamber' : 'lawyer';
  const messages: ViewMessage[] = (chamberThread?.messages ?? lawyerThread!.messages).map(
    (message) => ({
      id: message.id,
      mine: message.sender === 'client',
      body: message.body,
      created_at: message.created_at,
    })
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#a77c5c]">
          Conversation on Lawyard
        </p>
        <h1 className="mt-1 text-2xl font-black tracking-tight">{providerName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Keep this page — it is how the conversation continues. Your contact details are not shown
          unless you write them into a message.
        </p>
      </div>

      <div className="rounded-2xl border border-border/40 bg-card/40">
        <div className="space-y-3 border-b border-border/30 px-5 py-5">
          {messages.map((message) => (
            <div
              key={message.id}
              className={message.mine ? 'flex justify-end' : 'flex justify-start'}
            >
              <div
                className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm ${
                  message.mine ? 'bg-[#a77c5c] text-white' : 'bg-muted/30 text-foreground'
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{message.body}</p>
                <p
                  className={`mt-1 text-[10px] ${
                    message.mine ? 'text-white/60' : 'text-muted-foreground/60'
                  }`}
                >
                  {message.mine ? 'You' : providerName} · {when(message.created_at)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <ClientReplyForm token={token} kind={kind} />
      </div>

      <p className="mt-4 text-center text-[11px] text-muted-foreground/60">
        Anyone with this link can read this conversation. Don&rsquo;t forward it.
      </p>
    </div>
  );
}
