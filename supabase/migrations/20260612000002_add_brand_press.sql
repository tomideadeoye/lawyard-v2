-- Migration: Add brand press fields to articles
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS brand_name TEXT,
ADD COLUMN IF NOT EXISTS tier TEXT CHECK (tier IN ('basic', 'core', 'pro')),
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
ADD COLUMN IF NOT EXISTS scheduled_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS article_type TEXT DEFAULT 'editorial' CHECK (article_type IN ('editorial', 'brand_press'));
