-- Think Tank Technologies Installation Scheduler - Seed Data
-- Sample data for development and testing

-- Disable triggers during seeding to avoid audit log noise
SET session_replication_role = replica;

-- Insert sample addresses
INSERT INTO addresses (id, street, city, state, zip_code, coordinates) VALUES
('550e8400-e29b-41d4-a716-446655440001', '123 Main St', 'New York', 'NY', '10001', POINT(-73.9857, 40.7484)),
('550e8400-e29b-41d4-a716-446655440002', '456 Oak Ave', 'Los Angeles', 'CA', '90210', POINT(-118.2437, 34.0522)),
('550e8400-e29b-41d4-a716-446655440003', '789 Pine Rd', 'Chicago', 'IL', '60601', POINT(-87.6244, 41.8756)),
('550e8400-e29b-41d4-a716-446655440004', '321 Elm St', 'Houston', 'TX', '77001', POINT(-95.3698, 29.7604)),
('550e8400-e29b-41d4-a716-446655440005', '654 Maple Dr', 'Phoenix', 'AZ', '85001', POINT(-112.0740, 33.4484)),
('550e8400-e29b-41d4-a716-446655440006', '987 Cedar Ln', 'Philadelphia', 'PA', '19101', POINT(-75.1652, 39.9526)),
('550e8400-e29b-41d4-a716-446655440007', '147 Birch Way', 'San Antonio', 'TX', '78201', POINT(-98.4936, 29.4241)),
('550e8400-e29b-41d4-a716-446655440008', '258 Spruce St', 'San Diego', 'CA', '92101', POINT(-117.1611, 32.7157)),
('550e8400-e29b-41d4-a716-446655440009', '369 Willow Ave', 'Dallas', 'TX', '75201', POINT(-96.7970, 32.7767)),
('550e8400-e29b-41d4-a716-446655440010', '741 Ash Blvd', 'San Jose', 'CA', '95101', POINT(-121.8863, 37.3382));

-- Insert sample users (admin user already exists from schema)
INSERT INTO users (id, email, first_name, last_name, role, phone_number, emergency_contact, is_active) VALUES
-- Scheduler user
('550e8400-e29b-41d4-a716-446655440012', 'scheduler@thinktanktech.com', 'Jane', 'Scheduler', 'scheduler', '555-0002', '{"name": "Emergency Contact", "phone": "555-0912", "relationship": "manager"}', true),

-- Lead technicians
('550e8400-e29b-41d4-a716-446655440013', 'john.lead@thinktanktech.com', 'John', 'Smith', 'lead', '555-0013', '{"name": "Mary Smith", "phone": "555-0913", "relationship": "spouse"}', true),
('550e8400-e29b-41d4-a716-446655440014', 'sarah.lead@thinktanktech.com', 'Sarah', 'Johnson', 'lead', '555-0014', '{"name": "Bob Johnson", "phone": "555-0914", "relationship": "spouse"}', true),
('550e8400-e29b-41d4-a716-446655440015', 'mike.lead@thinktanktech.com', 'Mike', 'Williams', 'lead', '555-0015', '{"name": "Lisa Williams", "phone": "555-0915", "relationship": "spouse"}', true),
('550e8400-e29b-41d4-a716-446655440016', 'emily.lead@thinktanktech.com', 'Emily', 'Brown', 'lead', '555-0016', '{"name": "David Brown", "phone": "555-0916", "relationship": "spouse"}', true),

-- Assistant technicians
('550e8400-e29b-41d4-a716-446655440017', 'alex.assistant@thinktanktech.com', 'Alex', 'Davis', 'assistant', '555-0017', '{"name": "Parent Davis", "phone": "555-0917", "relationship": "parent"}', true),
('550e8400-e29b-41d4-a716-446655440018', 'chris.assistant@thinktanktech.com', 'Chris', 'Miller', 'assistant', '555-0018', '{"name": "Parent Miller", "phone": "555-0918", "relationship": "parent"}', true),
('550e8400-e29b-41d4-a716-446655440019', 'taylor.assistant@thinktanktech.com', 'Taylor', 'Wilson', 'assistant', '555-0019', '{"name": "Parent Wilson", "phone": "555-0919", "relationship": "parent"}', true),
('550e8400-e29b-41d4-a716-446655440020', 'jordan.assistant@thinktanktech.com', 'Jordan', 'Moore', 'assistant', '555-0020', '{"name": "Parent Moore", "phone": "555-0920", "relationship": "parent"}', true);

-- Insert team members
INSERT INTO team_members (id, employee_id, region, sub_regions, specializations, capacity, travel_radius, home_base_id, hire_date, department, job_title, employment_type, employment_status) VALUES
-- Leads
('550e8400-e29b-41d4-a716-446655440013', 'EMP001', 'Northeast', ARRAY['New York', 'New Jersey'], ARRAY['Electrical', 'Network'], 6, 75, '550e8400-e29b-41d4-a716-446655440001', '2020-01-15', 'Installation', 'Senior Installation Lead', 'full_time', 'active'),
('550e8400-e29b-41d4-a716-446655440014', 'EMP002', 'West Coast', ARRAY['California', 'Nevada'], ARRAY['HVAC', 'Plumbing'], 8, 100, '550e8400-e29b-41d4-a716-446655440002', '2019-03-22', 'Installation', 'Installation Lead', 'full_time', 'active'),
('550e8400-e29b-41d4-a716-446655440015', 'EMP003', 'Midwest', ARRAY['Illinois', 'Wisconsin'], ARRAY['Electrical', 'HVAC'], 7, 80, '550e8400-e29b-41d4-a716-446655440003', '2021-06-10', 'Installation', 'Installation Lead', 'full_time', 'active'),
('550e8400-e29b-41d4-a716-446655440016', 'EMP004', 'South', ARRAY['Texas', 'Oklahoma'], ARRAY['Network', 'Security'], 5, 90, '550e8400-e29b-41d4-a716-446655440004', '2020-09-05', 'Installation', 'Senior Installation Lead', 'full_time', 'active'),

-- Assistants
('550e8400-e29b-41d4-a716-446655440017', 'EMP005', 'Northeast', ARRAY['New York'], ARRAY['General'], 8, 50, '550e8400-e29b-41d4-a716-446655440001', '2022-01-20', 'Installation', 'Installation Assistant', 'full_time', 'active'),
('550e8400-e29b-41d4-a716-446655440018', 'EMP006', 'West Coast', ARRAY['California'], ARRAY['General'], 8, 60, '550e8400-e29b-41d4-a716-446655440002', '2022-03-15', 'Installation', 'Installation Assistant', 'full_time', 'active'),
('550e8400-e29b-41d4-a716-446655440019', 'EMP007', 'Midwest', ARRAY['Illinois'], ARRAY['General'], 7, 55, '550e8400-e29b-41d4-a716-446655440003', '2022-05-10', 'Installation', 'Installation Assistant', 'full_time', 'active'),
('550e8400-e29b-41d4-a716-446655440020', 'EMP008', 'South', ARRAY['Texas'], ARRAY['General'], 8, 65, '550e8400-e29b-41d4-a716-446655440004', '2022-07-08', 'Installation', 'Installation Assistant', 'full_time', 'active');

-- Insert team member skills
INSERT INTO team_member_skills (team_member_id, skill_id, level, acquired_date) VALUES
-- John Smith (Lead) - Electrical and Network specialist
('550e8400-e29b-41d4-a716-446655440013', (SELECT id FROM skills WHERE name = 'Electrical Installation'), 'expert', '2020-02-01'),
('550e8400-e29b-41d4-a716-446655440013', (SELECT id FROM skills WHERE name = 'Network Cabling'), 'advanced', '2020-06-01'),
('550e8400-e29b-41d4-a716-446655440013', (SELECT id FROM skills WHERE name = 'Safety Protocols'), 'expert', '2020-01-15'),
('550e8400-e29b-41d4-a716-446655440013', (SELECT id FROM skills WHERE name = 'Customer Service'), 'advanced', '2020-04-01'),
('550e8400-e29b-41d4-a716-446655440013', (SELECT id FROM skills WHERE name = 'Project Management'), 'advanced', '2021-01-01'),

-- Sarah Johnson (Lead) - HVAC and Plumbing specialist
('550e8400-e29b-41d4-a716-446655440014', (SELECT id FROM skills WHERE name = 'HVAC'), 'expert', '2019-04-01'),
('550e8400-e29b-41d4-a716-446655440014', (SELECT id FROM skills WHERE name = 'Plumbing'), 'advanced', '2019-08-01'),
('550e8400-e29b-41d4-a716-446655440014', (SELECT id FROM skills WHERE name = 'Safety Protocols'), 'expert', '2019-03-22'),
('550e8400-e29b-41d4-a716-446655440014', (SELECT id FROM skills WHERE name = 'Customer Service'), 'expert', '2020-01-01'),
('550e8400-e29b-41d4-a716-446655440014', (SELECT id FROM skills WHERE name = 'Project Management'), 'intermediate', '2021-06-01'),

-- Mike Williams (Lead) - Electrical and HVAC
('550e8400-e29b-41d4-a716-446655440015', (SELECT id FROM skills WHERE name = 'Electrical Installation'), 'advanced', '2021-07-01'),
('550e8400-e29b-41d4-a716-446655440015', (SELECT id FROM skills WHERE name = 'HVAC'), 'intermediate', '2021-09-01'),
('550e8400-e29b-41d4-a716-446655440015', (SELECT id FROM skills WHERE name = 'Safety Protocols'), 'advanced', '2021-06-10'),
('550e8400-e29b-41d4-a716-446655440015', (SELECT id FROM skills WHERE name = 'Customer Service'), 'intermediate', '2021-10-01'),

-- Emily Brown (Lead) - Network and Security
('550e8400-e29b-41d4-a716-446655440016', (SELECT id FROM skills WHERE name = 'Network Cabling'), 'expert', '2020-10-01'),
('550e8400-e29b-41d4-a716-446655440016', (SELECT id FROM skills WHERE name = 'Safety Protocols'), 'advanced', '2020-09-05'),
('550e8400-e29b-41d4-a716-446655440016', (SELECT id FROM skills WHERE name = 'Customer Service'), 'advanced', '2021-02-01'),
('550e8400-e29b-41d4-a716-446655440016', (SELECT id FROM skills WHERE name = 'Equipment Operation'), 'advanced', '2021-04-01');

-- Insert sample certifications
INSERT INTO certifications (team_member_id, name, issuer, certification_number, issue_date, expiration_date, status) VALUES
('550e8400-e29b-41d4-a716-446655440013', 'Electrical Safety Certification', 'OSHA', 'OSH001-2023', '2023-01-15', '2026-01-15', 'active'),
('550e8400-e29b-41d4-a716-446655440013', 'Network Installation Certification', 'CompTIA', 'NET001-2022', '2022-06-01', '2025-06-01', 'active'),
('550e8400-e29b-41d4-a716-446655440014', 'HVAC Technician License', 'EPA', 'EPA608-2023', '2023-03-15', '2026-03-15', 'active'),
('550e8400-e29b-41d4-a716-446655440014', 'Plumbing License', 'State of CA', 'CA-PLM-2022', '2022-08-01', '2024-08-01', 'expiring_soon'),
('550e8400-e29b-41d4-a716-446655440015', 'Electrical License', 'State of IL', 'IL-ELC-2023', '2023-07-01', '2025-07-01', 'active'),
('550e8400-e29b-41d4-a716-446655440016', 'Network Security Certification', 'Cisco', 'CCNA-2023', '2023-02-01', '2026-02-01', 'active');

-- Insert sample equipment
INSERT INTO equipment (name, type, serial_number, assigned_to, assigned_date, status, condition) VALUES
('Installation Van #1', 'vehicle', 'VAN001-2022', '550e8400-e29b-41d4-a716-446655440013', '2022-01-15', 'assigned', 'good'),
('Installation Van #2', 'vehicle', 'VAN002-2022', '550e8400-e29b-41d4-a716-446655440014', '2022-02-01', 'assigned', 'excellent'),
('Installation Van #3', 'vehicle', 'VAN003-2023', '550e8400-e29b-41d4-a716-446655440015', '2023-01-10', 'assigned', 'excellent'),
('Installation Van #4', 'vehicle', 'VAN004-2023', '550e8400-e29b-41d4-a716-446655440016', '2023-03-15', 'assigned', 'good'),
('Electrical Tool Kit', 'tools', 'ETK001', '550e8400-e29b-41d4-a716-446655440013', '2022-01-15', 'assigned', 'good'),
('HVAC Tool Kit', 'tools', 'HTK001', '550e8400-e29b-41d4-a716-446655440014', '2022-02-01', 'assigned', 'good'),
('Network Testing Equipment', 'testing_equipment', 'NTE001', '550e8400-e29b-41d4-a716-446655440013', '2022-06-01', 'assigned', 'excellent'),
('Safety Equipment Set #1', 'safety_equipment', 'SES001', '550e8400-e29b-41d4-a716-446655440017', '2022-01-20', 'assigned', 'good'),
('Safety Equipment Set #2', 'safety_equipment', 'SES002', '550e8400-e29b-41d4-a716-446655440018', '2022-03-15', 'assigned', 'good'),
('Tablet Device #1', 'technology', 'TAB001', '550e8400-e29b-41d4-a716-446655440013', '2022-01-15', 'assigned', 'excellent');

-- Insert availability schedules (all team members available Monday-Friday, 8-5)
INSERT INTO availability (team_member_id, start_date, end_date, start_time, end_time, is_recurring, recurring_days, is_available) VALUES
('550e8400-e29b-41d4-a716-446655440013', '2024-01-01', '2024-12-31', '08:00', '17:00', true, ARRAY[1,2,3,4,5], true),
('550e8400-e29b-41d4-a716-446655440014', '2024-01-01', '2024-12-31', '08:00', '17:00', true, ARRAY[1,2,3,4,5], true),
('550e8400-e29b-41d4-a716-446655440015', '2024-01-01', '2024-12-31', '08:00', '17:00', true, ARRAY[1,2,3,4,5], true),
('550e8400-e29b-41d4-a716-446655440016', '2024-01-01', '2024-12-31', '07:00', '16:00', true, ARRAY[1,2,3,4,5], true),
('550e8400-e29b-41d4-a716-446655440017', '2024-01-01', '2024-12-31', '08:00', '17:00', true, ARRAY[1,2,3,4,5], true),
('550e8400-e29b-41d4-a716-446655440018', '2024-01-01', '2024-12-31', '08:00', '17:00', true, ARRAY[1,2,3,4,5], true),
('550e8400-e29b-41d4-a716-446655440019', '2024-01-01', '2024-12-31', '08:00', '17:00', true, ARRAY[1,2,3,4,5], true),
('550e8400-e29b-41d4-a716-446655440020', '2024-01-01', '2024-12-31', '08:00', '17:00', true, ARRAY[1,2,3,4,5], true);

-- Insert work preferences
INSERT INTO work_preferences (team_member_id, preferred_start_time, preferred_end_time, max_daily_jobs, max_weekly_hours, weekends_available, overtime_available, travel_preference) VALUES
('550e8400-e29b-41d4-a716-446655440013', '08:00', '17:00', 6, 40, false, true, 'regional'),
('550e8400-e29b-41d4-a716-446655440014', '08:00', '17:00', 8, 45, false, true, 'multi_state'),
('550e8400-e29b-41d4-a716-446655440015', '08:00', '17:00', 7, 40, false, false, 'regional'),
('550e8400-e29b-41d4-a716-446655440016', '07:00', '16:00', 5, 40, true, true, 'multi_state'),
('550e8400-e29b-41d4-a716-446655440017', '08:00', '17:00', 8, 40, false, false, 'local_only'),
('550e8400-e29b-41d4-a716-446655440018', '08:00', '17:00', 8, 40, false, false, 'local_only'),
('550e8400-e29b-41d4-a716-446655440019', '08:00', '17:00', 7, 40, false, false, 'local_only'),
('550e8400-e29b-41d4-a716-446655440020', '08:00', '17:00', 8, 40, false, false, 'local_only');

-- Insert team pairings
INSERT INTO team_pairings (lead_id, assistant_id, region, compatibility_score, pairing_date, total_jobs_completed, average_performance, status) VALUES
('550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440017', 'Northeast', 0.92, '2022-02-01', 87, 0.94, 'preferred'),
('550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440018', 'West Coast', 0.88, '2022-04-01', 134, 0.91, 'active'),
('550e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440019', 'Midwest', 0.85, '2022-06-01', 76, 0.89, 'active'),
('550e8400-e29b-41d4-a716-446655440016', '550e8400-e29b-41d4-a716-446655440020', 'South', 0.90, '2022-08-01', 92, 0.93, 'preferred');

-- Insert sample installations
INSERT INTO installations (id, job_id, store_number, customer_name, customer_phone, customer_email, address_id, scheduled_date, scheduled_time, duration, status, priority, installation_type, specifications, requirements, region, notes, lead_id, assistant_id, estimated_revenue) VALUES
('550e8400-e29b-41d4-a716-446655440021', 'JOB-2024-001', 'STORE-001', 'Starbucks Coffee Co.', '555-1001', 'manager@starbucks-001.com', '550e8400-e29b-41d4-a716-446655440001', '2024-01-15', '09:00', 240, 'completed', 'high', 'POS System Installation', ARRAY['Network cabling', 'Electrical outlets', 'Payment terminals'], 'Requires network certification', 'Northeast', 'High-profile client', '550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440017', 2500.00),

('550e8400-e29b-41d4-a716-446655440022', 'JOB-2024-002', 'STORE-002', 'McDonald''s Restaurant', '555-1002', 'manager@mcdonalds-002.com', '550e8400-e29b-41d4-a716-446655440002', '2024-01-16', '08:00', 300, 'completed', 'medium', 'Kitchen Equipment Installation', ARRAY['HVAC systems', 'Plumbing connections', 'Electrical work'], 'Health department compliance required', 'West Coast', 'Kitchen renovation project', '550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440018', 3200.00),

('550e8400-e29b-41d4-a716-446655440023', 'JOB-2024-003', 'STORE-003', 'Best Buy Electronics', '555-1003', 'manager@bestbuy-003.com', '550e8400-e29b-41d4-a716-446655440003', '2024-01-17', '10:00', 180, 'scheduled', 'high', 'Security System Installation', ARRAY['Camera systems', 'Access control', 'Network infrastructure'], 'Security clearance verification needed', 'Midwest', 'Corporate security upgrade', '550e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440019', 4500.00),

('550e8400-e29b-41d4-a716-446655440024', 'JOB-2024-004', 'STORE-004', 'Target Corporation', '555-1004', 'manager@target-004.com', '550e8400-e29b-41d4-a716-446655440004', '2024-01-18', '07:30', 360, 'in_progress', 'urgent', 'Complete Store Setup', ARRAY['All systems', 'Full network', 'HVAC', 'Security'], 'New store opening - all trades required', 'South', 'Grand opening in 2 weeks', '550e8400-e29b-41d4-a716-446655440016', '550e8400-e29b-41d4-a716-446655440020', 8500.00),

('550e8400-e29b-41d4-a716-446655440025', 'JOB-2024-005', 'STORE-005', 'Home Depot', '555-1005', 'manager@homedepot-005.com', '550e8400-e29b-41d4-a716-446655440005', '2024-01-19', '09:30', 240, 'pending', 'medium', 'Tool Rental System', ARRAY['Network setup', 'Equipment installation', 'Training systems'], 'Coordination with IT department required', 'Southwest', 'Expansion of rental department', '550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440018', 3800.00),

('550e8400-e29b-41d4-a716-446655440026', 'JOB-2024-006', 'STORE-006', 'Walmart Supercenter', '555-1006', 'manager@walmart-006.com', '550e8400-e29b-41d4-a716-446655440006', '2024-01-20', '08:00', 420, 'scheduled', 'high', 'Grocery Department Upgrade', ARRAY['Refrigeration systems', 'POS integration', 'Inventory systems'], 'Food safety compliance critical', 'Northeast', 'Overnight work may be required', '550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440017', 6200.00);

-- Insert assignments for the installations
INSERT INTO assignments (installation_id, lead_id, assistant_id, assigned_by, status, estimated_travel_time, estimated_travel_distance, workload_score, efficiency_score) VALUES
('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440012', 'completed', 45, 23.5, 0.85, 0.92),
('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440018', '550e8400-e29b-41d4-a716-446655440012', 'completed', 60, 35.2, 0.78, 0.88),
('550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440019', '550e8400-e29b-41d4-a716-446655440012', 'accepted', 30, 18.7, 0.92, 0.95),
('550e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440016', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440012', 'accepted', 75, 42.8, 0.68, 0.82),
('550e8400-e29b-41d4-a716-446655440025', '550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440018', '550e8400-e29b-41d4-a716-446655440012', 'assigned', 90, 55.3, 0.72, 0.78),
('550e8400-e29b-41d4-a716-446655440026', '550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440012', 'assigned', 120, 67.4, 0.65, 0.75);

-- Insert sample performance metrics
INSERT INTO performance_metrics (team_member_id, period_start, period_end, completion_rate, average_time, customer_satisfaction, travel_efficiency, total_jobs, total_distance, quality_score, safety_score, punctuality_score, communication_score, revenue_generated, overtime_hours) VALUES
('550e8400-e29b-41d4-a716-446655440013', '2023-12-01', '2023-12-31', 0.94, 235.5, 4.6, 0.87, 18, 423.8, 4.7, 4.9, 4.8, 4.5, 32500.00, 12.5),
('550e8400-e29b-41d4-a716-446655440014', '2023-12-01', '2023-12-31', 0.91, 278.2, 4.4, 0.82, 22, 587.3, 4.4, 4.8, 4.6, 4.3, 41200.00, 18.0),
('550e8400-e29b-41d4-a716-446655440015', '2023-12-01', '2023-12-31', 0.89, 245.8, 4.3, 0.85, 16, 378.5, 4.2, 4.7, 4.4, 4.1, 28800.00, 8.5),
('550e8400-e29b-41d4-a716-446655440016', '2023-12-01', '2023-12-31', 0.93, 298.4, 4.7, 0.79, 14, 612.7, 4.8, 4.9, 4.9, 4.6, 38500.00, 22.0),
('550e8400-e29b-41d4-a716-446655440017', '2023-12-01', '2023-12-31', 0.96, 185.3, 4.5, 0.91, 18, 423.8, 4.4, 4.8, 4.7, 4.2, 0.00, 5.0),
('550e8400-e29b-41d4-a716-446655440018', '2023-12-01', '2023-12-31', 0.93, 195.7, 4.3, 0.88, 22, 587.3, 4.3, 4.7, 4.5, 4.1, 0.00, 8.5),
('550e8400-e29b-41d4-a716-446655440019', '2023-12-01', '2023-12-31', 0.91, 178.9, 4.2, 0.89, 16, 378.5, 4.1, 4.6, 4.3, 4.0, 0.00, 3.0),
('550e8400-e29b-41d4-a716-446655440020', '2023-12-01', '2023-12-31', 0.94, 205.6, 4.4, 0.86, 14, 612.7, 4.3, 4.8, 4.6, 4.2, 0.00, 12.5);

-- Insert sample schedules
INSERT INTO schedules (date, team_member_id, total_installations, completed_installations, total_travel_distance, total_travel_time, utilization_rate) VALUES
('2024-01-15', '550e8400-e29b-41d4-a716-446655440013', 1, 1, 23.5, 45, 0.85),
('2024-01-16', '550e8400-e29b-41d4-a716-446655440014', 1, 1, 35.2, 60, 0.92),
('2024-01-17', '550e8400-e29b-41d4-a716-446655440015', 1, 0, 18.7, 30, 0.75),
('2024-01-18', '550e8400-e29b-41d4-a716-446655440016', 1, 0, 42.8, 75, 0.95),
('2024-01-19', '550e8400-e29b-41d4-a716-446655440014', 1, 0, 55.3, 90, 0.88),
('2024-01-20', '550e8400-e29b-41d4-a716-446655440013', 1, 0, 67.4, 120, 0.93);

-- Insert communication preferences
INSERT INTO communication_preferences (user_id, email_frequency, preferred_formats, notification_types, language, timezone) VALUES
('00000000-0000-0000-0000-000000000001', 'immediate', ARRAY['pdf', 'html']::report_format[], ARRAY['system_alerts', 'admin_messages']::notification_type[], 'en', 'America/New_York'),
('550e8400-e29b-41d4-a716-446655440012', 'daily', ARRAY['pdf', 'excel']::report_format[], ARRAY['assignment_updates', 'schedule_changes', 'performance_reports']::notification_type[], 'en', 'America/New_York'),
('550e8400-e29b-41d4-a716-446655440013', 'daily', ARRAY['pdf']::report_format[], ARRAY['assignment_updates', 'schedule_changes']::notification_type[], 'en', 'America/New_York'),
('550e8400-e29b-41d4-a716-446655440014', 'weekly', ARRAY['pdf']::report_format[], ARRAY['assignment_updates', 'performance_reports']::notification_type[], 'en', 'America/Los_Angeles'),
('550e8400-e29b-41d4-a716-446655440015', 'daily', ARRAY['pdf']::report_format[], ARRAY['assignment_updates', 'schedule_changes']::notification_type[], 'en', 'America/Chicago'),
('550e8400-e29b-41d4-a716-446655440016', 'daily', ARRAY['pdf', 'excel']::report_format[], ARRAY['assignment_updates', 'schedule_changes', 'performance_reports']::notification_type[], 'en', 'America/Chicago');

-- Insert additional email templates
INSERT INTO email_templates (name, type, subject, body_html, body_plain, variables, target_audience, created_by) VALUES
('Schedule Update', 'schedule_update', 'Schedule Update for {{date}}', 
 '<h2>Schedule Update</h2><p>Your schedule for {{date}} has been updated.</p><p><strong>Total Jobs:</strong> {{total_jobs}}<br><strong>Estimated Travel:</strong> {{travel_time}} minutes</p>',
 'Schedule Update\n\nYour schedule for {{date}} has been updated.\n\nTotal Jobs: {{total_jobs}}\nEstimated Travel: {{travel_time}} minutes',
 '[{"name": "date", "type": "date", "required": true}, {"name": "total_jobs", "type": "number", "required": true}, {"name": "travel_time", "type": "number", "required": true}]',
 ARRAY['lead', 'assistant']::user_role[],
 '00000000-0000-0000-0000-000000000001'),

('Performance Report', 'performance_report', 'Monthly Performance Report - {{month}} {{year}}',
 '<h2>Performance Report</h2><p>Your performance for {{month}} {{year}}:</p><ul><li>Completion Rate: {{completion_rate}}%</li><li>Customer Satisfaction: {{satisfaction}}/5</li><li>Total Jobs: {{total_jobs}}</li></ul>',
 'Performance Report\n\nYour performance for {{month}} {{year}}:\n- Completion Rate: {{completion_rate}}%\n- Customer Satisfaction: {{satisfaction}}/5\n- Total Jobs: {{total_jobs}}',
 '[{"name": "month", "type": "string", "required": true}, {"name": "year", "type": "string", "required": true}, {"name": "completion_rate", "type": "number", "required": true}, {"name": "satisfaction", "type": "number", "required": true}, {"name": "total_jobs", "type": "number", "required": true}]',
 ARRAY['lead', 'assistant']::user_role[],
 '00000000-0000-0000-0000-000000000001');

-- Insert sample PDF templates
INSERT INTO pdf_templates (name, type, description, layout, components, variables, styling, created_by) VALUES
('Installation Schedule Report', 'installation_schedule', 'Daily/weekly installation schedule for team members',
 '{"pageSize": "A4", "orientation": "portrait", "margins": {"top": 50, "right": 50, "bottom": 50, "left": 50}}',
 '[{"id": "header", "type": "header", "content": "Think Tank Technologies - Installation Schedule"}, {"id": "schedule_table", "type": "table", "content": "schedule_data"}]',
 '[{"name": "schedule_data", "type": "array", "required": true}, {"name": "date_range", "type": "string", "required": true}, {"name": "team_member", "type": "string", "required": true}]',
 '{"fontFamily": "Arial", "fontSize": 12, "primaryColor": "#1e40af", "secondaryColor": "#64748b", "brandColors": {"primary": "#1e40af", "secondary": "#64748b", "accent": "#f59e0b"}}',
 '00000000-0000-0000-0000-000000000001'),

('Team Performance Dashboard', 'team_performance', 'Comprehensive team performance metrics and analytics',
 '{"pageSize": "A4", "orientation": "landscape", "margins": {"top": 40, "right": 40, "bottom": 40, "left": 40}}',
 '[{"id": "title", "type": "header", "content": "Team Performance Dashboard"}, {"id": "metrics_chart", "type": "chart", "content": "performance_data"}, {"id": "summary_table", "type": "table", "content": "summary_data"}]',
 '[{"name": "performance_data", "type": "array", "required": true}, {"name": "summary_data", "type": "array", "required": true}, {"name": "period", "type": "string", "required": true}]',
 '{"fontFamily": "Arial", "fontSize": 11, "primaryColor": "#1e40af", "secondaryColor": "#64748b", "brandColors": {"primary": "#1e40af", "secondary": "#64748b", "accent": "#f59e0b"}}',
 '00000000-0000-0000-0000-000000000001');

-- Re-enable triggers
SET session_replication_role = DEFAULT;

-- Create some sample distance matrix entries for optimization
INSERT INTO distance_matrix (from_address_id, to_address_id, distance, duration) VALUES
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 2789.5, 2580), -- NY to LA
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 790.2, 750), -- NY to Chicago
('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440004', 1082.8, 1020), -- Chicago to Houston
('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440005', 1015.7, 945), -- Houston to Phoenix
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440008', 120.3, 135); -- LA to San Diego

-- Insert sample training records
INSERT INTO training_records (team_member_id, course_name, provider, completed_date, expiration_date, score, hours_completed, renewal_required) VALUES
('550e8400-e29b-41d4-a716-446655440013', 'Advanced Electrical Safety', 'OSHA Training Institute', '2023-06-15', '2026-06-15', 95.5, 8.0, true),
('550e8400-e29b-41d4-a716-446655440014', 'HVAC Systems Certification', 'NATE Certification', '2023-04-20', '2025-04-20', 88.0, 16.0, true),
('550e8400-e29b-41d4-a716-446655440015', 'Project Management Fundamentals', 'PMI', '2023-08-10', NULL, 92.0, 24.0, false),
('550e8400-e29b-41d4-a716-446655440016', 'Network Security Best Practices', 'Cisco Learning Network', '2023-05-25', '2025-05-25', 91.5, 12.0, true);

-- Sample data processing results (simulating uploaded files)
INSERT INTO data_processing_results (file_name, file_size, file_type, total_rows, valid_rows, error_rows, warning_rows, valid_data, errors, warnings, metadata, processed_by) VALUES
('starbucks_installations_q1_2024.xlsx', 2048576, 'application/excel', 150, 147, 2, 1, 
 '[{"job_id": "SB-2024-001", "customer_name": "Starbucks #1234", "address": "123 Main St, Anytown, ST 12345", "install_date": "2024-02-15"}]',
 '[{"row": 45, "column": "install_date", "message": "Invalid date format", "severity": "error"}]',
 '[{"row": 89, "column": "phone_number", "message": "Phone number format may be incorrect", "severity": "warning"}]',
 '{"regions_detected": ["Northeast", "Southeast"], "installation_types": ["POS System", "Network Upgrade"], "date_range": {"start": "2024-01-15", "end": "2024-03-30"}}',
 '550e8400-e29b-41d4-a716-446655440012');

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;