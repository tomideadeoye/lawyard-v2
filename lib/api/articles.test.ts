import { describe, it, expect } from "vitest";
import { categoryCandidates } from "@/lib/api/articles";

// articles.category is TEXT[] holding whatever label the submitter picked, so
// the same category is stored as "News" (WP import), "news" (slug) or
// "Corporate Post" (corporate-post flow). Filtering it with .eq() was a hard
// 400 that silently emptied every category page — these are the spellings the
// matcher has to cover.
describe("categoryCandidates", () => {
  it("covers slug, spaced, Title Case and upper-case spellings", () => {
    expect(categoryCandidates("sports-law")).toEqual(
      expect.arrayContaining(["sports-law", "sports law", "Sports Law", "SPORTS LAW"])
    );
  });

  it("matches the label the corporate-post flow writes", () => {
    expect(categoryCandidates("corporate-post")).toContain("Corporate Post");
  });

  it("keeps small words lower-case in Title Case", () => {
    expect(categoryCandidates("banking-and-finance")).toContain("Banking and Finance");
  });

  it("handles a single word", () => {
    expect(categoryCandidates("news")).toEqual(
      expect.arrayContaining(["news", "News", "NEWS"])
    );
  });

  it("tolerates labels that are already Title Case", () => {
    expect(categoryCandidates("Corporate Post")).toContain("corporate post");
    expect(categoryCandidates("Corporate Post")).toContain("Corporate Post");
  });

  it("deduplicates", () => {
    const candidates = categoryCandidates("news");
    expect(new Set(candidates).size).toBe(candidates.length);
  });

  it("returns nothing for an empty value", () => {
    expect(categoryCandidates("")).toEqual([]);
    expect(categoryCandidates("   ")).toEqual([]);
  });
});
