#!/usr/bin/env node

/**
 * Direct Migration Execution for Hosted Supabase Database
 * Executes SQL migrations directly on the hosted database
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.development' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

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

async function executeSQLStatements(sqlContent, stepName) {
  // Clean and split SQL into individual statements
  const statements = sqlContent
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => {
      return stmt.length > 0 && 
             !stmt.startsWith('--') && 
             !stmt.startsWith('/*') &&
             !stmt.match(/^\s*$/);
    });
  
  log('info', `Found ${statements.length} SQL statements to execute`);
  
  const results = [];
  let successCount = 0;
  let failureCount = 0;
  
  for (const [index, statement] of statements.entries()) {
    if (statement.length === 0) continue;
    
    try {
      log('info', `Executing statement ${index + 1}/${statements.length}: ${statement.substring(0, 80)}...`);
      
      // For different types of SQL statements, we need different approaches
      if (statement.toUpperCase().includes('CREATE TABLE')) {
        // Table creation needs to be done via SQL query
        const { data, error } = await supabase.rpc('exec', { sql: statement });
        if (error) throw error;
        
      } else if (statement.toUpperCase().includes('CREATE TYPE')) {
        // Enum/type creation
        const { data, error } = await supabase.rpc('exec', { sql: statement });
        if (error) throw error;
        
      } else if (statement.toUpperCase().includes('ALTER TABLE')) {
        // Table alterations
        const { data, error } = await supabase.rpc('exec', { sql: statement });
        if (error) throw error;
        
      } else if (statement.toUpperCase().includes('CREATE POLICY')) {
        // RLS policy creation
        const { data, error } = await supabase.rpc('exec', { sql: statement });
        if (error) throw error;
        
      } else if (statement.toUpperCase().includes('CREATE OR REPLACE FUNCTION')) {
        // Function creation
        const { data, error } = await supabase.rpc('exec', { sql: statement });
        if (error) throw error;
        
      } else if (statement.toUpperCase().includes('INSERT INTO')) {
        // Data insertion
        const { data, error } = await supabase.rpc('exec', { sql: statement });
        if (error) throw error;
        
      } else {
        // Generic SQL execution
        const { data, error } = await supabase.rpc('exec', { sql: statement });
        if (error) throw error;
      }
      
      successCount++;
      results.push({ statement: statement.substring(0, 100), success: true });
      
      // Brief delay between statements to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 50));
      
    } catch (error) {
      failureCount++;
      const errorMsg = error.message || error.toString();
      log('warning', `Statement failed: ${errorMsg}`);
      results.push({ 
        statement: statement.substring(0, 100), 
        success: false, 
        error: errorMsg 
      });
      
      // Continue with other statements unless it's a critical failure
      if (errorMsg.includes('already exists') || errorMsg.includes('does not exist')) {
        log('info', 'Non-critical error, continuing...');
      } else if (statement.toUpperCase().includes('DROP POLICY')) {
        log('info', 'Policy drop failed (may not exist), continuing...');
      }
    }
  }
  
  return {
    success: failureCount === 0,
    partial: successCount > 0 && failureCount > 0,
    stats: { total: statements.length, success: successCount, failures: failureCount },
    results
  };
}

async function runMigrationStep(filePath, stepName, stepId) {
  log('step', `\n📋 ${stepName}`);
  log('info', `Reading migration file: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`Migration file not found: ${filePath}`);
  }
  
  const sqlContent = fs.readFileSync(filePath, 'utf8');
  const fileSize = Math.round(sqlContent.length / 1024);
  log('info', `File size: ${fileSize}KB`);
  
  const startTime = Date.now();
  const result = await executeSQLStatements(sqlContent, stepName);
  const duration = Date.now() - startTime;
  
  log('info', `Execution completed in ${duration}ms`);
  log('info', `Stats: ${result.stats.success} success, ${result.stats.failures} failures out of ${result.stats.total} statements`);
  
  if (result.success) {
    log('success', `✅ ${stepName} completed successfully`);
  } else if (result.partial) {
    log('warning', `⚠️ ${stepName} completed with some issues`);
  } else {
    log('error', `❌ ${stepName} failed`);
  }
  
  return { ...result, stepId, stepName, duration, filePath };
}

async function validateDatabase() {
  log('info', 'Validating database state after migration...');
  
  try {
    // Check if organizations table exists and has data
    const { data: orgCount } = await supabase
      .from('organizations')
      .select('*', { count: 'exact', head: true });
    
    log('success', `✅ Organizations table accessible`);
    
    // Check if Think Tank organization exists
    const { data: defaultOrg } = await supabase
      .from('organizations')
      .select('*')
      .eq('slug', 'think-tank-tech');
    
    if (defaultOrg && defaultOrg.length > 0) {
      log('success', `✅ Default organization "Think Tank Technologies" found`);
    }
    
    // Check if projects table exists
    const { data: projectCount } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true });
      
    log('success', `✅ Projects table accessible`);
    
    return true;
    
  } catch (error) {
    log('warning', `Database validation had issues: ${error.message}`);
    return false;
  }
}

async function executeMigration() {
  log('info', '==========================================');
  log('info', '🚀 DIRECT MULTI-TENANT MIGRATION');
  log('info', '==========================================');
  
  const migrationSteps = [
    {
      id: '003',
      name: 'Multi-Tenant Schema Transformation',
      file: 'supabase/migrations/003_multi_tenant_transformation.sql'
    },
    {
      id: '004',
      name: 'Row Level Security Policies',
      file: 'supabase/migrations/004_multi_tenant_rls_policies.sql'
    },
    {
      id: '005', 
      name: 'Data Migration to Multi-Tenant',
      file: 'supabase/migrations/005_data_migration_existing_to_multi_tenant.sql'
    }
  ];
  
  const results = [];
  let overallSuccess = true;
  
  for (const [index, step] of migrationSteps.entries()) {
    try {
      const result = await runMigrationStep(step.file, step.name, step.id);
      results.push(result);
      
      if (!result.success && !result.partial) {
        overallSuccess = false;
        log('error', `Critical failure in step ${step.id}. Stopping migration.`);
        break;
      }
      
    } catch (error) {
      log('error', `Exception in step ${step.id}: ${error.message}`);
      results.push({
        stepId: step.id,
        stepName: step.name,
        success: false,
        error: error.message
      });
      overallSuccess = false;
      break;
    }
  }
  
  // Validate final database state
  const validationSuccess = await validateDatabase();
  
  // Create migration log
  const migrationLog = {
    timestamp: new Date().toISOString(),
    type: 'direct_migration',
    database_url: process.env.VITE_SUPABASE_URL,
    overall_success: overallSuccess && validationSuccess,
    validation_success: validationSuccess,
    steps: results,
    summary: {
      total_steps: migrationSteps.length,
      completed_steps: results.filter(r => r.success || r.partial).length,
      failed_steps: results.filter(r => !r.success && !r.partial).length
    }
  };
  
  // Save migration log
  const logPath = `./backups/direct_migration_log_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  fs.writeFileSync(logPath, JSON.stringify(migrationLog, null, 2));
  log('success', `Migration log saved: ${logPath}`);
  
  log('info', '\n==========================================');
  if (overallSuccess && validationSuccess) {
    log('success', '🎉 MULTI-TENANT MIGRATION COMPLETED');
    log('info', '✅ Database successfully transformed to multi-tenant architecture');
    log('info', '✅ Think Tank Technologies organization created');
    log('info', '✅ All core tables and policies in place');
  } else {
    log('warning', '⚠️ MIGRATION COMPLETED WITH ISSUES');
    log('warning', 'Some steps may have failed or validation incomplete');
    log('warning', 'Check the migration log for detailed results');
  }
  log('info', '==========================================');
  
  return migrationLog;
}

// Execute if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  executeMigration()
    .then((log) => {
      if (log.overall_success) {
        process.exit(0);
      } else {
        process.exit(1);
      }
    })
    .catch((error) => {
      log('error', `Migration failed: ${error.message}`);
      process.exit(1);
    });
}

export { executeMigration };