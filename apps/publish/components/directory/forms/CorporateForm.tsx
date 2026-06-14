'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';

export default function CorporateForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const repName = formData.get('repName') as string;
    const companyName = formData.get('companyName') as string;
    const industry = formData.get('industry') as string;
    const teamSize = formData.get('teamSize') as string;
    const needsDescription = formData.get('needsDescription') as string;

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError('You must be logged in to register a corporate department.');
      setLoading(false);
      return;
    }

    try {
      // 1. Update Auth Metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: repName,
          company_name: companyName,
          industry: industry,
          team_size: teamSize,
          corporate_needs: needsDescription,
          is_corporate: true
        }
      });

      if (authError) throw authError;

      // 2. Update Database Profiles Row
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: `${repName} (${companyName})`,
          role: 'client' // Corporate departments operate as clients searching/hiring lawyers
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-10 space-y-4">
        <div className="text-5xl">💼</div>
        <h3 className="text-xl font-bold tracking-tight">Corporate Profile Initialized</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Your Corporate Legal Department profile is now active. You can post specific requirements and broadcast briefs directly to our directory&apos;s vetted counsel.
        </p>
        <Button onClick={() => window.location.href = '/dashboard'} className="mt-4">
          Go to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Field>
          <FieldLabel htmlFor="repName" className="text-xs uppercase tracking-wider text-accent font-bold">Representative Name</FieldLabel>
          <Input name="repName" id="repName" placeholder="e.g. Tobi Adebowale" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="companyName" className="text-xs uppercase tracking-wider text-accent font-bold">Company / Organization Name</FieldLabel>
          <Input name="companyName" id="companyName" placeholder="e.g. Tetracore Energy Group" required />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Field>
          <FieldLabel htmlFor="industry" className="text-xs uppercase tracking-wider text-accent font-bold">Industry Sector</FieldLabel>
          <Input name="industry" id="industry" placeholder="e.g. Energy & Infrastructure" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="teamSize" className="text-xs uppercase tracking-wider text-accent font-bold">Legal Team Size</FieldLabel>
          <select 
            name="teamSize" 
            id="teamSize"
            className="flex h-9 w-full rounded-md border border-input bg-background/50 px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground disabled:pointer-events-none disabled:opacity-50 md:text-sm dark:bg-input/30 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <option value="1-5" className="bg-background text-foreground">1 - 5 Lawyers</option>
            <option value="6-20" className="bg-background text-foreground">6 - 20 Lawyers</option>
            <option value="21-50" className="bg-background text-foreground">21 - 50 Lawyers</option>
            <option value="50+" className="bg-background text-foreground">50+ Lawyers</option>
          </select>
        </Field>
      </div>

      <Field>
        <FieldLabel htmlFor="needsDescription" className="text-xs uppercase tracking-wider text-accent font-bold">Primary Legal Support Requirements</FieldLabel>
        <textarea 
          name="needsDescription" 
          id="needsDescription" 
          rows={4} 
          placeholder="Describe the types of legal counsel, advice, or contracts your department typically manages or seeks external help with..." 
          required 
          className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />
      </Field>

      {error && <p className="text-sm text-destructive font-medium">{error}</p>}

      <Button type="submit" disabled={loading} className="w-full glow-primary">
        {loading ? 'Activating Corporate Profile...' : 'Activate Corporate Profile'}
      </Button>
    </form>
  );
}
