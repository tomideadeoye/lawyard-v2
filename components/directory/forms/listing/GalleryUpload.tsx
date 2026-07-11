'use client';

import { useRef, useState } from 'react';
import { uploadListingImage } from '@/app/directory/actions/upload-listing-image';
import { Button } from '@/components/ui/button';

interface GalleryUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
}

export default function GalleryUpload({ value, onChange, maxImages = 10 }: GalleryUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files: FileList) => {
    const remaining = maxImages - value.length;
    const toUpload = Array.from(files).slice(0, remaining);
    if (toUpload.length === 0) return;

    setUploading(true);
    const newUrls: string[] = [];

    for (const file of toUpload) {
      if (!file.type.startsWith('image/')) continue;
      if (file.size > 2 * 1024 * 1024) continue;

      const fd = new FormData();
      fd.append('file', file);
      const result = await uploadListingImage(fd);
      if (result.url) newUrls.push(result.url);
    }

    onChange([...value, ...newUrls]);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const remove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <span className="text-xs uppercase tracking-wider text-accent font-bold">
        Gallery Images ({value.length}/{maxImages})
      </span>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {value.map((url, i) => (
          <div key={i} className="relative aspect-[4/3] rounded-lg overflow-hidden border border-border/40 group">
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
            >
              ✕
            </button>
          </div>
        ))}

        {value.length < maxImages && (
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="aspect-[4/3] rounded-lg border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-accent/50 transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <span className="text-xs text-muted-foreground">Uploading...</span>
            ) : (
              <>
                <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span className="text-[10px] text-muted-foreground">Add image</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
        onChange={e => { const f = e.target.files; if (f) handleFiles(f); }}
      />

      <p className="text-[10px] text-muted-foreground">PNG, JPEG or WebP. Max 2MB each.</p>
    </div>
  );
}
