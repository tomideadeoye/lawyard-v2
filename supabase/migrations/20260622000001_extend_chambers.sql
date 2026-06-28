-- Extend chambers table for subscription model + contact info

ALTER TABLE chambers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE chambers ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE chambers ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE chambers ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE chambers ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE chambers ADD COLUMN IF NOT EXISTS subscription_tier TEXT NOT NULL DEFAULT 'free'
  CHECK (subscription_tier IN ('free', 'premium_package', 'enterprise'));
ALTER TABLE chambers ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'inactive'
  CHECK (subscription_status IN ('inactive', 'active', 'expired'));
ALTER TABLE chambers ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

-- Seed chambers are orphan data — set user_id to admin for now
DO $$
DECLARE
  admin_id UUID;
BEGIN
  SELECT id INTO admin_id FROM profiles WHERE role = 'admin' LIMIT 1;
  IF admin_id IS NOT NULL THEN
    UPDATE chambers SET user_id = admin_id WHERE user_id IS NULL;
  END IF;
END $$;

-- RLS: public read, owner writes, admin full access
DROP POLICY IF EXISTS "Chambers data is publicly readable" ON chambers;
CREATE POLICY "Chambers are publicly readable" ON chambers FOR SELECT USING (true);

CREATE POLICY "Chamber owners can insert" ON chambers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Chamber owners can update" ON chambers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admin full access" ON chambers FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
