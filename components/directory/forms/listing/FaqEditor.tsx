'use client';

import { Button } from '@/components/ui/button';

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqEditorProps {
  items: FaqItem[];
  onChange: (items: FaqItem[]) => void;
}

export default function FaqEditor({ items, onChange }: FaqEditorProps) {
  const addItem = () => {
    onChange([...items, { question: '', answer: '' }]);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof FaqItem, value: string) => {
    const updated = items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-accent font-bold">Frequently Asked Questions</span>
        <Button type="button" variant="outline" size="xs" onClick={addItem}>
          + Add FAQ
        </Button>
      </div>
      {items.length === 0 && (
        <p className="text-sm text-muted-foreground">No FAQs added yet. Click &quot;Add FAQ&quot; to start.</p>
      )}
      {items.map((item, i) => (
        <div key={i} className="border border-border/40 rounded-lg p-4 space-y-3 bg-muted/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">FAQ #{i + 1}</span>
            <Button type="button" variant="ghost" size="xs" className="text-destructive" onClick={() => removeItem(i)}>
              Remove
            </Button>
          </div>
          <input
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            placeholder="Question"
            value={item.question}
            onChange={e => updateItem(i, 'question', e.target.value)}
          />
          <textarea
            className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            placeholder="Answer"
            rows={2}
            value={item.answer}
            onChange={e => updateItem(i, 'answer', e.target.value)}
          />
        </div>
      ))}
    </div>
  );
}
