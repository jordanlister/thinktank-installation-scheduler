# Multi-Tenant Migration Execution Plan

## PRE-MIGRATION REQUIREMENTS

### 1. Database Backup
```bash
# Create full database backup before starting
pg_dump -h your-supabase-host -U postgres -d your-db > backup_pre_migration.sql
```

### 2. Environment Validation
- Verify current schema matches 001_initial_schema.sql
- Confirm all existing RLS policies are documented
- Test current application functionality
- Ensure no active transactions or locks on target tables

### 3. Application Preparation
- Put application in maintenance mode during migration
- Notify all users of scheduled downtime
- Prepare rollback procedures

## MIGRATION EXECUTION SEQUENCE

### Phase 1: Schema Transformation
**File**: `003_multi_tenant_transformation.sql`
**Estimated Time**: 5-10 minutes
**Dependencies**: None

```sql
-- Execute in transaction for safety
BEGIN;
\i 003_multi_tenant_transformation.sql
-- Verify schema changes
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('organizations', 'projects', 'project_users');
COMMIT;
```

**Validation Queries**:
```sql
-- Verify new tables exist
SELECT COUNT(*) FROM organizations;
SELECT COUNT(*) FROM projects;
SELECT COUNT(*) FROM project_users;

-- Verify new columns added
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'organization_id';
```

### Phase 2: Row Level Security Implementation
**File**: `004_multi_tenant_rls_policies.sql`
**Estimated Time**: 2-5 minutes
**Dependencies**: Phase 1 must be completed

```sql
-- Execute RLS policies
\i 004_multi_tenant_rls_policies.sql

-- Verify RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' AND tablename IN ('organizations', 'projects', 'users', 'team_members', 'installations', 'assignments', 'notifications');
```

**Critical Validation**:
```sql
-- Test RLS function
SELECT test_rls_policies();

-- Verify policy count
SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public';
```

### Phase 3: Data Migration
**File**: `005_data_migration_existing_to_multi_tenant.sql`
**Estimated Time**: 10-30 minutes (depending on data volume)
**Dependencies**: Phases 1 and 2 must be completed

```sql
-- Execute data migration
\i 005_data_migration_existing_to_multi_tenant.sql
```

**Critical Validation Queries**:
```sql
-- Verify all users have organization_id
SELECT COUNT(*) FROM users WHERE organization_id IS NULL;

-- Verify all team_members have org/project context
SELECT COUNT(*) FROM team_members WHERE organization_id IS NULL OR project_id IS NULL;

-- Verify all installations have org/project context  
SELECT COUNT(*) FROM installations WHERE organization_id IS NULL OR project_id IS NULL;

-- Verify all assignments have org/project context
SELECT COUNT(*) FROM assignments WHERE organization_id IS NULL OR project_id IS NULL;

-- Verify migration statistics
SELECT * FROM organization_activities WHERE activity_type = 'system_migration' ORDER BY created_at DESC LIMIT 5;
```

## ROLLBACK PROCEDURES

### If Migration Fails at Phase 1
```sql
-- Drop new tables and columns
DROP TABLE IF EXISTS organizations CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS project_users CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS user_invitations CASCADE;
-- Remove added columns
ALTER TABLE users DROP COLUMN IF EXISTS organization_id CASCADE;
-- Restore from backup
```

### If Migration Fails at Phase 2
```sql
-- Disable RLS on all tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;
-- Drop all policies
DROP POLICY IF EXISTS "organization_access" ON organizations;
-- Continue with Phase 1 rollback
```

### If Migration Fails at Phase 3
```sql
-- Restore data from backup
-- Remove NOT NULL constraints that were added
ALTER TABLE users ALTER COLUMN organization_id DROP NOT NULL;
-- Reset to pre-migration state
```

## POST-MIGRATION VALIDATION CHECKLIST

### Data Integrity Validation
- [ ] All users have organization_id assigned
- [ ] All team_members have organization_id and project_id
- [ ] All installations have organization_id and project_id  
- [ ] All assignments have organization_id and project_id
- [ ] All notifications have organization_id
- [ ] Default organization and project created successfully
- [ ] Migration activity logged properly

### Security Validation
- [ ] RLS enabled on all tenant tables
- [ ] Test cross-tenant data access (should fail)
- [ ] Verify service role can access all data
- [ ] Test JWT-based access patterns
- [ ] Validate role-based permissions

### Performance Validation
- [ ] Query performance within 200ms target
- [ ] Indexes properly created and utilized
- [ ] No table scans on large tenant tables
- [ ] Connection pooling working correctly

### Application Integration Validation
- [ ] Authentication flow works with organization context
- [ ] User can switch between projects
- [ ] Data displays only for current organization/project
- [ ] All CRUD operations respect tenant boundaries
- [ ] Notifications properly scoped

## KNOWN ISSUES AND WORKAROUNDS

### Issue 1: RLS Policy Recursion
**Problem**: Users table policies may cause recursion
**Workaround**: Execute policies in specific order, test with service role first

### Issue 2: JWT Claims Not Set
**Problem**: Application may not have organization context in JWT
**Workaround**: Update authentication service to include organization_id in JWT claims

### Issue 3: Performance on Large Datasets
**Problem**: Complex RLS policies may impact query performance
**Workaround**: Monitor query performance, optimize indexes as needed

## EMERGENCY CONTACTS AND PROCEDURES

### Database Issues
- Database Administrator: [Contact Info]
- Backup/Restore Specialist: [Contact Info]

### Application Issues  
- Development Team Lead: [Contact Info]
- DevOps Engineer: [Contact Info]

### Emergency Rollback Authorization
- Product Owner: [Contact Info]
- Technical Director: [Contact Info]

## SUCCESS CRITERIA

Migration is considered successful when:
1. All validation queries return expected results
2. Application loads and functions normally
3. Users can only access their organization's data
4. Performance metrics within acceptable range (< 200ms queries)
5. No data loss or corruption detected
6. All existing functionality works as before

## TIMELINE

**Total Estimated Time**: 2-4 hours including validation
- Phase 1: 30 minutes
- Phase 2: 30 minutes  
- Phase 3: 60-90 minutes
- Post-validation: 60-90 minutes

**Recommended Execution Window**: 
- Weekend or maintenance window
- Low-traffic period
- All stakeholders available for emergency response