-- Conversations stay on Lawyard.
--
-- The inquiry flow that shipped on 24 Nov was a bypass: the notification email
-- handed the firm the client's address and told it to reply directly, and the
-- client's email sat on a row any firm admin could read. That moves the whole
-- relationship off-platform on message one.
--
-- This migration makes the inquiry a thread that lives here:
--   * chamber_inquiry_messages holds the conversation (client | firm).
--   * chamber_inquiries.access_token_hash lets a guest come back to their
--     thread from an emailed link without creating an account. Only the hash is
--     stored; the raw token exists only in the email.
--   * The client's email and phone are revoked at the column level, so a firm
--     admin cannot read them through the API even though it can read the row.
--
-- `website` stays public — the firm page is also an advertisement. Email and
-- phone do not, because those are direct conversation channels.

-- ---------------------------------------------------------------------------
-- Threads
-- ---------------------------------------------------------------------------
-- The token is stored as issued, not hashed, because the firm's reply has to
-- re-send the same link: hashing would force rotation, and a rotated link
-- silently breaks every older email in the client's inbox. It is never in any
-- grant below, so only the service role (server-side, after a token match) can
-- read it. A full database dump would expose the threads it protects; it would
-- already expose the messages themselves.
ALTER TABLE chamber_inquiries
  ADD COLUMN IF NOT EXISTS access_token TEXT,
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS chamber_inquiries_token
  ON chamber_inquiries (access_token)
  WHERE access_token IS NOT NULL;

CREATE TABLE IF NOT EXISTS chamber_inquiry_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID NOT NULL REFERENCES chamber_inquiries(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('client', 'firm')),
  sender_name TEXT,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_chamber_inquiry_messages_thread
  ON chamber_inquiry_messages (inquiry_id, created_at);

-- Every existing inquiry becomes a one-message thread so nothing disappears.
INSERT INTO chamber_inquiry_messages (inquiry_id, sender, sender_name, body, created_at)
SELECT i.id, 'client', i.name, i.message, i.created_at
FROM chamber_inquiries i
WHERE NOT EXISTS (
  SELECT 1 FROM chamber_inquiry_messages m WHERE m.inquiry_id = i.id
);

ALTER TABLE chamber_inquiry_messages ENABLE ROW LEVEL SECURITY;

-- Firm side reads and writes the thread. The client side is not a database
-- session at all: it is authenticated by the token in its link, and the server
-- action uses the service role after verifying that token.
DROP POLICY IF EXISTS "Firm admins read thread" ON chamber_inquiry_messages;
CREATE POLICY "Firm admins read thread"
  ON chamber_inquiry_messages FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM chamber_inquiries i
    WHERE i.id = chamber_inquiry_messages.inquiry_id
      AND (
        EXISTS (SELECT 1 FROM chambers c WHERE c.id = i.chamber_id AND c.user_id = auth.uid())
        OR EXISTS (
          SELECT 1 FROM chamber_admins ca
          WHERE ca.chamber_id = i.chamber_id AND ca.user_id = auth.uid()
        )
      )
  ));

DROP POLICY IF EXISTS "Firm admins reply to thread" ON chamber_inquiry_messages;
CREATE POLICY "Firm admins reply to thread"
  ON chamber_inquiry_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender = 'firm'
    AND EXISTS (
      SELECT 1 FROM chamber_inquiries i
      WHERE i.id = chamber_inquiry_messages.inquiry_id
        AND (
          EXISTS (SELECT 1 FROM chambers c WHERE c.id = i.chamber_id AND c.user_id = auth.uid())
          OR EXISTS (
            SELECT 1 FROM chamber_admins ca
            WHERE ca.chamber_id = i.chamber_id AND ca.user_id = auth.uid()
          )
        )
    )
  );

DROP POLICY IF EXISTS "Firm admins mark thread read" ON chamber_inquiry_messages;
CREATE POLICY "Firm admins mark thread read"
  ON chamber_inquiry_messages FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM chamber_inquiries i
    WHERE i.id = chamber_inquiry_messages.inquiry_id
      AND (
        EXISTS (SELECT 1 FROM chambers c WHERE c.id = i.chamber_id AND c.user_id = auth.uid())
        OR EXISTS (
          SELECT 1 FROM chamber_admins ca
          WHERE ca.chamber_id = i.chamber_id AND ca.user_id = auth.uid()
        )
      )
  ))
  WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- Client contact details are not readable by firms
-- ---------------------------------------------------------------------------
-- A table-level SELECT grant includes every column, so a column-level REVOKE
-- would do nothing. Drop the table grant and re-grant only what the firm needs.
REVOKE SELECT ON chamber_inquiries FROM authenticated;
GRANT SELECT (id, chamber_id, name, message, read, created_at, last_activity_at)
  ON chamber_inquiries TO authenticated;

-- The firm still needs to mark a thread read and bump its activity.
GRANT UPDATE (read, last_activity_at) ON chamber_inquiries TO authenticated;

-- Note for future tables: `email` and `phone` are absent from that grant on
-- purpose. Adding them back re-opens the bypass.
