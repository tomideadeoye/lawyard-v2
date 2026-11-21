-- Corrects the practice-area backfill in 20261122000002.
--
-- That migration stripped the taxonomy's " Law" suffix with `\s+law$`, which
-- is case-sensitive, so "Corporate Law" never became "corporate" and no focus
-- token matched anything: `chamber_specialties` was created empty. Lowercase
-- first, then strip. Idempotent, so it is safe to re-run.
--
-- Rendering was never wrong — the page falls back to parsing `focus` — but the
-- relation stayed empty, which meant firm areas were not filterable.

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
