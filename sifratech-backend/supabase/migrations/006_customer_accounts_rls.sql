-- Add RLS policies for customer_accounts
DROP POLICY IF EXISTS "Customer accounts viewable by everyone" ON customer_accounts;
CREATE POLICY "Customer accounts viewable by everyone" ON customer_accounts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert customer accounts" ON customer_accounts;
CREATE POLICY "Anyone can insert customer accounts" ON customer_accounts FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update customer accounts" ON customer_accounts;
CREATE POLICY "Anyone can update customer accounts" ON customer_accounts FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Anyone can delete customer accounts" ON customer_accounts;
CREATE POLICY "Anyone can delete customer accounts" ON customer_accounts FOR DELETE USING (true);
