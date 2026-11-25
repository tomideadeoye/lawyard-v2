'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { submitChamberInquiry } from '@/app/directory/actions/chamber-inquiries';

// Guest-open on purpose: a firm page can be live with no email, phone or
// website, and this form is then the only way to reach the firm. Requiring an
// account here would put a signup wall in front of the page's one action.

export default function ChamberInquiryForm({
  chamberId,
  firmName,
}: {
  chamberId: string;
  firmName: string;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [company, setCompany] = useState(''); // honeypot

  const mutation = useMutation({
    mutationFn: () =>
      submitChamberInquiry({
        chamberId,
        name,
        email,
        phone: phone || undefined,
        message,
        company: company || undefined,
      }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;
    mutation.mutate();
  };

  if (mutation.isSuccess) {
    return (
      <div className="text-center py-6 space-y-2">
        <div className="text-2xl">✓</div>
        <p className="text-sm font-semibold text-emerald-600">Message sent</p>
        <p className="text-xs text-muted-foreground">We&rsquo;ve passed it to {firmName}.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="text"
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        autoComplete="name"
        className={inputClass}
      />
      <input
        type="email"
        placeholder="Your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="email"
        className={inputClass}
      />
      <input
        type="tel"
        placeholder="Phone (optional)"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        autoComplete="tel"
        className={inputClass}
      />
      <textarea
        placeholder="What do you need help with?"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        required
        rows={4}
        maxLength={2000}
        className={`${inputClass} resize-none`}
      />

      {/* Honeypot: visually hidden and not focusable, so only bots fill it. */}
      <div className="hidden" aria-hidden="true">
        <label>
          Company
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
        </label>
      </div>

      {mutation.isError && (
        <p className="text-xs text-destructive font-medium">
          {mutation.error instanceof Error ? mutation.error.message : 'Failed to send. Try again.'}
        </p>
      )}

      <button
        type="submit"
        disabled={mutation.isPending}
        className="w-full px-4 py-2.5 rounded-lg bg-[#a77c5c] hover:bg-[#906b4e] disabled:opacity-50 text-white text-xs font-bold transition-colors"
      >
        {mutation.isPending ? 'Sending…' : 'Send message'}
      </button>

      <p className="text-[10px] text-muted-foreground/50 text-center">
        Keep email addresses and phone numbers out of the message — the thread stays here.
        By sending, you agree to our Privacy Policy.
      </p>
    </form>
  );
}

const inputClass =
  'w-full px-3 py-2 rounded-lg bg-muted/20 border border-border/40 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-[#a77c5c]';
