-- Multi-Tenant Performance Optimization Script
-- Comprehensive indexing and query optimization for production-scale multi-tenant database

-- =====================================================
-- PERFORMANCE-FOCUSED INDEXES
-- =====================================================

-- Organizations - High Performance Lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organizations_slug_active 
ON organizations(slug) WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organizations_domain_active 
ON organizations(domain) WHERE is_active = true AND domain IS NOT NULL;

-- Projects - Multi-tenant Filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_org_active 
ON projects(organization_id, is_active) WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_org_name 
ON projects(organization_id, name);

-- Users - Fast Organization Lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_org_email 
ON users(organization_id, email) WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_org_role_active 
ON users(organization_id, role) WHERE is_active = true;

-- Project Users - Assignment Lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_project_users_user_project_active 
ON project_users(user_id, project_id) WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_project_users_project_role_active 
ON project_users(project_id, role) WHERE is_active = true;

-- Team Members - Multi-dimensional Queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_team_members_org_project_status 
ON team_members(organization_id, project_id, employment_status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_team_members_region_specialization 
ON team_members(organization_id, region, specializations) 
WHERE employment_status = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_team_members_capacity 
ON team_members(organization_id, capacity) 
WHERE employment_status = 'active';

-- Installations - High-volume Query Optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_installations_org_project_date 
ON installations(organization_id, project_id, scheduled_date);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_installations_org_status_priority 
ON installations(organization_id, status, priority);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_installations_date_status 
ON installations(scheduled_date, status) 
WHERE status IN ('pending', 'scheduled', 'in_progress');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_installations_location 
ON installations USING GIN ((address::jsonb)) 
WHERE address IS NOT NULL;

-- Assignments - Workload Distribution
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assignments_org_project_date 
ON assignments(organization_id, project_id, scheduled_date);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assignments_lead_date_status 
ON assignments(lead_id, scheduled_date, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assignments_assistant_date_status 
ON assignments(assistant_id, scheduled_date, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assignments_status_priority 
ON assignments(organization_id, status, priority);

-- Notifications - Real-time Performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_recipient_unread_created 
ON notifications(recipient_id, created_at DESC) 
WHERE status = 'unread';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_org_type_created 
ON notifications(organization_id, type, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_project_priority 
ON notifications(project_id, priority, created_at DESC) 
WHERE project_id IS NOT NULL;

-- Subscriptions - Billing Queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_org_status_billing 
ON subscriptions(organization_id, status, next_billing_date);

-- Organization Activities - Audit and Analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activities_org_created 
ON organization_activities(organization_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activities_project_type_created 
ON organization_activities(project_id, activity_type, created_at DESC) 
WHERE project_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activities_user_created 
ON organization_activities(user_id, created_at DESC) 
WHERE user_id IS NOT NULL;

-- =====================================================
-- PARTIAL INDEXES FOR COMMON QUERIES
-- =====================================================

-- Active installations needing assignments
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_installations_pending_assignment 
ON installations(organization_id, project_id, created_at) 
WHERE status = 'pending' AND lead_id IS NULL;

-- Overdue installations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_installations_overdue 
ON installations(organization_id, scheduled_date, status) 
WHERE scheduled_date < CURRENT_DATE AND status IN ('pending', 'scheduled');

-- Available team members
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_team_members_available 
ON team_members(organization_id, project_id, capacity) 
WHERE employment_status = 'active' AND capacity > 0;

-- Recent notifications for dashboard
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_recent_dashboard 
ON notifications(organization_id, recipient_id, created_at DESC) 
WHERE created_at > (CURRENT_TIMESTAMP - INTERVAL '7 days');

-- =====================================================
-- COMPOSITE INDEXES FOR COMPLEX QUERIES
-- =====================================================

-- Installation scheduling optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_installations_scheduling 
ON installations(organization_id, project_id, scheduled_date, status, priority);

-- Team workload analysis
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assignments_workload 
ON assignments(organization_id, lead_id, scheduled_date, status, estimated_duration);

-- Project dashboard performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_project_dashboard 
ON installations(project_id, status, scheduled_date DESC, priority);

-- =====================================================
-- QUERY PERFORMANCE FUNCTIONS
-- =====================================================

-- Function to get organization dashboard metrics
CREATE OR REPLACE FUNCTION get_organization_metrics(org_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    metrics jsonb := '{}';
BEGIN
    -- Get counts for dashboard
    SELECT jsonb_build_object(
        'active_projects', (
            SELECT count(*) FROM projects 
            WHERE organization_id = org_id AND is_active = true
        ),
        'total_team_members', (
            SELECT count(*) FROM team_members 
            WHERE organization_id = org_id AND employment_status = 'active'
        ),
        'pending_installations', (
            SELECT count(*) FROM installations 
            WHERE organization_id = org_id AND status = 'pending'
        ),
        'this_week_installations', (
            SELECT count(*) FROM installations 
            WHERE organization_id = org_id 
            AND scheduled_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
        ),
        'overdue_installations', (
            SELECT count(*) FROM installations 
            WHERE organization_id = org_id 
            AND scheduled_date < CURRENT_DATE 
            AND status IN ('pending', 'scheduled')
        ),
        'unread_notifications', (
            SELECT count(*) FROM notifications n
            JOIN users u ON n.recipient_id = u.id
            WHERE u.organization_id = org_id AND n.status = 'unread'
        )
    ) INTO metrics;
    
    RETURN metrics;
END;
$$;

-- Function for efficient team workload calculation
CREATE OR REPLACE FUNCTION get_team_workload(org_id uuid, date_from date DEFAULT CURRENT_DATE)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    workload jsonb := '{}';
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'team_member_id', tm.id,
            'name', tm.first_name || ' ' || tm.last_name,
            'capacity', tm.capacity,
            'assigned_hours', COALESCE(assignment_hours.total_hours, 0),
            'utilization_rate', 
                CASE 
                    WHEN tm.capacity > 0 THEN 
                        ROUND((COALESCE(assignment_hours.total_hours, 0) / tm.capacity::numeric) * 100, 2)
                    ELSE 0 
                END
        )
    )
    INTO workload
    FROM team_members tm
    LEFT JOIN (
        SELECT 
            COALESCE(a.lead_id, a.assistant_id) as team_member_id,
            SUM(COALESCE(a.estimated_duration, 240)) / 60.0 as total_hours
        FROM assignments a
        WHERE a.organization_id = org_id
        AND a.scheduled_date >= date_from
        AND a.scheduled_date < date_from + INTERVAL '7 days'
        AND a.status IN ('assigned', 'accepted', 'in_progress')
        GROUP BY COALESCE(a.lead_id, a.assistant_id)
    ) assignment_hours ON tm.id = assignment_hours.team_member_id
    WHERE tm.organization_id = org_id 
    AND tm.employment_status = 'active';
    
    RETURN COALESCE(workload, '[]'::jsonb);
END;
$$;

-- Function for installation conflict detection
CREATE OR REPLACE FUNCTION detect_scheduling_conflicts(org_id uuid, date_from date DEFAULT CURRENT_DATE)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    conflicts jsonb := '{}';
BEGIN
    WITH potential_conflicts AS (
        SELECT 
            a1.id as assignment_id_1,
            a2.id as assignment_id_2,
            a1.scheduled_date,
            COALESCE(a1.lead_id, a1.assistant_id) as team_member_id,
            'time_overlap' as conflict_type
        FROM assignments a1
        JOIN assignments a2 ON (
            (a1.lead_id = a2.lead_id OR a1.lead_id = a2.assistant_id OR 
             a1.assistant_id = a2.lead_id OR a1.assistant_id = a2.assistant_id)
            AND a1.id < a2.id  -- Avoid duplicates
            AND a1.scheduled_date = a2.scheduled_date
            AND a1.status IN ('assigned', 'accepted', 'in_progress')
            AND a2.status IN ('assigned', 'accepted', 'in_progress')
        )
        WHERE a1.organization_id = org_id 
        AND a1.scheduled_date >= date_from
        AND a1.scheduled_date < date_from + INTERVAL '30 days'
    )
    SELECT jsonb_agg(
        jsonb_build_object(
            'assignment_ids', ARRAY[assignment_id_1, assignment_id_2],
            'scheduled_date', scheduled_date,
            'team_member_id', team_member_id,
            'conflict_type', conflict_type
        )
    )
    INTO conflicts
    FROM potential_conflicts;
    
    RETURN COALESCE(conflicts, '[]'::jsonb);
END;
$$;

-- =====================================================
-- PERFORMANCE MONITORING VIEWS
-- =====================================================

-- View for monitoring query performance
CREATE OR REPLACE VIEW query_performance_monitor AS
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation,
    most_common_vals,
    most_common_freqs
FROM pg_stats 
WHERE schemaname = 'public'
AND tablename IN (
    'organizations', 'projects', 'users', 'team_members', 
    'installations', 'assignments', 'notifications'
);

-- View for index usage statistics
CREATE OR REPLACE VIEW index_usage_stats AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- =====================================================
-- PERFORMANCE OPTIMIZATION SETTINGS
-- =====================================================

-- Update table statistics for better query planning
ANALYZE organizations;
ANALYZE projects;
ANALYZE users;
ANALYZE project_users;
ANALYZE team_members;
ANALYZE installations;
ANALYZE assignments;
ANALYZE notifications;
ANALYZE subscriptions;
ANALYZE organization_activities;

-- =====================================================
-- COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON FUNCTION get_organization_metrics(uuid) IS 'Efficiently calculates key metrics for organization dashboard';
COMMENT ON FUNCTION get_team_workload(uuid, date) IS 'Calculates team member workload and utilization rates';
COMMENT ON FUNCTION detect_scheduling_conflicts(uuid, date) IS 'Identifies potential scheduling conflicts for team members';

COMMENT ON VIEW query_performance_monitor IS 'Monitor query performance and table statistics';
COMMENT ON VIEW index_usage_stats IS 'Track index usage to identify unused or underused indexes';

-- Performance optimization complete
SELECT 'Performance optimization indexes and functions created successfully' as status;