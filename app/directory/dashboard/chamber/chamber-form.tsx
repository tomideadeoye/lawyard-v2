'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface FormState {
  name: string;
  location: string;
  focus: string;
  description: string;
  email: string;
  phone: string;
  website: string;
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
  });
  const [saving, setSaving] = useState(false);

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
      await supabase.from('chambers').insert(payload);
    }

    setSaving(false);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      <Field label="Chamber Name">
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

      <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-lg bg-[#a77c5c] hover:bg-[#906b4e] disabled:opacity-50 text-white text-xs font-bold transition-colors">
        {saving ? 'Saving...' : initial?.id ? 'Update Chamber' : 'Create Chamber'}
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
}
