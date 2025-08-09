-- Multi-Tenant Migration SQL Consolidated
-- Generated: 2025-08-09T07:08:51.446Z
-- Execute this SQL in Supabase SQL Editor


-- =====================================================
-- MIGRATION STEP 1: 003_multi_tenant_transformation.sql
-- =====================================================

-- Multi-Tenant Transformation: Phase 1 - Core Schema
-- This migration transforms the single-tenant application into a multi-tenant SaaS platform

-- =====================================================
-- ENUMS AND TYPES
-- =====================================================

-- Organization and project roles
DO $$ BEGIN
    CREATE TYPE organization_role AS ENUM ('owner', 'admin', 'manager', 'member');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE project_role AS ENUM ('admin', 'manager', 'scheduler', 'lead', 'assistant', 'viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Subscription and billing types
DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'past_due', 'canceled', 'paused');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE billing_cycle AS ENUM ('monthly', 'yearly');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enhanced enums for existing types
DO $$ BEGIN
    CREATE TYPE employment_status AS ENUM ('active', 'inactive', 'terminated');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- CORE TENANT TABLES
-- =====================================================

-- Organizations (Primary tenant entity)
CREATE TABLE IF NOT EXISTS organizations (
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
CREATE TABLE IF NOT EXISTS projects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    settings jsonb DEFAULT '{}',
    is_active boolean DEFAULT true,
    created_by uuid REFERENCES users(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    UNIQUE(organization_id, name),
    CONSTRAINT projects_name_length CHECK (char_length(name) >= 2 AND char_length(name) <= 100)
);

-- Subscriptions and billing
CREATE TABLE IF NOT EXISTS subscriptions (
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

-- Add organization context to users table (safe column additions)
DO $$ BEGIN
    ALTER TABLE users ADD COLUMN organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN RAISE NOTICE 'Column organization_id already exists in users, skipping...'; END $$;

-- Handle role column - may exist as user_role enum, need to convert to organization_role
DO $$ 
DECLARE
    role_column_exists boolean;
    current_role_type text;
BEGIN
    -- Check if role column exists and get its type
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'role'
    ) INTO role_column_exists;
    
    IF role_column_exists THEN
        -- Get the current enum type name
        SELECT udt_name INTO current_role_type
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'role';
        
        RAISE NOTICE 'Found existing role column with type: %', current_role_type;
        
        -- If it's user_role, we need to add organization_role column instead
        IF current_role_type = 'user_role' THEN
            RAISE NOTICE 'Adding organization_role column to work alongside existing user_role column';
            ALTER TABLE users ADD COLUMN organization_role organization_role DEFAULT 'member';
        ELSIF current_role_type != 'organization_role' THEN
            -- Some other enum type, add organization_role column
            ALTER TABLE users ADD COLUMN organization_role organization_role DEFAULT 'member';
        ELSE
            RAISE NOTICE 'Role column already has organization_role type';
        END IF;
    ELSE
        -- No role column exists, create it with organization_role type
        ALTER TABLE users ADD COLUMN role organization_role DEFAULT 'member';
    END IF;
EXCEPTION 
    WHEN duplicate_column THEN RAISE NOTICE 'Role-related column already exists in users, skipping...'; 
    WHEN OTHERS THEN RAISE NOTICE 'Error handling role column: %, continuing...', SQLERRM;
END $$;

DO $$ BEGIN
    ALTER TABLE users ADD COLUMN invited_by uuid REFERENCES users(id);
EXCEPTION WHEN duplicate_column THEN RAISE NOTICE 'Column invited_by already exists in users, skipping...'; END $$;

DO $$ BEGIN
    ALTER TABLE users ADD COLUMN invited_at timestamptz;
EXCEPTION WHEN duplicate_column THEN RAISE NOTICE 'Column invited_at already exists in users, skipping...'; END $$;

DO $$ BEGIN
    ALTER TABLE users ADD COLUMN joined_at timestamptz;
EXCEPTION WHEN duplicate_column THEN RAISE NOTICE 'Column joined_at already exists in users, skipping...'; END $$;

DO $$ BEGIN
    ALTER TABLE users ADD COLUMN last_login_at timestamptz;
EXCEPTION WHEN duplicate_column THEN RAISE NOTICE 'Column last_login_at already exists in users, skipping...'; END $$;

DO $$ BEGIN
    ALTER TABLE users ADD COLUMN settings jsonb DEFAULT '{}';
EXCEPTION WHEN duplicate_column THEN RAISE NOTICE 'Column settings already exists in users, skipping...'; END $$;

-- Project user assignments
CREATE TABLE IF NOT EXISTS project_users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role project_role DEFAULT 'viewer',
    assigned_by uuid REFERENCES users(id),
    assigned_at timestamptz DEFAULT now(),
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    UNIQUE(project_id, user_id)
);

-- User invitations
CREATE TABLE IF NOT EXISTS user_invitations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
    email text NOT NULL,
    organization_role organization_role DEFAULT 'member',
    project_role project_role DEFAULT 'viewer',
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

-- Add multi-tenant columns to team_members (safe additions)
DO $$ BEGIN
    ALTER TABLE team_members ADD COLUMN organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN RAISE NOTICE 'Column organization_id already exists in team_members, skipping...'; END $$;

DO $$ BEGIN
    ALTER TABLE team_members ADD COLUMN project_id uuid REFERENCES projects(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN RAISE NOTICE 'Column project_id already exists in team_members, skipping...'; END $$;

-- Add multi-tenant columns to installations (safe additions)
DO $$ BEGIN
    ALTER TABLE installations ADD COLUMN organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN RAISE NOTICE 'Column organization_id already exists in installations, skipping...'; END $$;

DO $$ BEGIN
    ALTER TABLE installations ADD COLUMN project_id uuid REFERENCES projects(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN RAISE NOTICE 'Column project_id already exists in installations, skipping...'; END $$;

DO $$ BEGIN
    ALTER TABLE installations ADD COLUMN created_by uuid REFERENCES users(id);
EXCEPTION WHEN duplicate_column THEN RAISE NOTICE 'Column created_by already exists in installations, skipping...'; END $$;

-- Update assignments table (safe additions)
DO $$ BEGIN
    ALTER TABLE assignments ADD COLUMN organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN RAISE NOTICE 'Column organization_id already exists in assignments, skipping...'; END $$;

DO $$ BEGIN
    ALTER TABLE assignments ADD COLUMN project_id uuid REFERENCES projects(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN RAISE NOTICE 'Column project_id already exists in assignments, skipping...'; END $$;

-- Update notifications table (safe additions)
DO $$ BEGIN
    ALTER TABLE notifications ADD COLUMN organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN RAISE NOTICE 'Column organization_id already exists in notifications, skipping...'; END $$;

DO $$ BEGIN
    ALTER TABLE notifications ADD COLUMN project_id uuid REFERENCES projects(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN RAISE NOTICE 'Column project_id already exists in notifications, skipping...'; END $$;

-- =====================================================
-- ORGANIZATION FEATURES
-- =====================================================

-- Organization settings templates
CREATE TABLE IF NOT EXISTS organization_settings_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    settings_schema jsonb NOT NULL,
    default_values jsonb DEFAULT '{}',
    is_system boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- Organization API keys
CREATE TABLE IF NOT EXISTS organization_api_keys (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name text NOT NULL,
    key_hash text NOT NULL,
    key_prefix text NOT NULL,
    scopes text[] DEFAULT '{}',
    last_used_at timestamptz,
    expires_at timestamptz,
    created_by uuid NOT NULL REFERENCES users(id),
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    
    UNIQUE(organization_id, name),
    UNIQUE(key_hash)
);

-- Organization integrations
CREATE TABLE IF NOT EXISTS organization_integrations (
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
    created_by uuid NOT NULL REFERENCES users(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    UNIQUE(organization_id, integration_type, name)
);

-- =====================================================
-- AUDIT AND ACTIVITY TRACKING
-- =====================================================

-- Organization activity log
CREATE TABLE IF NOT EXISTS organization_activities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
    user_id uuid REFERENCES users(id) ON DELETE SET NULL,
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
CREATE TABLE IF NOT EXISTS data_retention_policies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    entity_type text NOT NULL,
    retention_days integer NOT NULL,
    is_active boolean DEFAULT true,
    created_by uuid NOT NULL REFERENCES users(id),
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

-- Triggers for updated_at (safe trigger creation)
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_project_users_updated_at ON project_users;
CREATE TRIGGER update_project_users_updated_at BEFORE UPDATE ON project_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_organization_integrations_updated_at ON organization_integrations;
CREATE TRIGGER update_organization_integrations_updated_at BEFORE UPDATE ON organization_integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_data_retention_policies_updated_at ON data_retention_policies;
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

-- Trigger for new user handling (safe trigger creation)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to get user's effective organization role (handles both role and organization_role columns)
CREATE OR REPLACE FUNCTION get_user_org_role(user_id uuid)
RETURNS text AS $$
DECLARE
    org_role text;
    user_role text;
    has_org_role_column boolean;
    has_role_column boolean;
BEGIN
    -- Check which columns exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'organization_role'
    ) INTO has_org_role_column;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'role'
    ) INTO has_role_column;
    
    -- Get the organization role value
    IF has_org_role_column THEN
        EXECUTE format('SELECT organization_role::text FROM users WHERE id = $1 AND is_active = true')
        USING user_id INTO org_role;
        
        IF org_role IS NOT NULL THEN
            RETURN org_role;
        END IF;
    END IF;
    
    -- Fall back to role column and convert user_role values to organization_role equivalents
    IF has_role_column THEN
        EXECUTE format('SELECT role::text FROM users WHERE id = $1 AND is_active = true')
        USING user_id INTO user_role;
        
        -- Convert user_role values to organization_role equivalents
        CASE user_role
            WHEN 'admin' THEN RETURN 'admin';
            WHEN 'manager' THEN RETURN 'manager';
            WHEN 'scheduler' THEN RETURN 'member';
            WHEN 'tech' THEN RETURN 'member';
            ELSE RETURN 'member';
        END CASE;
    END IF;
    
    RETURN 'member'; -- Default fallback
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's organization and project context
CREATE OR REPLACE FUNCTION get_user_context(user_id uuid)
RETURNS TABLE (
    organization_id uuid,
    organization_role text,
    projects jsonb
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.organization_id,
        get_user_org_role(u.id) as organization_role,
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
    GROUP BY u.id, u.organization_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create custom JWT claims for multi-tenant authentication
CREATE OR REPLACE FUNCTION get_claims(user_id uuid)
RETURNS jsonb AS $$
DECLARE
    user_context record;
    claims jsonb;
BEGIN
    -- Get user context including organization and role info
    SELECT * INTO user_context
    FROM get_user_context(user_id);
    
    -- Create JWT claims with organization context
    claims := jsonb_build_object(
        'organization_id', user_context.organization_id,
        'user_role', user_context.organization_role,
        'projects', user_context.projects
    );
    
    RETURN claims;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to refresh user JWT claims (for use in authentication hooks)
CREATE OR REPLACE FUNCTION refresh_user_claims()
RETURNS TRIGGER AS $$
DECLARE
    new_claims jsonb;
BEGIN
    -- Get updated claims for the user
    new_claims := get_claims(NEW.id);
    
    -- Update auth.users with new custom claims
    UPDATE auth.users 
    SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || new_claims
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically update JWT claims when user context changes
DROP TRIGGER IF EXISTS update_user_claims ON users;
CREATE TRIGGER update_user_claims
    AFTER INSERT OR UPDATE OF organization_id, organization_role, is_active
    ON users
    FOR EACH ROW
    EXECUTE FUNCTION refresh_user_claims();

-- Function to log organization activities
CREATE OR REPLACE FUNCTION log_organization_activity(
    p_organization_id uuid,
    p_activity_type text,
    p_description text,
    p_project_id uuid DEFAULT NULL,
    p_user_id uuid DEFAULT NULL,
    p_entity_type text DEFAULT NULL,
    p_entity_id uuid DEFAULT NULL,
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
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_domain ON organizations(domain);
CREATE INDEX IF NOT EXISTS idx_organizations_active ON organizations(is_active);

CREATE INDEX IF NOT EXISTS idx_projects_org_id ON projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_org_active ON projects(organization_id, is_active);

CREATE INDEX IF NOT EXISTS idx_subscriptions_org_id ON subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);

-- User context indexes
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);

CREATE INDEX IF NOT EXISTS idx_project_users_project_id ON project_users(project_id);
CREATE INDEX IF NOT EXISTS idx_project_users_user_id ON project_users(user_id);
CREATE INDEX IF NOT EXISTS idx_project_users_active ON project_users(is_active);

-- Invitation indexes
CREATE INDEX IF NOT EXISTS idx_user_invitations_org_id ON user_invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_invitations_email ON user_invitations(email);
CREATE INDEX IF NOT EXISTS idx_user_invitations_token ON user_invitations(token);
CREATE INDEX IF NOT EXISTS idx_user_invitations_expires ON user_invitations(expires_at);

-- Multi-tenant data indexes
CREATE INDEX IF NOT EXISTS idx_team_members_org_project ON team_members(organization_id, project_id);
CREATE INDEX IF NOT EXISTS idx_installations_org_project ON installations(organization_id, project_id);
CREATE INDEX IF NOT EXISTS idx_assignments_org_project ON assignments(organization_id, project_id);
CREATE INDEX IF NOT EXISTS idx_notifications_org_user ON notifications(organization_id, recipient_id);

-- Activity and audit indexes
CREATE INDEX IF NOT EXISTS idx_activities_org_id ON organization_activities(organization_id);
CREATE INDEX IF NOT EXISTS idx_activities_project_id ON organization_activities(project_id);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON organization_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON organization_activities(created_at);
CREATE INDEX IF NOT EXISTS idx_activities_entity ON organization_activities(entity_type, entity_id);

-- API keys indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_org_id ON organization_api_keys(organization_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON organization_api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON organization_api_keys(is_active);

-- Integration indexes
CREATE INDEX IF NOT EXISTS idx_integrations_org_type ON organization_integrations(organization_id, integration_type);
CREATE INDEX IF NOT EXISTS idx_integrations_active ON organization_integrations(is_active);

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


-- =====================================================
-- MIGRATION STEP 2: 004_multi_tenant_rls_policies.sql
-- =====================================================

-- Multi-Tenant Transformation: Phase 2 - Row Level Security Policies
-- This migration implements comprehensive RLS policies for multi-tenant data isolation

-- =====================================================
-- ENABLE RLS ON ALL TENANT TABLES
-- =====================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_retention_policies ENABLE ROW LEVEL SECURITY;

-- Enable RLS on enhanced existing tables
-- Note: users, team_members, installations, assignments, notifications already have RLS enabled

-- =====================================================
-- ORGANIZATIONS POLICIES
-- =====================================================

-- Users can only see their own organization
DROP POLICY IF EXISTS "organization_access" ON organizations;
CREATE POLICY "organization_access" ON organizations
    FOR ALL USING (
        -- Organization owners/admins can see full details
        id = (auth.jwt() ->> 'organization_id')::uuid
        -- Service role has full access (for system operations)
        OR auth.jwt() ->> 'role' = 'service_role'
    );

-- =====================================================
-- PROJECTS POLICIES
-- =====================================================

-- Users can access projects within their organization
DROP POLICY IF EXISTS "project_organization_access" ON projects;
CREATE POLICY "project_organization_access" ON projects
    FOR ALL USING (
        organization_id = (auth.jwt() ->> 'organization_id')::uuid
        AND (
            -- Organization owners/admins see all projects
            auth.jwt() ->> 'user_role' IN ('owner', 'admin')
            -- Or user is assigned to the project
            OR id IN (SELECT project_id FROM project_users WHERE user_id = auth.uid() AND is_active = true)
            -- Service role has full access
            OR auth.jwt() ->> 'role' = 'service_role'
        )
    );

-- Users can create projects if they have appropriate role
DROP POLICY IF EXISTS "project_create" ON projects;
CREATE POLICY "project_create" ON projects
    FOR INSERT WITH CHECK (
        organization_id = (auth.jwt() ->> 'organization_id')::uuid
        AND auth.jwt() ->> 'user_role' IN ('owner', 'admin', 'manager')
    );

-- =====================================================
-- SUBSCRIPTIONS POLICIES
-- =====================================================

-- Only organization owners/admins can access subscription information
DROP POLICY IF EXISTS "subscription_org_admin_access" ON subscriptions;
CREATE POLICY "subscription_org_admin_access" ON subscriptions
    FOR ALL USING (
        organization_id = (auth.jwt() ->> 'organization_id')::uuid
        AND (
            auth.jwt() ->> 'user_role' IN ('owner', 'admin')
            OR auth.jwt() ->> 'role' = 'service_role'
        )
    );

-- =====================================================
-- PROJECT USERS POLICIES
-- =====================================================

-- Users can see project assignments within their organization
DROP POLICY IF EXISTS "project_users_access" ON project_users;
CREATE POLICY "project_users_access" ON project_users
    FOR SELECT USING (
        -- Must be within user's organization
        project_id IN (
            SELECT id FROM projects 
            WHERE organization_id = (auth.jwt() ->> 'organization_id')::uuid
        )
        AND (
            -- User can see their own assignments
            user_id = auth.uid()
            -- Organization admins see all
            OR auth.jwt() ->> 'user_role' IN ('owner', 'admin')
            -- Project admins see project assignments
            OR project_id IN (
                SELECT project_id FROM project_users 
                WHERE user_id = auth.uid() AND role IN ('admin', 'manager') AND is_active = true
            )
            -- Service role access
            OR auth.jwt() ->> 'role' = 'service_role'
        )
    );

-- Users with appropriate permissions can manage project assignments
DROP POLICY IF EXISTS "project_users_manage" ON project_users;
CREATE POLICY "project_users_manage" ON project_users
    FOR INSERT WITH CHECK (
        -- Must be within user's organization
        project_id IN (
            SELECT id FROM projects 
            WHERE organization_id = (auth.jwt() ->> 'organization_id')::uuid
        )
        AND (
            -- Organization owners/admins can assign anyone
            auth.jwt() ->> 'user_role' IN ('owner', 'admin')
            -- Project admins can assign to their projects
            OR project_id IN (
                SELECT project_id FROM project_users 
                WHERE user_id = auth.uid() AND role IN ('admin', 'manager') AND is_active = true
            )
        )
    );

DROP POLICY IF EXISTS "project_users_update" ON project_users;
CREATE POLICY "project_users_update" ON project_users
    FOR UPDATE USING (
        -- Same conditions as manage
        project_id IN (
            SELECT id FROM projects 
            WHERE organization_id = (auth.jwt() ->> 'organization_id')::uuid
        )
        AND (
            auth.jwt() ->> 'user_role' IN ('owner', 'admin')
            OR project_id IN (
                SELECT project_id FROM project_users 
                WHERE user_id = auth.uid() AND role IN ('admin', 'manager') AND is_active = true
            )
        )
    );

-- =====================================================
-- USER INVITATIONS POLICIES
-- =====================================================

-- Users can see invitations for their organization
DROP POLICY IF EXISTS "invitations_org_access" ON user_invitations;
CREATE POLICY "invitations_org_access" ON user_invitations
    FOR SELECT USING (
        organization_id = (auth.jwt() ->> 'organization_id')::uuid
        AND (
            auth.jwt() ->> 'user_role' IN ('owner', 'admin', 'manager')
            OR invited_by = auth.uid()
            OR auth.jwt() ->> 'role' = 'service_role'
        )
    );

-- Users with appropriate role can create invitations
DROP POLICY IF EXISTS "invitations_create" ON user_invitations;
CREATE POLICY "invitations_create" ON user_invitations
    FOR INSERT WITH CHECK (
        organization_id = (auth.jwt() ->> 'organization_id')::uuid
        AND (
            auth.jwt() ->> 'user_role' IN ('owner', 'admin', 'manager')
        )
        AND invited_by = auth.uid()
    );

-- Update invitations (for acceptance)
DROP POLICY IF EXISTS "invitations_update" ON user_invitations;
CREATE POLICY "invitations_update" ON user_invitations
    FOR UPDATE USING (
        -- System can update for acceptance
        auth.jwt() ->> 'role' = 'service_role'
        -- Or invitation owner
        OR (
            organization_id = (auth.jwt() ->> 'organization_id')::uuid
            AND invited_by = auth.uid()
        )
    );

-- =====================================================
-- ENHANCED USERS POLICIES
-- =====================================================

-- Drop existing policies if any and recreate with organization context
DROP POLICY IF EXISTS "Users can access organization members" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;

-- Users can see members of their organization
DROP POLICY IF EXISTS "users_organization_access" ON users;
CREATE POLICY "users_organization_access" ON users
    FOR SELECT USING (
        -- Fixed: Remove recursive SELECT to avoid infinite recursion
        id = auth.uid()
        OR auth.jwt() ->> 'role' = 'service_role'
        OR auth.jwt() ->> 'user_role' IN ('owner', 'admin')
    );

-- Users can update their own profile
DROP POLICY IF EXISTS "users_own_profile_update" ON users;
CREATE POLICY "users_own_profile_update" ON users
    FOR UPDATE USING (id = auth.uid());

-- Organization admins can update organization member profiles
DROP POLICY IF EXISTS "users_org_admin_update" ON users;
CREATE POLICY "users_org_admin_update" ON users
    FOR UPDATE USING (
        -- Fixed: Use JWT claims to avoid recursive SELECT
        auth.jwt() ->> 'role' = 'service_role'
        OR (
            auth.jwt() ->> 'user_role' IN ('owner', 'admin') 
            AND auth.jwt() ->> 'organization_id' = organization_id::text
        )
    );

-- =====================================================
-- TEAM MEMBERS POLICIES
-- =====================================================

-- Drop existing policies and recreate with multi-tenant context
DROP POLICY IF EXISTS "Project access for team members" ON team_members;
DROP POLICY IF EXISTS "Admins can manage team members" ON team_members;

-- Users can access team members in their organization/projects
DROP POLICY IF EXISTS "team_members_access" ON team_members;
CREATE POLICY "team_members_access" ON team_members
    FOR SELECT USING (
        -- Fixed: Use JWT claims to avoid recursive SELECT from users
        (
            -- Organization admins see all team members  
            auth.jwt() ->> 'user_role' IN ('owner', 'admin')
            AND auth.jwt() ->> 'organization_id' = organization_id::text
        )
        OR (
            -- Project members see team members in their projects
            project_id IN (
                SELECT project_id FROM project_users 
                WHERE user_id = auth.uid() AND is_active = true
            )
        )
        -- Team members can see themselves
        OR user_id = auth.uid()
        -- Service role access
        OR auth.jwt() ->> 'role' = 'service_role'
    );

-- Team member management policies
DROP POLICY IF EXISTS "team_members_manage" ON team_members;
CREATE POLICY "team_members_manage" ON team_members
    FOR INSERT WITH CHECK (
        -- Fixed: Use JWT claims to avoid recursive SELECT from users
        (
            auth.jwt() ->> 'user_role' IN ('owner', 'admin')
            AND auth.jwt() ->> 'organization_id' = organization_id::text
        )
        OR project_id IN (
            SELECT project_id FROM project_users 
            WHERE user_id = auth.uid() AND role IN ('admin', 'manager') AND is_active = true
        )
        OR auth.jwt() ->> 'role' = 'service_role'
    );

DROP POLICY IF EXISTS "team_members_update" ON team_members;
CREATE POLICY "team_members_update" ON team_members
    FOR UPDATE USING (
        -- Fixed: Use JWT claims to avoid recursive SELECT from users
        (
            auth.jwt() ->> 'user_role' IN ('owner', 'admin')
            AND auth.jwt() ->> 'organization_id' = organization_id::text
        )
        OR project_id IN (
            SELECT project_id FROM project_users 
            WHERE user_id = auth.uid() AND role IN ('admin', 'manager') AND is_active = true
        )
        -- Team members can update their own profiles
        OR user_id = auth.uid()
        OR auth.jwt() ->> 'role' = 'service_role'
    );

DROP POLICY IF EXISTS "team_members_delete" ON team_members;
CREATE POLICY "team_members_delete" ON team_members
    FOR DELETE USING (
        -- Fixed: Use JWT claims to avoid recursive SELECT from users
        (
            auth.jwt() ->> 'user_role' IN ('owner', 'admin')
            AND auth.jwt() ->> 'organization_id' = organization_id::text
        )
        OR project_id IN (
            SELECT project_id FROM project_users 
            WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
        )
        OR auth.jwt() ->> 'role' = 'service_role'
    );

-- =====================================================
-- INSTALLATIONS POLICIES
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Project installations access" ON installations;

-- Users can access installations in their organization/projects
DROP POLICY IF EXISTS "installations_access" ON installations;
CREATE POLICY "installations_access" ON installations
    FOR SELECT USING (
        organization_id = (auth.jwt() ->> 'organization_id')::uuid
        AND (
            -- Organization admins see all
            auth.jwt() ->> 'user_role' IN ('owner', 'admin')
            -- Project members see project installations
            OR project_id IN (
                SELECT project_id FROM project_users 
                WHERE user_id = auth.uid() AND is_active = true
            )
            -- Service role access
            OR auth.jwt() ->> 'role' = 'service_role'
        )
    );

-- Installation management policies
DROP POLICY IF EXISTS "installations_create" ON installations;
CREATE POLICY "installations_create" ON installations
    FOR INSERT WITH CHECK (
        organization_id = (auth.jwt() ->> 'organization_id')::uuid
        AND (
            project_id IN (
                SELECT project_id FROM project_users 
                WHERE user_id = auth.uid() AND role IN ('admin', 'manager', 'scheduler') AND is_active = true
            )
            OR auth.jwt() ->> 'user_role' IN ('owner', 'admin')
        )
        AND created_by = auth.uid()
    );

DROP POLICY IF EXISTS "installations_update" ON installations;
CREATE POLICY "installations_update" ON installations
    FOR UPDATE USING (
        organization_id = (auth.jwt() ->> 'organization_id')::uuid
        AND (
            auth.jwt() ->> 'user_role' IN ('owner', 'admin')
            OR project_id IN (
                SELECT project_id FROM project_users 
                WHERE user_id = auth.uid() AND role IN ('admin', 'manager', 'scheduler') AND is_active = true
            )
            OR created_by = auth.uid()
        )
    );

DROP POLICY IF EXISTS "installations_delete" ON installations;
CREATE POLICY "installations_delete" ON installations
    FOR DELETE USING (
        organization_id = (auth.jwt() ->> 'organization_id')::uuid
        AND (
            auth.jwt() ->> 'user_role' IN ('owner', 'admin')
            OR (
                project_id IN (
                    SELECT project_id FROM project_users 
                    WHERE user_id = auth.uid() AND role IN ('admin', 'manager') AND is_active = true
                )
                AND created_by = auth.uid()
            )
        )
    );

-- =====================================================
-- ASSIGNMENTS POLICIES
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Project assignments access" ON assignments;

-- Assignment access policies
DROP POLICY IF EXISTS "assignments_access" ON assignments;
CREATE POLICY "assignments_access" ON assignments
    FOR SELECT USING (
        organization_id = (auth.jwt() ->> 'organization_id')::uuid
        AND (
            -- Organization admins see all
            auth.jwt() ->> 'user_role' IN ('owner', 'admin')
            -- Project members see project assignments
            OR project_id IN (
                SELECT project_id FROM project_users 
                WHERE user_id = auth.uid() AND is_active = true
            )
            -- Team members see their own assignments
            OR lead_id IN (
                SELECT id FROM team_members WHERE organization_id = (auth.jwt() ->> 'organization_id')::uuid AND user_id = auth.uid()
            )
            OR assistant_id IN (
                SELECT id FROM team_members WHERE organization_id = (auth.jwt() ->> 'organization_id')::uuid AND user_id = auth.uid()
            )
            -- Service role access
            OR auth.jwt() ->> 'role' = 'service_role'
        )
    );

-- Assignment management policies
DROP POLICY IF EXISTS "assignments_create" ON assignments;
CREATE POLICY "assignments_create" ON assignments
    FOR INSERT WITH CHECK (
        organization_id = (auth.jwt() ->> 'organization_id')::uuid
        AND (
            auth.jwt() ->> 'user_role' IN ('owner', 'admin')
            OR project_id IN (
                SELECT project_id FROM project_users 
                WHERE user_id = auth.uid() AND role IN ('admin', 'manager', 'scheduler') AND is_active = true
            )
        )
        AND assigned_by = auth.uid()
    );

DROP POLICY IF EXISTS "assignments_update" ON assignments;
CREATE POLICY "assignments_update" ON assignments
    FOR UPDATE USING (
        organization_id = (auth.jwt() ->> 'organization_id')::uuid
        AND (
            auth.jwt() ->> 'user_role' IN ('owner', 'admin')
            OR project_id IN (
                SELECT project_id FROM project_users 
                WHERE user_id = auth.uid() AND role IN ('admin', 'manager', 'scheduler') AND is_active = true
            )
            OR assigned_by = auth.uid()
        )
    );

DROP POLICY IF EXISTS "assignments_delete" ON assignments;
CREATE POLICY "assignments_delete" ON assignments
    FOR DELETE USING (
        organization_id = (auth.jwt() ->> 'organization_id')::uuid
        AND (
            auth.jwt() ->> 'user_role' IN ('owner', 'admin')
            OR (
                project_id IN (
                    SELECT project_id FROM project_users 
                    WHERE user_id = auth.uid() AND role IN ('admin', 'manager') AND is_active = true
                )
                AND assigned_by = auth.uid()
            )
        )
    );

-- =====================================================
-- NOTIFICATIONS POLICIES
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;

-- Users can read their own notifications within their organization
DROP POLICY IF EXISTS "notifications_own_access" ON notifications;
CREATE POLICY "notifications_own_access" ON notifications
    FOR SELECT USING (
        recipient_id = auth.uid()
        AND organization_id = (auth.jwt() ->> 'organization_id')::uuid
    );

-- Users can update their own notifications (mark as read, etc.)
DROP POLICY IF EXISTS "notifications_own_update" ON notifications;
CREATE POLICY "notifications_own_update" ON notifications
    FOR UPDATE USING (
        recipient_id = auth.uid()
        AND organization_id = (auth.jwt() ->> 'organization_id')::uuid
    );

-- System and authorized users can create notifications
DROP POLICY IF EXISTS "notifications_create" ON notifications;
CREATE POLICY "notifications_create" ON notifications
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'role' = 'service_role'
        OR (
            organization_id = (auth.jwt() ->> 'organization_id')::uuid
            AND (
                -- Organization admins can create notifications
                auth.jwt() ->> 'user_role' IN ('owner', 'admin')
                -- Project managers can create project notifications
                OR (
                    project_id IS NOT NULL 
                    AND project_id IN (
                        SELECT project_id FROM project_users 
                        WHERE user_id = auth.uid() AND role IN ('admin', 'manager') AND is_active = true
                    )
                )
            )
        )
    );

-- =====================================================
-- ORGANIZATION ACTIVITY POLICIES
-- =====================================================

-- Users can see activities for their organization/projects
DROP POLICY IF EXISTS "activities_access" ON organization_activities;
CREATE POLICY "activities_access" ON organization_activities
    FOR SELECT USING (
        organization_id = (auth.jwt() ->> 'organization_id')::uuid
        AND (
            -- Organization admins see all activities
            auth.jwt() ->> 'user_role' IN ('owner', 'admin')
            -- Users see their own activities
            OR user_id = auth.uid()
            -- Project members see project activities
            OR (
                project_id IS NOT NULL 
                AND project_id IN (
                    SELECT project_id FROM project_users 
                    WHERE user_id = auth.uid() AND is_active = true
                )
            )
            -- Service role access
            OR auth.jwt() ->> 'role' = 'service_role'
        )
    );

-- System and authorized functions can insert activities
DROP POLICY IF EXISTS "activities_create" ON organization_activities;
CREATE POLICY "activities_create" ON organization_activities
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'role' = 'service_role'
        OR organization_id = (auth.jwt() ->> 'organization_id')::uuid
    );

-- =====================================================
-- API KEYS POLICIES
-- =====================================================

-- Organization admins can manage API keys
DROP POLICY IF EXISTS "api_keys_admin_access" ON organization_api_keys;
CREATE POLICY "api_keys_admin_access" ON organization_api_keys
    FOR ALL USING (
        organization_id = (auth.jwt() ->> 'organization_id')::uuid
        AND (
            auth.jwt() ->> 'user_role' IN ('owner', 'admin')
            OR auth.jwt() ->> 'role' = 'service_role'
        )
    );

-- =====================================================
-- INTEGRATIONS POLICIES
-- =====================================================

-- Organization admins can manage integrations
DROP POLICY IF EXISTS "integrations_admin_access" ON organization_integrations;
CREATE POLICY "integrations_admin_access" ON organization_integrations
    FOR ALL USING (
        organization_id = (auth.jwt() ->> 'organization_id')::uuid
        AND (
            auth.jwt() ->> 'user_role' IN ('owner', 'admin')
            OR auth.jwt() ->> 'role' = 'service_role'
        )
    );

-- =====================================================
-- DATA RETENTION POLICIES
-- =====================================================

-- Organization admins can manage data retention policies
DROP POLICY IF EXISTS "retention_policies_admin_access" ON data_retention_policies;
CREATE POLICY "retention_policies_admin_access" ON data_retention_policies
    FOR ALL USING (
        organization_id = (auth.jwt() ->> 'organization_id')::uuid
        AND (
            auth.jwt() ->> 'user_role' IN ('owner', 'admin')
            OR auth.jwt() ->> 'role' = 'service_role'
        )
    );

-- =====================================================
-- SECURITY FUNCTIONS
-- =====================================================

-- Function to validate organization membership
CREATE OR REPLACE FUNCTION validate_organization_member(target_org_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND organization_id = target_org_id 
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate project access
CREATE OR REPLACE FUNCTION validate_project_access(target_project_id uuid)
RETURNS boolean AS $$
DECLARE
    user_org_id uuid;
    project_org_id uuid;
    user_org_role text;
BEGIN
    -- Get user's organization
    SELECT organization_id INTO user_org_id
    FROM users 
    WHERE id = auth.uid() AND is_active = true;
    
    -- Get user's effective organization role
    user_org_role := get_user_org_role(auth.uid());
    
    -- Get project's organization
    SELECT organization_id INTO project_org_id
    FROM projects 
    WHERE id = target_project_id AND is_active = true;
    
    -- Must be in same organization
    IF user_org_id != project_org_id THEN
        RETURN false;
    END IF;
    
    -- Organization owners/admins have access to all projects
    IF user_org_role IN ('owner', 'admin') THEN
        RETURN true;
    END IF;
    
    -- Check if user is assigned to the project
    RETURN EXISTS (
        SELECT 1 FROM project_users 
        WHERE project_id = target_project_id 
        AND user_id = auth.uid() 
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can perform action on entity
CREATE OR REPLACE FUNCTION can_perform_action(
    action_type text,
    entity_type text,
    entity_org_id uuid,
    entity_project_id uuid DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
    user_org_role text;
    user_project_role project_role;
BEGIN
    -- Get user's effective organization role
    user_org_role := get_user_org_role(auth.uid());
    
    -- Check organization membership
    IF NOT validate_organization_member(entity_org_id) THEN
        RETURN false;
    END IF;
    
    -- Organization owners and admins can perform most actions
    IF user_org_role IN ('owner', 'admin') THEN
        RETURN true;
    END IF;
    
    -- For project-specific entities, check project role
    IF entity_project_id IS NOT NULL THEN
        SELECT role INTO user_project_role
        FROM project_users 
        WHERE project_id = entity_project_id 
        AND user_id = auth.uid() 
        AND is_active = true;
        
        -- Project admins and managers have broad permissions
        IF user_project_role IN ('admin', 'manager') THEN
            RETURN true;
        END IF;
        
        -- Specific action checks based on role
        CASE action_type
            WHEN 'read' THEN
                RETURN user_project_role IS NOT NULL;
            WHEN 'create' THEN
                RETURN user_project_role IN ('admin', 'manager', 'scheduler');
            WHEN 'update' THEN
                RETURN user_project_role IN ('admin', 'manager', 'scheduler');
            WHEN 'delete' THEN
                RETURN user_project_role IN ('admin', 'manager');
            ELSE
                RETURN false;
        END CASE;
    END IF;
    
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- POLICY TESTING AND VALIDATION
-- =====================================================

-- Function to test RLS policies (for development/testing)
CREATE OR REPLACE FUNCTION test_rls_policies()
RETURNS jsonb AS $$
DECLARE
    test_results jsonb := '{}'::jsonb;
    test_org_id uuid;
    test_user_id uuid;
BEGIN
    -- This function would contain comprehensive RLS policy tests
    -- Normally you'd run this in a test environment
    
    test_results := jsonb_build_object(
        'organizations_policy_active', EXISTS(SELECT 1 FROM pg_policies WHERE tablename = 'organizations'),
        'projects_policy_active', EXISTS(SELECT 1 FROM pg_policies WHERE tablename = 'projects'),
        'users_policy_active', EXISTS(SELECT 1 FROM pg_policies WHERE tablename = 'users'),
        'team_members_policy_active', EXISTS(SELECT 1 FROM pg_policies WHERE tablename = 'team_members'),
        'installations_policy_active', EXISTS(SELECT 1 FROM pg_policies WHERE tablename = 'installations'),
        'assignments_policy_active', EXISTS(SELECT 1 FROM pg_policies WHERE tablename = 'assignments'),
        'notifications_policy_active', EXISTS(SELECT 1 FROM pg_policies WHERE tablename = 'notifications')
    );
    
    RETURN test_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON FUNCTION validate_organization_member(uuid) IS 'Validates if current user is a member of the specified organization';
COMMENT ON FUNCTION validate_project_access(uuid) IS 'Validates if current user has access to the specified project';
COMMENT ON FUNCTION can_perform_action(text, text, uuid, uuid) IS 'Checks if user can perform a specific action on an entity';
COMMENT ON FUNCTION test_rls_policies() IS 'Tests RLS policy configuration (for development use)';

-- Log successful policy application
SELECT log_organization_activity(
    (SELECT id FROM organizations LIMIT 1),
    'system_configuration',
    'Multi-tenant RLS policies successfully applied',
    NULL,
    auth.uid(),
    'rls_policies',
    NULL,
    '{"migration": "004_multi_tenant_rls_policies", "policies_created": "complete"}'::jsonb
) WHERE EXISTS(SELECT 1 FROM organizations LIMIT 1);


-- =====================================================
-- MIGRATION STEP 3: 005_data_migration_existing_to_multi_tenant.sql
-- =====================================================

-- Multi-Tenant Transformation: Phase 3 - Data Migration
-- This migration safely migrates existing single-tenant data to multi-tenant structure

-- =====================================================
-- MIGRATION SAFETY CHECKS
-- =====================================================

-- Ensure we have backup of current data
DO $$
BEGIN
    -- Check if we have existing data to migrate
    IF NOT EXISTS(SELECT 1 FROM users LIMIT 1) THEN
        RAISE NOTICE 'No existing users found - this appears to be a fresh installation';
        RETURN;
    END IF;
    
    -- Warn about the migration
    RAISE NOTICE 'Starting multi-tenant data migration...';
    RAISE NOTICE 'This will migrate all existing data to a default organization';
END $$;

-- =====================================================
-- CREATE DEFAULT ORGANIZATION
-- =====================================================

-- Create default organization for existing data
INSERT INTO organizations (id, name, slug, subscription_plan, settings, branding, is_active)
SELECT 
    gen_random_uuid(),
    'Think Tank Technologies',
    'think-tank-tech',
    'free',
    jsonb_build_object(
        'timezone', 'UTC',
        'currency', 'USD',
        'date_format', 'MM/DD/YYYY',
        'working_hours', jsonb_build_object('start', '08:00', 'end', '17:00'),
        'migrated_from_single_tenant', true
    ),
    jsonb_build_object(
        'primary_color', '#3b82f6',
        'secondary_color', '#6366f1',
        'logo_url', null
    ),
    true
WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE slug = 'think-tank-tech');

-- Get the default organization ID for use in subsequent operations
DO $$
DECLARE
    default_org_id uuid;
    default_project_id uuid;
    migration_stats jsonb := '{}';
    users_migrated integer := 0;
    team_members_migrated integer := 0;
    installations_migrated integer := 0;
    assignments_migrated integer := 0;
    notifications_migrated integer := 0;
    has_org_role_col boolean;
    has_role_col boolean;
    role_col_type text;
BEGIN
    -- Get default organization ID
    SELECT id INTO default_org_id 
    FROM organizations 
    WHERE slug = 'think-tank-tech';
    
    IF default_org_id IS NULL THEN
        RAISE EXCEPTION 'Default organization not found';
    END IF;
    
    RAISE NOTICE 'Default organization ID: %', default_org_id;
    
    -- =====================================================
    -- CREATE DEFAULT PROJECT
    -- =====================================================
    
    -- Create default project for existing installations/assignments
    INSERT INTO projects (id, organization_id, name, description, settings, is_active, created_by)
    SELECT 
        gen_random_uuid(),
        default_org_id,
        'Default Project',
        'Default project created during migration from single-tenant system',
        jsonb_build_object(
            'work_hours', jsonb_build_object('start', '08:00', 'end', '17:00'),
            'default_duration', 240,
            'max_jobs_per_day', 8,
            'auto_assignment', true
        ),
        true,
        (SELECT id FROM auth.users ORDER BY created_at LIMIT 1) -- First user becomes creator
    WHERE NOT EXISTS (SELECT 1 FROM projects WHERE organization_id = default_org_id);
    
    -- Get default project ID
    SELECT id INTO default_project_id
    FROM projects 
    WHERE organization_id = default_org_id AND name = 'Default Project';
    
    RAISE NOTICE 'Default project ID: %', default_project_id;
    
    -- =====================================================
    -- MIGRATE USERS
    -- =====================================================
    
    -- Update existing users with organization context
    -- Handle both role and organization_role columns
        -- Check which columns exist
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'organization_role'
        ) INTO has_org_role_col;
        
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'role'
        ) INTO has_role_col;
        
        IF has_role_col THEN
            SELECT udt_name INTO role_col_type
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'role';
        END IF;
        
        -- Update organization_id for all users
        UPDATE users SET 
            organization_id = default_org_id,
            joined_at = COALESCE(created_at, now()),
            settings = COALESCE(settings, '{}'::jsonb)
        WHERE organization_id IS NULL;
        
        -- Update organization_role column if it exists
        IF has_org_role_col THEN
            IF has_role_col AND role_col_type = 'user_role' THEN
                -- Convert from user_role to organization_role
                UPDATE users SET
                    organization_role = CASE 
                        WHEN role::text IN ('admin') THEN 'admin'::organization_role
                        WHEN role::text IN ('manager') THEN 'manager'::organization_role
                        WHEN role::text IN ('scheduler', 'tech') THEN 'member'::organization_role
                        ELSE 'member'::organization_role
                    END
                WHERE organization_id = default_org_id AND organization_role IS NULL;
            ELSE
                -- Set default organization_role
                UPDATE users SET organization_role = 'admin'::organization_role 
                WHERE organization_id = default_org_id 
                AND organization_role IS NULL 
                AND id = (SELECT id FROM users WHERE organization_id = default_org_id ORDER BY created_at LIMIT 1);
                
                UPDATE users SET organization_role = 'member'::organization_role 
                WHERE organization_id = default_org_id AND organization_role IS NULL;
            END IF;
        ELSIF has_role_col AND role_col_type = 'organization_role' THEN
            -- Update role column with organization_role values
            UPDATE users SET
                role = CASE 
                    WHEN id = (SELECT id FROM users WHERE organization_id = default_org_id ORDER BY created_at LIMIT 1) THEN 'admin'::organization_role
                    ELSE 'member'::organization_role
                END
            WHERE organization_id = default_org_id;
        END IF;
        
        RAISE NOTICE 'Updated users with organization context. has_org_role_col: %, has_role_col: %, role_col_type: %', has_org_role_col, has_role_col, role_col_type;
    
    SELECT count(*) INTO users_migrated FROM users WHERE organization_id = default_org_id;
    RAISE NOTICE 'Migrated % users to default organization', users_migrated;
    
    -- Assign all users to default project with appropriate roles
    -- Only proceed if we have users and a project
    IF default_project_id IS NOT NULL AND EXISTS(SELECT 1 FROM users WHERE organization_id = default_org_id) THEN
        INSERT INTO project_users (project_id, user_id, role, assigned_by, assigned_at, is_active)
        SELECT 
            default_project_id,
            u.id,
            CASE 
                WHEN get_user_org_role(u.id) = 'admin' THEN 'admin'::project_role
                WHEN get_user_org_role(u.id) = 'manager' THEN 'manager'::project_role
                WHEN get_user_org_role(u.id) = 'member' THEN 'viewer'::project_role
                ELSE 'viewer'::project_role
            END,
            COALESCE(
                (SELECT id FROM users WHERE organization_id = default_org_id ORDER BY created_at LIMIT 1),
                u.id  -- Fallback to self-assignment if no other user found
            ),
            now(),
            true
        FROM users u
        WHERE u.organization_id = default_org_id
        AND NOT EXISTS (SELECT 1 FROM project_users WHERE user_id = u.id AND project_id = default_project_id);
        
        RAISE NOTICE 'Assigned users to default project';
    ELSE
        RAISE NOTICE 'Skipped project user assignments - no users or project found';
    END IF;
    
    RAISE NOTICE 'Assigned all users to default project';
    
    -- =====================================================
    -- MIGRATE TEAM MEMBERS
    -- =====================================================
    
    -- Update team members with organization and project context
    UPDATE team_members SET
        organization_id = default_org_id,
        project_id = default_project_id,
        employment_status = CASE 
            WHEN employment_status IS NULL THEN 'active'::employment_status
            ELSE employment_status
        END,
        hire_date = COALESCE(hire_date, created_at::date),
        job_title = COALESCE(job_title, 'Installation Technician'),
        department = COALESCE(department, 'Installation Services')
    WHERE organization_id IS NULL;
    
    GET DIAGNOSTICS team_members_migrated = ROW_COUNT;
    RAISE NOTICE 'Migrated % team members to default organization/project', team_members_migrated;
    
    -- =====================================================
    -- MIGRATE INSTALLATIONS
    -- =====================================================
    
    -- Update installations with organization and project context
    UPDATE installations SET
        organization_id = default_org_id,
        project_id = default_project_id,
        created_by = COALESCE(
            created_by,
            (SELECT id FROM users WHERE organization_id = default_org_id ORDER BY created_at LIMIT 1)
        )
    WHERE organization_id IS NULL;
    
    GET DIAGNOSTICS installations_migrated = ROW_COUNT;
    RAISE NOTICE 'Migrated % installations to default organization/project', installations_migrated;
    
    -- =====================================================
    -- MIGRATE ASSIGNMENTS
    -- =====================================================
    
    -- Update assignments with organization and project context
    UPDATE assignments SET
        organization_id = default_org_id,
        project_id = default_project_id,
        assigned_by = COALESCE(
            assigned_by,
            (SELECT id FROM users WHERE organization_id = default_org_id ORDER BY created_at LIMIT 1)
        )
    WHERE organization_id IS NULL;
    
    GET DIAGNOSTICS assignments_migrated = ROW_COUNT;
    RAISE NOTICE 'Migrated % assignments to default organization/project', assignments_migrated;
    
    -- =====================================================
    -- MIGRATE NOTIFICATIONS
    -- =====================================================
    
    -- Update notifications with organization context
    UPDATE notifications SET
        organization_id = default_org_id,
        project_id = default_project_id  -- Assign all to default project for now
    WHERE organization_id IS NULL;
    
    GET DIAGNOSTICS notifications_migrated = ROW_COUNT;
    RAISE NOTICE 'Migrated % notifications to default organization/project', notifications_migrated;
    
    -- =====================================================
    -- CREATE DEFAULT SUBSCRIPTION
    -- =====================================================
    
    -- Create trial subscription for the default organization
    INSERT INTO subscriptions (
        organization_id, 
        plan_id, 
        status, 
        current_period_start, 
        current_period_end,
        trial_end,
        billing_cycle,
        amount_cents,
        currency,
        metadata
    ) 
    SELECT 
        default_org_id,
        'free',
        'active',
        now(),
        now() + interval '1 year',  -- Give them a year of free service
        now() + interval '30 days', -- 30 day trial period
        'monthly',
        0,
        'USD',
        jsonb_build_object(
            'migrated_from_single_tenant', true,
            'migration_date', now()::text,
            'legacy_users_count', users_migrated
        )
    WHERE NOT EXISTS (SELECT 1 FROM subscriptions WHERE organization_id = default_org_id);
    
    -- =====================================================
    -- CREATE MIGRATION SUMMARY
    -- =====================================================
    
    -- Log migration activity
    migration_stats := jsonb_build_object(
        'organization_id', default_org_id,
        'project_id', default_project_id,
        'migration_date', now(),
        'users_migrated', users_migrated,
        'team_members_migrated', team_members_migrated,
        'installations_migrated', installations_migrated,
        'assignments_migrated', assignments_migrated,
        'notifications_migrated', notifications_migrated,
        'migration_type', 'single_to_multi_tenant',
        'default_organization_created', true,
        'default_project_created', true,
        'subscription_created', true
    );
    
    -- Log the migration activity
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
        default_org_id,
        default_project_id,
        (SELECT id FROM users WHERE organization_id = default_org_id ORDER BY created_at LIMIT 1),
        'system_migration',
        'data_migration',
        default_org_id,
        'Successfully migrated single-tenant data to multi-tenant structure',
        migration_stats
    );
    
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'Migration stats: %', migration_stats;
    
END $$;

-- =====================================================
-- POST-MIGRATION VALIDATIONS
-- =====================================================

-- Validation: Ensure all users have organization_id
DO $$
DECLARE
    orphaned_users integer;
BEGIN
    SELECT count(*) INTO orphaned_users
    FROM users 
    WHERE organization_id IS NULL AND is_active = true;
    
    IF orphaned_users > 0 THEN
        RAISE WARNING '% users still do not have organization_id assigned', orphaned_users;
    ELSE
        RAISE NOTICE 'All active users have organization_id assigned ✓';
    END IF;
END $$;

-- Validation: Ensure all team members have organization and project context
DO $$
DECLARE
    orphaned_team_members integer;
BEGIN
    SELECT count(*) INTO orphaned_team_members
    FROM team_members 
    WHERE organization_id IS NULL OR project_id IS NULL;
    
    IF orphaned_team_members > 0 THEN
        RAISE WARNING '% team members still missing organization/project context', orphaned_team_members;
    ELSE
        RAISE NOTICE 'All team members have organization/project context ✓';
    END IF;
END $$;

-- Validation: Ensure all installations have organization and project context
DO $$
DECLARE
    orphaned_installations integer;
BEGIN
    SELECT count(*) INTO orphaned_installations
    FROM installations 
    WHERE organization_id IS NULL OR project_id IS NULL;
    
    IF orphaned_installations > 0 THEN
        RAISE WARNING '% installations still missing organization/project context', orphaned_installations;
    ELSE
        RAISE NOTICE 'All installations have organization/project context ✓';
    END IF;
END $$;

-- Validation: Ensure all assignments have organization and project context
DO $$
DECLARE
    orphaned_assignments integer;
BEGIN
    SELECT count(*) INTO orphaned_assignments
    FROM assignments 
    WHERE organization_id IS NULL OR project_id IS NULL;
    
    IF orphaned_assignments > 0 THEN
        RAISE WARNING '% assignments still missing organization/project context', orphaned_assignments;
    ELSE
        RAISE NOTICE 'All assignments have organization/project context ✓';
    END IF;
END $$;

-- =====================================================
-- ADD NOT NULL CONSTRAINTS
-- =====================================================

-- Now that data is migrated, add NOT NULL constraints
-- This ensures data integrity going forward

-- Users table constraints
ALTER TABLE users 
    ALTER COLUMN organization_id SET NOT NULL;

-- Team members table constraints  
ALTER TABLE team_members 
    ALTER COLUMN organization_id SET NOT NULL,
    ALTER COLUMN project_id SET NOT NULL;

-- Installations table constraints
ALTER TABLE installations 
    ALTER COLUMN organization_id SET NOT NULL,
    ALTER COLUMN project_id SET NOT NULL;

-- Assignments table constraints
ALTER TABLE assignments 
    ALTER COLUMN organization_id SET NOT NULL,
    ALTER COLUMN project_id SET NOT NULL;

-- Notifications table constraints
ALTER TABLE notifications 
    ALTER COLUMN organization_id SET NOT NULL;

-- =====================================================
-- CREATE ADDITIONAL INDEXES
-- =====================================================

-- Create indexes for frequently queried multi-tenant columns
CREATE INDEX IF NOT EXISTS idx_users_org_role 
    ON users(organization_id, role) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_team_members_org_project_active 
    ON team_members(organization_id, project_id, employment_status) 
    WHERE employment_status = 'active';

CREATE INDEX IF NOT EXISTS idx_installations_org_project_status 
    ON installations(organization_id, project_id, status);

CREATE INDEX IF NOT EXISTS idx_assignments_org_project_status 
    ON assignments(organization_id, project_id, status);

CREATE INDEX IF NOT EXISTS idx_notifications_org_recipient_unread 
    ON notifications(organization_id, recipient_id, read_at) 
    WHERE read_at IS NULL;

-- Index for project user lookups
CREATE INDEX IF NOT EXISTS idx_project_users_user_active 
    ON project_users(user_id, is_active) WHERE is_active = true;

-- =====================================================
-- UPDATE EXISTING FUNCTIONS
-- =====================================================

-- Update any existing functions that need organization context
-- This would include updating stored procedures, triggers, etc.

-- Example: Update any existing notification functions
-- (These would be specific to your existing functions)

-- =====================================================
-- MIGRATION CLEANUP
-- =====================================================

-- Clean up any temporary data or old structures if needed
-- Remove old single-tenant specific constraints or indexes if any exist

-- Update statistics for better query planning
ANALYZE users;
ANALYZE organizations;
ANALYZE projects;
ANALYZE project_users;
ANALYZE team_members;
ANALYZE installations;
ANALYZE assignments;
ANALYZE notifications;
ANALYZE subscriptions;

-- =====================================================
-- FINAL MIGRATION LOG
-- =====================================================

DO $$
DECLARE
    final_stats jsonb;
    default_org_id uuid;
BEGIN
    SELECT id INTO default_org_id 
    FROM organizations 
    WHERE slug = 'think-tank-tech';
    
    -- Generate final migration statistics
    final_stats := jsonb_build_object(
        'migration_completed_at', now(),
        'organizations_created', (SELECT count(*) FROM organizations),
        'projects_created', (SELECT count(*) FROM projects),
        'users_with_org_context', (SELECT count(*) FROM users WHERE organization_id IS NOT NULL),
        'team_members_with_context', (SELECT count(*) FROM team_members WHERE organization_id IS NOT NULL AND project_id IS NOT NULL),
        'installations_with_context', (SELECT count(*) FROM installations WHERE organization_id IS NOT NULL AND project_id IS NOT NULL),
        'assignments_with_context', (SELECT count(*) FROM assignments WHERE organization_id IS NOT NULL AND project_id IS NOT NULL),
        'notifications_with_context', (SELECT count(*) FROM notifications WHERE organization_id IS NOT NULL),
        'subscriptions_created', (SELECT count(*) FROM subscriptions),
        'project_user_assignments', (SELECT count(*) FROM project_users),
        'migration_successful', true
    );
    
    -- Log final migration status
    IF default_org_id IS NOT NULL THEN
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
            default_org_id,
            (SELECT id FROM projects WHERE organization_id = default_org_id LIMIT 1),
            (SELECT id FROM users WHERE organization_id = default_org_id ORDER BY created_at LIMIT 1),
            'system_migration',
            'migration_completion',
            default_org_id,
            'Multi-tenant data migration completed successfully with full data integrity',
            final_stats
        );
    END IF;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'MULTI-TENANT MIGRATION COMPLETED';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Final Statistics: %', final_stats;
    RAISE NOTICE '========================================';
    
END $$;

