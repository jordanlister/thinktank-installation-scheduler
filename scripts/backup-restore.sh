#!/bin/bash

# Think Tank Technologies Installation Scheduler - Backup and Restore Script
# This script handles database backup and restore operations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="ttt_scheduler_backup_${TIMESTAMP}.sql"

# Function to print colored output
print_status() {
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

# Load environment variables
load_env() {
    if [ -f ".env" ]; then
        source .env
    elif [ -f ".env.development" ]; then
        source .env.development
    else
        print_error "No environment file found. Please create .env or .env.development"
        exit 1
    fi

    if [ -z "$VITE_SUPABASE_URL" ]; then
        print_error "VITE_SUPABASE_URL not found in environment"
        exit 1
    fi
}

# Extract database connection info from Supabase URL
parse_supabase_url() {
    # Extract host from Supabase URL
    DB_HOST=$(echo $VITE_SUPABASE_URL | sed 's|https://||' | sed 's|http://||')
    DB_NAME="postgres"
    DB_USER="postgres"
    
    print_status "Database host: $DB_HOST"
    
    if [ -z "$SUPABASE_DB_PASSWORD" ]; then
        print_warning "SUPABASE_DB_PASSWORD not set in environment"
        print_status "You may need to enter the password manually"
    fi
}

# Create backup directory
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
        print_status "Created backup directory: $BACKUP_DIR"
    fi
}

# Backup database
backup_database() {
    print_status "Starting database backup..."
    
    create_backup_dir
    
    BACKUP_PATH="$BACKUP_DIR/$BACKUP_FILE"
    
    # For Supabase, we'll use a different approach since direct pg_dump might not work
    print_status "Creating backup using Supabase export..."
    
    # Use the Node.js script to export data
    node -e "
    const { createClient } = require('@supabase/supabase-js');
    const fs = require('fs');
    
    const supabase = createClient('$VITE_SUPABASE_URL', '$VITE_SUPABASE_ANON_KEY');
    
    async function exportData() {
        const tables = ['team_members', 'installations', 'schedules', 'reports', 'optimization_metrics'];
        const backup = {
            timestamp: new Date().toISOString(),
            tables: {}
        };
        
        for (const table of tables) {
            try {
                const { data, error } = await supabase.from(table).select('*');
                if (error) {
                    console.error(\`Error backing up \${table}:\`, error);
                } else {
                    backup.tables[table] = data;
                    console.log(\`✅ Backed up \${data.length} records from \${table}\`);
                }
            } catch (err) {
                console.error(\`Failed to backup \${table}:\`, err.message);
            }
        }
        
        fs.writeFileSync('$BACKUP_PATH.json', JSON.stringify(backup, null, 2));
        console.log('✅ Backup completed: $BACKUP_PATH.json');
    }
    
    exportData().catch(console.error);
    "
    
    if [ $? -eq 0 ]; then
        print_success "Backup completed successfully: $BACKUP_PATH.json"
        
        # Also create a compressed version
        if command -v gzip &> /dev/null; then
            gzip -c "$BACKUP_PATH.json" > "$BACKUP_PATH.json.gz"
            print_success "Compressed backup created: $BACKUP_PATH.json.gz"
        fi
    else
        print_error "Backup failed"
        exit 1
    fi
}

# Restore database
restore_database() {
    local restore_file="$1"
    
    if [ -z "$restore_file" ]; then
        print_error "Please specify a backup file to restore"
        echo "Usage: $0 restore <backup_file.json>"
        exit 1
    fi
    
    if [ ! -f "$restore_file" ]; then
        print_error "Backup file not found: $restore_file"
        exit 1
    fi
    
    print_warning "This will replace all existing data in the database!"
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Restore cancelled"
        exit 0
    fi
    
    print_status "Starting database restore from: $restore_file"
    
    # Use Node.js script to restore data
    node -e "
    const { createClient } = require('@supabase/supabase-js');
    const fs = require('fs');
    
    const supabase = createClient('$VITE_SUPABASE_URL', '$VITE_SUPABASE_ANON_KEY');
    
    async function restoreData() {
        const backup = JSON.parse(fs.readFileSync('$restore_file', 'utf8'));
        
        console.log('Backup timestamp:', backup.timestamp);
        console.log('Available tables:', Object.keys(backup.tables));
        
        // Clear existing data (in reverse dependency order)
        const clearOrder = ['schedules', 'reports', 'optimization_metrics', 'installations', 'team_members'];
        
        for (const table of clearOrder) {
            try {
                const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
                if (error) {
                    console.warn(\`Warning clearing \${table}:\`, error.message);
                } else {
                    console.log(\`🗑️  Cleared existing data from \${table}\`);
                }
            } catch (err) {
                console.warn(\`Failed to clear \${table}:\`, err.message);
            }
        }
        
        // Restore data (in dependency order)
        const restoreOrder = ['team_members', 'installations', 'schedules', 'reports', 'optimization_metrics'];
        
        for (const table of restoreOrder) {
            if (backup.tables[table] && backup.tables[table].length > 0) {
                try {
                    const { data, error } = await supabase.from(table).insert(backup.tables[table]);
                    if (error) {
                        console.error(\`Error restoring \${table}:\`, error);
                    } else {
                        console.log(\`✅ Restored \${backup.tables[table].length} records to \${table}\`);
                    }
                } catch (err) {
                    console.error(\`Failed to restore \${table}:\`, err.message);
                }
            }
        }
        
        console.log('✅ Restore completed');
    }
    
    restoreData().catch(console.error);
    "
    
    if [ $? -eq 0 ]; then
        print_success "Database restore completed successfully"
    else
        print_error "Restore failed"
        exit 1
    fi
}

# List available backups
list_backups() {
    print_status "Available backups in $BACKUP_DIR:"
    
    if [ ! -d "$BACKUP_DIR" ]; then
        print_warning "No backup directory found"
        return
    fi
    
    if [ -z "$(ls -A $BACKUP_DIR 2>/dev/null)" ]; then
        print_warning "No backups found"
        return
    fi
    
    ls -la "$BACKUP_DIR" | grep -E '\.(sql|json)' | while read -r line; do
        echo "  $line"
    done
}

# Clean old backups
clean_backups() {
    local days=${1:-7}
    
    print_status "Cleaning backups older than $days days..."
    
    if [ ! -d "$BACKUP_DIR" ]; then
        print_warning "No backup directory found"
        return
    fi
    
    find "$BACKUP_DIR" -name "*.sql" -o -name "*.json" -o -name "*.gz" | \
    while read -r file; do
        if [ $(stat -c %Y "$file") -lt $(date -d "$days days ago" +%s) ]; then
            rm "$file"
            print_status "Deleted old backup: $(basename "$file")"
        fi
    done
    
    print_success "Backup cleanup completed"
}

# Main function
main() {
    local command="$1"
    
    echo "======================================"
    echo "💾 Database Backup & Restore Tool"
    echo "======================================"
    
    load_env
    parse_supabase_url
    
    case "$command" in
        "backup")
            backup_database
            ;;
        "restore")
            restore_database "$2"
            ;;
        "list")
            list_backups
            ;;
        "clean")
            clean_backups "$2"
            ;;
        "help"|*)
            echo ""
            echo "Usage: $0 <command> [options]"
            echo ""
            echo "Commands:"
            echo "  backup           - Create a database backup"
            echo "  restore <file>   - Restore database from backup file"
            echo "  list             - List available backups"
            echo "  clean [days]     - Clean backups older than N days (default: 7)"
            echo "  help             - Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0 backup"
            echo "  $0 restore ./backups/ttt_scheduler_backup_20240101_120000.json"
            echo "  $0 list"
            echo "  $0 clean 30"
            echo ""
            ;;
    esac
}

# Run main function
main "$@"