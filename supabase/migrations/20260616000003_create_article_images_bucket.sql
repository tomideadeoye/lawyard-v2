-- Create article-images storage bucket for featured images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'article-images',
  'article-images',
  true,
  2097152, -- 2MB
  ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to read article images
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view article images' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "Public can view article images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'article-images');
  END IF;
END
$$;

-- Allow authenticated users to upload article images
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can upload article images' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "Authenticated users can upload article images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'article-images');
  END IF;
END
$$;

-- Users can delete their own article images
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own article images' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "Users can delete own article images"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'article-images' AND auth.role() = 'authenticated');
  END IF;
END
$$;
