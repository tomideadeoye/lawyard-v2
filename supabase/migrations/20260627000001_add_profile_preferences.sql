-- Add notification and display preference columns to profiles

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hide_contact_form BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_email TEXT DEFAULT 'everyone'
  CHECK (display_email IN ('everyone', 'logged_in_only', 'dont_display'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS contact_form_recipient TEXT DEFAULT 'author_email'
  CHECK (contact_form_recipient IN ('author_email', 'listing_email'));
