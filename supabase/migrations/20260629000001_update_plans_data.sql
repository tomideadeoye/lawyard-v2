-- Migration: Update plans seed data to match live WordPress site
-- Replaces old seed data (lawyer + client + chamber) with exact
-- plans, features, and pricing from directory.lawyard.org/select-your-plan/

-- First, remove old seed data (keep table structure)
DELETE FROM plans;

-- Insert lawyer plans (also used for clients tab on original site)
INSERT INTO plans (role, name, price, period, description, recommended, sort_order, features) VALUES

('lawyer', 'Premium (Package)', 20.00, '/ Per Package',
 'Best for a group of established lawyers seeking the best online visibility.',
 false, 0,
 '[{"name":"Listing as featured","included":true},{"name":"Website","included":true},{"name":"Social Profile Links","included":true},{"name":"Introductory Video","included":true},{"name":"Pricing","included":true},{"name":"Select Images (Max 6)","included":true},{"name":"Link Directory (Max 5)","included":true},{"name":"Contact Owner","included":true},{"name":"Allow Customer Review","included":true},{"name":"Claim Badge Included","included":true},{"name":"Booking Included","included":true},{"name":"Live Chat Included","included":true}]'),

('lawyer', 'Premium (Single)', 2.00, '/ 365 days',
 'Best for an established lawyer seeking the best online visibility.',
 true, 1,
 '[{"name":"Listing as featured","included":true},{"name":"Website","included":true},{"name":"Social Profile Links","included":true},{"name":"Introductory Video","included":true},{"name":"Pricing","included":true},{"name":"Select Images (Max 6)","included":true},{"name":"Link Directory (Max 5)","included":true},{"name":"Contact Owner","included":true},{"name":"Allow Customer Review","included":true},{"name":"Claim Badge Included","included":true},{"name":"Booking Included","included":true},{"name":"Live Chat Included","included":true}]'),

('lawyer', 'Free', 0.00, '/ Lifetime',
 'For a lawyer just getting started with online visibility.',
 false, 2,
 '[{"name":"Listing as featured","included":false},{"name":"Website","included":false},{"name":"Social Profile Links","included":false},{"name":"Introductory Video","included":false},{"name":"Pricing","included":false},{"name":"Select Images (Max 3)","included":true},{"name":"Link Directory","included":true},{"name":"Contact Owner","included":true},{"name":"Allow Customer Review","included":false},{"name":"Claim Badge Included","included":false},{"name":"Booking Included","included":false},{"name":"Live Chat Included","included":false}]'),

-- Chamber plans (different feature set from lawyers)
('chamber', 'Premium', 2.00, '/ 365 days',
 'Comprehensive visibility for established law chambers.',
 true, 0,
 '[{"name":"Listing as featured","included":true},{"name":"Link Directory - Lawyers (Max 15)","included":true},{"name":"Working Hours","included":true},{"name":"FAQs","included":true},{"name":"Social Info","included":true},{"name":"Website","included":true},{"name":"Open Positions","included":true},{"name":"Application Form","included":true},{"name":"Select display picture (Max 6)","included":true},{"name":"Pricing","included":true},{"name":"Contact Owner","included":true},{"name":"Claim Badge Included","included":true},{"name":"Booking Included","included":true},{"name":"Live Chat Included","included":true}]'),

('chamber', 'Free', 0.00, '/ Lifetime',
 'Basic directory listing for law chambers.',
 false, 1,
 '[{"name":"Listing as featured","included":false},{"name":"Link Directory - Lawyers (Max 1)","included":true},{"name":"Working Hours","included":false},{"name":"FAQs","included":false},{"name":"Social Info","included":false},{"name":"Website","included":false},{"name":"Open Positions","included":false},{"name":"Application Form","included":false},{"name":"Select display picture (Max 3)","included":true},{"name":"Pricing","included":false},{"name":"Contact Owner","included":true},{"name":"Claim Badge Included","included":false},{"name":"Booking Included","included":false},{"name":"Live Chat Included","included":false}]');
