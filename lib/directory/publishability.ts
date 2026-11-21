/**
 * What a firm page needs before it may be published.
 *
 * A firm can be registered by an administrator who is not a lawyer, so a member
 * lawyer is deliberately *not* required. What is required is that the page says
 * something, can be found, and can be contacted — otherwise it is a thin page
 * that cannot rank and cannot convert.
 */
export const MIN_DESCRIPTION = 120;

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
}

export interface PublishCheck {
  ready: boolean;
  blockers: string[];
  /** 0–1, for a completeness meter in the dashboard. */
  score: number;
}

const filled = (value?: string | null) => Boolean(value && value.trim().length > 0);

export function chamberPublishCheck(chamber: PublishableChamber): PublishCheck {
  const checks: Array<{ key: string; ok: boolean; label: string }> = [
    { key: "name", ok: filled(chamber.name), label: "Firm name" },
    { key: "description", ok: (chamber.description ?? "").trim().length >= MIN_DESCRIPTION, label: `Description (${MIN_DESCRIPTION}+ characters)` },
    { key: "location", ok: filled(chamber.location), label: "Location" },
    { key: "focus", ok: filled(chamber.focus), label: "Practice areas" },
    { key: "contact", ok: filled(chamber.email) || filled(chamber.phone), label: "A contact email or phone" },
    {
      key: "image",
      ok: filled(chamber.image_url) || (chamber.gallery_images ?? []).length > 0,
      label: "A logo or at least one image",
    },
  ];

  const blockers = checks.filter((check) => !check.ok).map((check) => check.label);
  const passed = checks.length - blockers.length;

  return {
    ready: blockers.length === 0,
    blockers,
    score: Math.round((passed / checks.length) * 100) / 100,
  };
}
