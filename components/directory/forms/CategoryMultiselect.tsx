'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import specialtiesData from '@/data/specialties.json';

interface CategoryMultiselectProps {
  value: string[];
  onChange: (value: string[]) => void;
}

export default function CategoryMultiselect({ value, onChange }: CategoryMultiselectProps) {
  const [custom, setCustom] = useState('');

  const toggle = (val: string) => {
    if (value.includes(val)) {
      onChange(value.filter((v) => v !== val));
    } else {
      onChange([...value, val]);
    }
  };

  const addCustom = () => {
    const trimmed = custom.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setCustom('');
  };

  const remove = (val: string) => {
    onChange(value.filter((v) => v !== val));
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto">
        {specialtiesData.map((s) => (
          <label
            key={s.id}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border/40 bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors text-xs font-medium text-muted-foreground hover:text-foreground has-[:checked]:border-[#a77c5c]/40 has-[:checked]:bg-[#a77c5c]/5 has-[:checked]:text-[#a77c5c]"
          >
            <input
              type="checkbox"
              checked={value.includes(s.slug)}
              onChange={() => toggle(s.slug)}
              className="rounded border-border/60 text-[#a77c5c] focus:ring-[#a77c5c]/20"
            />
            {s.name}
          </label>
        ))}
      </div>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((v) => {
            const match = specialtiesData.find((s) => s.slug === v);
            const label = match?.name || v;
            return (
              <span
                key={v}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#a77c5c]/10 text-[#a77c5c] text-[10px] font-bold uppercase tracking-wider"
              >
                {label}
                <button
                  type="button"
                  onClick={() => remove(v)}
                  className="hover:text-[#906b4e] transition-colors"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Other category..."
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }}
          className="flex-1 px-3 py-1.5 rounded-lg bg-muted/20 border border-border/40 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-[#a77c5c]"
        />
        <button
          type="button"
          onClick={addCustom}
          disabled={!custom.trim()}
          className="shrink-0 px-3 py-1.5 rounded-lg bg-[#a77c5c] hover:bg-[#906b4e] disabled:opacity-40 text-white text-xs font-bold transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  );
}
