-- Think Tank Technologies Installation Scheduler - Database Setup Script
-- Execute this script in your Supabase SQL Editor

-- First, run the initial schema
\i supabase/migrations/001_initial_schema.sql

-- Then, populate with seed data
\i supabase/seed.sql

-- Verify the setup
SELECT 'Database setup completed successfully!' as status;

-- Show summary of created data
SELECT 
  'Users' as entity,
  COUNT(*) as count
FROM users
UNION ALL
SELECT 
  'Team Members' as entity,
  COUNT(*) as count
FROM team_members
UNION ALL
SELECT 
  'Installations' as entity,
  COUNT(*) as count
FROM installations
UNION ALL
SELECT 
  'Skills' as entity,
  COUNT(*) as count
FROM skills
UNION ALL
SELECT 
  'Email Templates' as entity,
  COUNT(*) as count
FROM email_templates
UNION ALL
SELECT 
  'PDF Templates' as entity,
  COUNT(*) as count
FROM pdf_templates
ORDER BY entity;