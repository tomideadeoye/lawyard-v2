-- Rename article_type value
ALTER TABLE articles DROP CONSTRAINT IF EXISTS articles_article_type_check;
UPDATE articles SET article_type = 'corporate_post' WHERE article_type = 'brand_press';
ALTER TABLE articles ADD CONSTRAINT articles_article_type_check
  CHECK (article_type IN ('editorial', 'corporate_post'));

-- Rename plan_role values in transactions
UPDATE transactions SET plan_role = REPLACE(plan_role, 'brand_press', 'corporate_post')
  WHERE plan_role LIKE 'brand_press_%';

-- Rename metadata type values in transactions
UPDATE transactions SET metadata = (
  SELECT jsonb_set(metadata, '{type}', '"corporate_post"')
  WHERE metadata->>'type' = 'brand_press'
);

-- Storage bucket NOT renamed (Supabase manages storage schema — alter requires ownership)
-- Upload route references 'brand-press' internally; HTTP route path remains corporate-posts

-- Clean up app_settings key description
UPDATE app_settings SET description = 'Minimum window in minutes between two Corporate Post scheduled dates'
  WHERE key = 'brand_press_clash_window_minutes';
