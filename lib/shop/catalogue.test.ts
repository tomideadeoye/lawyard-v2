import { describe, it, expect } from "vitest";
import { filterCatalogue, paginate, PAGE_SIZE, type CatalogueItem } from "@/lib/shop/catalogue";

const item = (title: string, price = 500): CatalogueItem => ({
  id: title.toLowerCase(),
  slug: title.toLowerCase().replace(/\s+/g, "-"),
  title,
  price,
});

const items: CatalogueItem[] = [
  item("Companies and Allied Matters Act"),
  item("Electoral Act", 750),
  item("Armed Forces Act", 300),
  item("Banks and Other Financial Institutions Act"),
];

const available = new Set(["electoral-act"]);

describe("filterCatalogue", () => {
  it("returns everything when no filter is set, sorted by title", () => {
    const result = filterCatalogue(items, {}, available);
    expect(result.map((i) => i.title)).toEqual([
      "Armed Forces Act",
      "Banks and Other Financial Institutions Act",
      "Companies and Allied Matters Act",
      "Electoral Act",
    ]);
  });

  it("matches a title substring, case-insensitively", () => {
    expect(filterCatalogue(items, { query: "banks" }, available)).toHaveLength(1);
    expect(filterCatalogue(items, { query: "BANKS" }, available)).toHaveLength(1);
  });

  it("filters by first letter", () => {
    expect(filterCatalogue(items, { letter: "b" }, available).map((i) => i.title)).toEqual([
      "Banks and Other Financial Institutions Act",
    ]);
  });

  it("filters to purchasable items only", () => {
    expect(filterCatalogue(items, { availability: "available" }, available).map((i) => i.title)).toEqual([
      "Electoral Act",
    ]);
  });

  it("sorts by price when asked", () => {
    expect(filterCatalogue(items, { sort: "price-asc" }, available)[0].title).toBe("Armed Forces Act");
    expect(filterCatalogue(items, { sort: "price-desc" }, available)[0].title).toBe("Electoral Act");
  });

  it("combines filters", () => {
    // Only "Armed Forces Act" both starts with A and contains "act".
    expect(filterCatalogue(items, { query: "act", letter: "a" }, available)).toHaveLength(1);
    expect(filterCatalogue(items, { query: "act", letter: "a", availability: "available" }, available)).toHaveLength(0);
  });
});

describe("paginate", () => {
  const many = Array.from({ length: 55 }, (_, i) => item(`Act ${i}`));

  it("splits into pages of the configured size", () => {
    const first = paginate(many, 1);
    expect(first.items).toHaveLength(PAGE_SIZE);
    expect(first.totalPages).toBe(3);
    expect(first.total).toBe(55);
  });

  it("clamps an out-of-range page instead of returning nothing", () => {
    expect(paginate(many, 99).page).toBe(3);
    expect(paginate(many, 0).page).toBe(1);
    expect(paginate(many, Number.NaN).page).toBe(1);
  });

  it("returns the remaining items on the last page", () => {
    expect(paginate(many, 3).items).toHaveLength(55 - PAGE_SIZE * 2);
  });

  it("always reports at least one page, even when empty", () => {
    const empty = paginate([], 1);
    expect(empty.totalPages).toBe(1);
    expect(empty.items).toEqual([]);
  });
});
