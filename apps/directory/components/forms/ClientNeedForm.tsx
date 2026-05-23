'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@repo/ui/components/input';
import { Button } from '@repo/ui/components/button';
import { Field, FieldLabel } from '@repo/ui/components/field';

export default function ClientNeedForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const location = formData.get('location') as string;
    const budget = formData.get('budget') as string;

    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('You must be logged in to post a requirement.');
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase
      .from('client_needs')
      .insert({
        user_id: user.id,
        title,
        description,
        location,
        budget_range: budget,
        status: 'open'
      });

    if (insertError) {
      console.error(insertError);
      setError(insertError.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="text-center py-10 space-y-4">
        <div className="text-5xl">✅</div>
        <h3 className="text-xl font-bold tracking-tight">Requirement Posted Successfully</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Your legal need has been broadcast to the directory&apos;s vetted experts. You will receive notifications as they respond.
        </p>
        <Button onClick={() => window.location.href = '/dashboard'} className="mt-4">
          Go to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <Field>
        <FieldLabel htmlFor="title" className="text-xs uppercase tracking-wider text-accent font-bold">
          Reason for consultation (Subject)
        </FieldLabel>
        <Input name="title" id="title" placeholder="e.g. Intellectual Property Dispute in Lagos" required />
      </Field>

      <Field>
        <FieldLabel htmlFor="description" className="text-xs uppercase tracking-wider text-accent font-bold">
          Detailed Description
        </FieldLabel>
        <textarea 
          name="description" 
          id="description" 
          rows={5} 
          placeholder="Describe your legal situation in detail..." 
          required 
          className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Field>
          <FieldLabel htmlFor="location" className="text-xs uppercase tracking-wider text-accent font-bold">
            Location
          </FieldLabel>
          <Input name="location" id="location" placeholder="e.g. Lagos, Nigeria" />
        </Field>
        <Field>
          <FieldLabel htmlFor="budget" className="text-xs uppercase tracking-wider text-accent font-bold">
            Budget Range
          </FieldLabel>
          <select 
            name="budget" 
            id="budget"
            className="flex h-9 w-full rounded-md border border-input bg-background/50 px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground disabled:pointer-events-none disabled:opacity-50 md:text-sm dark:bg-input/30 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <option value="flexible" className="bg-background text-foreground">Flexible / Negotiable</option>
            <option value="low" className="bg-background text-foreground">Under $500</option>
            <option value="medium" className="bg-background text-foreground">$500 - $2,500</option>
            <option value="high" className="bg-background text-foreground">$2,500 - $10,000</option>
            <option value="premium" className="bg-background text-foreground">$10,000+</option>
          </select>
        </Field>
      </div>

      {error && <p className="text-sm text-destructive font-medium">{error}</p>}

      <Button type="submit" disabled={loading} className="w-full glow-primary">
        {loading ? 'Processing...' : 'Broadcast Requirement'}
      </Button>
    </form>
  );
}
