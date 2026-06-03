'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import { updateProfile } from '../../app/actions/profile';
import { DirectoryRole } from '@repo/api';
import AvatarUpload from './AvatarUpload';

interface ProfileFormProps {
  initialData: {
    full_name: string;
    role: string;
    avatar_url?: string | null;
  };
}

export default function ProfileForm({ initialData }: ProfileFormProps) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const firstName = formData.get('first_name') as string;
    const lastName = formData.get('last_name') as string;
    const role = formData.get('role') as string;

    const full_name = `${firstName.trim()} ${lastName.trim()}`.trim();

    const res = await updateProfile({ full_name, role });

    if (res.error) {
      setError(res.error);
    } else {
      setSuccess(true);
      router.refresh();
      // Reset success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    }
    
    setIsPending(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 text-sm rounded-md">
          {error}
        </div>
      )}
      
      {success && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-sm rounded-md">
          Profile updated successfully!
        </div>
      )}

      <AvatarUpload 
        initialAvatarUrl={initialData.avatar_url} 
        initials={initialData.full_name ? initialData.full_name?.[0].toUpperCase() : 'U'} 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="first_name">First Name</Label>
          <Input 
            id="first_name" 
            name="first_name" 
            defaultValue={initialData.full_name?.split(' ')[0] || ''} 
            placeholder="e.g. John"
            required 
            className="input-premium"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="last_name">Last Name</Label>
          <Input 
            id="last_name" 
            name="last_name" 
            defaultValue={initialData.full_name?.split(' ').slice(1).join(' ') || ''} 
            placeholder="e.g. Doe"
            required 
            className="input-premium"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Primary Account Role</Label>
        <select 
          id="role" 
          name="role" 
          defaultValue={initialData.role || DirectoryRole.CLIENT}
          className="input-premium appearance-none cursor-pointer"
        >
          <option value={DirectoryRole.CLIENT}>Client (Seeking Legal Services)</option>
          <option value={DirectoryRole.LAWYER}>Legal Practitioner / Lawyer</option>
          <option value={DirectoryRole.CHAMBER}>Law Chamber Representative</option>
        </select>
        <p className="text-xs text-muted-foreground mt-1">
          This determines how your dashboard is structured.
        </p>
      </div>

      <Button type="submit" disabled={isPending} className="w-full glow-primary">
        {isPending ? 'Saving Changes...' : 'Save Profile Changes'}
      </Button>
    </form>
  );
}
