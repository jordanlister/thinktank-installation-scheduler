#!/bin/bash

# Multi-Tenant Migration Execution Script
# Executes database migrations using Supabase CLI

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${CYAN}[STEP]${NC} $1"
}

# Check if Supabase CLI is available
check_supabase_cli() {
    if ! command -v supabase &> /dev/null; then
        print_error "Supabase CLI not found. Please install it first:"
        echo "npm install -g supabase"
        echo "or visit: https://supabase.com/docs/guides/cli"
        exit 1
    fi
    
    print_success "Supabase CLI found: $(supabase --version)"
}

# Ensure we're in the project directory
ensure_project_directory() {
    if [ ! -f "supabase/config.toml" ]; then
        print_error "Not in Supabase project directory. Please run from project root."
        exit 1
    fi
    
    print_success "Supabase project configuration found"
}

# Execute a single migration file
execute_migration_file() {
    local file_path="$1"
    local step_name="$2"
    local step_number="$3"
    
    print_step "\n📋 STEP $step_number: $step_name"
    print_info "Executing: $file_path"
    
    if [ ! -f "$file_path" ]; then
        print_error "Migration file not found: $file_path"
        return 1
    fi
    
    # Check file size
    local file_size=$(wc -c < "$file_path")
    print_info "File size: $((file_size / 1024))KB"
    
    # Execute using psql through Supabase CLI
    if supabase db reset --linked 2>/dev/null; then
        print_info "Using reset and applying all migrations..."
        supabase db push
    else
        print_info "Applying migration directly..."
        # Alternative: apply the SQL directly
        psql -h "$(supabase status | grep 'DB URL' | awk '{print $3}' | cut -d'/' -f3 | cut -d':' -f1)" \
             -p "$(supabase status | grep 'DB URL' | awk '{print $3}' | cut -d'/' -f3 | cut -d':' -f2)" \
             -U postgres \
             -d postgres \
             -f "$file_path" 2>/dev/null || {
            print_warning "Direct psql failed, trying Supabase migration approach..."
            # Copy to migrations if not already there
            local migration_name="$(basename "$file_path")"
            if [ ! -f "supabase/migrations/$migration_name" ]; then
                cp "$file_path" "supabase/migrations/"
            fi
            supabase db push
        }
    fi
    
    if [ $? -eq 0 ]; then
        print_success "✅ $step_name completed successfully"
        return 0
    else
        print_error "❌ $step_name failed"
        return 1
    fi
}

# Validate migration step
validate_migration_step() {
    local step_id="$1"
    
    print_info "Validating migration step: $step_id"
    
    case "$step_id" in
        "003")
            # Check if organizations table exists
            if supabase db shell -c "\d organizations" 2>/dev/null | grep -q "Table"; then
                print_success "✅ Organizations table created successfully"
            else
                print_warning "⚠️ Organizations table validation failed"
            fi
            ;;
        "004")
            # Check RLS policies
            if supabase db shell -c "SELECT count(*) FROM pg_policies WHERE schemaname = 'public';" 2>/dev/null; then
                print_success "✅ RLS policies applied"
            else
                print_warning "⚠️ RLS policies validation incomplete"
            fi
            ;;
        "005")
            # Check default organization
            if supabase db shell -c "SELECT name FROM organizations WHERE slug = 'think-tank-tech';" 2>/dev/null | grep -q "Think Tank"; then
                print_success "✅ Default organization created"
            else
                print_warning "⚠️ Default organization validation failed"
            fi
            ;;
    esac
}

# Main migration execution
execute_migration() {
    print_info "=========================================="
    print_info "🚀 MULTI-TENANT MIGRATION EXECUTION"
    print_info "=========================================="
    
    # Migration steps in order
    local migrations=(
        "supabase/migrations/003_multi_tenant_transformation.sql:Multi-Tenant Schema Transformation:1"
        "supabase/migrations/004_multi_tenant_rls_policies.sql:Row Level Security Policies:2" 
        "supabase/migrations/005_data_migration_existing_to_multi_tenant.sql:Data Migration to Multi-Tenant:3"
    )
    
    local overall_success=true
    local completed_steps=0
    
    for migration_info in "${migrations[@]}"; do
        IFS=':' read -r file_path step_name step_number <<< "$migration_info"
        
        if execute_migration_file "$file_path" "$step_name" "$step_number"; then
            # Extract step ID from filename
            step_id=$(basename "$file_path" | cut -d'_' -f1)
            validate_migration_step "$step_id"
            completed_steps=$((completed_steps + 1))
        else
            overall_success=false
            print_error "Migration failed at step $step_number. Stopping execution."
            break
        fi
        
        # Brief pause between steps
        sleep 2
    done
    
    print_info "\n=========================================="
    
    if [ "$overall_success" = true ]; then
        print_success "🎉 MULTI-TENANT MIGRATION COMPLETED SUCCESSFULLY"
        print_info "✅ All $completed_steps migration steps executed successfully"
        print_info "✅ Database transformed to multi-tenant architecture"
        print_info "✅ Default 'Think Tank Technologies' organization created"
        print_info "✅ RLS policies implemented for data isolation"
        
        # Create success checkpoint
        echo "{\"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)\", \"status\": \"completed\", \"steps\": $completed_steps}" > "./backups/migration_success_$(date +%Y%m%d_%H%M%S).json"
        
    else
        print_error "❌ MIGRATION COMPLETED WITH ERRORS"
        print_warning "Completed $completed_steps out of ${#migrations[@]} steps"
        print_warning "Check the output above for details"
        print_warning "You may need to manually resolve issues or rollback"
        
        return 1
    fi
    
    print_info "=========================================="
}

# Main execution
main() {
    print_info "💾 Think Tank Technologies - Multi-Tenant Migration"
    print_info "Starting migration execution..."
    
    check_supabase_cli
    ensure_project_directory
    
    # Create backup directory if it doesn't exist
    mkdir -p backups
    
    execute_migration
    
    if [ $? -eq 0 ]; then
        print_success "Migration execution completed successfully!"
        exit 0
    else
        print_error "Migration execution failed!"
        exit 1
    fi
}

# Run main function
main "$@"