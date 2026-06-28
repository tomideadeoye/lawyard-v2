"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronDown, BookOpen, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { KB_CATEGORIES, ARTICLES } from "./data";

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function Sidebar({ activeSlug }: { activeSlug: string | null }) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  useEffect(() => {
    if (!activeSlug) return;
    const parent = KB_CATEGORIES.find((cat) =>
      cat.articles.some((a) => a.slug === activeSlug)
    );
    if (parent && !expandedCategories.includes(parent.name)) {
      setExpandedCategories((prev) => [...prev, parent.name]);
    }
  }, [activeSlug]);

  function toggleCategory(name: string) {
    setExpandedCategories((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  }

  return (
    <aside className="w-72 shrink-0 border-r border-border/40 h-full overflow-y-auto">
      <div className="p-5 space-y-6">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
            <BookOpen className="h-3.5 w-3.5" />
            Knowledge Base
          </h2>
          <nav className="space-y-0.5">
            {KB_CATEGORIES.map((cat) => {
              const isOpen = expandedCategories.includes(cat.name);
              const hasActive = cat.articles.some((a) => a.slug === activeSlug);
              return (
                <div key={cat.name}>
                  <button
                    onClick={() => toggleCategory(cat.name)}
                    className={cn(
                      "flex items-center justify-between w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors",
                      hasActive
                        ? "bg-primary/10 text-primary font-bold"
                        : "text-foreground hover:bg-muted/50"
                    )}
                  >
                    <span className="truncate">{cat.name}</span>
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 shrink-0 ml-2 transition-transform duration-200",
                        isOpen && "rotate-180"
                      )}
                    />
                  </button>
                  <div
                    className={cn(
                      "overflow-hidden transition-all duration-300",
                      isOpen ? "max-h-[800px] mt-0.5" : "max-h-0"
                    )}
                  >
                    <div className="space-y-0.5 pl-3 border-l-2 border-border/40 ml-3">
                      {cat.articles.map((article) => (
                        <Link
                          key={article.slug}
                          href={`/directory/help?article=${article.slug}`}
                          className={cn(
                            "block w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors",
                            activeSlug === article.slug
                              ? "text-primary font-bold bg-primary/10 border-l-2 border-primary -ml-3 pl-[10px]"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                          )}
                        >
                          {article.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </nav>
        </div>
      </div>
    </aside>
  );
}

// ─── Article View ────────────────────────────────────────────────────────────

function ArticleView({ slug }: { slug: string }) {
  const article = ARTICLES[slug];
  if (!article) return null;

  return (
    <div className="flex-1 p-8 md:p-12 lg:p-16 overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-6">
          <Link href="/directory/help" className="hover:text-foreground transition-colors">
            Help Centre
          </Link>
          <span>/</span>
          <span className="text-muted-foreground">{article.category}</span>
          <span>/</span>
          <span className="text-[#a77c5c]">{article.title}</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-black mb-8 leading-tight">
          {article.title}
        </h1>

        <div className="space-y-5">
          {article.content.map((paragraph, i) => (
            <p key={i} className="text-base md:text-lg leading-relaxed text-muted-foreground">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-border/40">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/30 border border-border/30">
            <HelpCircle className="h-5 w-5 text-accent shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold mb-1">Need more help?</p>
              <p className="text-sm text-muted-foreground">
                Browse other topics in the sidebar or{" "}
                <Link href="/contact" className="text-accent hover:underline font-medium">
                  contact our support team
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Welcome View ────────────────────────────────────────────────────────────

function WelcomeView() {
  const mainCategories = KB_CATEGORIES.filter(
    (cat) => cat.name === "For Clients" || cat.name === "For Lawyers" || cat.name === "For Chambers"
  );

  return (
    <div className="flex-1 p-8 md:p-12 lg:p-16 overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-accent/10 text-accent border border-accent/20 mb-4">
            <BookOpen className="h-3.5 w-3.5" />
            Help Centre
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
            How can we help you?
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mb-6">
            Browse our knowledge base for guides, FAQs, and documentation on using
            the Lawyard Directory platform.
          </p>
          <div className="space-y-4 text-base text-muted-foreground leading-relaxed border-l-2 border-[#a77c5c]/30 pl-5 py-2">
            <p>Lawyard Directory is Nigeria&apos;s premier legal marketplace, connecting individuals and businesses with legal professionals across the country.</p>
            <p>Browse lawyer and chamber listings by specialty, location, or search directly. Each profile includes practice areas, experience, ratings, and direct contact information.</p>
            <p>To get started, use the search bar or browse specialties to find the right legal professional for your needs. You can compare listings, read reviews, and contact lawyers directly through the platform.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {mainCategories.map((cat) => {
            const firstSlug = cat.articles[0]?.slug;
            return (
              <Link
                key={cat.name}
                href={firstSlug ? `/directory/help?article=${firstSlug}` : "/directory/help"}
                className="block rounded-xl border border-border/40 bg-card/40 backdrop-blur-sm p-6 hover:border-[#a77c5c]/40 hover:bg-[#a77c5c]/5 transition-all group"
              >
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#a77c5c] mb-1">
                  {cat.name}
                </h3>
                <p className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                  {cat.articles.length} article{cat.articles.length > 1 ? "s" : ""}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HelpPage() {
  const searchParams = useSearchParams();
  const activeSlug = searchParams.get("article");
  const activeArticle = activeSlug && ARTICLES[activeSlug] ? activeSlug : null;

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <Sidebar activeSlug={activeArticle} />
      <div className="w-px bg-border/20" />
      {activeArticle ? <ArticleView slug={activeArticle} /> : <WelcomeView />}
    </div>
  );
}
