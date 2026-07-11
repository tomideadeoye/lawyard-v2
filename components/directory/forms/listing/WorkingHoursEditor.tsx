'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface DaySlot {
  day: string;
  hours: string;
}

interface WorkingHoursEditorProps {
  value: DaySlot[];
  onChange: (value: DaySlot[]) => void;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DEFAULT_HOURS = '9:00 AM — 5:00 PM';

export default function WorkingHoursEditor({ value, onChange }: WorkingHoursEditorProps) {
  const toggleDay = (day: string) => {
    const exists = value.find(w => w.day === day);
    if (exists) {
      onChange(value.filter(w => w.day !== day));
    } else {
      onChange([...value, { day, hours: DEFAULT_HOURS }]);
    }
  };

  const updateHours = (day: string, hours: string) => {
    onChange(value.map(w => w.day === day ? { ...w, hours } : w));
  };

  const setAll = () => {
    const all = DAYS.map(d => value.find(w => w.day === d) || { day: d, hours: DEFAULT_HOURS });
    onChange(all);
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-accent font-bold">Working Hours</span>
        <div className="flex gap-2">
          <button type="button" onClick={setAll} className="text-[10px] font-semibold text-accent hover:underline">
            Set All
          </button>
          <button type="button" onClick={clearAll} className="text-[10px] font-semibold text-muted-foreground hover:underline">
            Clear
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        {DAYS.map(day => {
          const slot = value.find(w => w.day === day);
          const isActive = !!slot;

          return (
            <div key={day} className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm cursor-pointer min-w-[100px]">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={() => toggleDay(day)}
                  className="rounded border-border text-accent focus-visible:ring-accent/20"
                />
                <span className={isActive ? 'font-medium text-foreground' : 'text-muted-foreground'}>
                  {day.slice(0, 3)}
                </span>
              </label>
              {isActive ? (
                <Input
                  value={slot!.hours}
                  onChange={e => updateHours(day, e.target.value)}
                  placeholder={DEFAULT_HOURS}
                  className="h-8 text-xs flex-1"
                />
              ) : (
                <span className="text-xs text-muted-foreground/50 flex-1">Closed</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
