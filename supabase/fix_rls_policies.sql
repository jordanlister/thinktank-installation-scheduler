-- Fix infinite recursion in RLS policies

-- Drop problematic policies that are causing recursion
DROP POLICY IF EXISTS "Users can be managed by admins" ON users;
DROP POLICY IF EXISTS "Team members can be managed by admins" ON team_members;

-- Create simple, non-recursive policies
CREATE POLICY "Enable read access for authenticated users" ON users
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON users
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can update any user" ON users
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND 
        auth.uid() IN (
            SELECT id FROM users WHERE role IN ('admin', 'scheduler') AND id = auth.uid()
        )
    );

-- Team members policies
CREATE POLICY "Enable read access for authenticated users" ON team_members
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON team_members
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage team members" ON team_members
    FOR ALL USING (
        auth.role() = 'authenticated' AND 
        auth.uid() IN (
            SELECT id FROM users WHERE role IN ('admin', 'scheduler') AND id = auth.uid()
        )
    );

-- Ensure RLS is enabled on critical tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Simple notification policies (replace existing ones)
DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can manage own notifications" ON notifications;

CREATE POLICY "Users can read own notifications" ON notifications
    FOR SELECT USING (recipient_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (recipient_id = auth.uid());

CREATE POLICY "System can insert notifications" ON notifications
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');