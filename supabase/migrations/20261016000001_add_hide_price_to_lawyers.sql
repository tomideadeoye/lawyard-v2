-- C12 (12 Sep 2026): Private pricing option.
-- Toggle that hides the price number on the public profile while keeping the
-- pricing section visible — renders as "Contact for pricing".
ALTER TABLE lawyers
  ADD COLUMN IF NOT EXISTS hide_price boolean NOT NULL DEFAULT false;
