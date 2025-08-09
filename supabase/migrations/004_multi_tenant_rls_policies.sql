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
CREATE POLICY "organization_access" ON organizations
    FOR ALL USING (
        -- Organization owners/admins can see full details
        id = (SELECT organization_id FROM users WHERE id = auth.uid() AND is_active = true)
        -- Service role has full access (for system operations)
        OR auth.jwt() ->> 'role' = 'service_role'
    );

-- =====================================================
-- PROJECTS POLICIES
-- =====================================================

-- Users can access projects within their organization
CREATE POLICY "project_organization_access" ON projects
    FOR ALL USING (
        organization_id = (SELECT organization_id FROM users WHERE id = auth.uid() AND is_active = true)
        AND (
            -- Organization owners/admins see all projects
            (SELECT role FROM users WHERE id = auth.uid()) IN ('owner', 'admin')
            -- Or user is assigned to the project
            OR id IN (SELECT project_id FROM project_users WHERE user_id = auth.uid() AND is_active = true)
            -- Service role has full access
            OR auth.jwt() ->> 'role' = 'service_role'
        )
    );

-- Users can create projects if they have appropriate role
CREATE POLICY "project_create" ON projects
    FOR INSERT WITH CHECK (
        organization_id = (SELECT organization_id FROM users WHERE id = auth.uid() AND is_active = true)
        AND (SELECT role FROM users WHERE id = auth.uid()) IN ('owner', 'admin', 'manager')
    );

-- =====================================================
-- SUBSCRIPTIONS POLICIES
-- =====================================================

-- Only organization owners/admins can access subscription information
CREATE POLICY "subscription_org_admin_access" ON subscriptions
    FOR ALL USING (
        organization_id = (SELECT organization_id FROM users WHERE id = auth.uid() AND is_active = true)
        AND (
            (SELECT role FROM users WHERE id = auth.uid()) IN ('owner', 'admin')
            OR auth.jwt() ->> 'role' = 'service_role'
        )
    );

-- =====================================================
-- PROJECT USERS POLICIES
-- =====================================================

-- Users can see project assignments within their organization
CREATE POLICY "project_users_access" ON project_users
    FOR SELECT USING (
        -- Must be within user's organization
        project_id IN (
            SELECT id FROM projects 
            WHERE organization_id = (SELECT organization_id FROM users WHERE id = auth.uid() AND is_active = true)
        )
        AND (
            -- User can see their own assignments
            user_id = auth.uid()
            -- Organization admins see all
            OR (SELECT role FROM users WHERE id = auth.uid()) IN ('owner', 'admin')
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
CREATE POLICY "project_users_manage" ON project_users
    FOR INSERT WITH CHECK (
        -- Must be within user's organization
        project_id IN (
            SELECT id FROM projects 
            WHERE organization_id = (SELECT organization_id FROM users WHERE id = auth.uid() AND is_active = true)
        )
        AND (
            -- Organization owners/admins can assign anyone
            (SELECT role FROM users WHERE id = auth.uid()) IN ('owner', 'admin')
            -- Project admins can assign to their projects
            OR project_id IN (
                SELECT project_id FROM project_users 
                WHERE user_id = auth.uid() AND role IN ('admin', 'manager') AND is_active = true
            )
        )
    );

CREATE POLICY "project_users_update" ON project_users
    FOR UPDATE USING (
        -- Same conditions as manage
        project_id IN (
            SELECT id FROM projects 
            WHERE organization_id = (SELECT organization_id FROM users WHERE id = auth.uid() AND is_active = true)
        )
        AND (
            (SELECT role FROM users WHERE id = auth.uid()) IN ('owner', 'admin')
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
CREATE POLICY "invitations_org_access" ON user_invitations
    FOR SELECT USING (
        organization_id = (SELECT organization_id FROM users WHERE id = auth.uid() AND is_active = true)
        AND (
            (SELECT role FROM users WHERE id = auth.uid()) IN ('owner', 'admin', 'manager')
            OR invited_by = auth.uid()
            OR auth.jwt() ->> 'role' = 'service_role'
        )
    );

-- Users with appropriate role can create invitations
CREATE POLICY "invitations_create" ON user_invitations
    FOR INSERT WITH CHECK (
        organization_id = (SELECT organization_id FROM users WHERE id = auth.uid() AND is_active = true)
        AND (
            (SELECT role FROM users WHERE id = auth.uid()) IN ('owner', 'admin', 'manager')
        )
        AND invited_by = auth.uid()
    );

-- Update invitations (for acceptance)
CREATE POLICY "invitations_update" ON user_invitations
    FOR UPDATE USING (
        -- System can update for acceptance
        auth.jwt() ->> 'role' = 'service_role'
        -- Or invitation owner
        OR (
            organization_id = (SELECT organization_id FROM users WHERE id = auth.uid() AND is_active = true)
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
CREATE POLICY "users_organization_access" ON users
    FOR SELECT USING (
        organization_id = (SELECT organization_id FROM users WHERE id = auth.uid() AND is_active = true)
        OR auth.jwt() ->> 'role' = 'service_role'
    );

-- Users can update their own profile
CREATE POLICY "users_own_profile_update" ON users
    FOR UPDATE USING (id = auth.uid());

-- Organization admins can update organization member profiles
CREATE POLICY "users_org_admin_update" ON users
    FOR UPDATE USING (
        organization_id = (SELECT organization_id FROM users WHERE id = auth.uid() AND is_active = true)
        AND (SELECT role FROM users WHERE id = auth.uid()) IN ('owner', 'admin')
    );

-- =====================================================
-- TEAM MEMBERS POLICIES
-- =====================================================

-- Drop existing policies and recreate with multi-tenant context
DROP POLICY IF EXISTS "Project access for team members" ON team_members;
DROP POLICY IF EXISTS "Admins can manage team members" ON team_members;

-- Users can access team members in their organization/projects
CREATE POLICY "team_members_access" ON team_members
    FOR SELECT USING (
        organization_id = (SELECT organization_id FROM users WHERE id = auth.uid() AND is_active = true)
        AND (
            -- Organization admins see all team members
            (SELECT role FROM users WHERE id = auth.uid()) IN ('owner', 'admin')
            -- Project members see team members in their projects
            OR project_id IN (
                SELECT project_id FROM project_users 
                WHERE user_id = auth.uid() AND is_active = true
            )
            -- Team members can see themselves
            OR id = auth.uid()
            -- Service role access
            OR auth.jwt() ->> 'role' = 'service_role'
        )
    );

-- Team member management policies
CREATE POLICY "team_members_manage" ON team_members
    FOR INSERT WITH CHECK (
        organization_id = (SELECT organization_id FROM users WHERE id = auth.uid() AND is_active = true)
        AND (
            (SELECT role FROM users WHERE id = auth.uid()) IN ('owner', 'admin')
            OR project_id IN (
                SELECT project_id FROM project_users 
                WHERE user_id = auth.uid() AND role IN ('admin', 'manager') AND is_active = true
            )
        )
    );

CREATE POLICY "team_members_update" ON team_members
    FOR UPDATE USING (
        organization_id = (SELECT organization_id FROM users WHERE id = auth.uid() AND is_active = true)
        AND (
            (SELECT role FROM users WHERE id = auth.uid()) IN ('owner', 'admin')
            OR project_id IN (
                SELECT project_id FROM project_users 
                WHERE user_id = auth.uid() AND role IN ('admin', 'manager') AND is_active = true
            )
            -- Team members can update their own profiles (limited fields)
            OR (id = auth.uid() AND organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()))
        )
    );

CREATE POLICY "team_members_delete" ON team_members
    FOR DELETE USING (
        organization_id = (SELECT organization_id FROM users WHERE id = auth.uid() AND is_active = true)
        AND (
            (SELECT role FROM users WHERE id = auth.uid()) IN ('owner', 'admin')
            OR project_id IN (
                SELECT project_id FROM project_users 
                WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
            )
        )
    );

-- =====================================================
-- INSTALLATIONS POLICIES
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Project installations access" ON installations;

-- Users can access installations in their organization/projects
CREATE POLICY "installations_access" ON installations
    FOR SELECT USING (
        organization_id = (SELECT organization_id FROM users WHERE id = auth.uid() AND is_active = true)
        AND (
            -- Organization admins see all
            (SELECT role FROM users WHERE id = auth.uid()) IN ('owner', 'admin')
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
CREATE POLICY "installations_create" ON installations
    FOR INSERT WITH CHECK (
        organization_id = (SELECT organization_id FROM users WHERE id = auth.uid() AND is_active = true)
        AND (
            project_id IN (
                SELECT project_id FROM project_users 
                WHERE user_id = auth.uid() AND role IN ('admin', 'manager', 'scheduler') AND is_active = true
            )
            OR (SELECT role FROM users WHERE id = auth.uid()) IN ('owner', 'admin')
        )
        AND created_by = auth.uid()
    );

CREATE POLICY "installations_update" ON installations
    FOR UPDATE USING (
        organization_id = (SELECT organization_id FROM users WHERE id = auth.uid() AND is_active = true)
        AND (
            (SELECT role FROM users WHERE id = auth.uid()) IN ('owner', 'admin')
            OR project_id IN (
                SELECT project_id FROM project_users 
                WHERE user_id = auth.uid() AND role IN ('admin', 'manager', 'scheduler') AND is_active = true
            )
            OR created_by = auth.uid()
        )
    );

CREATE POLICY "installations_delete" ON installations
    FOR DELETE USING (
        organization_id = (SELECT organization_id FROM users WHERE id = auth.uid() AND is_active = true)
        AND (
            (SELECT role FROM users WHERE id = auth.uid()) IN ('owner', 'admin')
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
CREATE POLICY "assignments_access" ON assignments
    FOR SELECT USING (
        organization_id = (SELECT organization_id FROM users WHERE id = auth.uid() AND is_active = true)
        AND (
            -- Organization admins see all
            (SELECT role FROM users WHERE id = auth.uid()) IN ('owner', 'admin')
            -- Project members see project assignments
            OR project_id IN (
                SELECT project_id FROM project_users 
                WHERE user_id = auth.uid() AND is_active = true
            )
            -- Team members see their own assignments
            OR lead_id IN (
                SELECT id FROM team_members WHERE organization_id = (
                    SELECT organization_id FROM users WHERE id = auth.uid()
                ) AND id = auth.uid()
            )
            OR assistant_id IN (
                SELECT id FROM team_members WHERE organization_id = (
                    SELECT organization_id FROM users WHERE id = auth.uid()
                ) AND id = auth.uid()
            )
            -- Service role access
            OR auth.jwt() ->> 'role' = 'service_role'
        )
    );

-- Assignment management policies
CREATE POLICY "assignments_create" ON assignments
    FOR INSERT WITH CHECK (
        organization_id = (SELECT organization_id FROM users WHERE id = auth.uid() AND is_active = true)
        AND (
            (SELECT role FROM users WHERE id = auth.uid()) IN ('owner', 'admin')
            OR project_id IN (
                SELECT project_id FROM project_users 
                WHERE user_id = auth.uid() AND role IN ('admin', 'manager', 'scheduler') AND is_active = true
            )
        )
        AND assigned_by = auth.uid()
    );

CREATE POLICY "assignments_update" ON assignments
    FOR UPDATE USING (
        organization_id = (SELECT organization_id FROM users WHERE id = auth.uid() AND is_active = true)
        AND (
            (SELECT role FROM users WHERE id = auth.uid()) IN ('owner', 'admin')
            OR project_id IN (
                SELECT project_id FROM project_users 
                WHERE user_id = auth.uid() AND role IN ('admin', 'manager', 'scheduler') AND is_active = true
            )
            OR assigned_by = auth.uid()
        )
    );

CREATE POLICY "assignments_delete" ON assignments
    FOR DELETE USING (
        organization_id = (SELECT organization_id FROM users WHERE id = auth.uid() AND is_active = true)
        AND (
            (SELECT role FROM users WHERE id = auth.uid()) IN ('owner', 'admin')
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
CREATE POLICY "notifications_own_access" ON notifications
    FOR SELECT USING (
        recipient_id = auth.uid()
        AND organization_id = (SELECT organization_id FROM users WHERE id = auth.uid() AND is_active = true)
    );

-- Users can update their own notifications (mark as read, etc.)
CREATE POLICY "notifications_own_update" ON notifications
    FOR UPDATE USING (
        recipient_id = auth.uid()
        AND organization_id = (SELECT organization_id FROM users WHERE id = auth.uid() AND is_active = true)
    );

-- System and authorized users can create notifications
CREATE POLICY "notifications_create" ON notifications
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'role' = 'service_role'
        OR (
            organization_id = (SELECT organization_id FROM users WHERE id = auth.uid() AND is_active = true)
            AND (
                -- Organization admins can create notifications
                (SELECT role FROM users WHERE id = auth.uid()) IN ('owner', 'admin')
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
CREATE POLICY "activities_access" ON organization_activities
    FOR SELECT USING (
        organization_id = (SELECT organization_id FROM users WHERE id = auth.uid() AND is_active = true)
        AND (
            -- Organization admins see all activities
            (SELECT role FROM users WHERE id = auth.uid()) IN ('owner', 'admin')
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
CREATE POLICY "activities_create" ON organization_activities
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'role' = 'service_role'
        OR organization_id = (SELECT organization_id FROM users WHERE id = auth.uid() AND is_active = true)
    );

-- =====================================================
-- API KEYS POLICIES
-- =====================================================

-- Organization admins can manage API keys
CREATE POLICY "api_keys_admin_access" ON organization_api_keys
    FOR ALL USING (
        organization_id = (SELECT organization_id FROM users WHERE id = auth.uid() AND is_active = true)
        AND (
            (SELECT role FROM users WHERE id = auth.uid()) IN ('owner', 'admin')
            OR auth.jwt() ->> 'role' = 'service_role'
        )
    );

-- =====================================================
-- INTEGRATIONS POLICIES
-- =====================================================

-- Organization admins can manage integrations
CREATE POLICY "integrations_admin_access" ON organization_integrations
    FOR ALL USING (
        organization_id = (SELECT organization_id FROM users WHERE id = auth.uid() AND is_active = true)
        AND (
            (SELECT role FROM users WHERE id = auth.uid()) IN ('owner', 'admin')
            OR auth.jwt() ->> 'role' = 'service_role'
        )
    );

-- =====================================================
-- DATA RETENTION POLICIES
-- =====================================================

-- Organization admins can manage data retention policies
CREATE POLICY "retention_policies_admin_access" ON data_retention_policies
    FOR ALL USING (
        organization_id = (SELECT organization_id FROM users WHERE id = auth.uid() AND is_active = true)
        AND (
            (SELECT role FROM users WHERE id = auth.uid()) IN ('owner', 'admin')
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
    user_role organization_role;
BEGIN
    -- Get user's organization and role
    SELECT organization_id, role INTO user_org_id, user_role
    FROM users 
    WHERE id = auth.uid() AND is_active = true;
    
    -- Get project's organization
    SELECT organization_id INTO project_org_id
    FROM projects 
    WHERE id = target_project_id AND is_active = true;
    
    -- Must be in same organization
    IF user_org_id != project_org_id THEN
        RETURN false;
    END IF;
    
    -- Organization owners/admins have access to all projects
    IF user_role IN ('owner', 'admin') THEN
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
    user_org_role organization_role;
    user_project_role project_role;
BEGIN
    -- Get user's organization role
    SELECT role INTO user_org_role
    FROM users 
    WHERE id = auth.uid() AND is_active = true;
    
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
    NULL,
    auth.uid(),
    'system_configuration',
    'rls_policies',
    NULL,
    'Multi-tenant RLS policies successfully applied',
    '{"migration": "004_multi_tenant_rls_policies", "policies_created": "complete"}'::jsonb
) WHERE EXISTS(SELECT 1 FROM organizations LIMIT 1);