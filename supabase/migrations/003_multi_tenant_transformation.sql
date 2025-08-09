-- Multi-Tenant Transformation: Phase 1 - Core Schema
-- This migration transforms the single-tenant application into a multi-tenant SaaS platform

-- =====================================================
-- ENUMS AND TYPES
-- =====================================================

-- Organization and project roles
CREATE TYPE organization_role AS ENUM ('owner', 'admin', 'manager', 'member');
CREATE TYPE project_role AS ENUM ('admin', 'manager', 'scheduler', 'lead', 'assistant', 'viewer');

-- Subscription and billing types
CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'past_due', 'canceled', 'paused');
CREATE TYPE billing_cycle AS ENUM ('monthly', 'yearly');

-- Enhanced enums for existing types
CREATE TYPE employment_status AS ENUM ('active', 'inactive', 'terminated');

-- =====================================================
-- CORE TENANT TABLES
-- =====================================================

-- Organizations (Primary tenant entity)
CREATE TABLE organizations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text UNIQUE NOT NULL,
    domain text UNIQUE,
    subscription_plan text DEFAULT 'free',
    settings jsonb DEFAULT '{}',
    branding jsonb DEFAULT '{}',
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    CONSTRAINT organizations_slug_format CHECK (slug ~ '^[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$'),
    CONSTRAINT organizations_name_length CHECK (char_length(name) >= 2 AND char_length(name) <= 100)
);

-- Projects (Secondary isolation within organizations)
CREATE TABLE projects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    settings jsonb DEFAULT '{}',
    is_active boolean DEFAULT true,
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    UNIQUE(organization_id, name),
    CONSTRAINT projects_name_length CHECK (char_length(name) >= 2 AND char_length(name) <= 100)
);

-- Subscriptions and billing
CREATE TABLE subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    plan_id text NOT NULL,
    status subscription_status DEFAULT 'trial',
    current_period_start timestamptz,
    current_period_end timestamptz,
    trial_end timestamptz,
    billing_cycle billing_cycle DEFAULT 'monthly',
    amount_cents integer,
    currency text DEFAULT 'USD',
    stripe_customer_id text,
    stripe_subscription_id text,
    payment_method_id text,
    last_payment_at timestamptz,
    next_billing_date timestamptz,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    CONSTRAINT subscriptions_positive_amount CHECK (amount_cents >= 0)
);

-- =====================================================
-- USER MANAGEMENT ENHANCEMENT
-- =====================================================

-- Add organization context to users table (non-breaking addition)
ALTER TABLE users 
ADD COLUMN organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
ADD COLUMN role organization_role DEFAULT 'member',
ADD COLUMN invited_by uuid REFERENCES auth.users(id),
ADD COLUMN invited_at timestamptz,
ADD COLUMN joined_at timestamptz,
ADD COLUMN last_login_at timestamptz,
ADD COLUMN settings jsonb DEFAULT '{}';

-- Project user assignments
CREATE TABLE project_users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role project_role DEFAULT 'member',
    assigned_by uuid REFERENCES auth.users(id),
    assigned_at timestamptz DEFAULT now(),
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    UNIQUE(project_id, user_id)
);

-- User invitations
CREATE TABLE user_invitations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
    email text NOT NULL,
    organization_role organization_role DEFAULT 'member',
    project_role project_role DEFAULT 'member',
    invited_by uuid NOT NULL REFERENCES auth.users(id),
    token text UNIQUE NOT NULL,
    expires_at timestamptz NOT NULL,
    accepted_at timestamptz,
    accepted_by uuid REFERENCES auth.users(id),
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    
    CONSTRAINT invitations_email_format CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$')
);

-- =====================================================
-- EXISTING TABLE ENHANCEMENTS
-- =====================================================

-- Add multi-tenant columns to team_members
ALTER TABLE team_members 
ADD COLUMN organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
ADD COLUMN project_id uuid REFERENCES projects(id) ON DELETE CASCADE;

-- Add multi-tenant columns to installations  
ALTER TABLE installations
ADD COLUMN organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
ADD COLUMN project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
ADD COLUMN created_by uuid REFERENCES auth.users(id);

-- Update assignments table
ALTER TABLE assignments 
ADD COLUMN organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
ADD COLUMN project_id uuid REFERENCES projects(id) ON DELETE CASCADE;

-- Update notifications table
ALTER TABLE notifications
ADD COLUMN organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
ADD COLUMN project_id uuid REFERENCES projects(id) ON DELETE CASCADE;

-- =====================================================
-- ORGANIZATION FEATURES
-- =====================================================

-- Organization settings templates
CREATE TABLE organization_settings_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    settings_schema jsonb NOT NULL,
    default_values jsonb DEFAULT '{}',
    is_system boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- Organization API keys
CREATE TABLE organization_api_keys (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name text NOT NULL,
    key_hash text NOT NULL,
    key_prefix text NOT NULL,
    scopes text[] DEFAULT '{}',
    last_used_at timestamptz,
    expires_at timestamptz,
    created_by uuid NOT NULL REFERENCES auth.users(id),
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    
    UNIQUE(organization_id, name),
    UNIQUE(key_hash)
);

-- Organization integrations
CREATE TABLE organization_integrations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    integration_type text NOT NULL,
    name text NOT NULL,
    configuration jsonb DEFAULT '{}',
    credentials jsonb DEFAULT '{}',
    is_active boolean DEFAULT true,
    last_sync_at timestamptz,
    sync_status text DEFAULT 'pending',
    sync_error text,
    created_by uuid NOT NULL REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    UNIQUE(organization_id, integration_type, name)
);

-- =====================================================
-- AUDIT AND ACTIVITY TRACKING
-- =====================================================

-- Organization activity log
CREATE TABLE organization_activities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    activity_type text NOT NULL,
    entity_type text,
    entity_id uuid,
    description text NOT NULL,
    metadata jsonb DEFAULT '{}',
    ip_address inet,
    user_agent text,
    created_at timestamptz DEFAULT now(),
    
    CONSTRAINT activities_description_length CHECK (char_length(description) <= 500)
);

-- Data retention policies
CREATE TABLE data_retention_policies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    entity_type text NOT NULL,
    retention_days integer NOT NULL,
    is_active boolean DEFAULT true,
    created_by uuid NOT NULL REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    UNIQUE(organization_id, entity_type),
    CONSTRAINT retention_positive_days CHECK (retention_days > 0)
);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_users_updated_at BEFORE UPDATE ON project_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organization_integrations_updated_at BEFORE UPDATE ON organization_integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_retention_policies_updated_at BEFORE UPDATE ON data_retention_policies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user creation with organization context
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    org_id uuid;
    invitation_record record;
BEGIN
    -- Check if user was invited (has invitation token in metadata)
    IF NEW.raw_user_meta_data ? 'invitation_token' THEN
        SELECT * INTO invitation_record 
        FROM user_invitations 
        WHERE token = NEW.raw_user_meta_data->>'invitation_token'
        AND expires_at > now()
        AND accepted_at IS NULL;
        
        IF FOUND THEN
            -- Accept the invitation
            UPDATE user_invitations 
            SET accepted_at = now(), accepted_by = NEW.id 
            WHERE id = invitation_record.id;
            
            -- Set organization context
            org_id = invitation_record.organization_id;
            
            -- Insert user record
            INSERT INTO public.users (
                id, 
                email, 
                first_name, 
                last_name, 
                organization_id, 
                role,
                invited_by,
                invited_at,
                joined_at
            ) VALUES (
                NEW.id,
                NEW.email,
                COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
                COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
                org_id,
                invitation_record.organization_role,
                invitation_record.invited_by,
                invitation_record.created_at,
                now()
            );
            
            -- Assign to project if specified
            IF invitation_record.project_id IS NOT NULL THEN
                INSERT INTO project_users (project_id, user_id, role, assigned_by, assigned_at)
                VALUES (
                    invitation_record.project_id,
                    NEW.id,
                    invitation_record.project_role,
                    invitation_record.invited_by,
                    now()
                );
            END IF;
        END IF;
    ELSE
        -- Regular signup - create organization for them or handle as needed
        -- This should be handled by application logic for security
        NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to get user's organization and project context
CREATE OR REPLACE FUNCTION get_user_context(user_id uuid)
RETURNS TABLE (
    organization_id uuid,
    organization_role organization_role,
    projects jsonb
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.organization_id,
        u.role as organization_role,
        COALESCE(
            json_agg(
                json_build_object(
                    'project_id', pu.project_id,
                    'project_name', p.name,
                    'project_role', pu.role,
                    'is_active', pu.is_active
                )
            ) FILTER (WHERE pu.project_id IS NOT NULL),
            '[]'::jsonb
        ) as projects
    FROM users u
    LEFT JOIN project_users pu ON u.id = pu.user_id AND pu.is_active = true
    LEFT JOIN projects p ON pu.project_id = p.id AND p.is_active = true
    WHERE u.id = user_id AND u.is_active = true
    GROUP BY u.id, u.organization_id, u.role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log organization activities
CREATE OR REPLACE FUNCTION log_organization_activity(
    p_organization_id uuid,
    p_project_id uuid DEFAULT NULL,
    p_user_id uuid DEFAULT NULL,
    p_activity_type text,
    p_entity_type text DEFAULT NULL,
    p_entity_id uuid DEFAULT NULL,
    p_description text,
    p_metadata jsonb DEFAULT '{}'
)
RETURNS uuid AS $$
DECLARE
    activity_id uuid;
BEGIN
    INSERT INTO organization_activities (
        organization_id,
        project_id,
        user_id,
        activity_type,
        entity_type,
        entity_id,
        description,
        metadata
    ) VALUES (
        p_organization_id,
        p_project_id,
        COALESCE(p_user_id, auth.uid()),
        p_activity_type,
        p_entity_type,
        p_entity_id,
        p_description,
        p_metadata
    ) RETURNING id INTO activity_id;
    
    RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate API key
CREATE OR REPLACE FUNCTION generate_api_key(
    p_organization_id uuid,
    p_name text,
    p_scopes text[] DEFAULT '{}'
)
RETURNS text AS $$
DECLARE
    key_string text;
    key_hash text;
    key_prefix text;
BEGIN
    -- Generate random key
    key_string := 'tts_' || encode(gen_random_bytes(32), 'hex');
    key_prefix := substring(key_string, 1, 8);
    key_hash := encode(digest(key_string, 'sha256'), 'hex');
    
    -- Store in database
    INSERT INTO organization_api_keys (
        organization_id,
        name,
        key_hash,
        key_prefix,
        scopes,
        created_by
    ) VALUES (
        p_organization_id,
        p_name,
        key_hash,
        key_prefix,
        p_scopes,
        auth.uid()
    );
    
    -- Return the actual key (only time it's visible)
    RETURN key_string;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Core multi-tenant indexes
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_domain ON organizations(domain);
CREATE INDEX idx_organizations_active ON organizations(is_active);

CREATE INDEX idx_projects_org_id ON projects(organization_id);
CREATE INDEX idx_projects_org_active ON projects(organization_id, is_active);

CREATE INDEX idx_subscriptions_org_id ON subscriptions(organization_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);

-- User context indexes
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_org_active ON users(organization_id, is_active);

CREATE INDEX idx_project_users_project_id ON project_users(project_id);
CREATE INDEX idx_project_users_user_id ON project_users(user_id);
CREATE INDEX idx_project_users_active ON project_users(is_active);

-- Invitation indexes
CREATE INDEX idx_user_invitations_org_id ON user_invitations(organization_id);
CREATE INDEX idx_user_invitations_email ON user_invitations(email);
CREATE INDEX idx_user_invitations_token ON user_invitations(token);
CREATE INDEX idx_user_invitations_expires ON user_invitations(expires_at);

-- Multi-tenant data indexes
CREATE INDEX idx_team_members_org_project ON team_members(organization_id, project_id);
CREATE INDEX idx_installations_org_project ON installations(organization_id, project_id);
CREATE INDEX idx_assignments_org_project ON assignments(organization_id, project_id);
CREATE INDEX idx_notifications_org_user ON notifications(organization_id, recipient_id);

-- Activity and audit indexes
CREATE INDEX idx_activities_org_id ON organization_activities(organization_id);
CREATE INDEX idx_activities_project_id ON organization_activities(project_id);
CREATE INDEX idx_activities_user_id ON organization_activities(user_id);
CREATE INDEX idx_activities_created_at ON organization_activities(created_at);
CREATE INDEX idx_activities_entity ON organization_activities(entity_type, entity_id);

-- API keys indexes
CREATE INDEX idx_api_keys_org_id ON organization_api_keys(organization_id);
CREATE INDEX idx_api_keys_hash ON organization_api_keys(key_hash);
CREATE INDEX idx_api_keys_active ON organization_api_keys(is_active);

-- Integration indexes
CREATE INDEX idx_integrations_org_type ON organization_integrations(organization_id, integration_type);
CREATE INDEX idx_integrations_active ON organization_integrations(is_active);

-- =====================================================
-- INITIAL DATA AND SETUP
-- =====================================================

-- Create default subscription plans (these would typically be managed via application)
INSERT INTO organization_settings_templates (name, description, settings_schema, default_values, is_system) VALUES
('default_org_settings', 'Default organization settings template', 
 '{"type": "object", "properties": {"timezone": {"type": "string"}, "currency": {"type": "string"}, "date_format": {"type": "string"}}}',
 '{"timezone": "UTC", "currency": "USD", "date_format": "MM/DD/YYYY"}',
 true),
('project_settings', 'Default project settings template',
 '{"type": "object", "properties": {"work_hours": {"type": "object"}, "default_duration": {"type": "number"}}}',
 '{"work_hours": {"start": "08:00", "end": "17:00"}, "default_duration": 240}',
 true);

-- Create system activity types for consistent logging
DO $$
BEGIN
    -- This would typically be managed via application constants
    -- but included here for completeness
END $$;

-- =====================================================
-- COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON TABLE organizations IS 'Primary tenant entity - represents a customer organization/company';
COMMENT ON COLUMN organizations.slug IS 'URL-friendly identifier for the organization';
COMMENT ON COLUMN organizations.domain IS 'Custom domain for organization (if applicable)';
COMMENT ON COLUMN organizations.settings IS 'Organization-specific configuration and preferences';
COMMENT ON COLUMN organizations.branding IS 'Custom branding configuration (colors, logos, etc.)';

COMMENT ON TABLE projects IS 'Secondary isolation entity - represents projects within an organization';
COMMENT ON COLUMN projects.settings IS 'Project-specific configuration and preferences';

COMMENT ON TABLE subscriptions IS 'Billing and subscription management for organizations';
COMMENT ON COLUMN subscriptions.stripe_customer_id IS 'Stripe customer ID for billing';
COMMENT ON COLUMN subscriptions.stripe_subscription_id IS 'Stripe subscription ID';

COMMENT ON TABLE project_users IS 'Maps users to projects with specific roles';
COMMENT ON TABLE user_invitations IS 'Manages user invitations to organizations and projects';

COMMENT ON TABLE organization_activities IS 'Audit log for organization and project activities';
COMMENT ON TABLE organization_api_keys IS 'API key management for organization integrations';
COMMENT ON TABLE organization_integrations IS 'Third-party integration configurations';

COMMENT ON FUNCTION handle_new_user() IS 'Handles user signup with organization context from invitations';
COMMENT ON FUNCTION get_user_context(uuid) IS 'Returns user organization and project context for JWT claims';
COMMENT ON FUNCTION log_organization_activity IS 'Logs organization activities for audit trail';
COMMENT ON FUNCTION generate_api_key IS 'Generates secure API keys for organizations';