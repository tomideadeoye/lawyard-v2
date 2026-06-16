-- Add seniority/experience level to lawyers table
ALTER TABLE lawyers ADD COLUMN IF NOT EXISTS seniority TEXT CHECK (seniority IN (
  'junior_associate',
  'associate',
  'senior_associate',
  'partner',
  'managing_partner',
  'of_counsel',
  'san'
));
