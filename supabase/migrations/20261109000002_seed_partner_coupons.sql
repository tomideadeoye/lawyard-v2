-- Partner codes Tobi asked for on 8 Nov:
--   Lawyard100 — free Corporate Post, 3 uses per account
--   Lawyard30  — 30% off, 1 use per account
--
-- Idempotent: re-running only refreshes the caps, so codes already handed out
-- keep working and no duplicate rows appear.

INSERT INTO coupons (code, discount_type, discount_value, per_user_limit, max_uses, frequency_days, is_active, description)
VALUES
  ('LAWYARD100', 'free', NULL, 3, NULL, NULL, true, 'Free Corporate Post — 3 uses per account'),
  ('LAWYARD30', 'percentage', 30, 1, NULL, NULL, true, '30% off Corporate Post — 1 use per account')
ON CONFLICT (code) DO UPDATE SET
  discount_type = EXCLUDED.discount_type,
  discount_value = EXCLUDED.discount_value,
  per_user_limit = EXCLUDED.per_user_limit,
  is_active = true,
  description = EXCLUDED.description,
  updated_at = now();
