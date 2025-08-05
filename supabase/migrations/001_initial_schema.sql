-- Think Tank Technologies Installation Scheduler - Complete Database Schema
-- Comprehensive schema supporting all application features

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create custom types/enums
CREATE TYPE user_role AS ENUM ('admin', 'scheduler', 'lead', 'assistant', 'viewer');
CREATE TYPE installation_status AS ENUM ('pending', 'scheduled', 'in_progress', 'completed', 'cancelled', 'rescheduled');
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE assignment_status AS ENUM ('assigned', 'accepted', 'declined', 'completed');
CREATE TYPE skill_category AS ENUM ('technical', 'safety', 'customer_service', 'equipment', 'specialized', 'management');
CREATE TYPE skill_level AS ENUM ('beginner', 'intermediate', 'advanced', 'expert', 'master');
CREATE TYPE certification_status AS ENUM ('active', 'expired', 'expiring_soon', 'suspended', 'pending');
CREATE TYPE equipment_type AS ENUM ('vehicle', 'tools', 'safety_equipment', 'testing_equipment', 'communication', 'technology', 'ppe');
CREATE TYPE equipment_status AS ENUM ('assigned', 'available', 'in_repair', 'out_of_service', 'retired');
CREATE TYPE equipment_condition AS ENUM ('excellent', 'good', 'fair', 'poor', 'needs_replacement');
CREATE TYPE travel_preference AS ENUM ('local_only', 'regional', 'multi_state', 'nationwide');
CREATE TYPE employment_type AS ENUM ('full_time', 'part_time', 'contract', 'temporary', 'intern');
CREATE TYPE employment_status AS ENUM ('active', 'on_leave', 'suspended', 'terminated', 'retired');
CREATE TYPE time_off_type AS ENUM ('vacation', 'sick_leave', 'personal', 'family_leave', 'training', 'other');
CREATE TYPE time_off_status AS ENUM ('pending', 'approved', 'denied', 'cancelled');
CREATE TYPE pairing_status AS ENUM ('active', 'temporary', 'inactive', 'preferred', 'avoid');
CREATE TYPE workload_status AS ENUM ('underutilized', 'optimal', 'overloaded', 'critical');
CREATE TYPE conflict_type AS ENUM ('time_overlap', 'capacity_exceeded', 'travel_distance', 'unavailable_team', 'missing_specialization', 'deadline_conflict', 'geographic_mismatch');
CREATE TYPE email_template_type AS ENUM ('assignment_notification', 'schedule_update', 'performance_report', 'customer_confirmation', 'team_communication', 'manager_report', 'automated_reminder', 'bulk_notification');
CREATE TYPE email_status AS ENUM ('draft', 'scheduled', 'queued', 'sending', 'sent', 'delivered', 'failed', 'bounced', 'rejected');
CREATE TYPE email_event_type AS ENUM ('queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'unsubscribed');
CREATE TYPE pdf_template_type AS ENUM ('installation_schedule', 'team_performance', 'customer_report', 'analytics_dashboard', 'inventory_report', 'financial_summary', 'compliance_report', 'route_optimization');
CREATE TYPE pdf_component_type AS ENUM ('text', 'image', 'table', 'chart', 'list', 'header', 'footer', 'page_break', 'line', 'rectangle', 'qr_code', 'barcode');
CREATE TYPE pdf_status AS ENUM ('generating', 'completed', 'failed', 'queued');
CREATE TYPE data_source_type AS ENUM ('database', 'api', 'file', 'webhook', 'supabase', 'external_service');
CREATE TYPE email_frequency AS ENUM ('immediate', 'daily', 'weekly', 'monthly', 'never');
CREATE TYPE report_format AS ENUM ('pdf', 'excel', 'csv', 'json', 'html');
CREATE TYPE notification_type AS ENUM ('assignment_updates', 'schedule_changes', 'performance_reports', 'system_alerts', 'marketing', 'admin_messages');
CREATE TYPE bulk_operation_type AS ENUM ('update_availability', 'update_skills', 'update_certifications', 'update_regions', 'update_capacity', 'reassign_equipment', 'update_status');
CREATE TYPE bulk_operation_status AS ENUM ('pending', 'in_progress', 'completed', 'failed', 'partially_completed');
CREATE TYPE team_recommendation_type AS ENUM ('hiring', 'training', 'certification_renewal', 'equipment_upgrade', 'region_rebalancing', 'performance_improvement', 'workload_adjustment');

-- Core Users table with comprehensive profile data
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role user_role NOT NULL DEFAULT 'viewer',
    is_active BOOLEAN DEFAULT true,
    profile_photo TEXT,
    phone_number VARCHAR(20),
    emergency_contact JSONB,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Address/Location management
CREATE TABLE addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    street VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    country VARCHAR(50) DEFAULT 'USA',
    coordinates POINT,
    geocoded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team Members (extends users with specific team data)
CREATE TABLE team_members (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    region VARCHAR(100) NOT NULL,
    sub_regions TEXT[],
    specializations TEXT[],
    capacity INTEGER DEFAULT 8, -- jobs per day
    travel_radius INTEGER DEFAULT 50, -- miles
    home_base_id UUID REFERENCES addresses(id),
    hire_date DATE NOT NULL,
    department VARCHAR(100),
    job_title VARCHAR(100),
    pay_grade VARCHAR(20),
    supervisor_id UUID REFERENCES users(id),
    work_location VARCHAR(100),
    employment_type employment_type DEFAULT 'full_time',
    employment_status employment_status DEFAULT 'active',
    probation_end_date DATE,
    benefits TEXT[],
    preferred_partners UUID[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Skills management
CREATE TABLE skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    category skill_category NOT NULL,
    description TEXT,
    is_required BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team member skills junction table
CREATE TABLE team_member_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
    level skill_level NOT NULL,
    acquired_date DATE NOT NULL,
    last_assessed DATE,
    assessed_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_member_id, skill_id)
);

-- Certifications
CREATE TABLE certifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    issuer VARCHAR(200) NOT NULL,
    certification_number VARCHAR(100),
    issue_date DATE NOT NULL,
    expiration_date DATE,
    status certification_status DEFAULT 'active',
    renewal_required BOOLEAN DEFAULT false,
    document_url TEXT,
    cost DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Equipment management
CREATE TABLE equipment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    type equipment_type NOT NULL,
    serial_number VARCHAR(100),
    assigned_to UUID REFERENCES team_members(id),
    assigned_date DATE,
    status equipment_status DEFAULT 'available',
    condition equipment_condition DEFAULT 'good',
    last_inspected DATE,
    next_inspection_due DATE,
    purchase_date DATE,
    warranty_expiration DATE,
    warranty_provider VARCHAR(200),
    specifications JSONB,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Availability tracking
CREATE TABLE availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_recurring BOOLEAN DEFAULT false,
    recurring_days INTEGER[], -- 0-6 for Sunday-Saturday
    is_available BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Time off requests
CREATE TABLE time_off_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    type time_off_type NOT NULL,
    status time_off_status DEFAULT 'pending',
    reason TEXT,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    notes TEXT
);

-- Work preferences
CREATE TABLE work_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
    preferred_start_time TIME DEFAULT '08:00',
    preferred_end_time TIME DEFAULT '17:00',
    max_daily_jobs INTEGER DEFAULT 8,
    max_weekly_hours INTEGER DEFAULT 40,
    weekends_available BOOLEAN DEFAULT false,
    overtime_available BOOLEAN DEFAULT false,
    travel_preference travel_preference DEFAULT 'regional',
    special_requests TEXT[],
    unavailable_dates DATE[],
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Training records
CREATE TABLE training_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
    course_name VARCHAR(200) NOT NULL,
    provider VARCHAR(200) NOT NULL,
    completed_date DATE NOT NULL,
    expiration_date DATE,
    score DECIMAL(5,2),
    certificate_url TEXT,
    renewal_required BOOLEAN DEFAULT false,
    cost DECIMAL(10,2),
    hours_completed DECIMAL(4,1),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance metrics
CREATE TABLE performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    completion_rate DECIMAL(5,2) DEFAULT 0.00,
    average_time DECIMAL(8,2) DEFAULT 0.00, -- minutes
    customer_satisfaction DECIMAL(3,2) DEFAULT 0.00,
    travel_efficiency DECIMAL(5,2) DEFAULT 0.00,
    total_jobs INTEGER DEFAULT 0,
    total_distance DECIMAL(10,2) DEFAULT 0.00, -- miles
    quality_score DECIMAL(3,2) DEFAULT 0.00,
    safety_score DECIMAL(3,2) DEFAULT 0.00,
    punctuality_score DECIMAL(3,2) DEFAULT 0.00,
    communication_score DECIMAL(3,2) DEFAULT 0.00,
    revenue_generated DECIMAL(12,2) DEFAULT 0.00,
    overtime_hours DECIMAL(6,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team pairings
CREATE TABLE team_pairings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
    assistant_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
    region VARCHAR(100) NOT NULL,
    compatibility_score DECIMAL(3,2) DEFAULT 0.00,
    pairing_date DATE NOT NULL,
    total_jobs_completed INTEGER DEFAULT 0,
    average_performance DECIMAL(3,2) DEFAULT 0.00,
    status pairing_status DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(lead_id, assistant_id)
);

-- Installations/Jobs
CREATE TABLE installations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id VARCHAR(100),
    store_number VARCHAR(50),
    customer_name VARCHAR(200) NOT NULL,
    customer_phone VARCHAR(20),
    customer_email VARCHAR(255),
    address_id UUID REFERENCES addresses(id) NOT NULL,
    scheduled_date DATE,
    scheduled_time TIME,
    duration INTEGER DEFAULT 240, -- minutes
    status installation_status DEFAULT 'pending',
    priority priority_level DEFAULT 'medium',
    installation_type VARCHAR(100),
    specifications TEXT[],
    requirements TEXT,
    region VARCHAR(100),
    notes TEXT,
    lead_id UUID REFERENCES team_members(id),
    assistant_id UUID REFERENCES team_members(id),
    estimated_revenue DECIMAL(10,2),
    actual_revenue DECIMAL(10,2),
    completion_photos TEXT[],
    customer_signature TEXT,
    customer_satisfaction_score INTEGER CHECK (customer_satisfaction_score >= 1 AND customer_satisfaction_score <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assignments (links installations to team members)
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    installation_id UUID REFERENCES installations(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES team_members(id) NOT NULL,
    assistant_id UUID REFERENCES team_members(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES users(id) NOT NULL,
    status assignment_status DEFAULT 'assigned',
    estimated_travel_time INTEGER, -- minutes
    estimated_travel_distance DECIMAL(8,2), -- miles
    actual_travel_time INTEGER,
    actual_travel_distance DECIMAL(8,2),
    travel_route JSONB,
    buffer_time INTEGER DEFAULT 30, -- minutes
    workload_score DECIMAL(5,2),
    efficiency_score DECIMAL(5,2),
    notes TEXT
);

-- Schedules (daily schedule summaries)
CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
    total_installations INTEGER DEFAULT 0,
    completed_installations INTEGER DEFAULT 0,
    total_travel_distance DECIMAL(10,2) DEFAULT 0.00,
    total_travel_time INTEGER DEFAULT 0, -- minutes
    utilization_rate DECIMAL(5,2) DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, team_member_id)
);

-- Geographic clusters for optimization
CREATE TABLE geographic_clusters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    center_point POINT NOT NULL,
    radius INTEGER NOT NULL, -- miles
    region VARCHAR(100) NOT NULL,
    density DECIMAL(5,2) DEFAULT 0.00,
    suggested_team UUID REFERENCES team_members(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Distance matrix for route optimization
CREATE TABLE distance_matrix (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_address_id UUID REFERENCES addresses(id) NOT NULL,
    to_address_id UUID REFERENCES addresses(id) NOT NULL,
    distance DECIMAL(8,2) NOT NULL, -- miles
    duration INTEGER NOT NULL, -- minutes
    route_data JSONB,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(from_address_id, to_address_id)
);

-- Scheduling conflicts
CREATE TABLE scheduling_conflicts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type conflict_type NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    description TEXT NOT NULL,
    affected_jobs UUID[],
    affected_team_members UUID[],
    suggested_resolution TEXT,
    auto_resolvable BOOLEAN DEFAULT false,
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email templates
CREATE TABLE email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    type email_template_type NOT NULL,
    subject VARCHAR(500) NOT NULL,
    body_html TEXT NOT NULL,
    body_plain TEXT NOT NULL,
    variables JSONB DEFAULT '[]',
    target_audience user_role[] DEFAULT ARRAY['viewer']::user_role[],
    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email messages
CREATE TABLE email_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID REFERENCES email_templates(id),
    to_addresses TEXT[] NOT NULL,
    cc_addresses TEXT[],
    bcc_addresses TEXT[],
    from_address VARCHAR(255) NOT NULL,
    reply_to VARCHAR(255),
    subject VARCHAR(500) NOT NULL,
    body_html TEXT NOT NULL,
    body_plain TEXT NOT NULL,
    attachments JSONB DEFAULT '[]',
    scheduled_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    status email_status DEFAULT 'draft',
    variables JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    priority priority_level DEFAULT 'medium',
    tracking_enabled BOOLEAN DEFAULT true,
    delivery_receipt JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email events
CREATE TABLE email_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES email_messages(id) ON DELETE CASCADE,
    type email_event_type NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data JSONB DEFAULT '{}'
);

-- PDF templates
CREATE TABLE pdf_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    type pdf_template_type NOT NULL,
    description TEXT,
    layout JSONB NOT NULL,
    components JSONB NOT NULL DEFAULT '[]',
    variables JSONB DEFAULT '[]',
    styling JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PDF reports
CREATE TABLE pdf_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID REFERENCES pdf_templates(id) NOT NULL,
    name VARCHAR(200) NOT NULL,
    generated_by UUID REFERENCES users(id) NOT NULL,
    status pdf_status DEFAULT 'queued',
    variables JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    file_url TEXT,
    file_path TEXT,
    file_size BIGINT,
    page_count INTEGER,
    error TEXT,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Report schedules
CREATE TABLE report_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    template_id UUID REFERENCES pdf_templates(id),
    email_template_id UUID REFERENCES email_templates(id),
    template_type VARCHAR(20) DEFAULT 'pdf' CHECK (template_type IN ('email', 'pdf')),
    cron_expression VARCHAR(100) NOT NULL,
    timezone VARCHAR(50) DEFAULT 'UTC',
    recipients JSONB NOT NULL DEFAULT '[]',
    variables JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_run TIMESTAMP WITH TIME ZONE,
    next_run TIMESTAMP WITH TIME ZONE NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Data sources
CREATE TABLE data_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    type data_source_type NOT NULL,
    connection_string TEXT,
    schema_data JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_sync TIMESTAMP WITH TIME ZONE,
    sync_frequency VARCHAR(50),
    credentials JSONB DEFAULT '{}', -- encrypted
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Communication preferences
CREATE TABLE communication_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    email_frequency email_frequency DEFAULT 'daily',
    preferred_formats report_format[] DEFAULT ARRAY['pdf']::report_format[],
    delivery_times JSONB DEFAULT '[]',
    notification_types notification_type[] DEFAULT ARRAY['assignment_updates']::notification_type[],
    unsubscribed_categories TEXT[] DEFAULT ARRAY[]::TEXT[],
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    mobile_opt_in BOOLEAN DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Bulk operations tracking
CREATE TABLE bulk_operations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type bulk_operation_type NOT NULL,
    team_member_ids UUID[] NOT NULL,
    changes JSONB NOT NULL,
    requested_by UUID REFERENCES users(id) NOT NULL,
    status bulk_operation_status DEFAULT 'pending',
    progress JSONB DEFAULT '{"total": 0, "completed": 0, "failed": 0}',
    results JSONB DEFAULT '[]',
    errors TEXT[],
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- System audit log
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    changed_by UUID REFERENCES users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Data processing results (for file uploads)
CREATE TABLE data_processing_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    total_rows INTEGER NOT NULL,
    valid_rows INTEGER NOT NULL,
    error_rows INTEGER NOT NULL,
    warning_rows INTEGER NOT NULL,
    valid_data JSONB NOT NULL DEFAULT '[]',
    errors JSONB NOT NULL DEFAULT '[]',
    warnings JSONB NOT NULL DEFAULT '[]',
    metadata JSONB NOT NULL DEFAULT '{}',
    schema_map JSONB NOT NULL DEFAULT '{}',
    processed_by UUID REFERENCES users(id) NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);

CREATE INDEX idx_team_members_region ON team_members(region);
CREATE INDEX idx_team_members_status ON team_members(employment_status);
CREATE INDEX idx_team_members_capacity ON team_members(capacity);

CREATE INDEX idx_installations_status ON installations(status);
CREATE INDEX idx_installations_date ON installations(scheduled_date);
CREATE INDEX idx_installations_region ON installations(region);
CREATE INDEX idx_installations_priority ON installations(priority);
CREATE INDEX idx_installations_lead ON installations(lead_id);

CREATE INDEX idx_assignments_installation ON assignments(installation_id);
CREATE INDEX idx_assignments_lead ON assignments(lead_id);
CREATE INDEX idx_assignments_status ON assignments(status);

CREATE INDEX idx_availability_team_member ON availability(team_member_id);
CREATE INDEX idx_availability_dates ON availability(start_date, end_date);

CREATE INDEX idx_performance_team_member ON performance_metrics(team_member_id);
CREATE INDEX idx_performance_period ON performance_metrics(period_start, period_end);

CREATE INDEX idx_skills_category ON skills(category);
CREATE INDEX idx_team_member_skills_member ON team_member_skills(team_member_id);
CREATE INDEX idx_team_member_skills_skill ON team_member_skills(skill_id);

CREATE INDEX idx_certifications_team_member ON certifications(team_member_id);
CREATE INDEX idx_certifications_status ON certifications(status);
CREATE INDEX idx_certifications_expiration ON certifications(expiration_date);

CREATE INDEX idx_equipment_type ON equipment(type);
CREATE INDEX idx_equipment_status ON equipment(status);
CREATE INDEX idx_equipment_assigned ON equipment(assigned_to);

CREATE INDEX idx_addresses_coordinates ON addresses USING GIST(coordinates);
CREATE INDEX idx_addresses_city_state ON addresses(city, state);

CREATE INDEX idx_distance_matrix_from ON distance_matrix(from_address_id);
CREATE INDEX idx_distance_matrix_to ON distance_matrix(to_address_id);

CREATE INDEX idx_email_messages_status ON email_messages(status);
CREATE INDEX idx_email_messages_scheduled ON email_messages(scheduled_at);
CREATE INDEX idx_email_events_message ON email_events(message_id);

CREATE INDEX idx_pdf_reports_status ON pdf_reports(status);
CREATE INDEX idx_pdf_reports_template ON pdf_reports(template_id);

CREATE INDEX idx_audit_log_table_record ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_log_changed_at ON audit_log(changed_at);
CREATE INDEX idx_audit_log_changed_by ON audit_log(changed_by);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON team_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_certifications_updated_at BEFORE UPDATE ON certifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON equipment
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_installations_updated_at BEFORE UPDATE ON installations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_pairings_updated_at BEFORE UPDATE ON team_pairings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pdf_templates_updated_at BEFORE UPDATE ON pdf_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_sources_updated_at BEFORE UPDATE ON data_sources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (table_name, record_id, action, old_values, changed_by, changed_at)
        VALUES (TG_TABLE_NAME, OLD.id, TG_OP, row_to_json(OLD), current_setting('app.current_user_id', true)::UUID, NOW());
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (table_name, record_id, action, old_values, new_values, changed_by, changed_at)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(OLD), row_to_json(NEW), current_setting('app.current_user_id', true)::UUID, NOW());
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (table_name, record_id, action, new_values, changed_by, changed_at)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(NEW), current_setting('app.current_user_id', true)::UUID, NOW());
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to key tables
CREATE TRIGGER audit_users AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_team_members AFTER INSERT OR UPDATE OR DELETE ON team_members
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_installations AFTER INSERT OR UPDATE OR DELETE ON installations
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_assignments AFTER INSERT OR UPDATE OR DELETE ON assignments
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (can be expanded based on requirements)
CREATE POLICY users_policy ON users
    FOR ALL
    TO authenticated
    USING (auth.uid()::text = id::text OR 
           EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::uuid AND role IN ('admin', 'scheduler')));

CREATE POLICY team_members_policy ON team_members
    FOR ALL
    TO authenticated
    USING (auth.uid()::text = id::text OR 
           EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::uuid AND role IN ('admin', 'scheduler')));

CREATE POLICY installations_policy ON installations
    FOR ALL
    TO authenticated
    USING (lead_id = auth.uid()::uuid OR assistant_id = auth.uid()::uuid OR
           EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::uuid AND role IN ('admin', 'scheduler')));

CREATE POLICY assignments_policy ON assignments
    FOR ALL
    TO authenticated
    USING (lead_id = auth.uid()::uuid OR assistant_id = auth.uid()::uuid OR
           EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::uuid AND role IN ('admin', 'scheduler')));

-- Create views for common queries
CREATE VIEW team_member_details AS
SELECT 
    tm.id,
    u.email,
    u.first_name,
    u.last_name,
    u.role,
    tm.employee_id,
    tm.region,
    tm.specializations,
    tm.capacity,
    tm.travel_radius,
    tm.employment_status,
    tm.job_title,
    a.street || ', ' || a.city || ', ' || a.state || ' ' || a.zip_code as home_address,
    COUNT(DISTINCT tms.skill_id) as skill_count,
    COUNT(DISTINCT c.id) as certification_count,
    AVG(pm.completion_rate) as avg_completion_rate,
    tm.created_at,
    tm.updated_at
FROM team_members tm
JOIN users u ON tm.id = u.id
LEFT JOIN addresses a ON tm.home_base_id = a.id
LEFT JOIN team_member_skills tms ON tm.id = tms.team_member_id
LEFT JOIN certifications c ON tm.id = c.team_member_id AND c.status = 'active'
LEFT JOIN performance_metrics pm ON tm.id = pm.team_member_id
GROUP BY tm.id, u.email, u.first_name, u.last_name, u.role, tm.employee_id, 
         tm.region, tm.specializations, tm.capacity, tm.travel_radius, 
         tm.employment_status, tm.job_title, home_address, tm.created_at, tm.updated_at;

CREATE VIEW installation_details AS
SELECT 
    i.id,
    i.job_id,
    i.customer_name,
    i.customer_phone,
    i.customer_email,
    a.street || ', ' || a.city || ', ' || a.state || ' ' || a.zip_code as address,
    i.scheduled_date,
    i.scheduled_time,
    i.duration,
    i.status,
    i.priority,
    i.installation_type,
    i.region,
    lead.first_name || ' ' || lead.last_name as lead_name,
    asst.first_name || ' ' || asst.last_name as assistant_name,
    i.estimated_revenue,
    i.actual_revenue,
    i.customer_satisfaction_score,
    i.created_at,
    i.updated_at
FROM installations i
JOIN addresses a ON i.address_id = a.id
LEFT JOIN users lead ON i.lead_id = lead.id
LEFT JOIN users asst ON i.assistant_id = asst.id;

-- Create functions for common operations
CREATE OR REPLACE FUNCTION get_team_member_availability(member_id UUID, check_date DATE)
RETURNS BOOLEAN AS $$
DECLARE
    is_available BOOLEAN := false;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM availability av
        WHERE av.team_member_id = member_id
        AND av.start_date <= check_date
        AND av.end_date >= check_date
        AND av.is_available = true
        AND (
            av.is_recurring = false
            OR EXTRACT(DOW FROM check_date) = ANY(av.recurring_days)
        )
    ) INTO is_available;
    
    -- Check for time off
    IF is_available THEN
        SELECT NOT EXISTS (
            SELECT 1 FROM time_off_requests tor
            WHERE tor.team_member_id = member_id
            AND tor.start_date <= check_date
            AND tor.end_date >= check_date
            AND tor.status = 'approved'
        ) INTO is_available;
    END IF;
    
    RETURN is_available;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_distance(lat1 FLOAT, lon1 FLOAT, lat2 FLOAT, lon2 FLOAT)
RETURNS FLOAT AS $$
BEGIN
    RETURN (
        3959 * acos(
            cos(radians(lat1)) * cos(radians(lat2)) * cos(radians(lon2) - radians(lon1)) +
            sin(radians(lat1)) * sin(radians(lat2))
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Insert default data
INSERT INTO skills (name, category, description) VALUES
('Electrical Installation', 'technical', 'Installation of electrical components and systems'),
('Plumbing', 'technical', 'Installation and repair of plumbing systems'),
('HVAC', 'technical', 'Heating, ventilation, and air conditioning systems'),
('Network Cabling', 'technical', 'Installation of network infrastructure'),
('Safety Protocols', 'safety', 'Knowledge of workplace safety procedures'),
('Customer Service', 'customer_service', 'Interaction with customers and service delivery'),
('Project Management', 'management', 'Planning and managing installation projects'),
('Equipment Operation', 'equipment', 'Operation of specialized installation equipment');

-- Create initial admin user (this would typically be done through Supabase Auth)
INSERT INTO users (id, email, first_name, last_name, role) VALUES
('00000000-0000-0000-0000-000000000001', 'admin@thinktanktech.com', 'System', 'Administrator', 'admin');

-- Insert default email templates
INSERT INTO email_templates (name, type, subject, body_html, body_plain, variables, created_by) VALUES
('Assignment Notification', 'assignment_notification', 'New Installation Assignment - {{job_id}}', 
 '<h2>New Assignment</h2><p>You have been assigned to installation {{job_id}} for {{customer_name}}.</p><p><strong>Date:</strong> {{scheduled_date}}<br><strong>Address:</strong> {{address}}</p>',
 'New Assignment\n\nYou have been assigned to installation {{job_id}} for {{customer_name}}.\n\nDate: {{scheduled_date}}\nAddress: {{address}}',
 '[{"name": "job_id", "type": "string", "required": true}, {"name": "customer_name", "type": "string", "required": true}, {"name": "scheduled_date", "type": "date", "required": true}, {"name": "address", "type": "string", "required": true}]',
 '00000000-0000-0000-0000-000000000001');

-- Grant appropriate permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Comments for documentation
COMMENT ON TABLE users IS 'Core user accounts with authentication and profile data';
COMMENT ON TABLE team_members IS 'Extended user data for team members with employment and performance info';
COMMENT ON TABLE installations IS 'Installation jobs/work orders with customer and scheduling data';
COMMENT ON TABLE assignments IS 'Links installations to team members with routing and performance data';
COMMENT ON TABLE performance_metrics IS 'Historical performance data for team members over time periods';
COMMENT ON TABLE email_templates IS 'Reusable email templates for automated communications';
COMMENT ON TABLE pdf_templates IS 'Templates for generating PDF reports and documents';
COMMENT ON TABLE audit_log IS 'Complete audit trail of all data changes in the system';