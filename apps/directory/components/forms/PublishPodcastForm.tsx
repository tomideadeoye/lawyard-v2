'use client';

import { useState, useTransition } from 'react';
import { Input } from '@repo/ui/components/input';
import { Button } from '@repo/ui/components/button';
import { Field, FieldLabel } from '@repo/ui/components/field';
import { publishPodcast } from '../../app/actions/content';

export default function PublishPodcastForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        await publishPodcast(formData);
      } catch (err: any) {
        // Next.js redirect mechanism relies on throwing redirect errors.
        // We rethrow it so Next.js handles the client navigation.
        if (err && err.digest && err.digest.startsWith('NEXT_REDIRECT')) {
          throw err;
        }
        console.error(err);
        setError(err instanceof Error ? err.message : 'An error occurred while publishing the podcast.');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field>
        <FieldLabel htmlFor="podcast-title" className="text-xs uppercase tracking-wider text-accent font-bold">Podcast Title</FieldLabel>
        <Input name="title" id="podcast-title" placeholder="e.g. Law & AI Ep 1" required />
      </Field>
      
      <Field>
        <FieldLabel htmlFor="media_url" className="text-xs uppercase tracking-wider text-accent font-bold">Media Link URL</FieldLabel>
        <Input name="media_url" id="media_url" placeholder="e.g. https://youtube.com/..." required />
      </Field>
      
      <Field>
        <FieldLabel htmlFor="media_type" className="text-xs uppercase tracking-wider text-accent font-bold">Format Type</FieldLabel>
        <select
          name="media_type"
          id="media_type"
          className="input-premium"
          defaultValue="audio"
        >
          <option value="audio">Audio Podcast</option>
          <option value="video">Video Podcast</option>
        </select>
      </Field>
      
      <Field>
        <FieldLabel htmlFor="description" className="text-xs uppercase tracking-wider text-accent font-bold">Description</FieldLabel>
        <textarea
          name="description"
          id="description"
          placeholder="Short summary of discussion..."
          className="input-premium min-h-[100px] resize-y"
        />
      </Field>

      {error && (
        <p className="text-sm text-destructive font-medium bg-destructive/10 p-2.5 rounded border border-destructive/20">
          {error}
        </p>
      )}
      
      <Button type="submit" disabled={isPending} className="w-full glow-primary mt-2">
        {isPending ? 'Going Live...' : 'Go Live on Homepage'}
      </Button>
    </form>
  );
}
