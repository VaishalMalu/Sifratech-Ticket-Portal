-- Add logo_url to customer_accounts table
ALTER TABLE customer_accounts ADD COLUMN IF NOT EXISTS logo_url TEXT;
