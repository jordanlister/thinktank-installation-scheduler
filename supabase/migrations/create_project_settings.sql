-- Create project_settings table for storing project-wide configuration
CREATE TABLE IF NOT EXISTS project_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_name TEXT NOT NULL DEFAULT 'Installation Scheduler',
  company_name TEXT NOT NULL DEFAULT 'Think Tank Technologies',
  timezone TEXT NOT NULL DEFAULT 'America/Los_Angeles',
  working_hours JSONB NOT NULL DEFAULT '{
    "start": "08:00",
    "end": "17:00", 
    "daysOfWeek": ["monday", "tuesday", "wednesday", "thursday", "friday"]
  }',
  scheduling_defaults JSONB NOT NULL DEFAULT '{
    "defaultDuration": 240,
    "bufferTime": 15,
    "maxJobsPerDay": 8,
    "allowWeekends": false
  }',
  notifications JSONB NOT NULL DEFAULT '{
    "emailEnabled": true,
    "smsEnabled": false,
    "scheduleReminders": true,
    "statusUpdates": true
  }',
  optimization JSONB NOT NULL DEFAULT '{
    "primaryGoal": "travel_distance",
    "geographicClustering": true,
    "allowOvertime": false,
    "maxTravelDistance": 100
  }',
  integrations JSONB NOT NULL DEFAULT '{
    "emailProvider": "built-in",
    "smsProvider": "none",
    "calendarSync": false
  }',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create RLS policies
ALTER TABLE project_settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read project settings
CREATE POLICY "Allow authenticated users to read project settings" ON project_settings
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to update project settings
CREATE POLICY "Allow authenticated users to update project settings" ON project_settings
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert project settings
CREATE POLICY "Allow authenticated users to insert project settings" ON project_settings
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_project_settings_updated_at 
  BEFORE UPDATE ON project_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default settings row if none exists
INSERT INTO project_settings (
  project_name,
  company_name,
  timezone,
  working_hours,
  scheduling_defaults,
  notifications,
  optimization,
  integrations
) 
SELECT 
  'Installation Scheduler',
  'Think Tank Technologies', 
  'America/Los_Angeles',
  '{
    "start": "08:00",
    "end": "17:00",
    "daysOfWeek": ["monday", "tuesday", "wednesday", "thursday", "friday"]
  }'::jsonb,
  '{
    "defaultDuration": 240,
    "bufferTime": 15,
    "maxJobsPerDay": 8,
    "allowWeekends": false
  }'::jsonb,
  '{
    "emailEnabled": true,
    "smsEnabled": false,
    "scheduleReminders": true,
    "statusUpdates": true
  }'::jsonb,
  '{
    "primaryGoal": "travel_distance",
    "geographicClustering": true,
    "allowOvertime": false,
    "maxTravelDistance": 100
  }'::jsonb,
  '{
    "emailProvider": "built-in",
    "smsProvider": "none",
    "calendarSync": false
  }'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM project_settings);