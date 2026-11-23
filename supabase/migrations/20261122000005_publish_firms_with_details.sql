-- Publishes firms that meet the details bar.
--
-- The first version of the gate required a 120-character description, a contact
-- channel and an image, and treated three matters as a substitute for the
-- description. That excluded a firm that incorporated last month: it has no
-- matters, no reviews and no history, which is exactly the supply a cold-start
-- directory needs. None of those are things a new firm can honestly produce.
--
-- Existence now needs firm details only: a name, a place, and at least one
-- practice area. Indexation is a separate check handled at the page (noindex
-- until there is a description or three matters), so a thin page can exist
-- without becoming a search result.

UPDATE chambers c
SET published_at = COALESCE(c.published_at, c.created_at)
WHERE c.published_at IS NULL
  AND trim(coalesce(c.name, '')) <> ''
  AND trim(coalesce(c.location, '')) <> ''
  AND (
    trim(coalesce(c.focus, '')) <> ''
    OR EXISTS (
      SELECT 1 FROM chamber_specialties cs WHERE cs.chamber_id = c.id
    )
  );
