-- Migration: Create plans table for DB-managed pricing
-- Replaces config/pricing.json so pricing can be managed without code changes

CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL CHECK (role IN ('lawyer', 'client', 'chamber')),
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  period TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  recommended BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  features JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- Everyone can read plans (pricing page is public)
CREATE POLICY "Anyone can view plans"
  ON plans FOR SELECT
  USING (true);

-- Only service_role can insert/update/delete
CREATE POLICY "Service role manages plans"
  ON plans FOR ALL
  USING (auth.role() = 'service_role');

-- Seed data from config/pricing.json
INSERT INTO plans (role, name, price, period, description, recommended, sort_order, features) VALUES
-- Lawyer plans
('lawyer', 'Premium (Package)', 20.00, '/ Per Package',
 'Best for a group of established lawyers seeking the best online visibility.',
 false, 0,
 '[{"name":"15 Featured Listings","included":true},{"name":"Website Link","included":true},{"name":"Social Profile Links","included":true},{"name":"Introductory Video","included":true},{"name":"Price Range Display","included":true},{"name":"Gallery Images (Max 5)","included":true},{"name":"Contact Owner Form","included":true},{"name":"FAQ Section","included":true},{"name":"Working Hours","included":true},{"name":"Priority in Search Results","included":true}]'),

('lawyer', 'Premium (Single)', 2.00, '/ 365 days',
 'Best for an established lawyer seeking the best online visibility.',
 true, 1,
 '[{"name":"Featured Listing","included":true},{"name":"Website Link","included":true},{"name":"Social Profile Links","included":true},{"name":"Introductory Video","included":true},{"name":"Price Range Display","included":true},{"name":"Gallery Images (Max 5)","included":true},{"name":"Contact Owner Form","included":true},{"name":"FAQ Section","included":true},{"name":"Working Hours","included":true},{"name":"Priority in Search Results","included":true}]'),

('lawyer', 'Free', 0.00, '/ Lifetime',
 'For a lawyer just getting started with online visibility.',
 false, 2,
 '[{"name":"Featured Listing","included":false},{"name":"Website Link","included":false},{"name":"Social Profile Links","included":false},{"name":"Introductory Video","included":false},{"name":"Price Range Display","included":false},{"name":"Gallery Images (Max 5)","included":false},{"name":"Contact Owner Form","included":true},{"name":"FAQ Section","included":false},{"name":"Working Hours","included":false},{"name":"Priority in Search Results","included":false}]'),

-- Client plans
('client', 'Free Access', 0.00, '/ Forever',
 'Search and contact lawyers for free.',
 true, 0,
 '[{"name":"Search Directory","included":true},{"name":"Bookmark Lawyers","included":true},{"name":"Contact Lawyers","included":true},{"name":"View Published Articles","included":true}]'),

-- Chamber plans
('chamber', 'Enterprise', 150.00, '/ Year',
 'Comprehensive visibility for established law chambers.',
 true, 0,
 '[{"name":"Featured Listing","included":true},{"name":"Website Link","included":true},{"name":"Social Profile Links","included":true},{"name":"Introductory Video","included":true},{"name":"Price Range Display","included":true},{"name":"Gallery Images (Max 5)","included":true},{"name":"Contact Owner Form","included":true},{"name":"FAQ Section","included":true},{"name":"Working Hours","included":true},{"name":"Priority in Search Results","included":true}]'),

('chamber', 'Basic', 0.00, '/ Lifetime',
 'Basic directory listing for law chambers.',
 false, 1,
 '[{"name":"Featured Listing","included":false},{"name":"Website Link","included":false},{"name":"Social Profile Links","included":false},{"name":"Introductory Video","included":false},{"name":"Price Range Display","included":false},{"name":"Gallery Images (Max 5)","included":false},{"name":"Contact Owner Form","included":true},{"name":"FAQ Section","included":false},{"name":"Working Hours","included":false},{"name":"Priority in Search Results","included":false}]');
