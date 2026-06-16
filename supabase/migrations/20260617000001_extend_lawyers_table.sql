-- Extend lawyers table with listing fields matching live directory.lawyard.org

ALTER TABLE lawyers ADD COLUMN IF NOT EXISTS brief_bio TEXT;
ALTER TABLE lawyers ADD COLUMN IF NOT EXISTS age INT;
ALTER TABLE lawyers ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE lawyers ADD COLUMN IF NOT EXISTS enrollment_number TEXT;
ALTER TABLE lawyers ADD COLUMN IF NOT EXISTS enrollment_number_tx TEXT;
ALTER TABLE lawyers ADD COLUMN IF NOT EXISTS organization_memberships TEXT[] DEFAULT '{}';
ALTER TABLE lawyers ADD COLUMN IF NOT EXISTS publications TEXT[] DEFAULT '{}';
ALTER TABLE lawyers ADD COLUMN IF NOT EXISTS awards TEXT[] DEFAULT '{}';
ALTER TABLE lawyers ADD COLUMN IF NOT EXISTS volunteer_pro_bono TEXT[] DEFAULT '{}';
ALTER TABLE lawyers ADD COLUMN IF NOT EXISTS intro_video_url TEXT;
ALTER TABLE lawyers ADD COLUMN IF NOT EXISTS gallery_images TEXT[] DEFAULT '{}';
ALTER TABLE lawyers ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '[]'::jsonb;
ALTER TABLE lawyers ADD COLUMN IF NOT EXISTS zip_code TEXT;
ALTER TABLE lawyers ADD COLUMN IF NOT EXISTS price_range TEXT CHECK (price_range IN ('cheap', 'economy', 'moderate', 'ultra_high'));
ALTER TABLE lawyers ADD COLUMN IF NOT EXISTS hide_contact_form BOOLEAN DEFAULT false;
ALTER TABLE lawyers ADD COLUMN IF NOT EXISTS working_hours JSONB DEFAULT '[]'::jsonb;
ALTER TABLE lawyers ADD COLUMN IF NOT EXISTS faqs JSONB DEFAULT '[]'::jsonb;
ALTER TABLE lawyers ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE lawyers ADD COLUMN IF NOT EXISTS listing_type TEXT DEFAULT 'general' CHECK (listing_type IN ('general', 'featured'));

-- Create a storage bucket for lawyer listing images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
SELECT 'listings', 'listings', true, 2097152, ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp']
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'listings');

-- RLS: public can view listing files
DROP POLICY IF EXISTS "Public can view listing files" ON storage.objects;
CREATE POLICY "Public can view listing files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'listings');

-- RLS: authenticated users can upload listing files
DROP POLICY IF EXISTS "Authenticated users can upload listing files" ON storage.objects;
CREATE POLICY "Authenticated users can upload listing files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'listings' AND auth.role() = 'authenticated');

-- RLS: users can delete their own listing files
DROP POLICY IF EXISTS "Users can delete own listing files" ON storage.objects;
CREATE POLICY "Users can delete own listing files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'listings' AND auth.role() = 'authenticated');
