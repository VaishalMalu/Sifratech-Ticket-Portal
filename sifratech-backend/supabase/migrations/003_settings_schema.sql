-- INCIDENT TYPES
CREATE TABLE incident_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- SYSTEM SETTINGS
CREATE TABLE system_settings (
    key VARCHAR(255) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE incident_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies
CREATE POLICY "Incident types viewable by everyone" ON incident_types FOR SELECT USING (true);
CREATE POLICY "Admins can insert incident types" ON incident_types FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update incident types" ON incident_types FOR UPDATE USING (true);
CREATE POLICY "Admins can delete incident types" ON incident_types FOR DELETE USING (true);

CREATE POLICY "System settings viewable by everyone" ON system_settings FOR SELECT USING (true);
CREATE POLICY "Admins can insert system settings" ON system_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update system settings" ON system_settings FOR UPDATE USING (true);

-- Seed Initial Incident Types
INSERT INTO incident_types (name) VALUES 
('Bug'), 
('Data Extract'), 
('Data Fix'), 
('Enhancement'), 
('New Requirement'), 
('New Setup Request'), 
('Reports'), 
('Responsibility Assignment'), 
('Training Request');

-- Seed System Settings (Initial configuration)
INSERT INTO system_settings (key, value) VALUES 
('email_config', '{"from_address": "support@sifratech.com", "inbound_address": "tickets@sifratech.com", "smtp_host": "smtp.sendgrid.net", "smtp_port": 587, "smtp_key": "", "notify_on_create": true, "notify_on_status": true, "notify_on_comment": false}'::jsonb),
('branding_config', '{"portal_name": "Sifratech Support Portal", "accent_color": "#1A9FCC", "support_email": "support@sifratech.com"}'::jsonb),
('ai_config', '{"anthropic_key": "", "auto_triage": true, "reply_suggestions": true, "ticket_summary": true, "weekly_digest": false}'::jsonb);

-- Ensure oracle_modules have full CRUD policy for development
CREATE POLICY "Anyone can insert oracle modules" ON oracle_modules FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update oracle modules" ON oracle_modules FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete oracle modules" ON oracle_modules FOR DELETE USING (true);

-- Add logo_url to customer_accounts
ALTER TABLE customer_accounts ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Ensure customer_accounts have full CRUD policy
CREATE POLICY "Anyone can insert customer accounts" ON customer_accounts FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update customer accounts" ON customer_accounts FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete customer accounts" ON customer_accounts FOR DELETE USING (true);
CREATE POLICY "Anyone can select customer accounts" ON customer_accounts FOR SELECT USING (true);

-- Ensure SLA have full CRUD policy
CREATE POLICY "Anyone can insert SLA" ON sla_configuration FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update SLA" ON sla_configuration FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete SLA" ON sla_configuration FOR DELETE USING (true);
CREATE POLICY "Anyone can select SLA" ON sla_configuration FOR SELECT USING (true);
