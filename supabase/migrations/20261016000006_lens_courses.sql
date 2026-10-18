-- C09 (12 Sep 2026): Lawyard Lens — thin bespoke courses.
-- Course list + checkout + subscriber discount (e.g. AI Governance ₦200k → ₦150k
-- for directory subscribers). No LMS — video is an external/R2 URL per course.

CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  subscriber_price NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'NGN',
  cover_image TEXT,
  video_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL DEFAULT 0,
  reference TEXT,
  status TEXT NOT NULL DEFAULT 'pending_payment' CHECK (status IN ('pending_payment','enrolled','refunded')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_course_enrollments_user ON course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course ON course_enrollments(course_id);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view published courses" ON courses;
CREATE POLICY "Anyone can view published courses"
  ON courses FOR SELECT USING (status = 'published' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role manages courses" ON courses;
CREATE POLICY "Service role manages courses"
  ON courses FOR ALL TO authenticated
  USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users read own enrollments" ON course_enrollments;
CREATE POLICY "Users read own enrollments"
  ON course_enrollments FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role manages enrollments" ON course_enrollments;
CREATE POLICY "Service role manages enrollments"
  ON course_enrollments FOR ALL TO authenticated
  USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Seed: the AI Governance course from the 12 Sep call.
INSERT INTO courses (slug, title, description, price, subscriber_price, status, sort_order)
SELECT 'ai-governance',
       'AI Governance',
       'A practical course on governing AI systems: risk, compliance, accountability, and the emerging regulatory landscape.',
       200000, 150000, 'published', 0
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE slug = 'ai-governance');
