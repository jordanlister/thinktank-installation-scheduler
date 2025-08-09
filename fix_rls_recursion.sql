-- Fix RLS infinite recursion in users table policies
-- This fixes the critical issue where users policies reference the users table causing infinite recursion

-- Drop and recreate users policies without recursion
DROP POLICY IF EXISTS "users_organization_access" ON users;
CREATE POLICY "users_organization_access" ON users
    FOR SELECT USING (
        -- Direct auth checks without recursive SELECT
        id = auth.uid()
        OR auth.jwt() ->> 'role' = 'service_role'
        OR auth.jwt() ->> 'user_role' IN ('owner', 'admin')
    );

-- Fix organization admin update policy to avoid recursion
DROP POLICY IF EXISTS "users_org_admin_update" ON users;
CREATE POLICY "users_org_admin_update" ON users
    FOR UPDATE USING (
        -- Allow service role and avoid recursive lookup
        auth.jwt() ->> 'role' = 'service_role'
        OR (
            auth.jwt() ->> 'user_role' IN ('owner', 'admin') 
            AND auth.jwt() ->> 'organization_id' = organization_id::text
        )
    );

-- Ensure team_members policies don't have similar issues
DROP POLICY IF EXISTS "team_members_access" ON team_members;
CREATE POLICY "team_members_access" ON team_members
    FOR SELECT USING (
        -- User can see team members in their organization
        user_id = auth.uid()
        OR auth.jwt() ->> 'role' = 'service_role'
        OR (
            project_id IN (
                SELECT id FROM projects 
                WHERE organization_id = (auth.jwt() ->> 'organization_id')::uuid
            )
        )
    );

-- Log the fix
SELECT 'RLS recursion fix applied successfully' as status;