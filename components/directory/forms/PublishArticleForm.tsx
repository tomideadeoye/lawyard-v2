'use client';

import { useState, useTransition } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { publishArticle } from '@/app/directory/actions/content';

export default function PublishArticleForm() {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [isCustomSlug, setIsCustomSlug] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')     // Remove all non-word characters except spaces and hyphens
      .replace(/[\s_-]+/g, '-')     // Replace spaces/underscores/hyphens with a single hyphen
      .replace(/^-+|-+$/g, '');     // Trim leading/trailing hyphens
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    if (!isCustomSlug) {
      setSlug(generateSlug(val));
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlug(e.target.value);
    setIsCustomSlug(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set('slug', slug); // Ensure the slug is set to current generated/edited state value

    startTransition(async () => {
      try {
        await publishArticle(formData);
      } catch (err: any) {
        // Next.js redirect mechanism relies on throwing redirect errors.
        // We rethrow it so Next.js handles the client navigation.
        if (err && err.digest && err.digest.startsWith('NEXT_REDIRECT')) {
          throw err;
        }
        console.error(err);
        setError(err instanceof Error ? err.message : 'An error occurred while publishing the article.');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field>
        <FieldLabel htmlFor="title" className="text-xs uppercase tracking-wider text-accent font-bold">Article Title</FieldLabel>
        <Input 
          name="title" 
          id="title" 
          placeholder="e.g. Legal Engineering in 2026" 
          value={title}
          onChange={handleTitleChange}
          required 
        />
      </Field>
      
      <Field>
        <FieldLabel htmlFor="slug" className="text-xs uppercase tracking-wider text-accent font-bold">URL Slug</FieldLabel>
        <Input 
          name="slug" 
          id="slug" 
          placeholder="e.g. legal-engineering-2026" 
          value={slug}
          onChange={handleSlugChange}
          required 
        />
      </Field>
      
      <Field>
        <FieldLabel htmlFor="content" className="text-xs uppercase tracking-wider text-accent font-bold">Article Content</FieldLabel>
        <Textarea
          name="content"
          id="content"
          placeholder="Write your content here..."
          className="min-h-[200px] resize-y"
          required
        />
      </Field>

      {error && (
        <p className="text-sm text-destructive font-medium bg-destructive/10 p-2.5 rounded border border-destructive/20">
          {error}
        </p>
      )}
      
      <Button type="submit" disabled={isPending} className="w-full glow-primary mt-2">
        {isPending ? 'Publishing...' : 'Publish to Directory'}
      </Button>
    </form>
  );
}
