-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE oracle_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE sla_configuration ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_history ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is Admin
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE u.id::text = auth.uid()::text AND r.name = 'Admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Tickets Policies
DROP POLICY IF EXISTS "Admins can view all tickets" ON tickets;
CREATE POLICY "Admins can view all tickets" ON tickets FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE u.id::text = auth.uid()::text AND r.name IN ('Admin', 'Account Manager', 'Delivery Manager')
    )
);

DROP POLICY IF EXISTS "Engineers view assigned tickets" ON tickets;
CREATE POLICY "Engineers view assigned tickets" ON tickets FOR SELECT
USING (
    assigned_to = auth.uid()::text
    AND EXISTS (
        SELECT 1 FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE u.id::text = auth.uid()::text AND r.name NOT IN ('Admin', 'Account Manager', 'Delivery Manager', 'Customer', 'Client')
    )
);

DROP POLICY IF EXISTS "Clients view own tickets" ON tickets;
CREATE POLICY "Clients view own tickets" ON tickets FOR SELECT
USING (
    created_by = auth.uid()::text 
    OR company = (SELECT company FROM users WHERE id::text = auth.uid()::text)
);

DROP POLICY IF EXISTS "Admins and Engineers can insert tickets" ON tickets;
CREATE POLICY "Admins and Engineers can insert tickets" ON tickets FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admins and Engineers can update tickets" ON tickets;
CREATE POLICY "Admins and Engineers can update tickets" ON tickets FOR UPDATE USING (true);

-- Comments Policies
DROP POLICY IF EXISTS "Comments viewable by everyone" ON ticket_comments;
CREATE POLICY "Comments viewable by everyone" ON ticket_comments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users can insert comments" ON ticket_comments;
CREATE POLICY "Authenticated users can insert comments" ON ticket_comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Users can update their own comments" ON ticket_comments;
CREATE POLICY "Users can update their own comments" ON ticket_comments FOR UPDATE USING (user_id::text = auth.uid()::text);

-- RLS policies for other tables (simplified for development, restrict in production)
DROP POLICY IF EXISTS "Users viewable by everyone" ON users;
CREATE POLICY "Users viewable by everyone" ON users FOR SELECT USING (true);
DROP POLICY IF EXISTS "Teams viewable by everyone" ON teams;
CREATE POLICY "Teams viewable by everyone" ON teams FOR SELECT USING (true);
DROP POLICY IF EXISTS "Roles viewable by everyone" ON roles;
CREATE POLICY "Roles viewable by everyone" ON roles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Oracle modules viewable by everyone" ON oracle_modules;
CREATE POLICY "Oracle modules viewable by everyone" ON oracle_modules FOR SELECT USING (true);

-- Ticket Status History Policies
DROP POLICY IF EXISTS "Ticket status history viewable by everyone" ON ticket_status_history;
CREATE POLICY "Ticket status history viewable by everyone" ON ticket_status_history FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can insert ticket status history" ON ticket_status_history;
CREATE POLICY "Anyone can insert ticket status history" ON ticket_status_history FOR INSERT WITH CHECK (true);

