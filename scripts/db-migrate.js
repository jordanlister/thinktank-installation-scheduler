#!/usr/bin/env node

/**
 * Think Tank Technologies Installation Scheduler - Database Migration Script
 * This script handles database migrations and seeding for local development
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Logging functions
const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  migration: (msg) => console.log(`${colors.magenta}[MIGRATION]${colors.reset} ${msg}`),
  seed: (msg) => console.log(`${colors.cyan}[SEED]${colors.reset} ${msg}`),
};

// Database client
let supabase;

// Initialize Supabase client
function initializeSupabase() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    log.error('Missing Supabase configuration. Please check your .env file.');
    process.exit(1);
  }

  supabase = createClient(supabaseUrl, supabaseKey);
  log.info('Supabase client initialized');
}

// Database schema definitions
const schemas = {
  // Installations table
  installations: `
    CREATE TABLE IF NOT EXISTS installations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      customer_name VARCHAR(255) NOT NULL,
      customer_email VARCHAR(255),
      customer_phone VARCHAR(50),
      address TEXT NOT NULL,
      city VARCHAR(100) NOT NULL,
      state VARCHAR(50) NOT NULL,
      zip_code VARCHAR(20) NOT NULL,
      coordinates JSONB,
      installation_type VARCHAR(100) NOT NULL,
      equipment_needed TEXT[],
      priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
      status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'rescheduled')),
      scheduled_date TIMESTAMP WITH TIME ZONE,
      estimated_duration INTEGER, -- in hours
      actual_duration INTEGER, -- in hours
      assigned_technician_id UUID,
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `,

  // Team members table
  team_members: `
    CREATE TABLE IF NOT EXISTS team_members (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      phone VARCHAR(50),
      role VARCHAR(100) NOT NULL,
      skills TEXT[],
      hire_date DATE,
      status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave')),
      location JSONB,
      availability JSONB,
      max_daily_hours INTEGER DEFAULT 8,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `,

  // Schedules table
  schedules: `
    CREATE TABLE IF NOT EXISTS schedules (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      date DATE NOT NULL,
      technician_id UUID NOT NULL REFERENCES team_members(id),
      installation_id UUID NOT NULL REFERENCES installations(id),
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
      travel_time INTEGER, -- in minutes
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(technician_id, date, start_time)
    );
  `,

  // Reports table
  reports: `
    CREATE TABLE IF NOT EXISTS reports (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      installation_id UUID NOT NULL REFERENCES installations(id),
      technician_id UUID NOT NULL REFERENCES team_members(id),
      report_type VARCHAR(50) NOT NULL,
      data JSONB NOT NULL,
      file_path TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `,

  // Optimization metrics table
  optimization_metrics: `
    CREATE TABLE IF NOT EXISTS optimization_metrics (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      date DATE NOT NULL,
      metric_type VARCHAR(50) NOT NULL,
      value DECIMAL(10,2) NOT NULL,
      unit VARCHAR(20),
      context JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `,
};

// Indexes for better performance
const indexes = [
  'CREATE INDEX IF NOT EXISTS idx_installations_status ON installations(status);',
  'CREATE INDEX IF NOT EXISTS idx_installations_scheduled_date ON installations(scheduled_date);',
  'CREATE INDEX IF NOT EXISTS idx_installations_assigned_technician ON installations(assigned_technician_id);',
  'CREATE INDEX IF NOT EXISTS idx_team_members_status ON team_members(status);',
  'CREATE INDEX IF NOT EXISTS idx_team_members_role ON team_members(role);',
  'CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(date);',
  'CREATE INDEX IF NOT EXISTS idx_schedules_technician ON schedules(technician_id);',
  'CREATE INDEX IF NOT EXISTS idx_schedules_installation ON schedules(installation_id);',
  'CREATE INDEX IF NOT EXISTS idx_reports_installation ON reports(installation_id);',
  'CREATE INDEX IF NOT EXISTS idx_reports_technician ON reports(technician_id);',
  'CREATE INDEX IF NOT EXISTS idx_optimization_metrics_date ON optimization_metrics(date);',
];

// Seed data
const seedData = {
  teamMembers: [
    {
      name: 'John Smith',
      email: 'john.smith@thinktanktech.com',
      phone: '555-0101',
      role: 'Senior Technician',
      skills: ['networking', 'cable_installation', 'troubleshooting', 'fiber_optics'],
      hire_date: '2023-01-15',
      location: { lat: 40.7128, lng: -74.0060 },
      availability: {
        monday: { start: '08:00', end: '17:00' },
        tuesday: { start: '08:00', end: '17:00' },
        wednesday: { start: '08:00', end: '17:00' },
        thursday: { start: '08:00', end: '17:00' },
        friday: { start: '08:00', end: '17:00' },
      },
    },
    {
      name: 'Sarah Johnson',
      email: 'sarah.johnson@thinktanktech.com',
      phone: '555-0102',
      role: 'Technician',
      skills: ['networking', 'installation', 'customer_service'],
      hire_date: '2023-03-10',
      location: { lat: 40.7589, lng: -73.9851 },
      availability: {
        monday: { start: '09:00', end: '18:00' },
        tuesday: { start: '09:00', end: '18:00' },
        wednesday: { start: '09:00', end: '18:00' },
        thursday: { start: '09:00', end: '18:00' },
        friday: { start: '09:00', end: '16:00' },
      },
    },
    {
      name: 'Mike Davis',
      email: 'mike.davis@thinktanktech.com',
      phone: '555-0103',
      role: 'Lead Technician',
      skills: ['networking', 'project_management', 'training', 'advanced_troubleshooting'],
      hire_date: '2022-08-20',
      location: { lat: 40.6892, lng: -74.0445 },
      availability: {
        monday: { start: '07:00', end: '16:00' },
        tuesday: { start: '07:00', end: '16:00' },
        wednesday: { start: '07:00', end: '16:00' },
        thursday: { start: '07:00', end: '16:00' },
        friday: { start: '07:00', end: '15:00' },
      },
    },
  ],

  installations: [
    {
      customer_name: 'Acme Corporation',
      customer_email: 'it@acme.com',
      customer_phone: '555-1001',
      address: '123 Business Ave',
      city: 'New York',
      state: 'NY',
      zip_code: '10001',
      coordinates: { lat: 40.7505, lng: -73.9934 },
      installation_type: 'Enterprise Network',
      equipment_needed: ['Router', 'Switch', 'Access Points', 'Cables'],
      priority: 'high',
      status: 'scheduled',
      scheduled_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      estimated_duration: 4,
      notes: 'Large office installation requiring multiple access points',
    },
    {
      customer_name: 'Local Coffee Shop',
      customer_email: 'manager@coffeeshop.com',
      customer_phone: '555-1002',
      address: '456 Main Street',
      city: 'Brooklyn',
      state: 'NY',
      zip_code: '11201',
      coordinates: { lat: 40.6928, lng: -73.9903 },
      installation_type: 'Small Business',
      equipment_needed: ['Router', 'WiFi Extender'],
      priority: 'medium',
      status: 'scheduled',
      scheduled_date: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      estimated_duration: 2,
      notes: 'Simple WiFi setup for customer area',
    },
    {
      customer_name: 'Tech Startup Inc',
      customer_email: 'ops@techstartup.com',
      customer_phone: '555-1003',
      address: '789 Innovation Blvd',
      city: 'Manhattan',
      state: 'NY',
      zip_code: '10002',
      coordinates: { lat: 40.7180, lng: -74.0020 },
      installation_type: 'Startup Office',
      equipment_needed: ['Managed Switch', 'Firewall', 'Access Points', 'Server Rack'],
      priority: 'urgent',
      status: 'scheduled',
      scheduled_date: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
      estimated_duration: 6,
      notes: 'Complete office network setup with security requirements',
    },
  ],
};

// Migration functions
async function runMigrations() {
  log.migration('Starting database migrations...');

  try {
    // Create tables
    for (const [tableName, schema] of Object.entries(schemas)) {
      log.migration(`Creating table: ${tableName}`);
      const { error } = await supabase.rpc('execute_sql', { sql: schema });
      
      if (error) {
        log.error(`Failed to create table ${tableName}: ${error.message}`);
      } else {
        log.success(`Table ${tableName} created successfully`);
      }
    }

    // Create indexes
    log.migration('Creating indexes...');
    for (const index of indexes) {
      const { error } = await supabase.rpc('execute_sql', { sql: index });
      
      if (error) {
        log.warning(`Index creation warning: ${error.message}`);
      }
    }

    log.success('Database migrations completed successfully');
  } catch (error) {
    log.error(`Migration failed: ${error.message}`);
    throw error;
  }
}

// Seeding functions
async function seedDatabase() {
  log.seed('Starting database seeding...');

  try {
    // Seed team members
    log.seed('Seeding team members...');
    const { error: teamError } = await supabase
      .from('team_members')
      .upsert(seedData.teamMembers, { onConflict: 'email' });
    
    if (teamError) {
      log.error(`Failed to seed team members: ${teamError.message}`);
    } else {
      log.success(`Seeded ${seedData.teamMembers.length} team members`);
    }

    // Get team member IDs for assignments
    const { data: teamMembers } = await supabase
      .from('team_members')
      .select('id, email');

    // Assign technicians to installations
    const installationsWithTechnicians = seedData.installations.map((installation, index) => ({
      ...installation,
      assigned_technician_id: teamMembers[index % teamMembers.length]?.id,
    }));

    // Seed installations
    log.seed('Seeding installations...');
    const { error: installError } = await supabase
      .from('installations')
      .upsert(installationsWithTechnicians);
    
    if (installError) {
      log.error(`Failed to seed installations: ${installError.message}`);
    } else {
      log.success(`Seeded ${installationsWithTechnicians.length} installations`);
    }

    log.success('Database seeding completed successfully');
  } catch (error) {
    log.error(`Seeding failed: ${error.message}`);
    throw error;
  }
}

// Utility functions
async function resetDatabase() {
  log.warning('Resetting database (this will delete all data)...');

  const tables = ['schedules', 'reports', 'optimization_metrics', 'installations', 'team_members'];

  for (const table of tables) {
    log.warning(`Dropping table: ${table}`);
    const { error } = await supabase.rpc('execute_sql', { 
      sql: `DROP TABLE IF EXISTS ${table} CASCADE;` 
    });
    
    if (error) {
      log.error(`Failed to drop table ${table}: ${error.message}`);
    }
  }

  log.success('Database reset completed');
}

async function checkConnection() {
  log.info('Checking database connection...');

  try {
    const { data, error } = await supabase
      .from('team_members')
      .select('count')
      .limit(1);

    if (error) {
      log.error(`Connection failed: ${error.message}`);
      return false;
    }

    log.success('Database connection successful');
    return true;
  } catch (error) {
    log.error(`Connection error: ${error.message}`);
    return false;
  }
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';

  console.log('====================================');
  console.log('🗄️  Database Migration Tool');
  console.log('====================================\n');

  initializeSupabase();

  switch (command) {
    case 'migrate':
      await runMigrations();
      break;

    case 'seed':
      await seedDatabase();
      break;

    case 'setup':
      await runMigrations();
      await seedDatabase();
      break;

    case 'reset':
      await resetDatabase();
      break;

    case 'check':
      await checkConnection();
      break;

    case 'help':
    default:
      console.log('Available commands:');
      console.log('  migrate  - Run database migrations');
      console.log('  seed     - Seed database with sample data');
      console.log('  setup    - Run migrations and seed data');
      console.log('  reset    - Reset database (WARNING: deletes all data)');
      console.log('  check    - Check database connection');
      console.log('  help     - Show this help message');
      break;
  }
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    log.error(`Script failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  runMigrations,
  seedDatabase,
  resetDatabase,
  checkConnection,
};