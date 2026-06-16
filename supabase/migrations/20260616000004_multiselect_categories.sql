-- Make articles.category a text array for multiselect support

-- First drop the old default so we can change the type
ALTER TABLE articles ALTER COLUMN category DROP DEFAULT;

-- Now change the column type
ALTER TABLE articles
  DROP CONSTRAINT IF EXISTS articles_category_check,
  ALTER COLUMN category TYPE TEXT[] USING CASE
    WHEN category IS NULL OR category = '' THEN ARRAY['general-practice']::TEXT[]
    ELSE ARRAY[category]::TEXT[]
  END,
  ALTER COLUMN category SET DEFAULT ARRAY['general-practice']::TEXT[];

-- Add category to podcasts
ALTER TABLE podcasts ADD COLUMN IF NOT EXISTS category TEXT[] DEFAULT ARRAY['general-practice']::TEXT[];

-- Drop old constraint if still around
ALTER TABLE articles
  DROP CONSTRAINT IF EXISTS articles_category_check CASCADE;
