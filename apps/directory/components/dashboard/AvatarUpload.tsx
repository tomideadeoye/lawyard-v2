'use client';

import { useState, useRef } from 'react';
import { uploadAvatar } from '../../app/actions/upload-avatar';
import { Button } from '@repo/ui/components/button';
import { Camera, Loader2 } from 'lucide-react';

interface AvatarUploadProps {
  initialAvatarUrl?: string | null;
  initials: string;
}

export default function AvatarUpload({ initialAvatarUrl, initials }: AvatarUploadProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null | undefined>(initialAvatarUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('avatar', file);

    const res = await uploadAvatar(formData);

    if (res.error) {
      setError(res.error);
    } else if (res.avatarUrl) {
      setAvatarUrl(res.avatarUrl);
    }
    
    setIsUploading(false);
    
    // Reset file input so the same file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  return (
    <div className="flex items-center gap-6 mb-8 p-4 border border-border/40 rounded-xl bg-muted/20">
      <div 
        className="relative w-24 h-24 rounded-full overflow-hidden bg-background flex flex-col items-center justify-center border border-border group cursor-pointer shrink-0 shadow-sm"
        onClick={() => fileInputRef.current?.click()}
      >
        {isUploading ? (
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        ) : avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <span className="text-3xl font-extrabold text-muted-foreground/50">{initials}</span>
        )}

        {!isUploading && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera className="w-6 h-6 text-white" />
          </div>
        )}
      </div>

      <div>
        <h4 className="font-semibold text-sm">Profile Picture</h4>
        <p className="text-xs text-muted-foreground mt-1 mb-3">
          Upload a professional headshot. Max size 5MB (JPEG or PNG).
        </p>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? 'Uploading...' : 'Change Picture'}
        </Button>
        {error && <p className="text-xs text-rose-500 font-medium mt-2">{error}</p>}
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/png, image/jpeg, image/webp" 
        onChange={handleFileChange}
      />
    </div>
  );
}
