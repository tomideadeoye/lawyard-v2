/**
 * Two different questions, deliberately answered separately.
 *
 * 1. MAY THIS FIRM EXIST?
 *    A firm page goes live as soon as the firm is identifiable and findable: a
 *    name, a place, and at least one practice area. That is all "firm details"
 *    means. A firm that incorporated last month has no matters, no reviews and
 *    no written history — requiring any of those would exclude exactly the new
 *    supply a cold-start directory is trying to attract. Contact channels are
 *    offered when present but not required to exist.
 *
 * 2. SHOULD SEARCH ENGINES INDEX IT?
 *    A page with nothing on it but a name is a doorway page: real to a client
 *    who was given the link, worthless and risky as a search result. Indexing
 *    therefore needs one piece of substance — a description, or listed matters.
 *    Failing that the page still exists, still appears in directory search, and
 *    is served with `noindex, follow`.
 *
 * A firm is never blocked from existing by a field it cannot have yet.
 */
export const MIN_DESCRIPTION = 120;
/** Matters are the alternative to a written description: facts instead of prose. */
export const MIN_MATTERS = 3;

export interface PublishableChamber {
  name?: string | null;
  description?: string | null;
  location?: string | null;
  focus?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  image_url?: string | null;
  gallery_images?: string[] | null;
  /** Number of matters listed. */
  matters?: number | null;
  /** Saved practice areas; a firm with areas does not need a tagline. */
  practiceAreas?: number | null;
}

export interface PublishCheck {
  ready: boolean;
  blockers: string[];
  /** 0–1, for a completeness meter in the dashboard. */
  score: number;
}

const filled = (value?: string | null) => Boolean(value && value.trim().length > 0);

function resolve(checks: Array<{ ok: boolean; label: string }>): PublishCheck {
  const blockers = checks.filter((check) => !check.ok).map((check) => check.label);
  const passed = checks.length - blockers.length;

  return {
    ready: blockers.length === 0,
    blockers,
    score: Math.round((passed / checks.length) * 100) / 100,
  };
}

/** May the page be listed and reachable at its URL? */
export function chamberPublishCheck(chamber: PublishableChamber): PublishCheck {
  return resolve([
    { ok: filled(chamber.name), label: "Firm name" },
    { ok: filled(chamber.location), label: "Location" },
    {
      ok: filled(chamber.focus) || (chamber.practiceAreas ?? 0) > 0,
      label: "At least one practice area",
    },
  ]);
}

/** Is there enough on the page to be worth a search result? */
export function chamberIndexCheck(chamber: PublishableChamber): PublishCheck {
  const hasDescription = (chamber.description ?? "").trim().length >= MIN_DESCRIPTION;
  const hasMatters = (chamber.matters ?? 0) >= MIN_MATTERS;

  return resolve([
    {
      ok: hasDescription || hasMatters,
      label: `A description (${MIN_DESCRIPTION}+ characters) or ${MIN_MATTERS} matters`,
    },
  ]);
}
