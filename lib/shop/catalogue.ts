/**
 * Catalogue filtering and pagination for the legislation store.
 *
 * Kept pure so the shop page and its tests agree: 420 titles in one grid made a
 * 1 MB page and an unusable scroll.
 */
export interface CatalogueItem {
  id: string;
  slug: string;
  title: string;
  price: number;
}

export interface CatalogueFilters {
  query?: string;
  letter?: string;
  availability?: "all" | "available";
  sort?: "title" | "price-asc" | "price-desc";
}

export const PAGE_SIZE = 24;

export function filterCatalogue<T extends CatalogueItem>(
  items: T[],
  filters: CatalogueFilters,
  availableSlugs: Set<string>
): T[] {
  const query = (filters.query ?? "").trim().toLowerCase();
  const letter = (filters.letter ?? "").trim().toUpperCase();

  let result = items.filter((item) => {
    if (query && !item.title.toLowerCase().includes(query)) return false;
    if (letter && item.title[0]?.toUpperCase() !== letter) return false;
    if (filters.availability === "available" && !availableSlugs.has(item.slug)) return false;
    return true;
  });

  switch (filters.sort) {
    case "price-asc":
      result = [...result].sort((a, b) => a.price - b.price || a.title.localeCompare(b.title));
      break;
    case "price-desc":
      result = [...result].sort((a, b) => b.price - a.price || a.title.localeCompare(b.title));
      break;
    default:
      result = [...result].sort((a, b) => a.title.localeCompare(b.title));
  }

  return result;
}

export function paginate<T>(items: T[], page: number, pageSize = PAGE_SIZE) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, Math.floor(page) || 1), totalPages);
  const start = (current - 1) * pageSize;
  return {
    page: current,
    totalPages,
    total,
    items: items.slice(start, start + pageSize),
  };
}
