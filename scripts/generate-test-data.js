#!/usr/bin/env node

/**
 * Think Tank Technologies Installation Scheduler - Test Data Generator
 * This script generates realistic test data for development and testing
 */

const fs = require('fs');
const path = require('path');

// Configuration
const OUTPUT_DIR = './test-data';
const CUSTOMER_NAMES = [
  'Acme Corporation', 'Global Tech Solutions', 'Metro Business Center', 'Downtown Coffee Co',
  'Riverside Medical Group', 'Sunset Restaurant', 'City Law Firm', 'Innovation Hub',
  'Family Dental Care', 'Neighborhood Market', 'Elite Fitness Center', 'Creative Studios',
  'Pacific Real Estate', 'Mountain View Clinic', 'Garden Center Inc', 'Precision Manufacturing',
  'Coastal Insurance', 'Urban Planning Group', 'Bright Future Academy', 'Green Energy Solutions'
];

const ADDRESSES = [
  { street: '123 Main St', city: 'New York', state: 'NY', zip: '10001' },
  { street: '456 Broadway', city: 'New York', state: 'NY', zip: '10002' },
  { street: '789 Fifth Ave', city: 'New York', state: 'NY', zip: '10003' },
  { street: '321 Park Ave', city: 'New York', state: 'NY', zip: '10004' },
  { street: '654 Wall St', city: 'New York', state: 'NY', zip: '10005' },
  { street: '987 Madison Ave', city: 'New York', state: 'NY', zip: '10006' },
  { street: '147 Lexington Ave', city: 'New York', state: 'NY', zip: '10007' },
  { street: '258 3rd Ave', city: 'Brooklyn', state: 'NY', zip: '11201' },
  { street: '369 Atlantic Ave', city: 'Brooklyn', state: 'NY', zip: '11202' },
  { street: '741 Flatbush Ave', city: 'Brooklyn', state: 'NY', zip: '11203' },
  { street: '852 Court St', city: 'Brooklyn', state: 'NY', zip: '11204' },
  { street: '963 Smith St', city: 'Brooklyn', state: 'NY', zip: '11205' },
  { street: '159 Northern Blvd', city: 'Queens', state: 'NY', zip: '11301' },
  { street: '357 Queens Blvd', city: 'Queens', state: 'NY', zip: '11302' },
  { street: '486 Roosevelt Ave', city: 'Queens', state: 'NY', zip: '11303' }
];

const INSTALLATION_TYPES = [
  'Small Business Network', 'Enterprise Network', 'Retail POS System',
  'Restaurant WiFi', 'Medical Office Network', 'Educational Network',
  'Home Office', 'Warehouse Network', 'Manufacturing Network',
  'Coworking Space WiFi'
];

const EQUIPMENT_OPTIONS = [
  ['Router', 'Modem'],
  ['Router', 'Switch', 'Access Points'],
  ['Firewall', 'Managed Switch', 'WiFi Controller'],
  ['POS Terminal', 'Receipt Printer', 'Cash Drawer'],
  ['Server Rack', 'UPS', 'Patch Panel'],
  ['WiFi Extenders', 'Mesh System'],
  ['Security Camera System', 'NVR'],
  ['Fiber Optic Equipment', 'Media Converters']
];

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const STATUSES = ['scheduled', 'in_progress', 'completed', 'cancelled', 'rescheduled'];

const TECHNICIAN_NAMES = [
  'John Smith', 'Sarah Johnson', 'Mike Davis', 'Emily Brown', 'David Wilson',
  'Lisa Anderson', 'Chris Taylor', 'Jessica Martinez', 'Ryan Thompson', 'Amanda White'
];

const SKILLS = [
  'networking', 'cable_installation', 'troubleshooting', 'fiber_optics',
  'wireless_systems', 'security_systems', 'voip', 'project_management',
  'customer_service', 'advanced_diagnostics'
];

// Utility functions
function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomChoices(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function randomDate(daysFromNow = 30) {
  const now = new Date();
  const futureDate = new Date(now.getTime() + Math.random() * daysFromNow * 24 * 60 * 60 * 1000);
  return futureDate.toISOString();
}

function randomPastDate(daysAgo = 90) {
  const now = new Date();
  const pastDate = new Date(now.getTime() - Math.random() * daysAgo * 24 * 60 * 60 * 1000);
  return pastDate.toISOString().split('T')[0];
}

function generateCoordinates(baseAddr) {
  // Generate coordinates around NYC area
  const baseLat = 40.7128;
  const baseLng = -74.0060;
  const lat = baseLat + (Math.random() - 0.5) * 0.2; // ~10 mile radius
  const lng = baseLng + (Math.random() - 0.5) * 0.2;
  return { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
}

function generatePhoneNumber() {
  const area = Math.floor(Math.random() * 900) + 100;
  const exchange = Math.floor(Math.random() * 900) + 100;
  const number = Math.floor(Math.random() * 9000) + 1000;
  return `${area}-${exchange}-${number}`;
}

function generateEmail(name, company) {
  const firstName = name.split(' ')[0].toLowerCase();
  const domain = company.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';
  return `${firstName}@${domain}`;
}

// Data generators
function generateTeamMembers(count = 10) {
  const teamMembers = [];
  
  for (let i = 0; i < count; i++) {
    const name = randomChoice(TECHNICIAN_NAMES);
    const email = `${name.toLowerCase().replace(' ', '.')}@thinktanktech.com`;
    const roles = ['Technician', 'Senior Technician', 'Lead Technician', 'Network Specialist'];
    
    teamMembers.push({
      name,
      email,
      phone: generatePhoneNumber(),
      role: randomChoice(roles),
      skills: randomChoices(SKILLS, Math.floor(Math.random() * 5) + 2),
      hire_date: randomPastDate(365),
      status: Math.random() > 0.1 ? 'active' : randomChoice(['inactive', 'on_leave']),
      location: generateCoordinates(),
      availability: {
        monday: { start: '08:00', end: '17:00' },
        tuesday: { start: '08:00', end: '17:00' },
        wednesday: { start: '08:00', end: '17:00' },
        thursday: { start: '08:00', end: '17:00' },
        friday: { start: '08:00', end: '16:00' }
      },
      max_daily_hours: 8
    });
  }
  
  return teamMembers;
}

function generateInstallations(count = 50) {
  const installations = [];
  
  for (let i = 0; i < count; i++) {
    const customerName = randomChoice(CUSTOMER_NAMES);
    const address = randomChoice(ADDRESSES);
    const installationType = randomChoice(INSTALLATION_TYPES);
    
    installations.push({
      customer_name: customerName,
      customer_email: generateEmail(customerName.split(' ')[0], customerName),
      customer_phone: generatePhoneNumber(),
      address: address.street,
      city: address.city,
      state: address.state,
      zip_code: address.zip,
      coordinates: generateCoordinates(address),
      installation_type: installationType,
      equipment_needed: randomChoice(EQUIPMENT_OPTIONS),
      priority: randomChoice(PRIORITIES),
      status: randomChoice(STATUSES),
      scheduled_date: randomDate(60),
      estimated_duration: Math.floor(Math.random() * 6) + 1,
      actual_duration: Math.random() > 0.5 ? Math.floor(Math.random() * 6) + 1 : null,
      notes: `${installationType} installation for ${customerName}. ${randomChoice([
        'Standard installation procedures.',
        'Customer requires after-hours installation.',
        'Multiple floors - expect longer installation time.',
        'Existing infrastructure needs assessment.',
        'Priority customer - ensure quality service.'
      ])}`
    });
  }
  
  return installations;
}

function generateSchedules(installations, teamMembers, count = 75) {
  const schedules = [];
  
  for (let i = 0; i < count; i++) {
    const installation = randomChoice(installations);
    const technician = randomChoice(teamMembers);
    const date = new Date();
    date.setDate(date.getDate() + Math.floor(Math.random() * 30));
    
    const startHour = Math.floor(Math.random() * 8) + 8; // 8 AM to 4 PM
    const duration = Math.floor(Math.random() * 4) + 1; // 1 to 4 hours
    
    schedules.push({
      date: date.toISOString().split('T')[0],
      technician_id: technician.id || `tech-${Math.random().toString(36).substr(2, 9)}`,
      installation_id: installation.id || `inst-${Math.random().toString(36).substr(2, 9)}`,
      start_time: `${startHour.toString().padStart(2, '0')}:00`,
      end_time: `${(startHour + duration).toString().padStart(2, '0')}:00`,
      status: randomChoice(['scheduled', 'in_progress', 'completed', 'cancelled']),
      travel_time: Math.floor(Math.random() * 45) + 15, // 15-60 minutes
      notes: randomChoice([
        'Regular installation appointment',
        'Follow-up visit required',
        'Customer requested morning appointment',
        'Equipment delivery included',
        'Site survey completed previously'
      ])
    });
  }
  
  return schedules;
}

function generateReports(installations, teamMembers, count = 30) {
  const reports = [];
  const reportTypes = ['Installation Report', 'Service Report', 'Maintenance Report', 'Site Survey'];
  
  for (let i = 0; i < count; i++) {
    const installation = randomChoice(installations);
    const technician = randomChoice(teamMembers);
    const reportType = randomChoice(reportTypes);
    
    reports.push({
      installation_id: installation.id || `inst-${Math.random().toString(36).substr(2, 9)}`,
      technician_id: technician.id || `tech-${Math.random().toString(36).substr(2, 9)}`,
      report_type: reportType,
      data: {
        duration: Math.floor(Math.random() * 6) + 1,
        equipment_installed: randomChoice(EQUIPMENT_OPTIONS),
        issues_encountered: Math.random() > 0.7 ? [
          randomChoice([
            'Wiring complications', 'Power outlet issues', 'Signal interference',
            'Customer requirements change', 'Equipment compatibility'
          ])
        ] : [],
        customer_satisfaction: Math.floor(Math.random() * 3) + 3, // 3-5 rating
        additional_work_needed: Math.random() > 0.8
      },
      file_path: `reports/${reportType.replace(' ', '_').toLowerCase()}_${Date.now()}.pdf`
    });
  }
  
  return reports;
}

function generateOptimizationMetrics(days = 30) {
  const metrics = [];
  const metricTypes = [
    'daily_utilization', 'travel_efficiency', 'completion_rate',
    'customer_satisfaction', 'equipment_usage', 'technician_productivity'
  ];
  
  for (let day = 0; day < days; day++) {
    const date = new Date();
    date.setDate(date.getDate() - day);
    
    metricTypes.forEach(metricType => {
      let value, unit;
      
      switch (metricType) {
        case 'daily_utilization':
          value = (Math.random() * 0.4 + 0.6) * 100; // 60-100%
          unit = 'percentage';
          break;
        case 'travel_efficiency':
          value = Math.random() * 30 + 20; // 20-50 minutes average
          unit = 'minutes';
          break;
        case 'completion_rate':
          value = (Math.random() * 0.2 + 0.8) * 100; // 80-100%
          unit = 'percentage';
          break;
        case 'customer_satisfaction':
          value = Math.random() * 2 + 3; // 3-5 rating
          unit = 'rating';
          break;
        case 'equipment_usage':
          value = Math.random() * 50 + 10; // 10-60 items
          unit = 'count';
          break;
        case 'technician_productivity':
          value = Math.random() * 3 + 2; // 2-5 jobs per day
          unit = 'jobs_per_day';
          break;
      }
      
      metrics.push({
        date: date.toISOString().split('T')[0],
        metric_type: metricType,
        value: Number(value.toFixed(2)),
        unit,
        context: {
          generated: true,
          random_seed: Math.random()
        }
      });
    });
  }
  
  return metrics;
}

// CSV generation functions
function generateCSV(data, filename) {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      if (typeof value === 'object' && value !== null) {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      }
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvRows.push(values.join(','));
  });
  
  return csvRows.join('\n');
}

// Main generation function
function generateAllData() {
  console.log('🏗️  Generating test data...\n');
  
  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  // Generate data
  console.log('Generating team members...');
  const teamMembers = generateTeamMembers(15);
  
  console.log('Generating installations...');
  const installations = generateInstallations(100);
  
  console.log('Generating schedules...');
  const schedules = generateSchedules(installations, teamMembers, 150);
  
  console.log('Generating reports...');
  const reports = generateReports(installations, teamMembers, 50);
  
  console.log('Generating optimization metrics...');
  const metrics = generateOptimizationMetrics(90);
  
  // Save as JSON files
  const datasets = {
    team_members: teamMembers,
    installations: installations,
    schedules: schedules,
    reports: reports,
    optimization_metrics: metrics
  };
  
  Object.entries(datasets).forEach(([name, data]) => {
    // Save as JSON
    const jsonPath = path.join(OUTPUT_DIR, `${name}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
    console.log(`✅ Generated ${data.length} ${name} records -> ${jsonPath}`);
    
    // Save as CSV
    const csvContent = generateCSV(data, name);
    if (csvContent) {
      const csvPath = path.join(OUTPUT_DIR, `${name}.csv`);
      fs.writeFileSync(csvPath, csvContent);
      console.log(`✅ Generated ${name} CSV -> ${csvPath}`);
    }
  });
  
  // Generate combined dataset
  const combinedPath = path.join(OUTPUT_DIR, 'combined_dataset.json');
  fs.writeFileSync(combinedPath, JSON.stringify(datasets, null, 2));
  console.log(`✅ Generated combined dataset -> ${combinedPath}`);
  
  console.log('\n🎉 Test data generation completed!');
  console.log(`📁 Files saved to: ${OUTPUT_DIR}`);
  
  // Generate summary
  const summary = {
    generated_at: new Date().toISOString(),
    counts: Object.fromEntries(
      Object.entries(datasets).map(([name, data]) => [name, data.length])
    ),
    total_records: Object.values(datasets).reduce((sum, data) => sum + data.length, 0)
  };
  
  const summaryPath = path.join(OUTPUT_DIR, 'generation_summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`📊 Generation summary -> ${summaryPath}`);
}

// CLI handling
function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'generate';
  
  console.log('====================================');
  console.log('📊 Test Data Generator');
  console.log('====================================\n');
  
  switch (command) {
    case 'generate':
      generateAllData();
      break;
      
    case 'clean':
      if (fs.existsSync(OUTPUT_DIR)) {
        fs.rmSync(OUTPUT_DIR, { recursive: true });
        console.log(`🗑️  Cleaned output directory: ${OUTPUT_DIR}`);
      } else {
        console.log('No output directory to clean');
      }
      break;
      
    case 'help':
    default:
      console.log('Available commands:');
      console.log('  generate  - Generate test data (default)');
      console.log('  clean     - Clean generated data');
      console.log('  help      - Show this help message');
      break;
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  generateTeamMembers,
  generateInstallations,
  generateSchedules,
  generateReports,
  generateOptimizationMetrics
};