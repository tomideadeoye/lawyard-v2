ALTER TABLE chambers ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Opt-in existing chambers with a focus as featured so the homepage isn't empty
UPDATE chambers SET is_featured = true WHERE focus IS NOT NULL AND focus != '';
