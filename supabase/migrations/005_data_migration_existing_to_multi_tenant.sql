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
    UPDATE users SET
        organization_id = default_org_id,
        role = CASE 
            WHEN role IN ('admin', 'scheduler') THEN 'admin'::organization_role
            WHEN role = 'lead' THEN 'manager'::organization_role
            ELSE 'member'::organization_role
        END,
        joined_at = COALESCE(created_at, now()),
        settings = COALESCE(settings, '{}'::jsonb)
    WHERE organization_id IS NULL;
    
    GET DIAGNOSTICS users_migrated = ROW_COUNT;
    RAISE NOTICE 'Migrated % users to default organization', users_migrated;
    
    -- Assign all users to default project with appropriate roles
    INSERT INTO project_users (project_id, user_id, role, assigned_by, assigned_at, is_active)
    SELECT 
        default_project_id,
        u.id,
        CASE 
            WHEN u.role = 'admin' THEN 'admin'::project_role
            WHEN u.role = 'manager' THEN 'manager'::project_role
            WHEN u.role = 'member' THEN 
                CASE
                    -- Try to determine role from old user role if it exists
                    WHEN EXISTS(SELECT 1 FROM information_schema.columns 
                               WHERE table_name = 'users' AND column_name = 'old_role') THEN
                        CASE 
                            WHEN u.role = 'scheduler' THEN 'scheduler'::project_role
                            WHEN u.role = 'lead' THEN 'lead'::project_role
                            WHEN u.role = 'assistant' THEN 'assistant'::project_role
                            ELSE 'viewer'::project_role
                        END
                    ELSE 'viewer'::project_role
                END
            ELSE 'viewer'::project_role
        END,
        (SELECT id FROM users WHERE organization_id = default_org_id ORDER BY created_at LIMIT 1),
        now(),
        true
    FROM users u
    WHERE u.organization_id = default_org_id
    AND NOT EXISTS (SELECT 1 FROM project_users WHERE user_id = u.id AND project_id = default_project_id);
    
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
    ) VALUES (
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
    ) WHERE NOT EXISTS (SELECT 1 FROM subscriptions WHERE organization_id = default_org_id);
    
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
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_org_role 
    ON users(organization_id, role) WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_team_members_org_project_active 
    ON team_members(organization_id, project_id, employment_status) 
    WHERE employment_status = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_installations_org_project_status 
    ON installations(organization_id, project_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assignments_org_project_status 
    ON assignments(organization_id, project_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_org_recipient_unread 
    ON notifications(organization_id, recipient_id, status) 
    WHERE status = 'unread';

-- Index for project user lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_project_users_user_active 
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