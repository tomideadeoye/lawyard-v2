'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TERMS } from '@/lib/constants';
import { createClient } from '@/lib/supabase/client';
import { galleryCapFor, isPaidTier } from '@/lib/directory/publishing';
import FaqEditor from '@/components/directory/forms/listing/FaqEditor';
import GalleryUpload from '@/components/directory/forms/listing/GalleryUpload';
import WorkingHoursEditor from '@/components/directory/forms/listing/WorkingHoursEditor';
import IntroVideoField from '@/components/directory/forms/listing/IntroVideoField';

interface FormState {
  name: string;
  location: string;
  focus: string;
  description: string;
  email: string;
  phone: string;
  website: string;
  working_hours: { day: string; hours: string }[];
  faqs: { question: string; answer: string }[];
  gallery_images: string[];
  intro_video_url: string;
}

export default function ChamberForm({ initial }: { initial: ChamberData | null }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    name: initial?.name || '',
    location: initial?.location || '',
    focus: initial?.focus || '',
    description: initial?.description || '',
    email: initial?.email || '',
    phone: initial?.phone || '',
    website: initial?.website || '',
    working_hours: initial?.working_hours || [],
    faqs: initial?.faqs || [],
    gallery_images: initial?.gallery_images || [],
    intro_video_url: initial?.intro_video_url || '',
  });
  const [saving, setSaving] = useState(false);

  const isPremium = isPaidTier(initial?.subscription_tier);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const payload = { ...form, user_id: user.id };

    if (initial?.id) {
      await supabase.from('chambers').update(payload).eq('id', initial.id);
    } else {
      const { data: created } = await supabase
        .from('chambers')
        .insert(payload)
        .select('id')
        .single();
      // Register the creator as owner-admin so multiple admins can manage later.
      if (created?.id) {
        await supabase.from('chamber_admins').insert({
          chamber_id: created.id,
          user_id: user.id,
          role: 'owner',
        });
      }
    }

    setSaving(false);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      <Field label={`${TERMS.firm.singular} Name`}>
        <input value={form.name} onChange={e => update('name', e.target.value)} required className={inputClass} />
      </Field>

      <Field label="Location">
        <input value={form.location} onChange={e => update('location', e.target.value)} className={inputClass} />
      </Field>

      <Field label="Focus Areas">
        <input value={form.focus} onChange={e => update('focus', e.target.value)} placeholder="e.g. Corporate, Energy & Dispute Resolution" className={inputClass} />
      </Field>

      <Field label="Description">
        <textarea value={form.description} onChange={e => update('description', e.target.value)} rows={4} className={`${inputClass} resize-y`} />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="Email">
          <input type="email" value={form.email} onChange={e => update('email', e.target.value)} className={inputClass} />
        </Field>
        <Field label="Phone">
          <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} className={inputClass} />
        </Field>
        <Field label="Website">
          <input type="url" value={form.website} onChange={e => update('website', e.target.value)} className={inputClass} />
        </Field>
      </div>

      <WorkingHoursEditor value={form.working_hours} onChange={v => update('working_hours', v)} />

      <FaqEditor items={form.faqs} onChange={v => update('faqs', v)} />

      <GalleryUpload
        value={form.gallery_images}
        onChange={v => update('gallery_images', v)}
        maxImages={galleryCapFor(initial?.subscription_tier, true)}
      />

      <IntroVideoField
        value={form.intro_video_url}
        onChange={v => update('intro_video_url', v)}
        isPremium={isPremium}
      />

      <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-lg bg-[#a77c5c] hover:bg-[#906b4e] disabled:opacity-50 text-white text-xs font-bold transition-colors">
        {saving ? 'Saving...' : initial?.id ? `Update ${TERMS.firm.singular}` : `Create ${TERMS.firm.singular}`}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wider text-[#a77c5c] font-bold">{label}</label>
      {children}
    </div>
  );
}

const inputClass = "w-full mt-1 px-3 py-2 rounded-lg bg-muted/20 border border-border/40 text-sm focus:outline-none focus:ring-1 focus:ring-[#a77c5c]";

interface ChamberData {
  id?: string;
  name: string;
  location?: string;
  focus?: string;
  description?: string;
  email?: string;
  phone?: string;
  website?: string;
  image_url?: string;
  subscription_tier?: string;
  working_hours?: { day: string; hours: string }[];
  faqs?: { question: string; answer: string }[];
  gallery_images?: string[];
  intro_video_url?: string;
}
