# Post-Migration Validation Checklist

## CRITICAL: Execute this checklist after each migration phase

## Phase 1 Validation: Schema Transformation Complete

### Database Schema Validation
- [ ] **Organizations table created**: `SELECT COUNT(*) FROM organizations;`
- [ ] **Projects table created**: `SELECT COUNT(*) FROM projects;`
- [ ] **Project_users table created**: `SELECT COUNT(*) FROM project_users;`
- [ ] **Subscriptions table created**: `SELECT COUNT(*) FROM subscriptions;`
- [ ] **User_invitations table created**: `SELECT COUNT(*) FROM user_invitations;`
- [ ] **Organization_activities table created**: `SELECT COUNT(*) FROM organization_activities;`

### Column Additions Validation
```sql
-- Verify new columns added to existing tables
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'team_members', 'installations', 'assignments', 'notifications')
AND column_name IN ('organization_id', 'project_id', 'created_by', 'assigned_by');
```

### Enum Types Validation
- [ ] **Organization roles**: `SELECT unnest(enum_range(NULL::organization_role));`
- [ ] **Project roles**: `SELECT unnest(enum_range(NULL::project_role));`
- [ ] **Subscription status**: `SELECT unnest(enum_range(NULL::subscription_status));`

### Functions and Triggers Validation
- [ ] **Update triggers**: `SELECT tgname FROM pg_trigger WHERE tgname LIKE '%updated_at%';`
- [ ] **handle_new_user function**: `SELECT proname FROM pg_proc WHERE proname = 'handle_new_user';`
- [ ] **get_user_context function**: `SELECT proname FROM pg_proc WHERE proname = 'get_user_context';`

## Phase 2 Validation: RLS Policies Active

### RLS Status Validation
```sql
-- Verify RLS is enabled on all tenant tables
SELECT 
    schemaname, 
    tablename, 
    rowsecurity,
    CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('organizations', 'projects', 'users', 'team_members', 'installations', 'assignments', 'notifications', 'project_users', 'user_invitations')
ORDER BY tablename;
```

### Policy Count Validation
```sql
-- Count policies per table
SELECT 
    schemaname,
    tablename,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;
```

### Security Function Validation
- [ ] **validate_organization_member**: `SELECT proname FROM pg_proc WHERE proname = 'validate_organization_member';`
- [ ] **validate_project_access**: `SELECT proname FROM pg_proc WHERE proname = 'validate_project_access';`
- [ ] **can_perform_action**: `SELECT proname FROM pg_proc WHERE proname = 'can_perform_action';`

### RLS Policy Testing
```sql
-- Test RLS policies are working (should return policy info)
SELECT test_rls_policies();
```

## Phase 3 Validation: Data Migration Complete

### Data Migration Validation
```sql
-- Critical validation queries

-- 1. All users have organization_id
SELECT 
    COUNT(*) as total_users,
    COUNT(organization_id) as users_with_org,
    COUNT(*) - COUNT(organization_id) as orphaned_users
FROM users;

-- 2. All team_members have org/project context
SELECT 
    COUNT(*) as total_team_members,
    COUNT(organization_id) as with_org,
    COUNT(project_id) as with_project,
    COUNT(CASE WHEN organization_id IS NOT NULL AND project_id IS NOT NULL THEN 1 END) as fully_contextualized
FROM team_members;

-- 3. All installations have org/project context
SELECT 
    COUNT(*) as total_installations,
    COUNT(organization_id) as with_org,
    COUNT(project_id) as with_project
FROM installations;

-- 4. All assignments have org/project context  
SELECT 
    COUNT(*) as total_assignments,
    COUNT(organization_id) as with_org,
    COUNT(project_id) as with_project
FROM assignments;

-- 5. All notifications have org context
SELECT 
    COUNT(*) as total_notifications,
    COUNT(organization_id) as with_org
FROM notifications;
```

### Default Organization Validation
```sql
-- Verify default organization created
SELECT 
    id,
    name,
    slug,
    subscription_plan,
    is_active,
    created_at
FROM organizations 
WHERE slug = 'think-tank-tech';

-- Verify default project created  
SELECT 
    p.id,
    p.name,
    p.description,
    p.is_active,
    o.name as organization_name
FROM projects p
JOIN organizations o ON p.organization_id = o.id
WHERE o.slug = 'think-tank-tech';
```

### Migration Statistics Validation
```sql
-- Check migration activity logs
SELECT 
    activity_type,
    entity_type,
    description,
    metadata,
    created_at
FROM organization_activities 
WHERE activity_type IN ('system_migration', 'migration_completion')
ORDER BY created_at DESC;
```

## COMPREHENSIVE SECURITY TESTING

### Test 1: Cross-Tenant Data Isolation
```sql
-- Create test organizations and users
INSERT INTO organizations (id, name, slug) VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Test Org 1', 'test-org-1'),
    ('22222222-2222-2222-2222-222222222222', 'Test Org 2', 'test-org-2');

-- Test that users from org 1 cannot see org 2 data
-- This should be done with proper authentication context
```

### Test 2: Role-Based Access Control
```sql
-- Test different user roles can access appropriate data
-- Verify owners can see all org data
-- Verify members can only see assigned project data
-- Verify project roles are properly enforced
```

### Test 3: JWT Claims Validation
```sql
-- Test JWT claims function
SELECT set_user_claims() AS user_claims;
```

## PERFORMANCE VALIDATION

### Index Utilization Check
```sql
-- Verify new indexes are being used
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM installations 
WHERE organization_id = '11111111-1111-1111-1111-111111111111' 
AND project_id = '33333333-3333-3333-3333-333333333333';
```

### Query Performance Benchmarks
```sql
-- Test multi-tenant query performance (should be < 200ms)
\timing on

-- Organization data access
SELECT COUNT(*) FROM team_members 
WHERE organization_id = '11111111-1111-1111-1111-111111111111';

-- Project-scoped data access
SELECT COUNT(*) FROM installations 
WHERE organization_id = '11111111-1111-1111-1111-111111111111' 
AND project_id = '33333333-3333-3333-3333-333333333333';

-- User notification queries
SELECT COUNT(*) FROM notifications 
WHERE organization_id = '11111111-1111-1111-1111-111111111111' 
AND recipient_id = '44444444-4444-4444-4444-444444444444';

\timing off
```

## APPLICATION INTEGRATION VALIDATION

### Authentication Flow Testing
- [ ] **User can log in successfully**
- [ ] **Organization context loaded in JWT**
- [ ] **Project switching works correctly**
- [ ] **User sees only their organization data**
- [ ] **Role-based UI elements display correctly**

### CRUD Operations Testing
- [ ] **Create installation (org/project context auto-added)**
- [ ] **Read installations (only org/project scoped)**
- [ ] **Update installation (respects tenant boundaries)**
- [ ] **Delete installation (properly scoped)**

### Notification System Testing
- [ ] **Notifications sent to correct organization users**
- [ ] **Cross-tenant notifications prevented**
- [ ] **Project-scoped notifications work**

## ERROR SCENARIOS VALIDATION

### Database Connection Issues
- [ ] **Connection pool handles multi-tenant queries**
- [ ] **RLS policies don't cause connection errors**
- [ ] **Authentication failures handled gracefully**

### Invalid Data Scenarios
- [ ] **Missing organization_id handled properly**
- [ ] **Invalid JWT claims rejected**
- [ ] **Orphaned records prevented**

## ROLLBACK VALIDATION (If Issues Found)

### Rollback Readiness Check
```sql
-- Verify rollback procedures work
-- Test with small dataset first
BEGIN;
-- Execute rollback steps
ROLLBACK;
```

### Data Integrity After Rollback
- [ ] **Original data restored completely**
- [ ] **No orphaned records created**
- [ ] **Application functions normally**
- [ ] **Performance back to baseline**

## FINAL SIGN-OFF CHECKLIST

### Technical Sign-off
- [ ] **All database validations pass**
- [ ] **Security tests confirm isolation**
- [ ] **Performance meets requirements (< 200ms)**
- [ ] **Application integration successful**
- [ ] **Error scenarios handled properly**

### Business Sign-off  
- [ ] **Existing users can access their data**
- [ ] **No data loss confirmed**
- [ ] **All functionality works as before**
- [ ] **Multi-tenant features ready for use**

### Documentation Sign-off
- [ ] **Migration executed per plan**
- [ ] **All validation steps completed**
- [ ] **Issues documented and resolved**
- [ ] **Rollback procedures tested**
- [ ] **Performance benchmarks recorded**

## MIGRATION SUCCESS CRITERIA

✅ **Migration is SUCCESSFUL when:**
1. All validation queries return expected results (zero errors)
2. Security testing confirms complete tenant isolation  
3. Performance benchmarks are within acceptable ranges (< 200ms)
4. Application loads and functions normally for all user types
5. No data loss or corruption detected
6. All existing functionality preserved
7. Multi-tenant features operational

❌ **Migration should be ROLLED BACK if:**
1. Any critical validation fails
2. Data loss or corruption detected
3. Security isolation compromised
4. Performance degrades significantly (> 500ms queries)
5. Application becomes non-functional
6. Rollback procedures fail during testing

---

**IMPORTANT**: Document all validation results with timestamps and screenshots. Any failures must be investigated and resolved before proceeding.