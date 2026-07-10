CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'free')),
  discount_value INTEGER CHECK (discount_value > 0 AND discount_value <= 100),
  max_uses INTEGER,
  frequency_days INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Only service_role can manage coupons
CREATE POLICY "Service role manages coupons"
  ON coupons FOR ALL
  TO service_role
  USING (true);

INSERT INTO coupons (code, discount_type, discount_value, frequency_days, description) VALUES
  ('PARTNER1', 'free', NULL, 7, 'Partner post — one free Corporate Post per week'),
  ('PARTNER2', 'free', NULL, 7, 'Partner post — one free Corporate Post per week'),
  ('TEST', 'free', NULL, NULL, 'Test code — free Corporate Post');
