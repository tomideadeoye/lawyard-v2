-- House ad inventory.
--
-- The WordPress site carried four ad placements as hand-edited theme slots
-- (ad_before_content, ad_after_content, ad_container_bottom) plus an AdSense
-- widget. Nothing about them was data: swapping a creative meant editing a
-- post body. This table makes each creative a row so the sales side can change
-- inventory without a deploy, and so the render side can reserve space from
-- real image dimensions instead of shifting the article when an ad loads.

CREATE TABLE IF NOT EXISTS ad_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Where it renders. Kept as a CHECK, not an enum, so adding a placement is a
  -- one-line migration rather than a type migration.
  placement TEXT NOT NULL CHECK (placement IN ('article-before','article-after','footer-banner','sidebar')),
  label TEXT NOT NULL DEFAULT 'Advertisement',
  image_url TEXT NOT NULL,
  href TEXT NOT NULL,
  alt TEXT,
  -- Intrinsic size, so the slot reserves its box before the image arrives.
  image_width INTEGER,
  image_height INTEGER,
  -- Higher weight wins when a placement holds more than one live creative.
  weight INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ad_slots_placement ON ad_slots (placement) WHERE is_active;

ALTER TABLE ad_slots ENABLE ROW LEVEL SECURITY;

-- Anyone can read a creative that is live right now; the render component never
-- has to be trusted with the filter.
DROP POLICY IF EXISTS "Anyone can view live ads" ON ad_slots;
CREATE POLICY "Anyone can view live ads"
  ON ad_slots FOR SELECT
  USING (
    is_active
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at IS NULL OR ends_at > now())
  );

DROP POLICY IF EXISTS "Service role manages ads" ON ad_slots;
CREATE POLICY "Service role manages ads"
  ON ad_slots FOR ALL TO authenticated
  USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Seed parity with the live WordPress page: the two DOA Handbook banners in the
-- article body and the end-of-article strip. Both land on the LawPavilion store
-- and are external, so they are marked as such by the component (rel=sponsored).
INSERT INTO ad_slots (placement, label, image_url, href, alt, image_width, image_height, weight)
SELECT * FROM (VALUES
  ('article-before', 'Advertisement',
   'https://www.lawyard.org/wp-content/uploads/2021/03/IMG-20250910-WA0025.jpg',
   'https://lpstore.lawpavilion.com/texts-and-journals/416',
   'DOA Handbook on Nigerian Competition Law, Volume 1', 499, 620, 10),
  ('article-after', 'Advertisement',
   'https://www.lawyard.org/wp-content/uploads/2021/03/IMG-20250910-WA0025.jpg',
   'https://lpstore.lawpavilion.com/texts-and-journals/417',
   'DOA Handbook on Nigerian Competition Law, Volume 2', 499, 620, 10),
  ('footer-banner', 'Advertisement',
   'https://www.lawyard.org/wp-content/uploads/2021/03/End-Advertisement-1024x127.jpg',
   'https://www.lawyard.org/contact/',
   'Advertise with Lawyard', 1024, 127, 10)
) AS seed(placement, label, image_url, href, alt, image_width, image_height, weight)
WHERE NOT EXISTS (SELECT 1 FROM ad_slots);
