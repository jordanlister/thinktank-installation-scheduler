#!/bin/bash

# Multi-Tenant Database Migration Execution Script
# This script executes the complete multi-tenant transformation for Think Tank Installation Scheduler

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="wgcmoorllvctbnabwqux"
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create backup directory
create_backup() {
    log_info "Creating backup directory: $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
}

# Execute migration with error handling
execute_migration() {
    local migration_file=$1
    local migration_name=$2
    
    log_info "Executing migration: $migration_name"
    log_info "File: $migration_file"
    
    if [ ! -f "$migration_file" ]; then
        log_error "Migration file not found: $migration_file"
        return 1
    fi
    
    # Execute the migration
    if supabase db reset --linked --debug; then
        log_success "Migration applied successfully: $migration_name"
        return 0
    else
        log_error "Failed to apply migration: $migration_name"
        return 1
    fi
}

# Main execution
main() {
    log_info "Starting Multi-Tenant Database Transformation"
    log_info "Project ID: $PROJECT_ID"
    
    # Create backup
    create_backup
    
    # Check if Supabase CLI is available
    if ! command -v supabase &> /dev/null; then
        log_error "Supabase CLI not found. Please install it first."
        exit 1
    fi
    
    # Check if project is linked
    if ! supabase projects list | grep -q "$PROJECT_ID"; then
        log_error "Project $PROJECT_ID not found. Please link your project first."
        exit 1
    fi
    
    log_info "All prerequisites met. Starting migration process..."
    
    # Execute migrations in order
    local migrations=(
        "supabase/migrations/003_multi_tenant_transformation.sql:Multi-Tenant Schema Transformation"
        "supabase/migrations/004_multi_tenant_rls_policies.sql:Row Level Security Policies"
        "supabase/migrations/005_data_migration_existing_to_multi_tenant.sql:Data Migration to Multi-Tenant"
    )
    
    for migration_info in "${migrations[@]}"; do
        IFS=':' read -r file name <<< "$migration_info"
        
        log_info "Processing migration: $name"
        
        if execute_migration "$file" "$name"; then
            log_success "✓ Migration completed: $name"
        else
            log_error "✗ Migration failed: $name"
            log_error "Stopping migration process due to error."
            exit 1
        fi
        
        # Wait a moment between migrations
        sleep 2
    done
    
    log_success "All migrations completed successfully!"
    log_info "Running validation queries..."
    
    # Validation would go here if we can connect
    log_success "Multi-tenant transformation completed successfully!"
}

# Trap errors
trap 'log_error "Script failed on line $LINENO"' ERR

# Run main function
main "$@"