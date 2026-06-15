-- Sync profiles.role to auth.users.raw_app_meta_data so JWT includes the role
-- This eliminates the DB query on every admin page load in the proxy

-- Create the trigger function (SECURITY DEFINER to allow writing to auth schema)
CREATE OR REPLACE FUNCTION public.sync_role_to_app_metadata()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role OR TG_OP = 'INSERT' THEN
    UPDATE auth.users
    SET raw_app_meta_data = 
      COALESCE(raw_app_meta_data, '{}'::jsonb) || 
      jsonb_build_object('role', NEW.role)
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- Attach trigger to profiles table
DROP TRIGGER IF EXISTS sync_role_to_app_metadata_trigger ON profiles;
CREATE TRIGGER sync_role_to_app_metadata_trigger
AFTER INSERT OR UPDATE OF role ON profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_role_to_app_metadata();

-- Backfill: set role in app_metadata for all existing users with a role
UPDATE auth.users u
SET raw_app_meta_data = 
  COALESCE(raw_app_meta_data, '{}'::jsonb) || 
  jsonb_build_object('role', p.role)
FROM profiles p
WHERE p.id = u.id
  AND p.role IS NOT NULL
  AND (
    raw_app_meta_data IS NULL 
    OR raw_app_meta_data->>'role' IS NULL 
    OR raw_app_meta_data->>'role' != p.role
  );
