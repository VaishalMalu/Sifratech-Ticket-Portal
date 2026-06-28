-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ROLES TABLE
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TEAMS TABLE
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- USERS TABLE (Linked to Supabase Auth)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    role_id UUID REFERENCES roles(id),
    team_id UUID REFERENCES teams(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- ORACLE MODULES
CREATE TABLE oracle_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    default_team_id UUID REFERENCES teams(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- SLA CONFIGURATION
CREATE TABLE sla_configuration (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    priority VARCHAR(50) NOT NULL UNIQUE,
    resolution_hours INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- CUSTOMER ACCOUNTS
CREATE TABLE customer_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TICKETS TABLE
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'Open',
    priority VARCHAR(50) DEFAULT 'Medium',
    severity VARCHAR(50),
    business_impact TEXT,
    customer_name VARCHAR(255),
    company VARCHAR(255),
    email_address VARCHAR(255),
    phone_number VARCHAR(50),
    source VARCHAR(50) DEFAULT 'Portal',
    email_message_id VARCHAR(255),
    conversation_id VARCHAR(255),
    oracle_module_id UUID REFERENCES oracle_modules(id),
    assigned_team_id UUID REFERENCES teams(id),
    assigned_to UUID REFERENCES users(id),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE
);

-- TICKET COMMENTS
CREATE TABLE ticket_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    comment_text TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE,
    source VARCHAR(50) DEFAULT 'Portal',
    email_message_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TICKET STATUS HISTORY
CREATE TABLE ticket_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    changed_by UUID REFERENCES users(id),
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ATTACHMENTS
CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES ticket_comments(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_type VARCHAR(100),
    file_size INTEGER,
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- EMAIL LOGS
CREATE TABLE email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES tickets(id),
    direction VARCHAR(10) NOT NULL, -- 'INBOUND' or 'OUTBOUND'
    subject VARCHAR(255),
    sender VARCHAR(255),
    recipient VARCHAR(255),
    message_id VARCHAR(255),
    status VARCHAR(50),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ACTIVITY LOGS / AUDIT LOGS
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ASSIGNMENT HISTORY
CREATE TABLE assignment_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(id),
    old_assigned_to UUID REFERENCES users(id),
    new_assigned_to UUID REFERENCES users(id),
    old_team_id UUID REFERENCES teams(id),
    new_team_id UUID REFERENCES teams(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add updated_at trigger for tickets
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tickets_updated_at
    BEFORE UPDATE ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Seed SLA Configuration
INSERT INTO sla_configuration (priority, resolution_hours) VALUES 
('Critical', 4),
('High', 8),
('Medium', 24),
('Low', 72);

-- Seed Roles
INSERT INTO roles (name, description) VALUES 
('Admin', 'Administrator with full access'),
('Manager', 'Team Manager'),
('Engineer', 'Support Engineer'),
('Customer', 'Customer Portal User');

-- Seed Teams
INSERT INTO teams (name, description) VALUES 
('Finance Support Team', 'Handles Financials module'),
('HR Team', 'Handles HRMS and Payroll modules'),
('Supply Chain Team', 'Handles SCM and Procurement'),
('Inventory Team', 'Handles Inventory module'),
('Projects Team', 'Handles Projects module');

-- Seed Oracle Modules
INSERT INTO oracle_modules (name, default_team_id) 
SELECT 'Financials', id FROM teams WHERE name = 'Finance Support Team' UNION ALL
SELECT 'HRMS', id FROM teams WHERE name = 'HR Team' UNION ALL
SELECT 'Payroll', id FROM teams WHERE name = 'HR Team' UNION ALL
SELECT 'SCM', id FROM teams WHERE name = 'Supply Chain Team' UNION ALL
SELECT 'Procurement', id FROM teams WHERE name = 'Supply Chain Team' UNION ALL
SELECT 'Inventory', id FROM teams WHERE name = 'Inventory Team' UNION ALL
SELECT 'Projects', id FROM teams WHERE name = 'Projects Team';
