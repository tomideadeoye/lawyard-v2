-- Every blocked attempt to share an address or number, for review.
--
-- The filter in lib/directory/contact-filter.ts is friction, not prevention; the
-- point of recording is to see whether a listing is pushing clients off-platform
-- and to tune the rule. Deliberately no FK: a flag can be raised before an
-- inquiry exists (the first message), so the id may be null.

CREATE TABLE IF NOT EXISTS contact_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  surface TEXT NOT NULL CHECK (surface IN ('chamber', 'lawyer')),
  inquiry_id UUID,
  direction TEXT NOT NULL CHECK (direction IN ('client', 'provider')),
  kinds TEXT[] NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_flags_created
  ON contact_flags (created_at DESC);

ALTER TABLE contact_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read contact flags" ON contact_flags;
CREATE POLICY "Admins read contact flags"
  ON contact_flags FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- No insert policy: writes run through the service role in the server actions,
-- so the browser cannot forge or suppress a flag.
