'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import PublishArticleForm from '@/components/directory/forms/PublishArticleForm';
import PublishPodcastForm from '@/components/directory/forms/PublishPodcastForm';
import Link from 'next/link';

type Tab = 'article' | 'podcast';

interface ContentItem {
  id: string;
  title: string;
  status: string;
  created_at: string;
}

interface PublishTabsProps {
  articles: ContentItem[];
  podcasts: ContentItem[];
}

const tabs: { key: Tab; label: string; icon: string }[] = [
  { key: 'article', label: 'Article', icon: '✍️' },
  { key: 'podcast', label: 'Podcast', icon: '🎙️' },
];

function ContentList({ items, type }: { items: ContentItem[]; type: 'article' | 'podcast' }) {
  if (items.length === 0) {
    return (
      <p className="text-xs text-muted-foreground/60 italic">No {type}s published yet.</p>
    );
  }

  return (
    <div className="space-y-1.5">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/20 text-xs"
        >
          <span className="truncate text-muted-foreground font-medium">{item.title}</span>
          <span className={cn(
            'shrink-0 text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded',
            item.status === 'published'
              ? 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30'
              : 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30'
          )}>
            {item.status}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function PublishTabs({ articles, podcasts }: PublishTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('article');

  return (
    <div className="flex gap-8">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 space-y-6">
        {/* Tab Switcher */}
        <div className="flex flex-col gap-1.5 bg-muted/20 rounded-xl p-2 border border-border/40">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-semibold text-left transition-all no-underline',
                activeTab === tab.key
                  ? 'bg-[#a77c5c] text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <span className="text-base">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Published Content */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
            Your {activeTab === 'article' ? 'Articles' : 'Podcasts'}
          </h4>
          <ContentList
            items={activeTab === 'article' ? articles : podcasts}
            type={activeTab}
          />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        <div className="rounded-2xl border border-border/40 bg-card/45 backdrop-blur-md p-6 md:p-8">
          {activeTab === 'article' ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">✍️ Publish Article</h2>
                <p className="text-sm text-muted-foreground">Share your insights with the legal community.</p>
              </div>
              <PublishArticleForm />
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">🎙️ Publish Podcast</h2>
                <p className="text-sm text-muted-foreground">Upload audio or video discussion links.</p>
              </div>
              <PublishPodcastForm />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
