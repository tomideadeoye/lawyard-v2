-- Migration: Add pending_review status, remove category constraint
ALTER TABLE articles
DROP CONSTRAINT IF EXISTS articles_status_check,
ADD CONSTRAINT articles_status_check CHECK (status IN ('draft', 'pending_review', 'published', 'archived'));

ALTER TABLE articles
DROP CONSTRAINT IF EXISTS articles_category_check;
