-- C17 (12 Sep 2026): Law Firm (chamber) site-admin role + PR/announcement publishing.
--
-- A chamber can have one or several admins (users) who manage the chamber page
-- and publish PR/announcement posts to the directory (editorial-gated).

CREATE TABLE IF NOT EXISTS chamber_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chamber_id UUID NOT NULL REFERENCES chambers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('owner','admin')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (chamber_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_chamber_admins_user ON chamber_admins(user_id);
CREATE INDEX IF NOT EXISTS idx_chamber_admins_chamber ON chamber_admins(chamber_id);

ALTER TABLE chamber_admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own chamber admin rows" ON chamber_admins;
CREATE POLICY "Users read own chamber admin rows"
  ON chamber_admins FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role manages chamber admins" ON chamber_admins;
CREATE POLICY "Service role manages chamber admins"
  ON chamber_admins FOR ALL TO authenticated
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Chamber admins (in addition to the owner) may manage their chamber page.
DROP POLICY IF EXISTS "Chamber admins can update their chamber" ON chambers;
CREATE POLICY "Chamber admins can update their chamber"
  ON chambers FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM chamber_admins ca
    WHERE ca.chamber_id = chambers.id AND ca.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM chamber_admins ca
    WHERE ca.chamber_id = chambers.id AND ca.user_id = auth.uid()
  ));

-- Link articles to a chamber for PR/announcement posts, and allow the type.
ALTER TABLE articles ADD COLUMN IF NOT EXISTS chamber_id UUID REFERENCES chambers(id) ON DELETE SET NULL;

ALTER TABLE articles DROP CONSTRAINT IF EXISTS articles_article_type_check;
ALTER TABLE articles ADD CONSTRAINT articles_article_type_check
  CHECK (article_type IN ('editorial', 'corporate_post', 'press_release'));
