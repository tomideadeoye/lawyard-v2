-- C14 + C15 (12 Sep 2026): Service Requests — structured + payable.
--
-- C14 — A "Service Request" is a NEW structured feature (service type, scope,
-- budget), not a rename of Inquiries. Inquiries remain the free contact form.
-- C15 — Bookings must be paid: the client pays a Lawyard booking fee via
-- Paystack BEFORE the request is confirmed. Lawyard charges for its own
-- service (booking/introduction) — the lawyer's legal fee is never routed.

CREATE TABLE IF NOT EXISTS service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lawyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT,
  service_type TEXT NOT NULL,
  scope TEXT NOT NULL,
  budget TEXT,
  preferred_date DATE,
  message TEXT,
  booking_fee NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending_payment'
    CHECK (status IN ('pending_payment','requested','accepted','declined','completed','cancelled')),
  payment_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_requests_lawyer ON service_requests(lawyer_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_client ON service_requests(client_id);

ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clients manage own service requests" ON service_requests;
CREATE POLICY "Clients manage own service requests"
  ON service_requests FOR ALL TO authenticated
  USING (auth.uid() = client_id)
  WITH CHECK (auth.uid() = client_id);

DROP POLICY IF EXISTS "Lawyers read their service requests" ON service_requests;
CREATE POLICY "Lawyers read their service requests"
  ON service_requests FOR SELECT TO authenticated
  USING (auth.uid() = lawyer_id);

DROP POLICY IF EXISTS "Lawyers update their service requests" ON service_requests;
CREATE POLICY "Lawyers update their service requests"
  ON service_requests FOR UPDATE TO authenticated
  USING (auth.uid() = lawyer_id)
  WITH CHECK (auth.uid() = lawyer_id);

DROP POLICY IF EXISTS "Service role manages service requests" ON service_requests;
CREATE POLICY "Service role manages service requests"
  ON service_requests FOR ALL TO authenticated
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Booking fee (Q11 — placeholder until Tobi confirms the amount)
INSERT INTO app_settings (key, value, description) VALUES
  ('booking_fee', '5000', 'NGN booking fee a client pays Lawyard before a service request is confirmed')
ON CONFLICT (key) DO NOTHING;
