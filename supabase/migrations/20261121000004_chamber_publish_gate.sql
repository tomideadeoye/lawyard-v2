-- Publish gate for law-firm pages.
--
-- A firm can be created by an administrator who is not a lawyer, so "has a
-- lawyer" cannot be required at signup. What can be required is that a page is
-- worth publishing: a description, a location, a contact channel and at least
-- one practice area. Anything short of that stays a draft — visible to its
-- owners in the dashboard, absent from the index, search and sitemap.
--
-- `published_at` is set by the save action, not by hand. NULL means draft.

ALTER TABLE chambers ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS chambers_published_idx ON chambers (published_at)
  WHERE published_at IS NOT NULL;

-- Existing rows: publish only those that already meet the bar, so the change
-- does not silently hide a complete firm page.
UPDATE chambers
SET published_at = COALESCE(published_at, created_at)
WHERE published_at IS NULL
  AND COALESCE(length(trim(description)), 0) >= 120
  AND location IS NOT NULL
  AND (email IS NOT NULL OR phone IS NOT NULL);
