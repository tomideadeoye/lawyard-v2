-- Lawyer verification table for manual bar status verification (Nigeria SCN)
CREATE TABLE IF NOT EXISTS lawyer_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  scn TEXT,                              -- Supreme Court Number
  year_of_call INTEGER NOT NULL,
  phone TEXT,
  firm_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups by user and status
CREATE INDEX IF NOT EXISTS idx_lawyer_verifications_user_id ON lawyer_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_lawyer_verifications_status ON lawyer_verifications(status);

-- Enable RLS
ALTER TABLE lawyer_verifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own verification
CREATE POLICY "Users can view own verification"
  ON lawyer_verifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own verification
CREATE POLICY "Users can insert own verification"
  ON lawyer_verifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Only admins can update verification status
CREATE POLICY "Only admins can update verification"
  ON lawyer_verifications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
