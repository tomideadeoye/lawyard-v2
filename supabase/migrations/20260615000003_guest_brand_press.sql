-- Make author_id nullable for guest-created brand press articles
ALTER TABLE articles ALTER COLUMN author_id DROP NOT NULL;

-- Make user_id nullable for guest-created brand press transactions
ALTER TABLE transactions ALTER COLUMN user_id DROP NOT NULL;
