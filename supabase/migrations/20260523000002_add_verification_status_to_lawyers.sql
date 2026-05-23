-- Migration: Add verification columns to lawyers table to support Admin Control Plane verification pipeline
ALTER TABLE lawyers ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected'));
ALTER TABLE lawyers ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
