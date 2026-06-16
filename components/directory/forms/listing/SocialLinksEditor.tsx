'use client';

import { Button } from '@/components/ui/button';

interface SocialLink {
  platform: string;
  url: string;
}

interface SocialLinksEditorProps {
  items: SocialLink[];
  onChange: (items: SocialLink[]) => void;
}

const PLATFORMS = [
  'LinkedIn',
  'Twitter / X',
  'Instagram',
  'Facebook',
  'YouTube',
  'TikTok',
  'WhatsApp',
  'Telegram',
];

export default function SocialLinksEditor({ items, onChange }: SocialLinksEditorProps) {
  const addItem = () => {
    onChange([...items, { platform: '', url: '' }]);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof SocialLink, value: string) => {
    const updated = items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-accent font-bold">Social Media Links</span>
        <Button type="button" variant="outline" size="xs" onClick={addItem}>
          + Add Social
        </Button>
      </div>
      {items.length === 0 && (
        <p className="text-sm text-muted-foreground">No social links added yet.</p>
      )}
      {items.map((item, i) => (
        <div key={i} className="border border-border/40 rounded-lg p-4 space-y-3 bg-muted/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Link #{i + 1}</span>
            <Button type="button" variant="ghost" size="xs" className="text-destructive" onClick={() => removeItem(i)}>
              Remove
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select
              value={item.platform}
              onChange={e => updateItem(i, 'platform', e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background/50 px-3 py-1 text-sm transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <option value="" className="bg-background">Select platform</option>
              {PLATFORMS.map(p => (
                <option key={p} value={p} className="bg-background">{p}</option>
              ))}
            </select>
            <input
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              placeholder="https://linkedin.com/in/..."
              value={item.url}
              onChange={e => updateItem(i, 'url', e.target.value)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
