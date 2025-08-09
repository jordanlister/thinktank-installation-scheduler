#!/usr/bin/env node

/**
 * Comprehensive Database Backup Script for Multi-Tenant Migration
 * Creates a complete backup of all existing data before migration
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

const BACKUP_DIR = './backups';
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');
const BACKUP_FILE = `pre_migration_backup_${TIMESTAMP}`;

// All tables to backup in dependency order
const TABLES_TO_BACKUP = [
  'users',
  'team_members', 
  'installations',
  'assignments',
  'notifications'
  // Note: reports and optimization_metrics don't exist yet - will be created
];

// Color output functions
const colors = {
  info: '\x1b[34m[INFO]\x1b[0m',
  success: '\x1b[32m[SUCCESS]\x1b[0m',
  warning: '\x1b[33m[WARNING]\x1b[0m',
  error: '\x1b[31m[ERROR]\x1b[0m'
};

function log(level, message) {
  console.log(`${colors[level]} ${message}`);
}

async function createBackupDirectory() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    log('info', `Created backup directory: ${BACKUP_DIR}`);
  }
}

async function getTableSchema(tableName) {
  try {
    // Get table structure from information_schema
    const { data, error } = await supabase.rpc('get_table_schema', { 
      table_name: tableName 
    });
    
    if (error) {
      log('warning', `Could not get schema for ${tableName}: ${error.message}`);
      return null;
    }
    return data;
  } catch (err) {
    log('warning', `Schema extraction failed for ${tableName}: ${err.message}`);
    return null;
  }
}

async function backupTable(tableName) {
  try {
    log('info', `Backing up table: ${tableName}`);
    
    // Get all data from table
    const { data, error } = await supabase
      .from(tableName)
      .select('*');
    
    if (error) {
      log('error', `Failed to backup ${tableName}: ${error.message}`);
      return { tableName, success: false, error: error.message, count: 0 };
    }
    
    log('success', `✅ Backed up ${data?.length || 0} records from ${tableName}`);
    return { 
      tableName, 
      success: true, 
      data: data || [], 
      count: data?.length || 0,
      schema: await getTableSchema(tableName)
    };
    
  } catch (err) {
    log('error', `Exception backing up ${tableName}: ${err.message}`);
    return { tableName, success: false, error: err.message, count: 0 };
  }
}

async function validateBackup(backup) {
  const validation = {
    isValid: true,
    issues: [],
    stats: {
      totalTables: Object.keys(backup.tables).length,
      totalRecords: 0,
      tablesWithData: 0,
      emptyTables: []
    }
  };
  
  for (const [tableName, tableData] of Object.entries(backup.tables)) {
    if (!tableData.success) {
      validation.isValid = false;
      validation.issues.push(`Failed to backup ${tableName}: ${tableData.error}`);
      continue;
    }
    
    const recordCount = tableData.count;
    validation.stats.totalRecords += recordCount;
    
    if (recordCount === 0) {
      validation.stats.emptyTables.push(tableName);
      log('warning', `Table ${tableName} is empty`);
    } else {
      validation.stats.tablesWithData++;
    }
    
    // Check critical tables - empty is OK for fresh installations
    if (['users', 'installations', 'team_members'].includes(tableName) && recordCount === 0) {
      log('info', `Critical table ${tableName} is empty - appears to be fresh installation`);
    }
  }
  
  return validation;
}

async function createMigrationCheckpoint() {
  const checkpoint = {
    timestamp: new Date().toISOString(),
    database_url: process.env.VITE_SUPABASE_URL,
    migration_status: 'pre_migration',
    system_info: {
      node_version: process.version,
      platform: process.platform,
      cwd: process.cwd()
    },
    backup_metadata: {
      tables_count: TABLES_TO_BACKUP.length,
      backup_method: 'supabase_client_export'
    }
  };
  
  const checkpointPath = path.join(BACKUP_DIR, `${BACKUP_FILE}_checkpoint.json`);
  fs.writeFileSync(checkpointPath, JSON.stringify(checkpoint, null, 2));
  
  log('success', `Migration checkpoint created: ${checkpointPath}`);
  return checkpoint;
}

async function performBackup() {
  log('info', '==========================================');
  log('info', '🛡️  COMPREHENSIVE PRE-MIGRATION BACKUP');
  log('info', '==========================================');
  
  await createBackupDirectory();
  
  const backup = {
    metadata: {
      timestamp: new Date().toISOString(),
      backup_type: 'pre_migration',
      database_url: process.env.VITE_SUPABASE_URL,
      migration_target: 'multi_tenant_transformation'
    },
    tables: {},
    validation: null
  };
  
  // Backup all tables
  for (const tableName of TABLES_TO_BACKUP) {
    const result = await backupTable(tableName);
    backup.tables[tableName] = result;
  }
  
  // Validate backup
  const validation = await validateBackup(backup);
  backup.validation = validation;
  
  if (!validation.isValid) {
    log('error', 'Backup validation failed:');
    validation.issues.forEach(issue => log('error', `  - ${issue}`));
    process.exit(1);
  }
  
  log('info', '==========================================');
  log('success', 'BACKUP VALIDATION SUCCESSFUL');
  log('info', `📊 Total tables: ${validation.stats.totalTables}`);
  log('info', `📊 Total records: ${validation.stats.totalRecords}`);
  log('info', `📊 Tables with data: ${validation.stats.tablesWithData}`);
  log('info', `📊 Empty tables: ${validation.stats.emptyTables.join(', ') || 'None'}`);
  log('info', '==========================================');
  
  // Save backup files
  const backupPath = path.join(BACKUP_DIR, `${BACKUP_FILE}.json`);
  const compactBackupPath = path.join(BACKUP_DIR, `${BACKUP_FILE}_compact.json`);
  
  // Full backup with all data
  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
  
  // Compact backup (metadata only)
  const compactBackup = {
    ...backup,
    tables: Object.fromEntries(
      Object.entries(backup.tables).map(([name, data]) => [
        name,
        {
          tableName: data.tableName,
          success: data.success,
          count: data.count,
          error: data.error,
          schema: data.schema
        }
      ])
    )
  };
  fs.writeFileSync(compactBackupPath, JSON.stringify(compactBackup, null, 2));
  
  // Create checkpoint
  await createMigrationCheckpoint();
  
  log('success', `✅ Full backup saved: ${backupPath}`);
  log('success', `✅ Compact backup saved: ${compactBackupPath}`);
  
  // Create compressed backup
  try {
    const { execSync } = await import('child_process');
    execSync(`gzip -c "${backupPath}" > "${backupPath}.gz"`);
    log('success', `✅ Compressed backup created: ${backupPath}.gz`);
  } catch (err) {
    log('warning', 'Could not create compressed backup (gzip not available)');
  }
  
  log('info', '==========================================');
  log('success', '🎉 PRE-MIGRATION BACKUP COMPLETE');
  log('info', '==========================================');
  
  return backup;
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  performBackup()
    .then(() => {
      log('success', 'Backup process completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      log('error', `Backup process failed: ${error.message}`);
      process.exit(1);
    });
}

export { performBackup, validateBackup };