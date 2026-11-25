/**
 * Who is allowed to download a purchased legislation.
 *
 * A purchase is recorded on `transactions` with `plan_role = 'legislation_buyer'`
 * and `metadata.items[]` listing what was bought. Entitlement is therefore
 * derived from a successful transaction, never from the fact that a page was
 * reachable.
 */
export interface PurchaseRecord {
  status?: string | null;
  plan_role?: string | null;
  metadata?: {
    items?: Array<{ id?: string; slug?: string }> | null;
  } | null;
}

export function ownsLegislation(purchases: PurchaseRecord[], slug: string): boolean {
  return purchases.some((purchase) => {
    if (purchase.status !== "success") return false;
    if (purchase.plan_role !== "legislation_buyer") return false;
    const items = purchase.metadata?.items ?? [];
    return items.some((item) => item.slug === slug || item.id === slug);
  });
}

/** A legislation is sellable only when its file exists. */
export function isPurchasable(legislation: { file_path?: string | null } | null | undefined): boolean {
  return Boolean(legislation?.file_path);
}
