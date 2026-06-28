'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { FormSelect } from '@/components/ui/form-select';
import { Textarea } from '@/components/ui/textarea';
import CategoryMultiselect from './CategoryMultiselect';
import { publishPodcast } from '@/app/directory/actions/content';

export default function PublishPodcastForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState('audio');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState<string[]>(['general-practice']);
  const [scheduledDate, setScheduledDate] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.set('title', title);
      formData.set('media_url', mediaUrl);
      formData.set('media_type', mediaType);
      formData.set('description', description);
      formData.set('category', JSON.stringify(categories));
      if (scheduledDate) formData.set('scheduled_date', scheduledDate);
      const result = await publishPodcast(formData);
      if ('error' in result) throw new Error(result.error as string);
      return result;
    },
    onSuccess: () => {
      router.push('/directory/dashboard');
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field>
        <FieldLabel htmlFor="podcast-title" className="text-xs uppercase tracking-wider text-[#a77c5c] font-bold">
          Podcast Title
        </FieldLabel>
        <Input
          id="podcast-title"
          placeholder="e.g. Law & AI Ep 1"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="media_url" className="text-xs uppercase tracking-wider text-[#a77c5c] font-bold">
          Media Link URL
        </FieldLabel>
        <Input
          id="media_url"
          placeholder="e.g. https://youtube.com/..."
          value={mediaUrl}
          onChange={(e) => setMediaUrl(e.target.value)}
          required
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="media_type" className="text-xs uppercase tracking-wider text-[#a77c5c] font-bold">
          Format Type
        </FieldLabel>
        <FormSelect
          id="media_type"
          value={mediaType}
          onChange={(e) => setMediaType(e.target.value)}
        >
          <option value="audio">Audio Podcast</option>
          <option value="video">Video Podcast</option>
        </FormSelect>
      </Field>

      <Field>
        <FieldLabel htmlFor="description" className="text-xs uppercase tracking-wider text-[#a77c5c] font-bold">
          Description
        </FieldLabel>
        <Textarea
          id="description"
          placeholder="Short summary of discussion..."
          className="min-h-[100px] resize-y"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>

      <div className="space-y-2">
        <FieldLabel className="text-xs uppercase tracking-wider text-[#a77c5c] font-bold">
          Practice Areas
        </FieldLabel>
        <CategoryMultiselect value={categories} onChange={setCategories} />
      </div>

      <Field>
        <FieldLabel htmlFor="scheduled_date" className="text-xs uppercase tracking-wider text-[#a77c5c] font-bold">
          Schedule Date (optional)
        </FieldLabel>
        <Input
          id="scheduled_date"
          type="date"
          value={scheduledDate}
          onChange={(e) => setScheduledDate(e.target.value)}
        />
        <p className="text-[10px] text-muted-foreground/60 mt-1">
          Leave empty to publish immediately after editorial approval.
        </p>
      </Field>

      {mutation.isError && (
        <p className="text-sm text-destructive font-medium bg-destructive/10 p-2.5 rounded border border-destructive/20">
          {mutation.error instanceof Error ? mutation.error.message : 'An error occurred while publishing.'}
        </p>
      )}

      <Button type="submit" disabled={mutation.isPending} className="w-full glow-primary mt-2">
        {mutation.isPending ? 'Submitting for Review...' : 'Submit for Editorial Review'}
      </Button>
    </form>
  );
}
