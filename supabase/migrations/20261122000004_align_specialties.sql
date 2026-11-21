-- Aligns the specialty taxonomy with what the product actually advertises.
--
-- `data/specialties.json` (the header nav, the category picker, the search
-- slug map) had drifted from the `specialties` table: it used five ids that do
-- not exist in the database (banking-and-finance, dispute-resolution-law,
-- mediation-and-arbitration, privacy-and-data-protection, commercial-law) and
-- omitted five that do (intellectual property, maritime, taxation, and the
-- two renamed ids). Two consequences:
--
--   * chamber_specialties / lawyer_specialties could not store the ids the UI
--     offered — the foreign key rejects them;
--   * firm pages could not record "Dispute Resolution", the area named in the
--     only firm's own tagline.
--
-- The table is the source of truth because both junction tables point at it.
-- This migration adds the two areas the product already advertises but never
-- had rows for, then re-runs the focus backfill so existing firms pick them up.
-- The JSON file is rewritten to match in the same change.

INSERT INTO specialties (id, name, slug) VALUES
  ('dispute-resolution-law', 'Dispute Resolution Law', 'dispute-resolution-law'),
  ('commercial-law', 'Commercial Law', 'commercial-law')
ON CONFLICT DO NOTHING;

-- Same backfill as 20261122000003, idempotent, re-run so newly added rows are
-- matched against existing focus lines.
INSERT INTO chamber_specialties (chamber_id, specialty_id)
SELECT DISTINCT c.id, s.id
FROM chambers c
CROSS JOIN LATERAL regexp_split_to_table(
  coalesce(c.focus, ''),
  '\s*(?:,|&|;|\||\yand\y|/)\s*'
) AS token
JOIN specialties s
  ON regexp_replace(lower(trim(s.name)), '\s+law$', '')
   = regexp_replace(lower(trim(token)), '\s+law$', '')
WHERE trim(token) <> ''
ON CONFLICT DO NOTHING;
