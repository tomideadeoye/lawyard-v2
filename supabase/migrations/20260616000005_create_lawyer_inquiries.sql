-- Create lawyer_inquiries table for client-to-lawyer contact messages

CREATE TABLE IF NOT EXISTS lawyer_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lawyer_id UUID REFERENCES lawyers(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE lawyer_inquiries ENABLE ROW LEVEL SECURITY;

-- Anyone can submit an inquiry
CREATE POLICY "Anyone can submit inquiries"
  ON lawyer_inquiries FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Lawyers/admins can view inquiries where lawyer_id = their own id
CREATE POLICY "Lawyers can view own inquiries"
  ON lawyer_inquiries FOR SELECT
  TO authenticated
  USING (lawyer_id = auth.uid());

-- Lawyers can mark their own inquiries as read
CREATE POLICY "Lawyers can update own inquiries"
  ON lawyer_inquiries FOR UPDATE
  TO authenticated
  USING (lawyer_id = auth.uid())
  WITH CHECK (lawyer_id = auth.uid());

-- Admins can view all inquiries
CREATE POLICY "Admins can view all inquiries"
  ON lawyer_inquiries FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );
