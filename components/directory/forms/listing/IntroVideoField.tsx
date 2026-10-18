'use client';

import { useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { uploadIntroVideo } from '@/app/directory/actions/upload-intro-video';

interface IntroVideoFieldProps {
  value: string;
  onChange: (url: string) => void;
  isPremium: boolean;
}

export default function IntroVideoField({ value, onChange, isPremium }: IntroVideoFieldProps) {
  const [mode, setMode] = useState<'url' | 'upload'>('url');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!isPremium) {
    return (
      <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
        <p className="text-xs uppercase tracking-wider text-accent font-bold">Introductory Video</p>
        <p className="text-xs text-muted-foreground mt-1">
          Premium feature — upgrade to add a 1-minute intro video (upload or link).
        </p>
      </div>
    );
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    const res = await uploadIntroVideo(fd);
    if (res.error) setError(res.error);
    else if (res.url) onChange(res.url);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-accent font-bold">Introductory Video</span>
        <div className="flex gap-1 text-[10px]">
          <button type="button" onClick={() => setMode('url')}
            className={`px-2 py-0.5 rounded ${mode === 'url' ? 'bg-accent text-white' : 'text-muted-foreground hover:text-foreground'}`}>
            Link
          </button>
          <button type="button" onClick={() => setMode('upload')}
            className={`px-2 py-0.5 rounded ${mode === 'upload' ? 'bg-accent text-white' : 'text-muted-foreground hover:text-foreground'}`}>
            Upload
          </button>
        </div>
      </div>

      {mode === 'url' ? (
        <>
          <Input type="url" placeholder="YouTube or Vimeo URL"
            value={value.startsWith('http') && !value.includes('/storage/v1/object/public/intro-videos') ? value : ''}
            onChange={e => onChange(e.target.value)} />
          <p className="text-xs text-muted-foreground">YouTube &amp; Vimeo links, or switch to Upload.</p>
        </>
      ) : (
        <>
          {value && value.includes('/storage/v1/object/public/intro-videos') ? (
            <div className="space-y-2">
              <video src={value} controls className="w-full rounded-lg max-h-64 bg-black" />
              <Button type="button" variant="outline" size="sm" onClick={() => onChange('')}>Remove video</Button>
            </div>
          ) : (
            <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
              {uploading ? 'Uploading…' : 'Choose a video (max 1 min, 25MB)'}
            </Button>
          )}
          <input ref={inputRef} type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden" onChange={handleFile} />
        </>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
