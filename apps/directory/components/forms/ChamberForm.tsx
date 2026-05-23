'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@repo/ui/components/input';
import { Button } from '@repo/ui/components/button';
import { Field, FieldLabel } from '@repo/ui/components/field';

export default function ChamberForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const location = formData.get('location') as string;
    const focus = formData.get('focus') as string;
    const imageUrl = formData.get('imageUrl') as string || null;

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError('You must be logged in to register an institution/chamber.');
      setLoading(false);
      return;
    }

    try {
      // 1. Insert Chamber
      const { data: chamberData, error: chamberError } = await supabase
        .from('chambers')
        .insert({
          name,
          location,
          focus,
          image_url: imageUrl,
        })
        .select()
        .single();

      if (chamberError) throw chamberError;

      // 2. Associate current user (if they have a lawyer profile) with this chamber
      if (chamberData) {
        // Check if a lawyer profile exists for the current user
        const { data: lawyerProfile } = await supabase
          .from('lawyers')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();

        if (lawyerProfile) {
          // Update the existing lawyer profile to link to the new chamber
          await supabase
            .from('lawyers')
            .update({ chamber_id: chamberData.id })
            .eq('id', user.id);
        } else {
          // If no lawyer profile exists, let's create a stub so they are associated
          // Get the user's name from profiles
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .maybeSingle();

          await supabase
            .from('lawyers')
            .insert({
              id: user.id,
              name: userProfile?.full_name || user.email || 'Anonymous Practitioner',
              chamber_id: chamberData.id,
              verification_status: 'pending',
            });
        }

        // Ensure user profile role is set to 'lawyer'
        await supabase
          .from('profiles')
          .update({ role: 'lawyer' })
          .eq('id', user.id);
      }

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
        <div className="text-5xl">🏛️</div>
        <h3 className="text-xl font-bold tracking-tight">Institution Registered</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Your chamber/firm has been registered. You have been designated as a legal professional within this institution.
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
        <FieldLabel htmlFor="name" className="text-xs uppercase tracking-wider text-accent font-bold">Chamber / Law Firm Name</FieldLabel>
        <Input name="name" id="name" placeholder="e.g. Aluko & Oyebode" required />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Field>
          <FieldLabel htmlFor="location" className="text-xs uppercase tracking-wider text-accent font-bold">Headquarters Location</FieldLabel>
          <Input name="location" id="location" placeholder="e.g. Lagos, Nigeria" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="focus" className="text-xs uppercase tracking-wider text-accent font-bold">Primary Practice Focus</FieldLabel>
          <Input name="focus" id="focus" placeholder="e.g. Corporate Finance & Dispute Resolution" required />
        </Field>
      </div>

      <Field>
        <FieldLabel htmlFor="imageUrl" className="text-xs uppercase tracking-wider text-accent font-bold">Chamber Logo/Banner Image URL</FieldLabel>
        <Input type="url" name="imageUrl" id="imageUrl" placeholder="e.g. https://lawyard.org/images/logo.png" />
      </Field>

      {error && <p className="text-sm text-destructive font-medium">{error}</p>}

      <Button type="submit" disabled={loading} className="w-full glow-primary">
        {loading ? 'Registering Institution...' : 'Register Chamber / Firm'}
      </Button>
    </form>
  );
}
