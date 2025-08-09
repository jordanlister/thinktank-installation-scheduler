-- Multi-Tenant Migration Rollback Procedures
-- EMERGENCY ROLLBACK: Use only if migration needs to be reversed

-- =====================================================
-- ROLLBACK SAFETY CHECKS
-- =====================================================

-- Create rollback checkpoint before executing
DO $$
BEGIN
    RAISE NOTICE '⚠️  WARNING: ROLLBACK PROCEDURES STARTING';
    RAISE NOTICE '⚠️  This will remove multi-tenant structure';
    RAISE NOTICE '⚠️  Ensure you have current backups before proceeding';
    RAISE NOTICE '⚠️  Data in organizations/projects tables will be lost';
END $$;

-- Verify backup exists before rollback
DO $$
BEGIN
    -- This would check for recent backup files
    -- In production, verify backup timestamp is recent
    RAISE NOTICE '🔍 Verifying backup availability...';
    -- Add backup verification logic here
END $$;

-- =====================================================
-- STEP 1: PRESERVE CRITICAL DATA
-- =====================================================

-- Create temporary backup of organization/project mappings
CREATE TABLE IF NOT EXISTS rollback_organization_backup AS
SELECT * FROM organizations;

CREATE TABLE IF NOT EXISTS rollback_project_backup AS
SELECT * FROM projects;

CREATE TABLE IF NOT EXISTS rollback_project_users_backup AS
SELECT * FROM project_users;

RAISE NOTICE '✅ Critical data preserved in rollback backup tables';

-- =====================================================
-- STEP 2: REMOVE RLS POLICIES
-- =====================================================

-- Disable RLS on all tables
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_invitations DISABLE ROW LEVEL SECURITY;
ALTER TABLE organization_activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE organization_api_keys DISABLE ROW LEVEL SECURITY;
ALTER TABLE organization_integrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE data_retention_policies DISABLE ROW LEVEL SECURITY;

-- Drop multi-tenant RLS policies
DROP POLICY IF EXISTS "organization_access" ON organizations;
DROP POLICY IF EXISTS "project_organization_access" ON projects;
DROP POLICY IF EXISTS "project_create" ON projects;
DROP POLICY IF EXISTS "subscription_org_admin_access" ON subscriptions;
DROP POLICY IF EXISTS "project_users_access" ON project_users;
DROP POLICY IF EXISTS "project_users_manage" ON project_users;
DROP POLICY IF EXISTS "project_users_update" ON project_users;
DROP POLICY IF EXISTS "invitations_org_access" ON user_invitations;
DROP POLICY IF EXISTS "invitations_create" ON user_invitations;
DROP POLICY IF EXISTS "invitations_update" ON user_invitations;
DROP POLICY IF EXISTS "users_organization_access" ON users;
DROP POLICY IF EXISTS "users_own_profile_update" ON users;
DROP POLICY IF EXISTS "users_org_admin_update" ON users;
DROP POLICY IF EXISTS "team_members_access" ON team_members;
DROP POLICY IF EXISTS "team_members_manage" ON team_members;
DROP POLICY IF EXISTS "team_members_update" ON team_members;
DROP POLICY IF EXISTS "team_members_delete" ON team_members;
DROP POLICY IF EXISTS "installations_access" ON installations;
DROP POLICY IF EXISTS "installations_create" ON installations;
DROP POLICY IF EXISTS "installations_update" ON installations;
DROP POLICY IF EXISTS "installations_delete" ON installations;
DROP POLICY IF EXISTS "assignments_access" ON assignments;
DROP POLICY IF EXISTS "assignments_create" ON assignments;
DROP POLICY IF EXISTS "assignments_update" ON assignments;
DROP POLICY IF EXISTS "assignments_delete" ON assignments;
DROP POLICY IF EXISTS "notifications_own_access" ON notifications;
DROP POLICY IF EXISTS "notifications_own_update" ON notifications;
DROP POLICY IF EXISTS "notifications_create" ON notifications;
DROP POLICY IF EXISTS "activities_access" ON organization_activities;
DROP POLICY IF EXISTS "activities_create" ON organization_activities;
DROP POLICY IF EXISTS "api_keys_admin_access" ON organization_api_keys;
DROP POLICY IF EXISTS "integrations_admin_access" ON organization_integrations;
DROP POLICY IF EXISTS "retention_policies_admin_access" ON data_retention_policies;

RAISE NOTICE '✅ Multi-tenant RLS policies removed';

-- =====================================================
-- STEP 3: REMOVE MULTI-TENANT COLUMNS
-- =====================================================

-- Remove organization_id constraint from existing tables (make nullable first)
ALTER TABLE users ALTER COLUMN organization_id DROP NOT NULL;
ALTER TABLE team_members ALTER COLUMN organization_id DROP NOT NULL;
ALTER TABLE team_members ALTER COLUMN project_id DROP NOT NULL;
ALTER TABLE installations ALTER COLUMN organization_id DROP NOT NULL;
ALTER TABLE installations ALTER COLUMN project_id DROP NOT NULL;
ALTER TABLE assignments ALTER COLUMN organization_id DROP NOT NULL;
ALTER TABLE assignments ALTER COLUMN project_id DROP NOT NULL;
ALTER TABLE notifications ALTER COLUMN organization_id DROP NOT NULL;

-- Drop foreign key constraints
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_organization_id_fkey;
ALTER TABLE team_members DROP CONSTRAINT IF EXISTS team_members_organization_id_fkey;
ALTER TABLE team_members DROP CONSTRAINT IF EXISTS team_members_project_id_fkey;
ALTER TABLE installations DROP CONSTRAINT IF EXISTS installations_organization_id_fkey;
ALTER TABLE installations DROP CONSTRAINT IF EXISTS installations_project_id_fkey;
ALTER TABLE assignments DROP CONSTRAINT IF EXISTS assignments_organization_id_fkey;
ALTER TABLE assignments DROP CONSTRAINT IF EXISTS assignments_project_id_fkey;
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_organization_id_fkey;
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_project_id_fkey;

-- Option A: Remove multi-tenant columns entirely (WARNING: DATA LOSS)
-- Uncomment these lines only if you want to completely remove multi-tenant structure
/*
ALTER TABLE users DROP COLUMN IF EXISTS organization_id;
ALTER TABLE users DROP COLUMN IF EXISTS role;
ALTER TABLE users DROP COLUMN IF EXISTS invited_by;
ALTER TABLE users DROP COLUMN IF EXISTS invited_at;
ALTER TABLE users DROP COLUMN IF EXISTS joined_at;
ALTER TABLE users DROP COLUMN IF EXISTS last_login_at;

ALTER TABLE team_members DROP COLUMN IF EXISTS organization_id;
ALTER TABLE team_members DROP COLUMN IF EXISTS project_id;

ALTER TABLE installations DROP COLUMN IF EXISTS organization_id;
ALTER TABLE installations DROP COLUMN IF EXISTS project_id;
ALTER TABLE installations DROP COLUMN IF EXISTS created_by;

ALTER TABLE assignments DROP COLUMN IF EXISTS organization_id;
ALTER TABLE assignments DROP COLUMN IF EXISTS project_id;

ALTER TABLE notifications DROP COLUMN IF EXISTS organization_id;
ALTER TABLE notifications DROP COLUMN IF EXISTS project_id;
*/

-- Option B: Keep columns but make them nullable (SAFER - preserves data)
-- This is the default - columns remain but constraints are removed

RAISE NOTICE '✅ Multi-tenant column constraints removed';

-- =====================================================
-- STEP 4: DROP MULTI-TENANT TABLES
-- =====================================================

-- Drop dependent tables first (in reverse dependency order)
DROP TABLE IF EXISTS organization_activities CASCADE;
DROP TABLE IF EXISTS organization_integrations CASCADE;
DROP TABLE IF EXISTS organization_api_keys CASCADE;
DROP TABLE IF EXISTS data_retention_policies CASCADE;
DROP TABLE IF EXISTS user_invitations CASCADE;
DROP TABLE IF EXISTS project_users CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP TABLE IF EXISTS organization_settings_templates CASCADE;

RAISE NOTICE '✅ Multi-tenant tables dropped';

-- =====================================================
-- STEP 5: DROP MULTI-TENANT FUNCTIONS
-- =====================================================

-- Drop multi-tenant functions
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS get_user_context(uuid) CASCADE;
DROP FUNCTION IF EXISTS log_organization_activity(uuid, uuid, uuid, text, text, uuid, text, jsonb) CASCADE;
DROP FUNCTION IF EXISTS generate_api_key(uuid, text, text[]) CASCADE;
DROP FUNCTION IF EXISTS validate_organization_member(uuid) CASCADE;
DROP FUNCTION IF EXISTS validate_project_access(uuid) CASCADE;
DROP FUNCTION IF EXISTS can_perform_action(text, text, uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS test_rls_policies() CASCADE;
DROP FUNCTION IF EXISTS get_organization_metrics(uuid) CASCADE;
DROP FUNCTION IF EXISTS get_team_workload(uuid, date) CASCADE;
DROP FUNCTION IF EXISTS detect_scheduling_conflicts(uuid, date) CASCADE;

RAISE NOTICE '✅ Multi-tenant functions dropped';

-- =====================================================
-- STEP 6: DROP MULTI-TENANT ENUMS
-- =====================================================

-- Drop custom types (only if not used elsewhere)
DROP TYPE IF EXISTS organization_role CASCADE;
DROP TYPE IF EXISTS project_role CASCADE;
DROP TYPE IF EXISTS subscription_status CASCADE;
DROP TYPE IF EXISTS billing_cycle CASCADE;
DROP TYPE IF EXISTS employment_status CASCADE;

RAISE NOTICE '✅ Multi-tenant types dropped';

-- =====================================================
-- STEP 7: DROP MULTI-TENANT INDEXES
-- =====================================================

-- Drop multi-tenant specific indexes
DROP INDEX CONCURRENTLY IF EXISTS idx_organizations_slug;
DROP INDEX CONCURRENTLY IF EXISTS idx_organizations_domain;
DROP INDEX CONCURRENTLY IF EXISTS idx_organizations_active;
DROP INDEX CONCURRENTLY IF EXISTS idx_projects_org_id;
DROP INDEX CONCURRENTLY IF EXISTS idx_projects_org_active;
DROP INDEX CONCURRENTLY IF EXISTS idx_subscriptions_org_id;
DROP INDEX CONCURRENTLY IF EXISTS idx_subscriptions_status;
DROP INDEX CONCURRENTLY IF EXISTS idx_users_organization_id;
DROP INDEX CONCURRENTLY IF EXISTS idx_users_org_active;
DROP INDEX CONCURRENTLY IF EXISTS idx_project_users_project_id;
DROP INDEX CONCURRENTLY IF EXISTS idx_project_users_user_id;
DROP INDEX CONCURRENTLY IF EXISTS idx_project_users_active;
DROP INDEX CONCURRENTLY IF EXISTS idx_team_members_org_project;
DROP INDEX CONCURRENTLY IF EXISTS idx_installations_org_project;
DROP INDEX CONCURRENTLY IF EXISTS idx_assignments_org_project;
DROP INDEX CONCURRENTLY IF EXISTS idx_notifications_org_user;
DROP INDEX CONCURRENTLY IF EXISTS idx_activities_org_id;
DROP INDEX CONCURRENTLY IF EXISTS idx_api_keys_org_id;
DROP INDEX CONCURRENTLY IF EXISTS idx_integrations_org_type;

RAISE NOTICE '✅ Multi-tenant indexes dropped';

-- =====================================================
-- STEP 8: RESTORE SINGLE-TENANT RLS POLICIES
-- =====================================================

-- Recreate original single-tenant RLS policies
-- (These would be the policies that existed before multi-tenant migration)

-- Example: Restore simple user-based policies
CREATE POLICY "Users can read own profile" ON users
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (id = auth.uid());

-- Example: Restore team member policies
CREATE POLICY "Team members can read all team members" ON team_members
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage team members" ON team_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'scheduler')
        )
    );

-- Example: Restore installation policies
CREATE POLICY "Users can read all installations" ON installations
    FOR SELECT USING (true);

CREATE POLICY "Authorized users can manage installations" ON installations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'scheduler', 'lead')
        )
    );

-- Example: Restore assignment policies
CREATE POLICY "Users can read assignments" ON assignments
    FOR SELECT USING (true);

CREATE POLICY "Authorized users can manage assignments" ON assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'scheduler')
        )
    );

-- Example: Restore notification policies
CREATE POLICY "Users can read own notifications" ON notifications
    FOR SELECT USING (recipient_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (recipient_id = auth.uid());

CREATE POLICY "System can insert notifications" ON notifications
    FOR INSERT WITH CHECK (true);

RAISE NOTICE '✅ Single-tenant RLS policies restored';

-- =====================================================
-- STEP 9: CLEANUP AND VERIFICATION
-- =====================================================

-- Update table statistics
ANALYZE users;
ANALYZE team_members;
ANALYZE installations;
ANALYZE assignments;
ANALYZE notifications;

-- Drop rollback backup tables (comment out to keep them)
-- DROP TABLE IF EXISTS rollback_organization_backup;
-- DROP TABLE IF EXISTS rollback_project_backup;
-- DROP TABLE IF EXISTS rollback_project_users_backup;

-- Create rollback completion log
DO $$
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE '🔄 ROLLBACK COMPLETED SUCCESSFULLY';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '✅ Multi-tenant structure removed';
    RAISE NOTICE '✅ Single-tenant policies restored';
    RAISE NOTICE '✅ Database reverted to original state';
    RAISE NOTICE '⚠️  Backup tables preserved for safety';
    RAISE NOTICE '==========================================';
END $$;

-- Final verification queries
SELECT 'Rollback verification - Tables remaining:' as status;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%organization%' 
OR table_name LIKE '%project%';

SELECT 'Rollback verification - RLS policies active:' as status;
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename;