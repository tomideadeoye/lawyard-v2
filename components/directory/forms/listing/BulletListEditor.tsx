'use client';

interface BulletListEditorProps {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  required?: boolean;
  maxHeight?: string;
}

export default function BulletListEditor({
  label,
  value,
  onChange,
  placeholder = 'One item per line...',
  required = false,
  maxHeight = '150px',
}: BulletListEditorProps) {
  const text = value.join('\n');

  const handleChange = (newText: string) => {
    const lines = newText
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);
    onChange(lines);
  };

  return (
    <div className="space-y-2">
      <label className="text-xs uppercase tracking-wider text-accent font-bold">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      <textarea
        value={text}
        onChange={e => handleChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        style={{ maxHeight }}
        className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 resize-y"
      />
      <p className="text-xs text-muted-foreground">
        {value.length} item{value.length !== 1 ? 's' : ''} — each line becomes a bullet point
      </p>
    </div>
  );
}
