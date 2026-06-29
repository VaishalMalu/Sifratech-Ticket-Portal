CREATE TABLE IF NOT EXISTS managed_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    plain_password TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE managed_credentials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Credentials viewable by everyone" ON managed_credentials;
CREATE POLICY "Credentials viewable by everyone" ON managed_credentials FOR SELECT USING (false);

DROP POLICY IF EXISTS "Anyone can insert credentials" ON managed_credentials;
CREATE POLICY "Anyone can insert credentials" ON managed_credentials FOR INSERT WITH CHECK (false);

DROP POLICY IF EXISTS "Anyone can update credentials" ON managed_credentials;
CREATE POLICY "Anyone can update credentials" ON managed_credentials FOR UPDATE USING (false);

DROP POLICY IF EXISTS "Anyone can delete credentials" ON managed_credentials;
CREATE POLICY "Anyone can delete credentials" ON managed_credentials FOR DELETE USING (false);
