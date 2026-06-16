'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { submitLawyerListing, type ListingFormData } from '@/app/directory/actions/submit-listing';
import specialtiesData from '@/data/specialties.json';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldLabel, FieldDescription } from '@/components/ui/field';
import { FormSelect } from '@/components/ui/form-select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import StepIndicator from './listing/StepIndicator';
import BulletListEditor from './listing/BulletListEditor';
import ImageUpload from './listing/ImageUpload';
import FaqEditor from './listing/FaqEditor';
import SocialLinksEditor from './listing/SocialLinksEditor';

const STEPS = [
  { label: 'General', description: 'Basic info & specialties' },
  { label: 'Professional', description: 'Credentials & background' },
  { label: 'Media', description: 'Photos & video' },
  { label: 'Extras', description: 'FAQ & social links' },
  { label: 'Contact', description: 'Location & pricing' },
];

const GENDER_OPTIONS = ['Male', 'Female', 'Other'];
const PRICE_OPTIONS = [
  { value: '', label: 'Select Price Range' },
  { value: 'cheap', label: 'Cheap ($)' },
  { value: 'economy', label: 'Economy ($$)' },
  { value: 'moderate', label: 'Moderate ($$$)' },
  { value: 'ultra_high', label: 'Ultra High ($$$$)' },
];
const LISTING_TYPE_OPTIONS = [
  { value: 'general', label: 'General' },
  { value: 'featured', label: 'Featured' },
];

interface FormState {
  name: string;
  role: string;
  location: string;
  email: string;
  phone: string;
  website: string;
  brief_bio: string;
  bio: string;
  age: string;
  gender: string;
  enrollment_number: string;
  enrollment_number_tx: string;
  education: string[];
  organization_memberships: string[];
  publications: string[];
  awards: string[];
  volunteer_pro_bono: string[];
  image_url: string | null;
  intro_video_url: string;
  gallery_images: string[];
  faqs: { question: string; answer: string }[];
  social_links: { platform: string; url: string }[];
  address: string;
  zip_code: string;
  price_range: string;
  hide_contact_form: boolean;
  listing_type: string;
}

const INITIAL_STATE: FormState = {
  name: '', role: '', location: '', email: '', phone: '', website: '',
  brief_bio: '', bio: '',
  age: '', gender: '', enrollment_number: '', enrollment_number_tx: '',
  education: [], organization_memberships: [], publications: [], awards: [], volunteer_pro_bono: [],
  image_url: null, intro_video_url: '', gallery_images: [],
  faqs: [], social_links: [],
  address: '', zip_code: '', price_range: '', hide_contact_form: false, listing_type: 'general',
};



export default function LawyerForm() {
  const supabase = createClient();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const hydrated = useRef(false);

  const { data: existingListing, isLoading: profileLoading } = useQuery({
    queryKey: ['lawyer-listing'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from('lawyers')
        .select('*, lawyer_specialties(specialty_id)')
        .eq('id', user.id)
        .maybeSingle();
      return data as Record<string, unknown> | null;
    },
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (existingListing && !hydrated.current) {
      hydrated.current = true;
      const ls = existingListing as Record<string, unknown>;
      setForm({
        name: (ls.name as string) || '',
        role: (ls.role as string) || '',
        location: (ls.location as string) || '',
        email: (ls.email as string) || '',
        phone: (ls.phone as string) || '',
        website: (ls.website as string) || '',
        brief_bio: (ls.brief_bio as string) || '',
        bio: (ls.bio as string) || '',
        age: (ls.age as string) || '',
        gender: (ls.gender as string) || '',
        enrollment_number: (ls.enrollment_number as string) || '',
        enrollment_number_tx: (ls.enrollment_number_tx as string) || '',
        education: (ls.education as string[]) || [],
        organization_memberships: (ls.organization_memberships as string[]) || [],
        publications: (ls.publications as string[]) || [],
        awards: (ls.awards as string[]) || [],
        volunteer_pro_bono: (ls.volunteer_pro_bono as string[]) || [],
        image_url: (ls.image_url as string) || null,
        intro_video_url: (ls.intro_video_url as string) || '',
        gallery_images: (ls.gallery_images as string[]) || [],
        faqs: (ls.faqs as { question: string; answer: string }[]) || [],
        social_links: (ls.social_links as { platform: string; url: string }[]) || [],
        address: (ls.address as string) || '',
        zip_code: (ls.zip_code as string) || '',
        price_range: (ls.price_range as string) || '',
        hide_contact_form: (ls.hide_contact_form as boolean) || false,
        listing_type: (ls.listing_type as string) || 'general',
      });
      const specs = ls.lawyer_specialties as { specialty_id: string }[] | undefined;
      if (specs) setSelectedSpecialties(specs.map(s => s.specialty_id));
    }
  }, [existingListing]);

  const mutation = useMutation({
    mutationFn: submitLawyerListing,
  });

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSpecialtyChange = (id: string) => {
    setSelectedSpecialties(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const buildPayload = (): ListingFormData => ({
    ...form,
    age: form.age ? parseInt(form.age, 10) : undefined,
    specialties: selectedSpecialties,
  });

  const canProceed = (): boolean => {
    if (step === 0) return form.name.trim().length > 0;
    if (step === 4) return form.email.trim().length > 0 || form.phone.trim().length > 0;
    return true;
  };

  const handleSubmit = async () => {
    mutation.mutate(buildPayload());
  };

  if (profileLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading your profile...</p>
      </div>
    );
  }

  if (mutation.isSuccess) {
    return (
      <div className="text-center py-10 space-y-4">
        <div className="text-5xl">🎓</div>
        <h3 className="text-xl font-bold tracking-tight">Listing Submitted</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Your lawyer listing has been saved and is pending verification.
        </p>
        <Button onClick={() => window.location.href = '/directory/dashboard'} className="mt-4">
          Go to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div>
      <StepIndicator steps={STEPS} currentStep={step} />

      {mutation.isError && (
        <p className="text-sm text-destructive font-medium mb-4">
          {mutation.error instanceof Error ? mutation.error.message : 'Submission failed'}
        </p>
      )}

      {/* Step 0: General Information */}
      {step === 0 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Field>
              <FieldLabel htmlFor="name" className="text-xs uppercase tracking-wider text-accent font-bold">
                Title and Full Name <span className="text-destructive">*</span>
              </FieldLabel>
              <Input name="name" id="name" placeholder="e.g. John Doe, SAN"
                value={form.name} onChange={e => update('name', e.target.value)} required />
            </Field>
            <Field>
              <FieldLabel htmlFor="listing_type" className="text-xs uppercase tracking-wider text-accent font-bold">Listing Type</FieldLabel>
              <FormSelect name="listing_type" id="listing_type"
                value={form.listing_type} onChange={e => update('listing_type', e.target.value)}>
                {LISTING_TYPE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value} className="bg-background">{o.label}</option>
                ))}
              </FormSelect>
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="brief_bio" className="text-xs uppercase tracking-wider text-accent font-bold">Brief Description</FieldLabel>
            <div className="relative">
              <Textarea name="brief_bio" id="brief_bio" rows={3} maxLength={350}
                placeholder="Brief overview of your practice (max 350 characters)"
                value={form.brief_bio} onChange={e => update('brief_bio', e.target.value)} />
              <span className="absolute bottom-2 right-3 text-xs text-muted-foreground">{form.brief_bio.length}/350</span>
            </div>
          </Field>

          <Field>
            <FieldLabel htmlFor="bio" className="text-xs uppercase tracking-wider text-accent font-bold">Detailed Description</FieldLabel>
            <div className="relative">
              <Textarea name="bio" id="bio" rows={6} maxLength={1500}
                placeholder="Detailed profile of your legal practice (max 1500 characters)"
                value={form.bio} onChange={e => update('bio', e.target.value)} />
              <span className="absolute bottom-2 right-3 text-xs text-muted-foreground">{form.bio.length}/1500</span>
            </div>
          </Field>

          <Field>
            <FieldLabel className="text-xs uppercase tracking-wider text-accent font-bold">Areas of Expertise</FieldLabel>
            <FieldDescription className="text-xs text-muted-foreground/75 mb-2">
              Select all that apply to your practice.
            </FieldDescription>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[220px] overflow-y-auto p-4 bg-muted/20 border border-border/30 rounded-lg">
              {specialtiesData.map(s => (
                <label key={s.id} className="flex items-center gap-2.5 text-sm cursor-pointer select-none py-1 hover:text-foreground text-muted-foreground transition-colors">
                  <Checkbox checked={selectedSpecialties.includes(s.id)} onCheckedChange={() => handleSpecialtyChange(s.id)} />
                  <span>{s.name}</span>
                </label>
              ))}
            </div>
          </Field>
        </div>
      )}

      {/* Step 1: Professional Details */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Field>
              <FieldLabel htmlFor="age" className="text-xs uppercase tracking-wider text-accent font-bold">Age</FieldLabel>
              <Input type="number" name="age" id="age" placeholder="e.g. 30"
                value={form.age} onChange={e => update('age', e.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor="gender" className="text-xs uppercase tracking-wider text-accent font-bold">Gender</FieldLabel>
              <FormSelect name="gender" id="gender"
                value={form.gender} onChange={e => update('gender', e.target.value)}>
                <option value="" className="bg-background">Select</option>
                {GENDER_OPTIONS.map(g => (
                  <option key={g} value={g} className="bg-background">{g}</option>
                ))}
              </FormSelect>
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Field>
              <FieldLabel htmlFor="enrollment_number" className="text-xs uppercase tracking-wider text-accent font-bold">
                Enrollment Number <span className="text-destructive">*</span>
              </FieldLabel>
              <Input name="enrollment_number" id="enrollment_number" placeholder="e.g. 12345" required
                value={form.enrollment_number} onChange={e => update('enrollment_number', e.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor="enrollment_number_tx" className="text-xs uppercase tracking-wider text-accent font-bold">
                Enrollment Number (Tx) <span className="text-destructive">*</span>
              </FieldLabel>
              <Input name="enrollment_number_tx" id="enrollment_number_tx" placeholder="Tx" required
                value={form.enrollment_number_tx} onChange={e => update('enrollment_number_tx', e.target.value)} />
            </Field>
          </div>

          <BulletListEditor label="Education" value={form.education} onChange={v => update('education', v)}
            placeholder="e.g. University of Ibadan, Nigeria (2023)&#10;Nigerian Law School, B.L. (2024)" required />

          <BulletListEditor label="Organization Memberships" value={form.organization_memberships} onChange={v => update('organization_memberships', v)}
            placeholder="e.g. Nigerian Bar Association (2020-present)&#10;International Bar Association" required />

          <BulletListEditor label="Publications" value={form.publications} onChange={v => update('publications', v)}
            placeholder="e.g. 'Legal Tech in Nigeria' — Journal of Law & Technology (2024)" />

          <BulletListEditor label="Awards and Recognitions" value={form.awards} onChange={v => update('awards', v)}
            placeholder="e.g. Best Tech Lawyer of the Year 2023 (NBA Awards)" />

          <BulletListEditor label="Volunteer / Pro Bono" value={form.volunteer_pro_bono} onChange={v => update('volunteer_pro_bono', v)}
            placeholder="e.g. Legal aid for displaced persons (2023)" />
        </div>
      )}

      {/* Step 2: Media & Chamber */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Field>
              <FieldLabel htmlFor="role" className="text-xs uppercase tracking-wider text-accent font-bold">
                Professional Role / Title <span className="text-destructive">*</span>
              </FieldLabel>
              <Input name="role" id="role" placeholder="e.g. Senior Advocate of Nigeria (SAN)"
                value={form.role} onChange={e => update('role', e.target.value)} required />
            </Field>
            <Field>
              <FieldLabel htmlFor="location" className="text-xs uppercase tracking-wider text-accent font-bold">Primary Location</FieldLabel>
              <Input name="location" id="location" placeholder="e.g. Ikoyi, Lagos"
                value={form.location} onChange={e => update('location', e.target.value)} />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <ImageUpload label="Profile Picture" value={form.image_url} onChange={v => update('image_url', v)} />
            <Field>
              <FieldLabel htmlFor="intro_video_url" className="text-xs uppercase tracking-wider text-accent font-bold">Introductory Video</FieldLabel>
              <Input type="url" name="intro_video_url" id="intro_video_url" placeholder="YouTube or Vimeo URL"
                value={form.intro_video_url} onChange={e => update('intro_video_url', e.target.value)} />
              <p className="text-xs text-muted-foreground mt-1">YouTube & Vimeo URLs only.</p>
            </Field>
          </div>
        </div>
      )}

      {/* Step 3: FAQ & Social */}
      {step === 3 && (
        <div className="space-y-8">
          <FaqEditor items={form.faqs} onChange={v => update('faqs', v)} />
          <SocialLinksEditor items={form.social_links} onChange={v => update('social_links', v)} />
        </div>
      )}

      {/* Step 4: Contact & Location */}
      {step === 4 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Field>
              <FieldLabel htmlFor="phone" className="text-xs uppercase tracking-wider text-accent font-bold">
                Phone Number <span className="text-destructive">*</span>
              </FieldLabel>
              <Input type="tel" name="phone" id="phone" placeholder="e.g. +234 803 123 4567" required
                value={form.phone} onChange={e => update('phone', e.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor="email" className="text-xs uppercase tracking-wider text-accent font-bold">
                Email Address <span className="text-destructive">*</span>
              </FieldLabel>
              <Input type="email" name="email" id="email" placeholder="john@example.com" required
                value={form.email} onChange={e => update('email', e.target.value)} />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Field>
              <FieldLabel htmlFor="address" className="text-xs uppercase tracking-wider text-accent font-bold">
                Address <span className="text-destructive">*</span>
              </FieldLabel>
              <Input name="address" id="address" placeholder="e.g. 123 Marina, Lagos" required
                value={form.address} onChange={e => update('address', e.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor="zip_code" className="text-xs uppercase tracking-wider text-accent font-bold">Zip/Post Code</FieldLabel>
              <Input name="zip_code" id="zip_code" placeholder="e.g. 200211"
                value={form.zip_code} onChange={e => update('zip_code', e.target.value)} />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Field>
              <FieldLabel htmlFor="website" className="text-xs uppercase tracking-wider text-accent font-bold">Website</FieldLabel>
              <Input type="url" name="website" id="website" placeholder="https://example.com"
                value={form.website} onChange={e => update('website', e.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor="price_range" className="text-xs uppercase tracking-wider text-accent font-bold">Price Range</FieldLabel>
              <FormSelect name="price_range" id="price_range"
                value={form.price_range} onChange={e => update('price_range', e.target.value)}>
                {PRICE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value} className="bg-background">{o.label}</option>
                ))}
              </FormSelect>
            </Field>
          </div>

          <label className="flex items-center gap-2.5 text-sm cursor-pointer">
            <input type="checkbox" checked={form.hide_contact_form}
              onChange={e => update('hide_contact_form', e.target.checked)}
              className="rounded border-border text-accent focus-visible:ring-accent/20" />
            <span className="text-muted-foreground">Hide contact owner form on listing page</span>
          </label>
        </div>
      )}

      {/* Navigation */}
      <div className={cn('flex items-center justify-between mt-8 pt-6 border-t border-border/40', step === 0 && 'justify-end')}>
        {step > 0 && (
          <Button type="button" variant="outline" onClick={() => setStep(s => s - 1)}>
            ← Back
          </Button>
        )}
        {step < STEPS.length - 1 ? (
          <Button type="button" disabled={!canProceed()} onClick={() => setStep(s => s + 1)}>
            Continue →
          </Button>
        ) : (
          <Button type="button" disabled={mutation.isPending || !canProceed()} onClick={handleSubmit} className="glow-primary">
            {mutation.isPending ? 'Submitting...' : 'Save & Preview'}
          </Button>
        )}
      </div>
    </div>
  );
}
