#!/usr/bin/env node

/**
 * Migration SQL Output Script
 * Outputs the migration SQL for manual execution in Supabase dashboard
 */

import fs from 'fs';
import path from 'path';

// Color output functions
const colors = {
  info: '\x1b[34m[INFO]\x1b[0m',
  success: '\x1b[32m[SUCCESS]\x1b[0m',
  warning: '\x1b[33m[WARNING]\x1b[0m',
  error: '\x1b[31m[ERROR]\x1b[0m',
  step: '\x1b[36m[STEP]\x1b[0m'
};

function log(level, message) {
  console.log(`${colors[level]} ${message}`);
}

const migrationFiles = [
  'supabase/migrations/003_multi_tenant_transformation.sql',
  'supabase/migrations/004_multi_tenant_rls_policies.sql', 
  'supabase/migrations/005_data_migration_existing_to_multi_tenant.sql'
];

function outputMigrationSQL() {
  log('info', '==========================================');
  log('info', '📄 MIGRATION SQL OUTPUT');
  log('info', '==========================================');
  
  let consolidatedSQL = '-- Multi-Tenant Migration SQL Consolidated\n';
  consolidatedSQL += `-- Generated: ${new Date().toISOString()}\n`;
  consolidatedSQL += '-- Execute this SQL in Supabase SQL Editor\n\n';
  
  for (const [index, filePath] of migrationFiles.entries()) {
    log('step', `\nProcessing: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      log('error', `File not found: ${filePath}`);
      continue;
    }
    
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    const fileSize = Math.round(sqlContent.length / 1024);
    log('info', `File size: ${fileSize}KB`);
    
    consolidatedSQL += `\n-- =====================================================\n`;
    consolidatedSQL += `-- MIGRATION STEP ${index + 1}: ${path.basename(filePath)}\n`;
    consolidatedSQL += `-- =====================================================\n\n`;
    consolidatedSQL += sqlContent;
    consolidatedSQL += '\n\n';
    
    log('success', `✅ Added to consolidated SQL`);
  }
  
  // Save consolidated SQL
  const outputPath = './migration-consolidated.sql';
  fs.writeFileSync(outputPath, consolidatedSQL);
  
  log('info', '\n==========================================');
  log('success', `📁 Consolidated SQL saved to: ${outputPath}`);
  log('info', '==========================================');
  log('info', 'NEXT STEPS:');
  log('info', '1. Open your Supabase dashboard');
  log('info', '2. Go to SQL Editor');
  log('info', '3. Copy and paste the contents of migration-consolidated.sql');
  log('info', '4. Execute the SQL');
  log('info', '5. Verify the migration completed successfully');
  log('info', '==========================================');
  
  return outputPath;
}

// Execute if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const outputFile = outputMigrationSQL();
    console.log(`\n✅ Migration SQL ready for execution: ${outputFile}`);
  } catch (error) {
    console.error(`❌ Failed to process migration files: ${error.message}`);
    process.exit(1);
  }
}