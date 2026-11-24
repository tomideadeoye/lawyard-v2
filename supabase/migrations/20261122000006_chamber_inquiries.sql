-- A firm page is publishable on its details, which means it can be live with no
-- email, no phone and no website. Until now the only action on a firm page was
-- "request to join this firm" — for lawyers. A client had nowhere to go.
--
-- Inquiries are addressed to the firm, not to a lawyer, so they cannot reuse
-- lawyer_inquiries (lawyer_id is NOT NULL and points at a listing). Same shape,
-- own table.
--
-- Reading is limited to whoever manages the firm: the billing owner, or a
-- delegate admin from chamber_admins. Delivery does not depend on either — see
-- the server action's fallback to the Lawyard inbox.

CREATE TABLE IF NOT EXISTS chamber_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chamber_id UUID NOT NULL REFERENCES chambers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chamber_inquiries_chamber
  ON chamber_inquiries (chamber_id, created_at DESC);

ALTER TABLE chamber_inquiries ENABLE ROW LEVEL SECURITY;

-- Anyone can write; the action validates and the page is public.
DROP POLICY IF EXISTS "Anyone can submit a firm inquiry" ON chamber_inquiries;
CREATE POLICY "Anyone can submit a firm inquiry"
  ON chamber_inquiries FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Firm admins read inquiries" ON chamber_inquiries;
CREATE POLICY "Firm admins read inquiries"
  ON chamber_inquiries FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chambers c
      WHERE c.id = chamber_inquiries.chamber_id
        AND c.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM chamber_admins ca
      WHERE ca.chamber_id = chamber_inquiries.chamber_id
        AND ca.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Firm admins mark inquiries read" ON chamber_inquiries;
CREATE POLICY "Firm admins mark inquiries read"
  ON chamber_inquiries FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chambers c
      WHERE c.id = chamber_inquiries.chamber_id
        AND c.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM chamber_admins ca
      WHERE ca.chamber_id = chamber_inquiries.chamber_id
        AND ca.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chambers c
      WHERE c.id = chamber_inquiries.chamber_id
        AND c.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM chamber_admins ca
      WHERE ca.chamber_id = chamber_inquiries.chamber_id
        AND ca.user_id = auth.uid()
    )
  );
