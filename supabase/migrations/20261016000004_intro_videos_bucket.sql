-- C08 (12 Sep 2026): self-hosted 1-minute intro videos (premium feature).
-- Storage bucket for uploaded intro videos. (Decision named Cloudflare R2;
-- implemented on Supabase Storage to stay on the chosen backend — the upload
-- action is the swap point if R2 is adopted later.)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'intro-videos',
  'intro-videos',
  true,
  26214400, -- 25MB (~1 minute)
  ARRAY['video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view intro videos' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "Public can view intro videos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'intro-videos');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can upload intro videos' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "Authenticated users can upload intro videos"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'intro-videos');
  END IF;
END
$$;
