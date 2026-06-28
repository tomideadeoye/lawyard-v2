'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { RichTextEditor } from '@/components/brand-press/rich-text-editor';
import CategoryMultiselect from './CategoryMultiselect';
import { publishArticle } from '@/app/directory/actions/content';
import { uploadArticleImage } from '@/app/directory/actions/upload-article-image';

interface FormState {
  title: string;
  slug: string;
  isCustomSlug: boolean;
  content: string;
  excerpt: string;
  headerImage: string | null;
  categories: string[];
  scheduledDate: string;
}

const INITIAL_STATE: FormState = {
  title: '',
  slug: '',
  isCustomSlug: false,
  content: '',
  excerpt: '',
  headerImage: null,
  categories: ['general-practice'],
  scheduledDate: '',
};

function generateSlug(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function PublishArticleForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.set('title', form.title);
      formData.set('slug', form.slug);
      formData.set('content', form.content);
      formData.set('excerpt', form.excerpt || form.content.substring(0, 160).replace(/<[^>]*>/g, '') + '...');
      formData.set('category', JSON.stringify(form.categories));
      if (form.scheduledDate) formData.set('scheduled_date', form.scheduledDate);
      if (form.headerImage) formData.set('featured_image', form.headerImage);
      const result = await publishArticle(formData);
      if ('error' in result) throw new Error(result.error as string);
      return result;
    },
    onSuccess: () => {
      router.push('/directory/dashboard');
    },
  });

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    update('title', val);
    if (!form.isCustomSlug) {
      update('slug', generateSlug(val));
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    update('slug', e.target.value);
    update('isCustomSlug', true);
  };

  const handleHeaderImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('File must be an image');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be under 2MB');
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', file);

    const res = await uploadArticleImage(formData);
    if (res.error) {
      setError(res.error);
    } else if (res.imageUrl) {
      update('headerImage', res.imageUrl);
    }
    setUploading(false);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!form.content.trim()) {
      setError('Article content is required');
      return;
    }

    mutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Header Image */}
      <div className="space-y-2">
        <FieldLabel className="text-xs uppercase tracking-wider text-[#a77c5c] font-bold">
          Header Image
        </FieldLabel>
        <div
          onClick={() => fileInputRef.current?.click()}
          className="relative rounded-xl border-2 border-dashed border-border/60 hover:border-[#a77c5c]/40 transition-colors cursor-pointer overflow-hidden bg-muted/20 min-h-[160px] flex items-center justify-center group"
        >
          {form.headerImage ? (
            <>
              <img src={form.headerImage} alt="Header" className="w-full h-full object-cover absolute inset-0" />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); update('headerImage', null); }}
                className="relative z-10 px-3 py-1.5 rounded-lg bg-black/60 text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Remove
              </button>
            </>
          ) : (
            <div className="text-center p-6">
              <svg className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <p className="text-xs text-muted-foreground/70">{uploading ? 'Uploading...' : 'Click to upload header image'}</p>
              <p className="text-[10px] text-muted-foreground/50 mt-1">PNG, JPG, WebP (max 2MB)</p>
            </div>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleHeaderImage} className="hidden" />
      </div>

      {/* Title */}
      <Field>
        <FieldLabel htmlFor="title" className="text-xs uppercase tracking-wider text-[#a77c5c] font-bold">
          Article Title
        </FieldLabel>
        <Input
          id="title"
          placeholder="e.g. Legal Engineering in 2026"
          value={form.title}
          onChange={handleTitleChange}
          required
        />
      </Field>

      {/* Slug */}
      <Field>
        <FieldLabel htmlFor="slug" className="text-xs uppercase tracking-wider text-[#a77c5c] font-bold">
          URL Slug
        </FieldLabel>
        <Input
          id="slug"
          placeholder="e.g. legal-engineering-2026"
          value={form.slug}
          onChange={handleSlugChange}
          required
        />
      </Field>

      {/* Practice Areas */}
      <div className="space-y-2">
        <FieldLabel className="text-xs uppercase tracking-wider text-[#a77c5c] font-bold">
          Practice Areas
        </FieldLabel>
        <CategoryMultiselect value={form.categories} onChange={v => update('categories', v)} />
      </div>

      {/* Content */}
      <div className="space-y-2">
        <FieldLabel htmlFor="content" className="text-xs uppercase tracking-wider text-[#a77c5c] font-bold">
          Article Content
        </FieldLabel>
        <RichTextEditor content={form.content} onChange={v => update('content', v)} />
      </div>

      {/* Excerpt */}
      <Field>
        <FieldLabel htmlFor="excerpt" className="text-xs uppercase tracking-wider text-[#a77c5c] font-bold">
          Excerpt (optional)
        </FieldLabel>
        <Textarea
          id="excerpt"
          placeholder="Brief summary for previews..."
          value={form.excerpt}
          onChange={e => update('excerpt', e.target.value)}
          className="min-h-[60px] resize-y"
        />
        <p className="text-[10px] text-muted-foreground/60 mt-1">
          Auto-generated from content if left empty.
        </p>
      </Field>

      <Field>
        <FieldLabel htmlFor="scheduled_date" className="text-xs uppercase tracking-wider text-[#a77c5c] font-bold">
          Schedule Date (optional)
        </FieldLabel>
        <Input
          id="scheduled_date"
          type="date"
          value={form.scheduledDate}
          onChange={e => update('scheduledDate', e.target.value)}
        />
        <p className="text-[10px] text-muted-foreground/60 mt-1">
          Leave empty to publish immediately after editorial approval.
        </p>
      </Field>

      {(error || mutation.isError) && (
        <p className="text-sm text-destructive font-medium bg-destructive/10 p-2.5 rounded border border-destructive/20">
          {error || (mutation.error instanceof Error ? mutation.error.message : 'An error occurred.')}
        </p>
      )}

      <Button type="submit" disabled={mutation.isPending || uploading} className="w-full glow-primary mt-2">
        {mutation.isPending ? 'Submitting for Review...' : 'Submit for Editorial Review'}
      </Button>
    </form>
  );
}
