'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import specialtiesData from '@/data/specialties.json';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel, FieldDescription } from '@/components/ui/field';
import { Checkbox } from '@/components/ui/checkbox';

export default function LawyerForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);

  const handleSpecialtyChange = (specialtyId: string) => {
    setSelectedSpecialties(prev => 
      prev.includes(specialtyId) 
        ? prev.filter(id => id !== specialtyId) 
        : [...prev, specialtyId]
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const role = formData.get('role') as string;
    const location = formData.get('location') as string;
    const bio = formData.get('bio') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const website = formData.get('website') as string;
    
    // Parse semicolon separated lists to arrays
    const educationStr = formData.get('education') as string;
    const experienceStr = formData.get('experience') as string;
    const achievementsStr = formData.get('achievements') as string;

    const education = educationStr ? educationStr.split(';').map(s => s.trim()).filter(Boolean) : [];
    const experience = experienceStr ? experienceStr.split(';').map(s => s.trim()).filter(Boolean) : [];
    const achievements = achievementsStr ? achievementsStr.split(';').map(s => s.trim()).filter(Boolean) : [];

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError('You must be logged in to create a lawyer listing.');
      setLoading(false);
      return;
    }

    try {
      // 1. Insert or Upsert Lawyer Profile
      const { error: lawyerError } = await supabase
        .from('lawyers')
        .upsert({
          id: user.id, // Linking 1-to-1 with auth user profile
          name,
          role,
          location,
          bio,
          email,
          phone,
          website,
          education,
          experience,
          achievements,
          verification_status: 'pending',
        });

      if (lawyerError) throw lawyerError;

      // 2. Clear old specialties for this lawyer
      await supabase
        .from('lawyer_specialties')
        .delete()
        .eq('lawyer_id', user.id);

      // 3. Insert newly selected specialties
      if (selectedSpecialties.length > 0) {
        const specialtiesToInsert = selectedSpecialties.map(specialtyId => ({
          lawyer_id: user.id,
          specialty_id: specialtyId,
        }));

        const { error: specError } = await supabase
          .from('lawyer_specialties')
          .insert(specialtiesToInsert);

        if (specError) throw specError;
      }

      // 4. Update role in profiles to 'lawyer'
      await supabase
        .from('profiles')
        .update({ role: 'lawyer' })
        .eq('id', user.id);

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
        <div className="text-5xl">🎓</div>
        <h3 className="text-xl font-bold tracking-tight">Professional Profile Submitted</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Your lawyer listing has been saved and is currently under verification. Our administrative panel will review your credentials shortly.
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
          <FieldLabel htmlFor="name" className="text-xs uppercase tracking-wider text-accent font-bold">Full Name</FieldLabel>
          <Input name="name" id="name" placeholder="e.g. John Doe" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="role" className="text-xs uppercase tracking-wider text-accent font-bold">Professional Role / Title</FieldLabel>
          <Input name="role" id="role" placeholder="e.g. Senior Advocate of Nigeria (SAN) / Partner" required />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Field>
          <FieldLabel htmlFor="email" className="text-xs uppercase tracking-wider text-accent font-bold">Public Contact Email</FieldLabel>
          <Input type="email" name="email" id="email" placeholder="john@doe.com" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="phone" className="text-xs uppercase tracking-wider text-accent font-bold">Phone Number</FieldLabel>
          <Input type="tel" name="phone" id="phone" placeholder="e.g. +234 803 123 4567" />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Field>
          <FieldLabel htmlFor="location" className="text-xs uppercase tracking-wider text-accent font-bold">Primary Location</FieldLabel>
          <Input name="location" id="location" placeholder="e.g. Ikoyi, Lagos" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="website" className="text-xs uppercase tracking-wider text-accent font-bold">Website / Portfolio Link</FieldLabel>
          <Input type="url" name="website" id="website" placeholder="e.g. https://john-doe-law.com" />
        </Field>
      </div>

      <Field>
        <FieldLabel htmlFor="bio" className="text-xs uppercase tracking-wider text-accent font-bold">Professional Profile Bio</FieldLabel>
        <textarea 
          name="bio" 
          id="bio" 
          rows={5} 
          placeholder="Describe your legal practice, achievements, and focus..." 
          required 
          className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />
      </Field>

      <Field>
        <FieldLabel className="text-xs uppercase tracking-wider text-accent font-bold">Areas of Specialty</FieldLabel>
        <FieldDescription className="text-xs text-muted-foreground/75 mb-2">Select all legal practice areas that apply to your profile.</FieldDescription>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[220px] overflow-y-auto p-4 bg-muted/20 border border-border/30 rounded-lg">
          {specialtiesData.map(s => (
            <label key={s.id} className="flex items-center gap-2.5 text-sm cursor-pointer select-none py-1 hover:text-foreground text-muted-foreground transition-colors">
              <Checkbox 
                checked={selectedSpecialties.includes(s.id)}
                onCheckedChange={() => handleSpecialtyChange(s.id)}
              />
              <span>{s.name}</span>
            </label>
          ))}
        </div>
      </Field>

      <Field>
        <FieldLabel htmlFor="education" className="text-xs uppercase tracking-wider text-accent font-bold">Education (Separate with semicolons)</FieldLabel>
        <Input name="education" id="education" placeholder="e.g. Nigerian Law School, B.L.; University of Lagos, LL.B" />
      </Field>

      <Field>
        <FieldLabel htmlFor="experience" className="text-xs uppercase tracking-wider text-accent font-bold">Notable Experience (Separate with semicolons)</FieldLabel>
        <Input name="experience" id="experience" placeholder="e.g. Partner at Elite Law Firm (2018-Present); Associate at Doe & Partners (2014-2018)" />
      </Field>

      <Field>
        <FieldLabel htmlFor="achievements" className="text-xs uppercase tracking-wider text-accent font-bold">Key Achievements (Separate with semicolons)</FieldLabel>
        <Input name="achievements" id="achievements" placeholder="e.g. Lead Counsel on $50M energy project; Vetted by Legal500 EMEA" />
      </Field>

      {error && <p className="text-sm text-destructive font-medium">{error}</p>}

      <Button type="submit" disabled={loading} className="w-full glow-primary">
        {loading ? 'Submitting Details...' : 'Register Professional Profile'}
      </Button>
    </form>
  );
}
