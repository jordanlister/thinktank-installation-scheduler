-- Team Management Tables for Think Tank Technologies Installation Scheduler

-- Skills table (master list of available skills)
CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Team member skills junction table
CREATE TABLE IF NOT EXISTS team_member_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  level TEXT NOT NULL CHECK (level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  acquired_date DATE,
  last_assessed TIMESTAMP WITH TIME ZONE,
  assessed_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(team_member_id, skill_id)
);

-- Certifications table
CREATE TABLE IF NOT EXISTS certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  issuer TEXT NOT NULL,
  certification_number TEXT,
  issue_date DATE,
  expiration_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'suspended', 'pending')),
  renewal_required BOOLEAN DEFAULT false,
  document_url TEXT,
  cost DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Equipment table
CREATE TABLE IF NOT EXISTS equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  serial_number TEXT,
  assigned_to UUID REFERENCES team_members(id) ON DELETE SET NULL,
  assigned_date DATE,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'maintenance', 'retired')),
  condition TEXT NOT NULL DEFAULT 'good' CHECK (condition IN ('excellent', 'good', 'fair', 'poor')),
  purchase_date DATE,
  warranty_expiration DATE,
  warranty_provider TEXT,
  last_inspected DATE,
  next_inspection_due DATE,
  specifications JSONB DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Availability table
CREATE TABLE IF NOT EXISTS availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  is_recurring BOOLEAN DEFAULT false,
  recurring_days TEXT[], -- ['monday', 'tuesday', etc.]
  is_available BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  CHECK (end_date >= start_date)
);

-- Work preferences table
CREATE TABLE IF NOT EXISTS work_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE UNIQUE,
  preferred_start_time TIME DEFAULT '08:00',
  preferred_end_time TIME DEFAULT '17:00',
  max_daily_jobs INTEGER DEFAULT 5 CHECK (max_daily_jobs > 0),
  max_weekly_hours INTEGER DEFAULT 40 CHECK (max_weekly_hours > 0),
  weekends_available BOOLEAN DEFAULT false,
  overtime_available BOOLEAN DEFAULT false,
  travel_preference TEXT DEFAULT 'regional' CHECK (travel_preference IN ('local', 'regional', 'national')),
  special_requests TEXT[],
  unavailable_dates DATE[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Performance metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  completion_rate DECIMAL(5,4) DEFAULT 0 CHECK (completion_rate >= 0 AND completion_rate <= 1),
  average_time DECIMAL(8,2), -- in minutes
  customer_satisfaction DECIMAL(3,2) DEFAULT 0 CHECK (customer_satisfaction >= 0 AND customer_satisfaction <= 10),
  travel_efficiency DECIMAL(3,2) DEFAULT 0 CHECK (travel_efficiency >= 0 AND travel_efficiency <= 10),
  total_jobs INTEGER DEFAULT 0,
  total_distance DECIMAL(10,2) DEFAULT 0, -- in miles
  quality_score DECIMAL(3,2) DEFAULT 0 CHECK (quality_score >= 0 AND quality_score <= 10),
  safety_score DECIMAL(3,2) DEFAULT 0 CHECK (safety_score >= 0 AND safety_score <= 10),
  punctuality_score DECIMAL(3,2) DEFAULT 0 CHECK (punctuality_score >= 0 AND punctuality_score <= 10),
  communication_score DECIMAL(3,2) DEFAULT 0 CHECK (communication_score >= 0 AND communication_score <= 10),
  revenue_generated DECIMAL(12,2) DEFAULT 0,
  overtime_hours DECIMAL(6,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  CHECK (period_end >= period_start)
);

-- Drop and recreate team_member_details view for easier querying
DROP VIEW IF EXISTS team_member_details;

CREATE VIEW team_member_details AS
SELECT 
  tm.id,
  tm.id as user_id, -- team_members.id IS the user_id
  u.email,
  u.first_name,
  u.last_name,
  u.role,
  u.emergency_contact,
  tm.region,
  tm.sub_regions,
  tm.capacity,
  tm.travel_radius,
  tm.specializations,
  tm.employee_id,
  tm.employment_status,
  tm.job_title,
  tm.hire_date,
  tm.created_at,
  tm.updated_at
FROM team_members tm
JOIN users u ON tm.id = u.id;

-- Enable RLS on all tables
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_member_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for skills (read-only for authenticated users)
CREATE POLICY "Allow authenticated users to read skills" ON skills
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admin users to manage skills" ON skills
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'scheduler')
    )
  );

-- RLS Policies for team_member_skills
CREATE POLICY "Allow authenticated users to read team member skills" ON team_member_skills
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admin users to manage team member skills" ON team_member_skills
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'scheduler')
    )
  );

-- RLS Policies for certifications
CREATE POLICY "Allow authenticated users to read certifications" ON certifications
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admin users to manage certifications" ON certifications
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'scheduler')
    )
  );

-- RLS Policies for equipment
CREATE POLICY "Allow authenticated users to read equipment" ON equipment
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admin users to manage equipment" ON equipment
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'scheduler')
    )
  );

-- RLS Policies for availability
CREATE POLICY "Allow authenticated users to read availability" ON availability
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow team members to manage their own availability" ON availability
  FOR ALL USING (
    auth.role() = 'authenticated' AND (
      team_member_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role IN ('admin', 'scheduler')
      )
    )
  );

-- RLS Policies for work_preferences
CREATE POLICY "Allow authenticated users to read work preferences" ON work_preferences
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow team members to manage their own work preferences" ON work_preferences
  FOR ALL USING (
    auth.role() = 'authenticated' AND (
      team_member_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role IN ('admin', 'scheduler')
      )
    )
  );

-- RLS Policies for performance_metrics
CREATE POLICY "Allow authenticated users to read performance metrics" ON performance_metrics
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admin users to manage performance metrics" ON performance_metrics
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'scheduler')
    )
  );

-- Create updated_at triggers for all tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers (drop existing ones first to avoid conflicts)
DROP TRIGGER IF EXISTS update_team_member_skills_updated_at ON team_member_skills;
CREATE TRIGGER update_team_member_skills_updated_at 
  BEFORE UPDATE ON team_member_skills 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_certifications_updated_at ON certifications;
CREATE TRIGGER update_certifications_updated_at 
  BEFORE UPDATE ON certifications 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_equipment_updated_at ON equipment;
CREATE TRIGGER update_equipment_updated_at 
  BEFORE UPDATE ON equipment 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_availability_updated_at ON availability;
CREATE TRIGGER update_availability_updated_at 
  BEFORE UPDATE ON availability 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_work_preferences_updated_at ON work_preferences;
CREATE TRIGGER update_work_preferences_updated_at 
  BEFORE UPDATE ON work_preferences 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_performance_metrics_updated_at ON performance_metrics;
CREATE TRIGGER update_performance_metrics_updated_at 
  BEFORE UPDATE ON performance_metrics 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Clean up duplicate skills and add unique constraint
DO $$ 
BEGIN
  -- Remove duplicates by keeping only the first occurrence (using ROW_NUMBER for UUIDs)
  DELETE FROM skills 
  WHERE id IN (
    SELECT id
    FROM (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at) as rn
      FROM skills
    ) t
    WHERE rn > 1
  );
  
  -- Add unique constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'skills_name_unique'
  ) THEN
    ALTER TABLE skills ADD CONSTRAINT skills_name_unique UNIQUE (name);
  END IF;
END $$;

-- Insert some default skills (will be ignored if they already exist)
INSERT INTO skills (name, category, description) VALUES
  ('Electrical Installation', 'technical', 'Installation and maintenance of electrical systems'),
  ('Plumbing Systems', 'technical', 'Installation and repair of plumbing systems'),
  ('HVAC Systems', 'technical', 'Heating, ventilation, and air conditioning systems'),
  ('Solar Panel Installation', 'technical', 'Installation of solar energy systems'),
  ('Network Wiring', 'technical', 'Installation of network and telecommunications wiring'),
  ('Customer Service', 'customer_service', 'Excellent customer interaction and service skills'),
  ('Project Management', 'management', 'Planning and managing installation projects'),
  ('Safety Compliance', 'safety', 'Knowledge and adherence to safety protocols'),
  ('Tool Operation', 'equipment', 'Proficient use of installation tools and equipment'),
  ('Quality Control', 'specialized', 'Ensuring installation quality and standards')
ON CONFLICT (name) DO NOTHING;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_team_member_skills_team_member_id ON team_member_skills(team_member_id);
CREATE INDEX IF NOT EXISTS idx_team_member_skills_skill_id ON team_member_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_certifications_team_member_id ON certifications(team_member_id);
CREATE INDEX IF NOT EXISTS idx_certifications_expiration_date ON certifications(expiration_date);
CREATE INDEX IF NOT EXISTS idx_equipment_assigned_to ON equipment(assigned_to);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);
CREATE INDEX IF NOT EXISTS idx_availability_team_member_id ON availability(team_member_id);
CREATE INDEX IF NOT EXISTS idx_availability_date_range ON availability(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_work_preferences_team_member_id ON work_preferences(team_member_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_team_member_id ON performance_metrics(team_member_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_period ON performance_metrics(period_start, period_end);