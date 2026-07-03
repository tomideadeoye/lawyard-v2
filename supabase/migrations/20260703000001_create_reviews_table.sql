-- Create reviews table for lawyer ratings
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lawyer_id UUID NOT NULL REFERENCES lawyers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lawyer review lookups
CREATE INDEX IF NOT EXISTS idx_reviews_lawyer_id ON reviews(lawyer_id);

-- Auto-compute rating and reviews_count on lawyers when reviews change
CREATE OR REPLACE FUNCTION recalc_lawyer_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE lawyers SET
    rating = COALESCE(
      (SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews WHERE lawyer_id = COALESCE(NEW.lawyer_id, OLD.lawyer_id)),
      0.0
    ),
    reviews_count = (
      SELECT COUNT(*) FROM reviews WHERE lawyer_id = COALESCE(NEW.lawyer_id, OLD.lawyer_id)
    )
  WHERE id = COALESCE(NEW.lawyer_id, OLD.lawyer_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_recalc_lawyer_rating_insert ON reviews;
CREATE TRIGGER trg_recalc_lawyer_rating_insert
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION recalc_lawyer_rating();

DROP TRIGGER IF EXISTS trg_recalc_lawyer_rating_update ON reviews;
CREATE TRIGGER trg_recalc_lawyer_rating_update
  AFTER UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION recalc_lawyer_rating();

DROP TRIGGER IF EXISTS trg_recalc_lawyer_rating_delete ON reviews;
CREATE TRIGGER trg_recalc_lawyer_rating_delete
  AFTER DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION recalc_lawyer_rating();

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read reviews
CREATE POLICY "Anyone can read reviews"
  ON reviews FOR SELECT
  USING (true);

-- Authenticated users can create reviews
CREATE POLICY "Authenticated users can create reviews"
  ON reviews FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Users can update their own reviews
CREATE POLICY "Users can update own reviews"
  ON reviews FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete own reviews"
  ON reviews FOR DELETE
  USING (auth.uid() = user_id);
