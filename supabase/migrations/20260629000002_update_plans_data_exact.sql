-- Migration: Update plans seed data with exact feature matrix from live site
-- Verified against directory.lawyard.org/select-your-plan/ screenshots

-- Add subtitle column for display label (e.g. "Per Package", "Per Listing")
ALTER TABLE plans ADD COLUMN IF NOT EXISTS subtitle TEXT DEFAULT '';

-- Remove old seed data
DELETE FROM plans;

-- Insert lawyer plans
INSERT INTO plans (role, name, price, period, subtitle, description, recommended, sort_order, features) VALUES

('lawyer', 'Premium (Package)', 20.00, '/ 365 days', 'Per Package',
 'Best for a group of established lawyers seeking the best online visibility.',
 false, 0,
 '[
   {"name":"15 Featured Listings","included":true},
   {"name":"Website","included":true},
   {"name":"Social Profile Links","included":true},
   {"name":"Introductory Video","included":true},
   {"name":"Pricing","included":true},
   {"name":"Select Images (Maximum of 6)","included":true},
   {"name":"Link Directory (Maximum of 5)","included":true},
   {"name":"Contact Owner","included":true},
   {"name":"Allow Customer Review","included":true},
   {"name":"Claim Badge Included","included":true},
   {"name":"Booking Included","included":true},
   {"name":"Live Chat Included","included":true}
 ]'::jsonb),

('lawyer', 'Premium (Single)', 2.00, '/ 365 days', 'Per Listing',
 'Best for an established lawyer seeking the best online visibility.',
 true, 1,
 '[
   {"name":"Listing as featured","included":true},
   {"name":"Website","included":true},
   {"name":"Social Profile Links","included":true},
   {"name":"Introductory Video","included":true},
   {"name":"Pricing","included":true},
   {"name":"Select Images (Maximum of 6)","included":true},
   {"name":"Link Directory (Maximum of 5)","included":true},
   {"name":"Contact Owner","included":true},
   {"name":"Allow Customer Review","included":true},
   {"name":"Claim Badge Included","included":true},
   {"name":"Booking Included","included":true},
   {"name":"Live Chat Included","included":true}
 ]'::jsonb),

('lawyer', 'Free', 0.00, '/ Lifetime', 'Per Listing',
 'For a lawyer just getting started with online visibility.',
 false, 2,
 '[
   {"name":"Listing as featured","included":false},
   {"name":"Website","included":false},
   {"name":"Social Profile Links","included":false},
   {"name":"Introductory Video","included":true},
   {"name":"Pricing","included":false},
   {"name":"Select Images (Maximum of 3)","included":true},
   {"name":"Link Directory","included":false},
   {"name":"Contact Owner","included":true},
   {"name":"Allow Customer Review","included":false},
   {"name":"Claim Badge Included","included":true},
   {"name":"Booking Included","included":false},
   {"name":"Live Chat Included","included":false}
 ]'::jsonb),

-- Client plans (clients pay for listings too — different from lawyer plans)
('client', 'Premium (Single)', 1.00, '/ 90 days', 'Per Listing',
 'Best for individuals seeking premium visibility for their listing.',
 true, 0,
 '[
   {"name":"Listing as featured","included":true},
   {"name":"Deadline Date","included":true},
   {"name":"URL","included":true},
   {"name":"Phone number","included":true},
   {"name":"FAQs","included":true},
   {"name":"Relevant images (Maximum of 6)","included":true},
   {"name":"Contact Owner","included":true},
   {"name":"Claim Badge Included","included":true},
   {"name":"Live Chat Included","included":true}
 ]'::jsonb),

('client', 'Premium (Package)', 3.00, '/ 90 days', 'Per Package',
 'Best for groups needing multiple featured listings.',
 false, 1,
 '[
   {"name":"Regular Listings","included":false},
   {"name":"5 Featured Listings","included":true},
   {"name":"Deadline Date","included":true},
   {"name":"URL","included":true},
   {"name":"Phone number","included":true},
   {"name":"FAQs","included":true},
   {"name":"Relevant images (Maximum of 6)","included":true},
   {"name":"Contact Owner","included":true},
   {"name":"Claim Badge Included","included":true},
   {"name":"Live Chat Included","included":true}
 ]'::jsonb),

('client', 'Free', 0.00, '/ 90 days', 'Per Listing',
 'Basic listing for individuals.',
 false, 2,
 '[
   {"name":"Listing as featured","included":false},
   {"name":"Deadline Date","included":false},
   {"name":"URL","included":false},
   {"name":"Phone number","included":false},
   {"name":"FAQs","included":false},
   {"name":"Relevant images (Maximum of 3)","included":true},
   {"name":"Contact Owner","included":true},
   {"name":"Claim Badge Included","included":false},
   {"name":"Live Chat Included","included":false}
 ]'::jsonb),

-- Chamber plans
('chamber', 'Premium', 2.00, '/ 365 days', 'Per Listing',
 'Comprehensive visibility for established law chambers.',
 true, 0,
 '[
   {"name":"Listing as featured","included":true},
   {"name":"Link Directory - Lawyers (Maximum of 15)","included":true},
   {"name":"Working Hours","included":true},
   {"name":"FAQs","included":true},
   {"name":"Social Info","included":true},
   {"name":"Website","included":true},
   {"name":"Open Positions","included":true},
   {"name":"Application Form","included":true},
   {"name":"Select display picture (Maximum of 6)","included":true},
   {"name":"Pricing","included":true},
   {"name":"Contact Owner","included":true},
   {"name":"Claim Badge Included","included":true},
   {"name":"Booking Included","included":true},
   {"name":"Live Chat Included","included":true}
 ]'::jsonb),

('chamber', 'Free', 0.00, '/ Lifetime', 'Per Listing',
 'Basic directory listing for law chambers.',
 false, 1,
 '[
   {"name":"Listing as featured","included":false},
   {"name":"Link Directory - Lawyers (Maximum of 1)","included":true},
   {"name":"Working Hours","included":true},
   {"name":"FAQs","included":false},
   {"name":"Social Info","included":false},
   {"name":"Website","included":false},
   {"name":"Open Positions","included":false},
   {"name":"Application Form","included":false},
   {"name":"Select display picture (Maximum of 3)","included":true},
   {"name":"Pricing","included":false},
   {"name":"Contact Owner","included":true},
   {"name":"Claim Badge Included","included":false},
   {"name":"Booking Included","included":false},
   {"name":"Live Chat Included","included":false}
 ]'::jsonb);
