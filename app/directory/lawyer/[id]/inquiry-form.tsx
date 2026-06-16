'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { submitInquiry } from '@/app/directory/actions/inquiries';

export default function InquiryForm({ lawyerId }: { lawyerId: string }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  const mutation = useMutation({
    mutationFn: () => submitInquiry({ lawyerId, name, email, phone: phone || undefined, message }),
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
        <p className="text-sm font-semibold text-emerald-600">Message sent!</p>
        <p className="text-xs text-muted-foreground">The lawyer will respond within 24 hours.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="text"
        placeholder="Your Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        className="w-full px-3 py-2 rounded-lg bg-muted/20 border border-border/40 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-[#a77c5c]"
      />
      <input
        type="email"
        placeholder="Your Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="w-full px-3 py-2 rounded-lg bg-muted/20 border border-border/40 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-[#a77c5c]"
      />
      <input
        type="tel"
        placeholder="Phone (optional)"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="w-full px-3 py-2 rounded-lg bg-muted/20 border border-border/40 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-[#a77c5c]"
      />
      <textarea
        placeholder="Describe your legal needs..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        required
        rows={4}
        className="w-full px-3 py-2 rounded-lg bg-muted/20 border border-border/40 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-[#a77c5c] resize-none"
      />

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
        {mutation.isPending ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  );
}
