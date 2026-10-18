-- C05 + C02 (12 Sep 2026): content post caps, paid extra-post credits, Silver tier.
--
-- C05 — Post caps: Free = 1 post total, paid tiers = 3 posts / calendar month,
-- beyond the cap = a one-off Paystack payment that grants an extra-post credit.
-- C02 — Silver tier: adds the middle rung of the Free -> Silver -> Premium ladder.
-- (Silver contents & pricing are placeholders pending Tobi's C21 note.)

-- ---------------------------------------------------------------------------
-- Extra-post credits (ledger: +1 on purchase, -1 when consumed)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS post_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL DEFAULT 'purchase',
  reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_post_credits_user ON post_credits(user_id);

ALTER TABLE post_credits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own post credits" ON post_credits;
CREATE POLICY "Users read own post credits"
  ON post_credits FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role manages post credits" ON post_credits;
CREATE POLICY "Service role manages post credits"
  ON post_credits FOR ALL TO authenticated
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- Self-service settings (editable via admin, no deploy required)
-- ---------------------------------------------------------------------------
INSERT INTO app_settings (key, value, description) VALUES
  ('extra_post_price', '20000', 'NGN price for a one-off extra post beyond the plan cap'),
  ('post_cap_free_total', '1', 'Total content posts allowed on the free tier (lifetime)'),
  ('post_cap_paid_per_month', '3', 'Content posts per calendar month allowed on paid tiers')
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- C02: Silver tier placeholder plan (one per role)
-- ---------------------------------------------------------------------------
INSERT INTO plans (role, name, price, period, subtitle, description, recommended, sort_order, features)
SELECT * FROM (VALUES
  ('lawyer'::text, 'Silver', 0.00, '/ 365 days', 'Per Listing', 'PLACEHOLDER - Silver tier; contents & pricing pending confirmation (C21).', false, 1, '[]'::jsonb),
  ('client', 'Silver', 0.00, '/ 90 days', 'Per Listing', 'PLACEHOLDER - Silver tier; contents & pricing pending confirmation (C21).', false, 1, '[]'::jsonb),
  ('chamber', 'Silver', 0.00, '/ 365 days', 'Per Listing', 'PLACEHOLDER - Silver tier; contents & pricing pending confirmation (C21).', false, 1, '[]'::jsonb)
) AS v(role, name, price, period, subtitle, description, recommended, sort_order, features)
WHERE NOT EXISTS (
  SELECT 1 FROM plans p WHERE p.role = v.role AND p.name = 'Silver'
);
