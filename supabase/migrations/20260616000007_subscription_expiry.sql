-- Add subscription expiry tracking

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

-- Backfill: set existing premium subscriptions to expire 365 days from now
UPDATE profiles 
SET subscription_expires_at = now() + interval '365 days'
WHERE subscription_tier IN ('premium_single', 'premium_package', 'enterprise')
  AND subscription_expires_at IS NULL;
