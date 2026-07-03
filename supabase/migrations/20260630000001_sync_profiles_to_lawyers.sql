-- Sync personal info from profiles → lawyers so all reads from lawyers stay current.
-- Settings (ProfileForm) writes to profiles; the trigger keeps lawyers in sync.
-- This eliminates the dual-table drift without changing any read queries.

CREATE OR REPLACE FUNCTION sync_profile_to_lawyer()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE lawyers SET
    name    = NEW.full_name,
    phone   = NEW.phone,
    website = NEW.website,
    bio     = NEW.about
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_profile_update ON profiles;
CREATE TRIGGER on_profile_update
  AFTER INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_to_lawyer();

-- Backfill: sync existing profiles data into lawyers rows
UPDATE profiles SET updated_at = COALESCE(updated_at, now())
WHERE id IN (SELECT id FROM lawyers);
