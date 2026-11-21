'use client';

import { Button } from '@/components/ui/button';
import specialtiesData from '@/data/specialties.json';

// Matters editor for the firm dashboard.
//
// A firm with no description still has cases. Capturing them here is what
// gives the public page something factual to show, so the fields follow the
// shape of a Nigerian court matter rather than a generic portfolio item.

export interface MatterDraft {
  title: string;
  kind: string;
  practice_area_id: string;
  court: string;
  suit_number: string;
  citation: string;
  year: string;
  role: string;
  side: string;
  outcome: string;
  summary: string;
  client_name: string;
  client_consent: boolean;
  visibility: string;
}

export const emptyMatter = (): MatterDraft => ({
  title: '',
  kind: 'litigation',
  practice_area_id: '',
  court: '',
  suit_number: '',
  citation: '',
  year: '',
  role: '',
  side: '',
  outcome: '',
  summary: '',
  client_name: '',
  client_consent: false,
  visibility: 'anonymised',
});

const KINDS = [
  { value: 'litigation', label: 'Litigation' },
  { value: 'arbitration', label: 'Arbitration' },
  { value: 'advisory', label: 'Advisory' },
  { value: 'transaction', label: 'Transaction' },
  { value: 'regulatory', label: 'Regulatory' },
  { value: 'pro_bono', label: 'Pro bono' },
];

const ROLES = [
  { value: '', label: 'Role —' },
  { value: 'lead_counsel', label: 'Lead counsel' },
  { value: 'co_counsel', label: 'Co-counsel' },
  { value: 'supporting', label: 'Supporting counsel' },
  { value: 'sole', label: 'Sole counsel' },
];

const SIDES = [
  { value: '', label: 'Acted for —' },
  { value: 'claimant', label: 'Claimant' },
  { value: 'defendant', label: 'Defendant' },
  { value: 'appellant', label: 'Appellant' },
  { value: 'respondent', label: 'Respondent' },
  { value: 'applicant', label: 'Applicant' },
];

const OUTCOMES = [
  { value: '', label: 'Outcome —' },
  { value: 'in_favour', label: 'In favour' },
  { value: 'against', label: 'Against' },
  { value: 'settled', label: 'Settled' },
  { value: 'pending', label: 'Pending' },
  { value: 'dismissed', label: 'Dismissed' },
  { value: 'withdrawn', label: 'Withdrawn' },
];

const VISIBILITY = [
  { value: 'anonymised', label: 'Public — client withheld' },
  { value: 'public', label: 'Public — client named (consent required)' },
  { value: 'private', label: 'Private — internal only' },
];

const isJudicial = (kind: string) => kind === 'litigation' || kind === 'arbitration';

export default function MattersEditor({
  items,
  onChange,
}: {
  items: MatterDraft[];
  onChange: (items: MatterDraft[]) => void;
}) {
  const updateItem = <K extends keyof MatterDraft>(index: number, field: K, value: MatterDraft[K]) => {
    onChange(items.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-accent font-bold">Selected Matters</span>
        <Button
          type="button"
          variant="outline"
          size="xs"
          disabled={items.length >= 25}
          onClick={() => onChange([...items, emptyMatter()])}
        >
          + Add matter
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Cases, arbitrations and advisory work you can talk about publicly. These appear on the firm
        page and are the strongest content a profile with no description has.
      </p>

      {items.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No matters added yet. Start with the case you would tell a client about.
        </p>
      )}

      {items.map((item, i) => (
        <div key={i} className="border border-border/40 rounded-lg p-4 space-y-3 bg-muted/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Matter #{i + 1}</span>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              className="text-destructive"
              onClick={() => onChange(items.filter((_, index) => index !== i))}
            >
              Remove
            </Button>
          </div>

          <input
            className={inputClass}
            placeholder="Matter title, e.g. JEE v. Federal Inland Revenue Service"
            value={item.title}
            onChange={(e) => updateItem(i, 'title', e.target.value)}
            maxLength={200}
          />

          <div className="grid grid-cols-2 gap-3">
            <select
              className={inputClass}
              value={item.kind}
              onChange={(e) => updateItem(i, 'kind', e.target.value)}
              aria-label="Matter type"
            >
              {KINDS.map((k) => (
                <option key={k.value} value={k.value}>{k.label}</option>
              ))}
            </select>
            <input
              className={inputClass}
              type="number"
              min={1900}
              max={2100}
              placeholder="Year"
              value={item.year}
              onChange={(e) => updateItem(i, 'year', e.target.value)}
              aria-label="Year"
            />
          </div>

          {isJudicial(item.kind) && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <input
                  className={inputClass}
                  placeholder="Court, e.g. Court of Appeal"
                  value={item.court}
                  onChange={(e) => updateItem(i, 'court', e.target.value)}
                  aria-label="Court"
                  maxLength={200}
                />
                <input
                  className={inputClass}
                  placeholder="Suit number"
                  value={item.suit_number}
                  onChange={(e) => updateItem(i, 'suit_number', e.target.value)}
                  aria-label="Suit number"
                  maxLength={120}
                />
              </div>
              <input
                className={inputClass}
                placeholder="Citation, e.g. (2024) 12 NWLR (Pt. 1900) 1"
                value={item.citation}
                onChange={(e) => updateItem(i, 'citation', e.target.value)}
                aria-label="Citation"
                maxLength={200}
              />
            </>
          )}

          <div className="grid grid-cols-2 gap-3">
            <select
              className={inputClass}
              value={item.side}
              onChange={(e) => updateItem(i, 'side', e.target.value)}
              aria-label="Side represented"
            >
              {SIDES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <select
              className={inputClass}
              value={item.role}
              onChange={(e) => updateItem(i, 'role', e.target.value)}
              aria-label="Role"
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <select
              className={inputClass}
              value={item.outcome}
              onChange={(e) => updateItem(i, 'outcome', e.target.value)}
              aria-label="Outcome"
            >
              {OUTCOMES.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <select
              className={inputClass}
              value={item.practice_area_id}
              onChange={(e) => updateItem(i, 'practice_area_id', e.target.value)}
              aria-label="Practice area"
            >
              <option value="">Practice area —</option>
              {specialtiesData.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <textarea
            className={`${inputClass} resize-y`}
            rows={3}
            placeholder="One or two sentences on what the matter was about. Facts only — no advocacy."
            value={item.summary}
            onChange={(e) => updateItem(i, 'summary', e.target.value)}
            aria-label="Summary"
            maxLength={1200}
          />

          <div className="space-y-2">
            <input
              className={inputClass}
              placeholder="Client name (only if the client has agreed to be named)"
              value={item.client_name}
              onChange={(e) => updateItem(i, 'client_name', e.target.value)}
              aria-label="Client name"
              maxLength={200}
            />
            <label className="flex items-start gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={item.client_consent}
                onChange={(e) => updateItem(i, 'client_consent', e.target.checked)}
              />
              The client has consented in writing to being named. Without this the name is never
              published.
            </label>
          </div>

          <div>
            <select
              className={inputClass}
              value={item.visibility}
              onChange={(e) => updateItem(i, 'visibility', e.target.value)}
              aria-label="Visibility"
            >
              {VISIBILITY.map((v) => (
                <option key={v.value} value={v.value}>{v.label}</option>
              ))}
            </select>
            {item.visibility === 'public' && !item.client_consent && (
              <p className="mt-1.5 text-[11px] text-amber-600">
                Without recorded consent this matter stays anonymous even if you pick &ldquo;client
                named&rdquo;.
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

const inputClass =
  'w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50';
