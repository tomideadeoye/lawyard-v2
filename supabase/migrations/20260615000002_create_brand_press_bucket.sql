-- Create brand-press storage bucket for featured images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'brand-press',
  'brand-press',
  true,
  512000, -- 500KB
  ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to read brand-press images
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view brand-press images' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "Public can view brand-press images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'brand-press');
  END IF;
END
$$;

-- Allow authenticated users to upload brand-press images
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can upload brand-press images' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "Authenticated users can upload brand-press images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'brand-press');
  END IF;
END
$$;
