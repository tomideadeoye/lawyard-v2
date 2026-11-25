-- Lawyer inquiries become threads, on the same terms as firm inquiries.
--
-- The notification was already made pointer-only, but there was nowhere to
-- reply: the lawyer inbox listed messages and stopped. This adds the other
-- half — a conversation the client can answer without an account, and a lawyer
-- who answers from the dashboard rather than by email.
--
-- Same credential model as chamber_inquiries: a 256-bit token in the client's
-- link is the only way back in, and the client's email and phone are removed
-- from the authenticated grant so a lawyer cannot read them from the row.

ALTER TABLE lawyer_inquiries
  ADD COLUMN IF NOT EXISTS access_token TEXT,
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS lawyer_inquiries_token
  ON lawyer_inquiries (access_token)
  WHERE access_token IS NOT NULL;

CREATE TABLE IF NOT EXISTS lawyer_inquiry_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID NOT NULL REFERENCES lawyer_inquiries(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('client', 'lawyer')),
  sender_name TEXT,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_lawyer_inquiry_messages_thread
  ON lawyer_inquiry_messages (inquiry_id, created_at);

-- Preserve the existing one-message inquiries as threads.
INSERT INTO lawyer_inquiry_messages (inquiry_id, sender, sender_name, body, created_at)
SELECT i.id, 'client', i.name, i.message, i.created_at
FROM lawyer_inquiries i
WHERE NOT EXISTS (
  SELECT 1 FROM lawyer_inquiry_messages m WHERE m.inquiry_id = i.id
);

ALTER TABLE lawyer_inquiry_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lawyer reads thread" ON lawyer_inquiry_messages;
CREATE POLICY "Lawyer reads thread"
  ON lawyer_inquiry_messages FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM lawyer_inquiries i
    WHERE i.id = lawyer_inquiry_messages.inquiry_id AND i.lawyer_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Lawyer replies to thread" ON lawyer_inquiry_messages;
CREATE POLICY "Lawyer replies to thread"
  ON lawyer_inquiry_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender = 'lawyer'
    AND EXISTS (
      SELECT 1 FROM lawyer_inquiries i
      WHERE i.id = lawyer_inquiry_messages.inquiry_id AND i.lawyer_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Lawyer marks thread read" ON lawyer_inquiry_messages;
CREATE POLICY "Lawyer marks thread read"
  ON lawyer_inquiry_messages FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM lawyer_inquiries i
    WHERE i.id = lawyer_inquiry_messages.inquiry_id AND i.lawyer_id = auth.uid()
  ))
  WITH CHECK (true);

-- A table grant includes every column, so revoke it and re-issue without the
-- client's contact details. Row-level security alone would not hide them.
REVOKE SELECT ON lawyer_inquiries FROM authenticated;
GRANT SELECT (id, lawyer_id, name, message, read, created_at, last_activity_at)
  ON lawyer_inquiries TO authenticated;
GRANT UPDATE (read, last_activity_at) ON lawyer_inquiries TO authenticated;

-- `email` and `phone` are deliberately absent. Do not add them back.
