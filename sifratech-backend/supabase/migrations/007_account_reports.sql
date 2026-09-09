-- Reports Business Cases
CREATE TABLE IF NOT EXISTS reports_business_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_name VARCHAR(255) NOT NULL,
    project_name VARCHAR(255) NOT NULL,
    customer_name VARCHAR(255),
    business_objective TEXT,
    
    current_situation TEXT,
    customer_problem TEXT,
    operational_challenges TEXT,
    support_challenges TEXT,
    
    existing_process TEXT,
    existing_workflow TEXT,
    current_limitations TEXT,
    
    support_approach TEXT,
    process_improvements TEXT,
    ticketing_workflow TEXT,
    automation_used TEXT,
    
    major_activities TEXT,
    key_milestones TEXT,
    teams_involved TEXT,
    important_changes TEXT,
    
    improvements_achieved TEXT,
    operational_benefits TEXT,
    visibility_improvements TEXT,
    efficiency_improvements TEXT,
    
    major_observations TEXT,
    lessons_learned TEXT,
    
    recommended_improvements TEXT,
    automation_opportunities TEXT,
    further_enhancements TEXT,
    
    status VARCHAR(50) DEFAULT 'Draft',
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS update_reports_business_cases_updated_at ON reports_business_cases;
CREATE TRIGGER update_reports_business_cases_updated_at
    BEFORE UPDATE ON reports_business_cases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Reports WSR Drafts
CREATE TABLE IF NOT EXISTS reports_wsr_drafts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_name VARCHAR(255) NOT NULL,
    project_name VARCHAR(255) NOT NULL,
    reporting_week DATE NOT NULL,
    
    key_activities TEXT,
    pending_items TEXT,
    risks_blockers TEXT,
    next_actions TEXT,
    management_comments TEXT,
    ai_summary TEXT,
    
    status VARCHAR(50) DEFAULT 'Draft',
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS update_reports_wsr_drafts_updated_at ON reports_wsr_drafts;
CREATE TRIGGER update_reports_wsr_drafts_updated_at
    BEFORE UPDATE ON reports_wsr_drafts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE reports_business_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports_wsr_drafts ENABLE ROW LEVEL SECURITY;

-- Allow Account Manager to do everything
DROP POLICY IF EXISTS "AMs can do everything on business cases" ON reports_business_cases;
CREATE POLICY "AMs can do everything on business cases" ON reports_business_cases
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.id = auth.uid() 
              AND (r.name = 'Account Manager' OR u.email IN ('account_manager@sifratc.com', 'account_manager@sifratech.com'))
        )
    );

DROP POLICY IF EXISTS "AMs can do everything on wsr drafts" ON reports_wsr_drafts;
CREATE POLICY "AMs can do everything on wsr drafts" ON reports_wsr_drafts
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.id = auth.uid() 
              AND (r.name = 'Account Manager' OR u.email IN ('account_manager@sifratc.com', 'account_manager@sifratech.com'))
        )
    );
