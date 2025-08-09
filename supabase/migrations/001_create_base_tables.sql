-- Create base tables for multi-tenant migration
-- This creates the minimum required tables that the migration expects to exist

-- Team members table (basic structure)
CREATE TABLE IF NOT EXISTS team_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    role text,
    employment_status text DEFAULT 'active',
    hire_date date,
    hourly_rate numeric,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    UNIQUE(email)
);

-- Installations table (basic structure)
CREATE TABLE IF NOT EXISTS installations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    location text,
    start_date date,
    end_date date,
    status text DEFAULT 'scheduled',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Assignments table (basic structure)  
CREATE TABLE IF NOT EXISTS assignments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    installation_id uuid NOT NULL REFERENCES installations(id) ON DELETE CASCADE,
    team_member_id uuid NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
    lead_id uuid REFERENCES team_members(id),
    assistant_id uuid REFERENCES team_members(id),
    assigned_by uuid REFERENCES auth.users(id),
    role text NOT NULL,
    scheduled_date date,
    status text DEFAULT 'assigned',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Notifications table (basic structure)
CREATE TABLE IF NOT EXISTS notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    message text,
    type text DEFAULT 'info',
    read boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables (will be configured properly in main migration)
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;