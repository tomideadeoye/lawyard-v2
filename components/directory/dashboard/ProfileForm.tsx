'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { updateProfile } from '@/app/directory/actions/profile';
import AvatarUpload from './AvatarUpload';

interface ProfileFormProps {
  initialData: {
    display_name: string;
    username?: string | null;
    first_name?: string;
    last_name?: string;
    email: string;
    phone?: string | null;
    website?: string | null;
    address?: string | null;
    about?: string | null;
    avatar_url?: string | null;
    facebook_url?: string | null;
    x_url?: string | null;
    linkedin_url?: string | null;
    youtube_url?: string | null;
  };
}

type SaveState = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

export default function ProfileForm({ initialData }: ProfileFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [bioLen, setBioLen] = useState(initialData.about?.length || 0);
  const BIO_MAX = 500;
  const router = useRouter();

  const doSave = useCallback(async () => {
    if (!formRef.current) return;

    setSaveState('saving');
    setErrorMsg(null);

    const formData = new FormData(formRef.current);

    const res = await updateProfile({
      display_name: formData.get('display_name') as string,
      first_name: formData.get('first_name') as string,
      last_name: formData.get('last_name') as string,
      phone: formData.get('phone') as string,
      website: formData.get('website') as string,
      address: formData.get('address') as string,
      about: formData.get('about') as string,
      facebook_url: formData.get('facebook_url') as string,
      x_url: formData.get('x_url') as string,
      linkedin_url: formData.get('linkedin_url') as string,
      youtube_url: formData.get('youtube_url') as string,
    });

    if (res.error) {
      setSaveState('error');
      setErrorMsg(res.error);
      // Auto-dismiss error after 6s
      setTimeout(() => { setErrorMsg(null); setSaveState('idle'); }, 6000);
    } else {
      setSaveState('saved');
      router.refresh();
      // "Saved" visible for 2s then back to idle
      setTimeout(() => setSaveState('idle'), 2000);
    }
  }, [router]);

  const scheduleSave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (saveState === 'saved' || saveState === 'idle' || saveState === 'error') {
      setErrorMsg(null);
      setSaveState('pending');
    }
    timerRef.current = setTimeout(doSave, 1500);
  }, [doSave, saveState]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <form ref={formRef} onChange={scheduleSave} className="space-y-8 relative">
      {/* Save indicator — fixed toast, always visible */}
      {saveState !== 'idle' && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-3.5 py-2 rounded-lg border border-border/40 bg-background/95 backdrop-blur-md shadow-lg">
          {errorMsg ? (
            <span className="text-xs text-destructive whitespace-nowrap">{errorMsg}</span>
          ) : saveState === 'saving' ? (
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-muted-foreground/40 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-muted-foreground/60" />
              </span>
              Saving…
            </span>
          ) : saveState === 'saved' ? (
            <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-emerald-500">
                <path d="M11.667 3.5L5.25 9.917L2.333 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Saved
            </span>
          ) : null}
        </div>
      )}

      {/* Avatar */}
      <AvatarUpload
        initialAvatarUrl={initialData.avatar_url}
        initials={initialData.display_name?.[0]?.toUpperCase() ?? 'U'}
      />

      {/* My Profile Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4">My Profile</h3>
        <div className="space-y-4">
          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="display_name">Display Name</Label>
            <Input
              id="display_name"
              name="display_name"
              defaultValue={initialData.display_name}
              required
              className="input-premium"
            />
          </div>

          {/* Username (readonly) */}
          <div className="space-y-2">
            <Label htmlFor="username">User Name</Label>
            <Input
              id="username"
              name="username"
              defaultValue={initialData.username || ''}
              readOnly
              tabIndex={-1}
              className="input-premium bg-muted/50 text-muted-foreground cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground">Username cannot be changed</p>
          </div>

          {/* First Name / Last Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                name="first_name"
                defaultValue={initialData.first_name || ''}
                placeholder="Tomide"
                className="input-premium"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                name="last_name"
                defaultValue={initialData.last_name || ''}
                placeholder="Adeoye"
                className="input-premium"
              />
            </div>
          </div>

          {/* Email (required, readonly) */}
          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              name="email"
              defaultValue={initialData.email}
              readOnly
              tabIndex={-1}
              className="input-premium bg-muted/50 text-muted-foreground cursor-not-allowed"
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              defaultValue={initialData.phone || ''}
              placeholder="Enter your phone number"
              className="input-premium"
            />
          </div>

          {/* Website */}
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              name="website"
              defaultValue={initialData.website || ''}
              placeholder="https://example.com"
              className="input-premium"
            />
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              name="address"
              defaultValue={initialData.address || ''}
              placeholder="Enter your address"
              className="input-premium"
            />
          </div>

          {/* Professional Bio */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="about">Professional Bio</Label>
              <span className={`text-xs tabular-nums ${
                BIO_MAX - bioLen <= 0 ? 'text-destructive font-semibold' :
                BIO_MAX - bioLen <= 50 ? 'text-amber-500' :
                'text-muted-foreground'
              }`}>
                {bioLen}/{BIO_MAX}
              </span>
            </div>
            <Textarea
              id="about"
              name="about"
              defaultValue={initialData.about || ''}
              placeholder="Write a short professional bio..."
              rows={4}
              maxLength={BIO_MAX}
              className="input-premium resize-y"
              onChange={(e) => setBioLen(e.target.value.length)}
            />
          </div>
        </div>
      </div>

      {/* Social Profiles Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Social Profiles</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="facebook_url">Facebook</Label>
            <Input
              id="facebook_url"
              name="facebook_url"
              defaultValue={initialData.facebook_url || ''}
              placeholder="https://facebook.com/your-profile"
              className="input-premium"
            />
            <p className="text-xs text-muted-foreground">Leave it empty to hide</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="x_url">X (Twitter)</Label>
            <Input
              id="x_url"
              name="x_url"
              defaultValue={initialData.x_url || ''}
              placeholder="https://x.com/your-handle"
              className="input-premium"
            />
            <p className="text-xs text-muted-foreground">Leave it empty to hide</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkedin_url">LinkedIn</Label>
            <Input
              id="linkedin_url"
              name="linkedin_url"
              defaultValue={initialData.linkedin_url || ''}
              placeholder="https://linkedin.com/in/your-profile"
              className="input-premium"
            />
            <p className="text-xs text-muted-foreground">Leave it empty to hide</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="youtube_url">YouTube</Label>
            <Input
              id="youtube_url"
              name="youtube_url"
              defaultValue={initialData.youtube_url || ''}
              placeholder="https://youtube.com/@your-channel"
              className="input-premium"
            />
            <p className="text-xs text-muted-foreground">Leave it empty to hide</p>
          </div>
        </div>
      </div>
    </form>
  );
}
