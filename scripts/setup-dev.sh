#!/bin/bash

# Think Tank Technologies Installation Scheduler - Development Setup Script
# This script sets up the local development environment

set -e  # Exit on any error

echo "🚀 Setting up Think Tank Technologies Installation Scheduler development environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 20 or higher."
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18 or higher is required. Current version: $(node -v)"
        exit 1
    fi
    
    print_success "Node.js $(node -v) is installed"
}

# Check if npm is installed
check_npm() {
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm."
        exit 1
    fi
    
    print_success "npm $(npm -v) is installed"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    if [ -f "package-lock.json" ]; then
        npm ci
    else
        npm install
    fi
    
    print_success "Dependencies installed successfully"
}

# Setup environment variables
setup_env() {
    print_status "Setting up environment variables..."
    
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_success "Created .env file from .env.example"
            print_warning "Please update .env file with your actual configuration values"
        else
            print_error ".env.example file not found"
            exit 1
        fi
    else
        print_warning ".env file already exists, skipping creation"
    fi
    
    # Create development environment file if it doesn't exist
    if [ ! -f ".env.development" ]; then
        print_warning ".env.development file not found, please create it for development-specific settings"
    fi
}

# Setup git hooks (if using husky)
setup_git_hooks() {
    print_status "Setting up git hooks..."
    
    if [ -d ".git" ]; then
        if command -v husky &> /dev/null; then
            npx husky install
            print_success "Git hooks set up successfully"
        else
            print_warning "Husky not found, skipping git hooks setup"
        fi
    else
        print_warning "Not a git repository, skipping git hooks setup"
    fi
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    # Create directories for local development
    mkdir -p logs
    mkdir -p tmp
    mkdir -p uploads
    mkdir -p backups
    
    # Create test results directory
    mkdir -p test-results
    mkdir -p coverage
    
    print_success "Directories created successfully"
}

# Setup local database (if using PostgreSQL)
setup_database() {
    print_status "Checking database setup..."
    
    if command -v psql &> /dev/null; then
        print_status "PostgreSQL is installed"
        
        # Check if database exists
        DB_NAME="installation_scheduler"
        if psql -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
            print_success "Database '$DB_NAME' already exists"
        else
            print_warning "Database '$DB_NAME' does not exist"
            print_status "To create the database, run: createdb $DB_NAME"
        fi
    else
        print_warning "PostgreSQL not found. If you're using Supabase, this is fine."
        print_status "Make sure your Supabase configuration is correct in .env"
    fi
}

# Run initial build to verify setup
verify_setup() {
    print_status "Verifying setup by running build..."
    
    npm run build
    
    if [ $? -eq 0 ]; then
        print_success "Build completed successfully"
    else
        print_error "Build failed. Please check the error messages above."
        exit 1
    fi
}

# Run linting to check code quality
check_code_quality() {
    print_status "Checking code quality..."
    
    npm run lint
    
    if [ $? -eq 0 ]; then
        print_success "Code quality check passed"
    else
        print_warning "Code quality issues found. Run 'npm run lint:fix' to fix automatically fixable issues."
    fi
}

# Main setup process
main() {
    echo "======================================"
    echo "🏗️  Development Environment Setup"
    echo "======================================"
    
    check_node
    check_npm
    install_dependencies
    setup_env
    setup_git_hooks
    create_directories
    setup_database
    verify_setup
    check_code_quality
    
    echo ""
    echo "======================================"
    print_success "Development environment setup completed!"
    echo "======================================"
    echo ""
    echo "Next steps:"
    echo "1. Update your .env file with the correct configuration values"
    echo "2. Start the development server: npm run dev"
    echo "3. Open http://localhost:3000 in your browser"
    echo ""
    echo "Available commands:"
    echo "  npm run dev          - Start development server"
    echo "  npm run build        - Build for production"
    echo "  npm run preview      - Preview production build"
    echo "  npm run test         - Run tests"
    echo "  npm run lint         - Check code quality"
    echo "  npm run lint:fix     - Fix code quality issues"
    echo "  npm run type-check   - Check TypeScript types"
    echo ""
    echo "For more information, see README.md"
}

# Run main function
main "$@"