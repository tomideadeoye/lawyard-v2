-- C22 (21 Nov 2026): chamber membership as a first-class relation, billed per seat.
--
-- Until now "being in a firm" was a single mutable column: lawyers.chamber_id.
-- Nobody could add a lawyer to a firm, no lawyer could join one, nobody could
-- leave, and the price sheet's seat limits ("Maximum of 15 lawyers") were copy
-- with no enforcement. A firm could attach unlimited lawyers on the free tier.
--
-- This migration makes membership its own row with history, puts a seat cap on
-- the chamber, and makes activation atomic so two simultaneous accepts cannot
-- both take the last seat.
--
-- Model:
--   profiles.role      what a person can do alone        (client | lawyer | admin)
--   chamber_admins     who may edit the firm page        (owner | admin)
--   chamber_members    who occupies a paid seat          (this table)
--   lawyers.chamber_id denormalised cache of the active membership, for reads

-- ---------------------------------------------------------------------------
-- Seats on the chamber
-- ---------------------------------------------------------------------------
-- seat_limit is what the firm bought (per-seat billing), not a tier constant.
-- Free firms get exactly one seat: the owner. Legacy paid chambers inherit the
-- 15 the old price sheet advertised; a real purchase overwrites it.
ALTER TABLE chambers ADD COLUMN IF NOT EXISTS seat_limit INTEGER NOT NULL DEFAULT 1;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chambers_seat_limit_positive'
  ) THEN
    ALTER TABLE chambers ADD CONSTRAINT chambers_seat_limit_positive CHECK (seat_limit >= 1);
  END IF;
END $$;

UPDATE chambers
SET seat_limit = 15
WHERE seat_limit = 1
  AND subscription_tier <> 'free'
  AND subscription_status = 'active';

-- ---------------------------------------------------------------------------
-- Membership rows
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chamber_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chamber_id UUID NOT NULL REFERENCES chambers(id) ON DELETE CASCADE,
  -- membership does not require a published listing: a lawyer can accept a seat
  -- before their profile is filled in, and keeps the seat if the listing lapses.
  lawyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seat_role TEXT NOT NULL DEFAULT 'member' CHECK (seat_role IN ('partner', 'member', 'associate', 'of_counsel')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'ended', 'declined')),
  -- who started it: an admin invite, or the lawyer asking to join
  invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  requested_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  joined_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  ended_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- A person can hold one open membership at a time. Firms compete for lawyers;
-- the directory must not show the same person in two firms at once.
CREATE UNIQUE INDEX IF NOT EXISTS one_open_membership_per_lawyer
  ON chamber_members (lawyer_id)
  WHERE status IN ('pending', 'active');

CREATE INDEX IF NOT EXISTS idx_chamber_members_chamber
  ON chamber_members (chamber_id, status);

ALTER TABLE chamber_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members and firm admins read memberships" ON chamber_members;
CREATE POLICY "Members and firm admins read memberships"
  ON chamber_members FOR SELECT TO authenticated
  USING (
    lawyer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM chamber_admins ca
      WHERE ca.chamber_id = chamber_members.chamber_id
        AND ca.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM chambers c
      WHERE c.id = chamber_members.chamber_id
        AND c.user_id = auth.uid()
    )
  );

-- All writes go through server actions that authorise first and then use the
-- service role, so the browser can never write a seat directly.
DROP POLICY IF EXISTS "Service role manages memberships" ON chamber_members;
CREATE POLICY "Service role manages memberships"
  ON chamber_members FOR ALL TO authenticated
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- Invites (email-first, token-redeemable)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chamber_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chamber_id UUID NOT NULL REFERENCES chambers(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  seat_role TEXT NOT NULL DEFAULT 'member' CHECK (seat_role IN ('partner', 'member', 'associate', 'of_counsel')),
  -- two uuids, stripped: 64 hex chars. Avoids depending on pgcrypto.
  token TEXT NOT NULL UNIQUE
    DEFAULT replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
  invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + interval '14 days',
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chamber_invites_chamber ON chamber_invites (chamber_id, accepted_at);
CREATE UNIQUE INDEX IF NOT EXISTS one_live_invite_per_email
  ON chamber_invites (chamber_id, lower(email))
  WHERE accepted_at IS NULL AND revoked_at IS NULL;

ALTER TABLE chamber_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Firm admins read invites" ON chamber_invites;
CREATE POLICY "Firm admins read invites"
  ON chamber_invites FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chamber_admins ca
      WHERE ca.chamber_id = chamber_invites.chamber_id AND ca.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM chambers c
      WHERE c.id = chamber_invites.chamber_id AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service role manages invites" ON chamber_invites;
CREATE POLICY "Service role manages invites"
  ON chamber_invites FOR ALL TO authenticated
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- Seat count + atomic activation
-- ---------------------------------------------------------------------------
-- Active seats only. A pending invite is not a seat: over-inviting is allowed,
-- the last person to accept is the one who gets told to buy another seat.
CREATE OR REPLACE FUNCTION public.chamber_seats_used(p_chamber_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(count(*), 0)::int
  FROM chamber_members
  WHERE chamber_id = p_chamber_id AND status = 'active';
$$;

REVOKE ALL ON FUNCTION public.chamber_seats_used(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.chamber_seats_used(UUID) TO authenticated, service_role;

-- Activates a pending membership. Caller must be the lawyer themselves or an
-- admin/owner of the firm. Row-locks the chamber so concurrent accepts serialise
-- on the seat count instead of both reading "14 of 15".
CREATE OR REPLACE FUNCTION public.chamber_accept_seat(p_member_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  m chamber_members;
  cap INTEGER;
  used INTEGER;
  caller UUID := auth.uid();
  authorised BOOLEAN;
BEGIN
  IF caller IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated');
  END IF;

  SELECT * INTO m FROM chamber_members WHERE id = p_member_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;
  IF m.status <> 'pending' THEN
    RETURN jsonb_build_object('error', 'not_pending', 'status', m.status);
  END IF;

  authorised := (m.lawyer_id = caller)
    OR EXISTS (SELECT 1 FROM chamber_admins ca WHERE ca.chamber_id = m.chamber_id AND ca.user_id = caller)
    OR EXISTS (SELECT 1 FROM chambers c WHERE c.id = m.chamber_id AND c.user_id = caller);

  IF NOT authorised THEN
    RETURN jsonb_build_object('error', 'forbidden');
  END IF;

  SELECT seat_limit INTO cap FROM chambers WHERE id = m.chamber_id FOR UPDATE;
  IF cap IS NULL THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;

  SELECT count(*) INTO used FROM chamber_members WHERE chamber_id = m.chamber_id AND status = 'active';

  IF used >= cap THEN
    RETURN jsonb_build_object('error', 'seat_limit_reached', 'cap', cap, 'used', used);
  END IF;

  UPDATE chamber_members
  SET status = 'active', joined_at = now(), updated_at = now()
  WHERE id = m.id;

  -- Cache for public reads. A member without a listing simply has no row to update.
  UPDATE lawyers SET chamber_id = m.chamber_id WHERE id = m.lawyer_id;

  RETURN jsonb_build_object('ok', true, 'seat', used + 1, 'cap', cap);
END;
$$;

REVOKE ALL ON FUNCTION public.chamber_accept_seat(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.chamber_accept_seat(UUID) TO authenticated, service_role;

-- Ends a membership, whether the lawyer leaves or the firm removes them.
-- Idempotent: ending an already-ended row is a no-op. Never deletes the lawyer's
-- listing — only the firm link.
CREATE OR REPLACE FUNCTION public.chamber_end_seat(p_member_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  m chamber_members;
  caller UUID := auth.uid();
  authorised BOOLEAN;
BEGIN
  IF caller IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated');
  END IF;

  SELECT * INTO m FROM chamber_members WHERE id = p_member_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;

  authorised := (m.lawyer_id = caller)
    OR EXISTS (SELECT 1 FROM chamber_admins ca WHERE ca.chamber_id = m.chamber_id AND ca.user_id = caller)
    OR EXISTS (SELECT 1 FROM chambers c WHERE c.id = m.chamber_id AND c.user_id = caller);

  IF NOT authorised THEN
    RETURN jsonb_build_object('error', 'forbidden');
  END IF;

  IF m.status = 'ended' THEN
    RETURN jsonb_build_object('ok', true, 'already_ended', true);
  END IF;

  -- The billing owner cannot be removed by a delegate admin. Only they can step
  -- down, and that is a support conversation, not a button.
  IF m.lawyer_id = (SELECT user_id FROM chambers WHERE id = m.chamber_id)
     AND caller <> m.lawyer_id THEN
    RETURN jsonb_build_object('error', 'owner_cannot_be_removed');
  END IF;

  UPDATE chamber_members
  SET status = 'ended', ended_at = now(), ended_by = caller,
      note = COALESCE(p_reason, note), updated_at = now()
  WHERE id = m.id;

  -- Only unlink if this chamber is still the current link (never cut a newer one).
  UPDATE lawyers SET chamber_id = NULL
  WHERE id = m.lawyer_id AND chamber_id = m.chamber_id;

  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.chamber_end_seat(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.chamber_end_seat(UUID, TEXT) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Backfill so the model starts true for existing data
-- ---------------------------------------------------------------------------
-- Every existing owner is an admin row (legacy chambers predate C17).
INSERT INTO chamber_admins (chamber_id, user_id, role)
SELECT id, user_id, 'owner'
FROM chambers
WHERE user_id IS NOT NULL
ON CONFLICT (chamber_id, user_id) DO NOTHING;

-- Every lawyer currently linked to a chamber becomes an active member, and the
-- owner of a chamber holds the first seat. Ordered so the owner wins the seat if
-- the chamber somehow already has more lawyers than seats.
INSERT INTO chamber_members (chamber_id, lawyer_id, seat_role, status, joined_at, invited_by)
SELECT chamber_id, lawyer_id, seat_role, 'active', joined_at, NULL
FROM (
  SELECT
    l.chamber_id,
    l.id AS lawyer_id,
    CASE WHEN c.user_id = l.id THEN 'partner' ELSE 'member' END AS seat_role,
    COALESCE(l.created_at, now()) AS joined_at,
    ROW_NUMBER() OVER (
      PARTITION BY l.chamber_id
      ORDER BY (c.user_id = l.id) DESC, l.created_at ASC NULLS LAST
    ) AS seat_rank
  FROM lawyers l
  JOIN chambers c ON c.id = l.chamber_id
  -- Legacy WordPress-era listings may have ids that never became auth users;
  -- there is nobody to give a seat to, so they are skipped.
  WHERE EXISTS (SELECT 1 FROM auth.users u WHERE u.id = l.id)
) ranked
WHERE seat_rank <= GREATEST((SELECT seat_limit FROM chambers c2 WHERE c2.id = ranked.chamber_id), 1)
ON CONFLICT DO NOTHING;

-- Anyone left over (over-cap legacy data) is captured in the ledger as ended-lite
-- rather than silently dropped: their listing stays linked, but they are not an
-- active seat. The firm sees them as "unseated" and must buy seats or remove them.
INSERT INTO chamber_members (chamber_id, lawyer_id, seat_role, status, joined_at, note)
SELECT l.chamber_id, l.id, 'member', 'ended', COALESCE(l.created_at, now()),
       'Legacy link beyond the seat cap on migration (C22).'
FROM lawyers l
WHERE l.chamber_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM auth.users u WHERE u.id = l.id)
  AND NOT EXISTS (
    SELECT 1 FROM chamber_members m
    WHERE m.chamber_id = l.chamber_id AND m.lawyer_id = l.id
  );
