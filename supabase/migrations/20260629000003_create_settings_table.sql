-- App settings table — key-value config managed via admin panel
-- Purpose: store auto_approve_hours, clash_window_minutes, etc.
-- so the project is self-service without code/env changes

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Seed defaults
INSERT INTO app_settings (key, value, description) VALUES
  ('auto_approve_hours', '24', 'Hours after which an unreviewed article auto-publishes'),
  ('brand_press_clash_window_minutes', '60', 'Minimum minutes between two Corporate Post scheduled dates')
ON CONFLICT (key) DO NOTHING;

-- Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Admins can read settings
CREATE POLICY "Admins can read settings"
  ON app_settings FOR SELECT
  TO authenticated
  USING (auth.role() = 'service_role' OR auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  ));

-- Admins can update settings
CREATE POLICY "Admins can update settings"
  ON app_settings FOR UPDATE
  TO authenticated
  USING (auth.role() = 'service_role' OR auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  ))
  WITH CHECK (auth.role() = 'service_role' OR auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  ));

-- Service role can do everything (for edge function)
CREATE POLICY "Service role full access"
  ON app_settings FOR ALL
  TO authenticated
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Allow anon/authenticated reads for edge function via service_role key
CREATE POLICY "Public read for edge function"
  ON app_settings FOR SELECT
  TO anon, authenticated
  USING (true);
