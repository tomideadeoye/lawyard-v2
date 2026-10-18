-- C11 (12 Sep 2026): Law Firm (chamber) page parity.
-- Adds the profile fields lawyers already have — working hours, FAQs, gallery
-- images, and an intro video — so the firm page reaches full parity.

ALTER TABLE chambers
  ADD COLUMN IF NOT EXISTS working_hours jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS faqs jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS gallery_images jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS intro_video_url text;
