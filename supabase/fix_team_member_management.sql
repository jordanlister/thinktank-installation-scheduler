-- Fix Team Member Management Issues

-- First, let's check if team_members table exists and create if needed
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    region VARCHAR(100) NOT NULL,
    sub_regions TEXT[],
    specializations TEXT[],
    capacity INTEGER DEFAULT 8,
    travel_radius INTEGER DEFAULT 50,
    home_base_id UUID REFERENCES addresses(id),
    hire_date DATE NOT NULL,
    department VARCHAR(100),
    job_title VARCHAR(100),
    pay_grade VARCHAR(20),
    supervisor_id UUID REFERENCES users(id),
    work_location VARCHAR(100),
    employment_type VARCHAR(20) DEFAULT 'full_time',
    employment_status VARCHAR(20) DEFAULT 'active',
    probation_end_date DATE,
    benefits TEXT[],
    preferred_partners UUID[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update RLS policies to allow team member creation
DROP POLICY IF EXISTS "Team members can be managed by admins" ON team_members;
CREATE POLICY "Team members can be managed by admins" ON team_members
    FOR ALL USING (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'scheduler')
        )
    );

-- Update RLS policies for users table to allow team member creation
DROP POLICY IF EXISTS "Users can be managed by admins" ON users;
CREATE POLICY "Users can be managed by admins" ON users
    FOR ALL USING (
        auth.role() = 'authenticated' AND (
            id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM users u
                WHERE u.id = auth.uid() 
                AND u.role IN ('admin', 'scheduler')
            )
        )
    );

-- Function to safely create a team member with all related data
CREATE OR REPLACE FUNCTION create_team_member_safe(
    p_email TEXT,
    p_first_name TEXT,
    p_last_name TEXT,
    p_role TEXT,
    p_region TEXT,
    p_capacity INTEGER DEFAULT 8,
    p_travel_radius INTEGER DEFAULT 50,
    p_specializations TEXT[] DEFAULT '{}',
    p_emergency_contact JSONB DEFAULT '{}',
    p_preferred_start_time TIME DEFAULT '08:00',
    p_preferred_end_time TIME DEFAULT '17:00',
    p_max_daily_jobs INTEGER DEFAULT 5,
    p_max_weekly_hours INTEGER DEFAULT 40,
    p_weekends_available BOOLEAN DEFAULT false,
    p_overtime_available BOOLEAN DEFAULT false,
    p_travel_preference TEXT DEFAULT 'regional'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_user_id UUID;
    new_employee_id TEXT;
BEGIN
    -- Generate unique employee ID
    new_employee_id := 'EMP' || EXTRACT(EPOCH FROM NOW())::TEXT;
    
    -- Create user record first
    INSERT INTO users (
        email, 
        first_name, 
        last_name, 
        role, 
        emergency_contact,
        is_active
    )
    VALUES (
        p_email, 
        p_first_name, 
        p_last_name, 
        p_role::user_role, 
        COALESCE(p_emergency_contact, '{}'::jsonb),
        true
    )
    RETURNING id INTO new_user_id;
    
    -- Create team member record
    INSERT INTO team_members (
        id,
        employee_id,
        region,
        specializations,
        capacity,
        travel_radius,
        hire_date,
        employment_status,
        job_title,
        department
    )
    VALUES (
        new_user_id,
        new_employee_id,
        p_region,
        COALESCE(p_specializations, '{}'),
        COALESCE(p_capacity, 8),
        COALESCE(p_travel_radius, 50),
        CURRENT_DATE,
        'active',
        CASE 
            WHEN p_role = 'admin' THEN 'System Administrator'
            WHEN p_role = 'scheduler' THEN 'Installation Scheduler'
            WHEN p_role = 'lead' THEN 'Lead Installer'
            WHEN p_role = 'assistant' THEN 'Installation Assistant'
            ELSE 'Team Member'
        END,
        'Installation Services'
    );
    
    -- Create work preferences if provided
    INSERT INTO work_preferences (
        team_member_id,
        preferred_start_time,
        preferred_end_time,
        max_daily_jobs,
        max_weekly_hours,
        weekends_available,
        overtime_available,
        travel_preference
    )
    VALUES (
        new_user_id,
        COALESCE(p_preferred_start_time, '08:00'::TIME),
        COALESCE(p_preferred_end_time, '17:00'::TIME),
        COALESCE(p_max_daily_jobs, 5),
        COALESCE(p_max_weekly_hours, 40),
        COALESCE(p_weekends_available, false),
        COALESCE(p_overtime_available, false),
        COALESCE(p_travel_preference, 'regional')
    );
    
    RETURN new_user_id;
END;
$$;

-- Function to safely update a team member
CREATE OR REPLACE FUNCTION update_team_member_safe(
    p_id UUID,
    p_first_name TEXT DEFAULT NULL,
    p_last_name TEXT DEFAULT NULL,
    p_email TEXT DEFAULT NULL,
    p_role TEXT DEFAULT NULL,
    p_region TEXT DEFAULT NULL,
    p_capacity INTEGER DEFAULT NULL,
    p_travel_radius INTEGER DEFAULT NULL,
    p_specializations TEXT[] DEFAULT NULL,
    p_emergency_contact JSONB DEFAULT NULL,
    p_employment_status TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update user table
    UPDATE users SET
        first_name = COALESCE(p_first_name, first_name),
        last_name = COALESCE(p_last_name, last_name),
        email = COALESCE(p_email, email),
        role = COALESCE(p_role::user_role, role),
        emergency_contact = COALESCE(p_emergency_contact, emergency_contact),
        updated_at = NOW()
    WHERE id = p_id;
    
    -- Update team member table
    UPDATE team_members SET
        region = COALESCE(p_region, region),
        capacity = COALESCE(p_capacity, capacity),
        travel_radius = COALESCE(p_travel_radius, travel_radius),
        specializations = COALESCE(p_specializations, specializations),
        employment_status = COALESCE(p_employment_status, employment_status),
        job_title = CASE 
            WHEN p_role IS NOT NULL THEN
                CASE 
                    WHEN p_role = 'admin' THEN 'System Administrator'
                    WHEN p_role = 'scheduler' THEN 'Installation Scheduler'
                    WHEN p_role = 'lead' THEN 'Lead Installer'
                    WHEN p_role = 'assistant' THEN 'Installation Assistant'
                    ELSE 'Team Member'
                END
            ELSE job_title
        END,
        updated_at = NOW()
    WHERE id = p_id;
END;
$$;

-- Function to safely delete (deactivate) a team member
CREATE OR REPLACE FUNCTION delete_team_member_safe(p_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Mark user as inactive
    UPDATE users SET
        is_active = false,
        updated_at = NOW()
    WHERE id = p_id;
    
    -- Mark team member as terminated
    UPDATE team_members SET
        employment_status = 'terminated',
        updated_at = NOW()
    WHERE id = p_id;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION create_team_member_safe TO authenticated;
GRANT EXECUTE ON FUNCTION update_team_member_safe TO authenticated;
GRANT EXECUTE ON FUNCTION delete_team_member_safe TO authenticated;

-- Create improved team_member_details view if it doesn't exist
DROP VIEW IF EXISTS team_member_details;
CREATE VIEW team_member_details AS
SELECT 
    tm.id,
    u.email,
    u.first_name,
    u.last_name,
    u.role,
    u.is_active,
    u.emergency_contact,
    u.created_at,
    u.updated_at,
    tm.employee_id,
    tm.region,
    tm.sub_regions,
    tm.specializations,
    tm.capacity,
    tm.travel_radius,
    tm.hire_date,
    tm.department,
    tm.job_title,
    tm.employment_status,
    tm.employment_type
FROM team_members tm
JOIN users u ON tm.id = u.id
WHERE u.is_active = true AND tm.employment_status IN ('active', 'on_leave');