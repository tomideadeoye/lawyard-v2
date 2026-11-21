-- Ad delivery counters.
--
-- Pageviews are already covered (Vercel Analytics here, GA4 on the WordPress
-- host), but none of them can attribute a view or a click to a row in
-- `ad_slots` — so the inventory that is actually sold had no report. This is
-- the smallest thing that fixes it: a daily rollup per creative, written
-- through one SECURITY DEFINER function so anonymous readers can record an
-- event without being able to read or forge the table.

CREATE TABLE IF NOT EXISTS ad_events (
  ad_id UUID NOT NULL REFERENCES ad_slots(id) ON DELETE CASCADE,
  day DATE NOT NULL DEFAULT CURRENT_DATE,
  kind TEXT NOT NULL CHECK (kind IN ('impression','click')),
  count INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
  PRIMARY KEY (ad_id, day, kind)
);

CREATE INDEX IF NOT EXISTS idx_ad_events_day ON ad_events (day DESC);

ALTER TABLE ad_events ENABLE ROW LEVEL SECURITY;

-- No policies: the table is only reachable through the function below and the
-- service role. Neither readers nor advertisers get direct access.

CREATE OR REPLACE FUNCTION record_ad_event(p_ad_id UUID, p_kind TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Only the two counters exist; anything else is a bug, not a new event.
  IF p_kind NOT IN ('impression','click') THEN
    RAISE EXCEPTION 'unknown ad event kind: %', p_kind;
  END IF;

  -- An event for a creative that no longer exists is a stale page, not an error.
  IF NOT EXISTS (SELECT 1 FROM ad_slots WHERE id = p_ad_id) THEN
    RETURN;
  END IF;

  INSERT INTO ad_events (ad_id, day, kind, count)
  VALUES (p_ad_id, CURRENT_DATE, p_kind, 1)
  ON CONFLICT (ad_id, day, kind)
  DO UPDATE SET count = ad_events.count + 1;
END;
$$;

REVOKE ALL ON FUNCTION record_ad_event(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION record_ad_event(UUID, TEXT) TO anon, authenticated, service_role;
