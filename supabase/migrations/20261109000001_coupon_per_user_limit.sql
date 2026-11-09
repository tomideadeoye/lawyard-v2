-- Per-account redemption caps for coupons.
--
-- `max_uses` is a global cap and `frequency_days` is a global cooldown — neither
-- expresses "an account may use this three times", which is what partner codes
-- like Lawyard100 need. Redemptions are attributed through the transaction
-- metadata written at submit time (`metadata->>submitter_id`).
--
-- NULL = no per-account cap (existing codes keep their behaviour).

ALTER TABLE coupons
  ADD COLUMN IF NOT EXISTS per_user_limit INTEGER
  CHECK (per_user_limit IS NULL OR per_user_limit > 0);

COMMENT ON COLUMN coupons.per_user_limit IS
  'Max redemptions per submitting account (transactions.metadata->>submitter_id). NULL = unlimited.';

-- Usage lookups hit transactions by coupon + account.
CREATE INDEX IF NOT EXISTS idx_transactions_coupon_submitter
  ON transactions ((metadata->>'coupon_code'), (metadata->>'submitter_id'));
