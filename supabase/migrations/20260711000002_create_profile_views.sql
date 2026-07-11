-- Profile view tracking for analytics
CREATE TABLE IF NOT EXISTS profile_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lawyer_id uuid NOT NULL REFERENCES lawyers(id) ON DELETE CASCADE,
  viewed_at timestamptz DEFAULT now(),
  date date DEFAULT CURRENT_DATE,
  referrer text DEFAULT 'direct'
);

CREATE INDEX IF NOT EXISTS idx_profile_views_lawyer_date ON profile_views(lawyer_id, date);
CREATE INDEX IF NOT EXISTS idx_profile_views_lawyer ON profile_views(lawyer_id);

ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (public tracking, no auth needed)
CREATE POLICY "Anyone can record a profile view"
  ON profile_views FOR INSERT
  WITH CHECK (true);

-- Lawyers can read their own stats
CREATE POLICY "Lawyers can read their own views"
  ON profile_views FOR SELECT
  USING (lawyer_id = auth.uid());
