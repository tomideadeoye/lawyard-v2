'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { markInquiryRead } from '@/app/directory/actions/inquiries';

interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  read: boolean;
  created_at: string;
}

export default function InboxClient({ inquiries: initial }: { inquiries: Inquiry[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const markRead = useMutation({
    mutationFn: markInquiryRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiries'] });
    },
  });

  const active = selected ? initial.find((i) => i.id === selected) : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6">
      {/* List */}
      <div className="space-y-2">
        {initial.map((inq) => (
          <button
            key={inq.id}
            onClick={() => {
              setSelected(inq.id);
              if (!inq.read) markRead.mutate(inq.id);
            }}
            className={`w-full text-left p-4 rounded-xl border transition-all ${
              selected === inq.id
                ? 'border-[#a77c5c]/40 bg-[#a77c5c]/5'
                : 'border-border/40 bg-card/40 hover:bg-muted/20'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate flex items-center gap-2">
                  {inq.name}
                  {!inq.read && <span className="w-2 h-2 rounded-full bg-[#a77c5c] shrink-0" />}
                </p>
                <p className="text-xs text-muted-foreground truncate">{inq.email}</p>
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0">
                {new Date(inq.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            </div>
            <p className="text-xs text-muted-foreground/70 mt-2 line-clamp-2">{inq.message}</p>
          </button>
        ))}
      </div>

      {/* Detail */}
      <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-md p-6 min-h-[300px]">
        {active ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold">{active.name}</h3>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
                <a href={`mailto:${active.email}`} className="text-primary hover:underline">{active.email}</a>
                {active.phone && (
                  <a href={`tel:${active.phone}`} className="hover:text-foreground transition-colors">{active.phone}</a>
                )}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-muted/20 border border-border/20">
              <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{active.message}</p>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/20">
              <span>
                Received {new Date(active.created_at).toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
              {active.read && <span className="text-emerald-500 font-semibold">Read</span>}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <p className="text-sm text-muted-foreground">Select an inquiry to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
