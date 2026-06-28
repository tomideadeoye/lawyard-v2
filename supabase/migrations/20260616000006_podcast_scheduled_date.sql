-- Add scheduled_date and pending_review status to podcasts

ALTER TABLE podcasts ADD COLUMN IF NOT EXISTS scheduled_date TIMESTAMPTZ;

ALTER TABLE podcasts
  DROP CONSTRAINT IF EXISTS podcasts_status_check,
  ADD CONSTRAINT podcasts_status_check CHECK (status IN ('draft', 'pending_review', 'published', 'archived'));
