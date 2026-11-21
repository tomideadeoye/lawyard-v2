-- Firm practice areas as a relation, and matters as first-class rows.
--
-- Why this exists
-- ---------------
-- `chambers.focus` is a display line, not a taxonomy: one TEXT column holding
-- "Corporate, Energy & Dispute Resolution". Lawyers got a real many-to-many
-- (`lawyer_specialties`) from day one; firms never did, so a firm's practice
-- areas were only ever the *aggregate of its member lawyers* — computed at
-- render time and therefore empty for a firm with no members. That is why the
-- only seeded firm currently shows no practice areas at all.
--
-- `focus` stays as the human tagline ("Corporate, Energy & Dispute
-- Resolution"); `chamber_specialties` becomes the filterable truth.
--
-- `chamber_matters` is the other half. A firm with no description has no
-- narrative to show, but it almost always has matters: a suit, a court, a
-- year, a side it acted for. Those are verifiable facts, so they carry a
-- sparse profile without inventing prose.

-- ---------------------------------------------------------------------------
-- Firm practice areas
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chamber_specialties (
  chamber_id UUID NOT NULL REFERENCES chambers(id) ON DELETE CASCADE,
  specialty_id TEXT NOT NULL REFERENCES specialties(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (chamber_id, specialty_id)
);

CREATE INDEX IF NOT EXISTS idx_chamber_specialties_specialty
  ON chamber_specialties (specialty_id);

ALTER TABLE chamber_specialties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Firm practice areas are publicly readable" ON chamber_specialties;
CREATE POLICY "Firm practice areas are publicly readable"
  ON chamber_specialties FOR SELECT USING (true);

-- Writes stay with people who manage the firm (owner or delegate admin), so
-- the dashboard form can save without the service role.
DROP POLICY IF EXISTS "Firm admins manage practice areas" ON chamber_specialties;
CREATE POLICY "Firm admins manage practice areas"
  ON chamber_specialties FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chambers c
      WHERE c.id = chamber_specialties.chamber_id
        AND c.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM chamber_admins ca
      WHERE ca.chamber_id = chamber_specialties.chamber_id
        AND ca.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chambers c
      WHERE c.id = chamber_specialties.chamber_id
        AND c.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM chamber_admins ca
      WHERE ca.chamber_id = chamber_specialties.chamber_id
        AND ca.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Matters
-- ---------------------------------------------------------------------------
-- One row per engagement. `kind` separates a court case from an advisory or a
-- transaction so the page can group them; the judicial columns (court, suit
-- number, citation, side, outcome) are only meaningful for litigation and
-- arbitration and are left nullable elsewhere.
--
-- Confidentiality: naming a client requires recorded consent, so
-- `client_name` cannot exist without `client_consent`. `visibility` defaults
-- to `anonymised` — the matter is public, the client is not.
CREATE TABLE IF NOT EXISTS chamber_matters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chamber_id UUID NOT NULL REFERENCES chambers(id) ON DELETE CASCADE,
  -- The lawyer who led it, when that person is listed on the directory.
  lawyer_id UUID REFERENCES lawyers(id) ON DELETE SET NULL,
  kind TEXT NOT NULL DEFAULT 'advisory'
    CHECK (kind IN ('litigation', 'arbitration', 'advisory', 'transaction', 'regulatory', 'pro_bono')),
  title TEXT NOT NULL,
  practice_area_id TEXT REFERENCES specialties(id) ON DELETE SET NULL,
  court TEXT,
  suit_number TEXT,
  citation TEXT,
  year INTEGER CHECK (year IS NULL OR (year >= 1900 AND year <= 2100)),
  role TEXT CHECK (role IN ('lead_counsel', 'co_counsel', 'supporting', 'sole')),
  side TEXT CHECK (side IN ('claimant', 'defendant', 'appellant', 'respondent', 'applicant')),
  outcome TEXT CHECK (outcome IN ('in_favour', 'against', 'settled', 'pending', 'dismissed', 'withdrawn')),
  summary TEXT,
  client_name TEXT,
  client_consent BOOLEAN NOT NULL DEFAULT false,
  visibility TEXT NOT NULL DEFAULT 'anonymised'
    CHECK (visibility IN ('public', 'anonymised', 'private')),
  is_verified BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chamber_matters_client_needs_consent
    CHECK (client_name IS NULL OR client_consent)
);

CREATE INDEX IF NOT EXISTS idx_chamber_matters_chamber
  ON chamber_matters (chamber_id, visibility, sort_order);

ALTER TABLE chamber_matters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Published matters are publicly readable" ON chamber_matters;
CREATE POLICY "Published matters are publicly readable"
  ON chamber_matters FOR SELECT
  USING (visibility <> 'private');

DROP POLICY IF EXISTS "Firm admins manage matters" ON chamber_matters;
CREATE POLICY "Firm admins manage matters"
  ON chamber_matters FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chambers c
      WHERE c.id = chamber_matters.chamber_id
        AND c.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM chamber_admins ca
      WHERE ca.chamber_id = chamber_matters.chamber_id
        AND ca.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chambers c
      WHERE c.id = chamber_matters.chamber_id
        AND c.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM chamber_admins ca
      WHERE ca.chamber_id = chamber_matters.chamber_id
        AND ca.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Backfill practice areas from the existing focus lines
-- ---------------------------------------------------------------------------
-- Deliberately conservative: each token of `focus` must equal a taxonomy name
-- once " law" and case are normalised, so a launch backfill cannot invent an
-- area. Anything unmatched still reaches the page through the render-time
-- parser until an editor maps it properly.
INSERT INTO chamber_specialties (chamber_id, specialty_id)
SELECT DISTINCT c.id, s.id
FROM chambers c
CROSS JOIN LATERAL regexp_split_to_table(
  coalesce(c.focus, ''),
  '\s*(?:,|&|;|\||\yand\y|/)\s*'
) AS token
JOIN specialties s
  ON lower(regexp_replace(trim(s.name), '\s+law$', ''))
   = lower(regexp_replace(trim(token), '\s+law$', ''))
WHERE trim(token) <> ''
ON CONFLICT DO NOTHING;
