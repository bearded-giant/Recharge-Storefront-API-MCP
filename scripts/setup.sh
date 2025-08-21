#!/bin/bash

# Recharge Storefront API MCP Server Setup Script
# This script sets up the development environment

set -e

echo "🚀 Setting up Recharge Storefront API MCP Server..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ️${NC} $1"
}

# Check Node.js version
print_info "Checking Node.js version..."
node_version=$(node -v | cut -d'v' -f2)
required_version="18.0.0"

if [ "$(printf '%s\n' "$required_version" "$node_version" | sort -V | head -n1)" != "$required_version" ]; then
    print_error "Node.js version $node_version is not supported. Please install Node.js $required_version or higher."
    exit 1
fi

print_status "Node.js version $node_version is supported"

# Check npm version
npm_version=$(npm -v)
print_info "npm version: $npm_version"

# Check if package.json exists
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Are you in the correct directory?"
    exit 1
fi

# Install dependencies
print_info "Installing dependencies..."
if npm install; then
    print_status "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Check for security vulnerabilities
print_info "Checking for security vulnerabilities..."
if npm audit --audit-level=high; then
    print_status "No high-severity vulnerabilities found"
else
    print_warning "Security vulnerabilities detected. Run 'npm audit fix' to resolve."
fi

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    print_info "Creating .env file from template..."
    cp .env.example .env
    print_warning "Please edit .env file with your Recharge API credentials"
    print_info "Required variables:"
    print_info "  - RECHARGE_STOREFRONT_DOMAIN=your-shop.myshopify.com"
    print_info "  - RECHARGE_ACCESS_TOKEN=your_access_token_here (optional)"
else
    print_status ".env file already exists"
fi

# Validate .env file format
if [ -f .env ]; then
    print_info "Validating .env file format..."
    if grep -q "RECHARGE_STOREFRONT_DOMAIN=" .env; then
        domain=$(grep "RECHARGE_STOREFRONT_DOMAIN=" .env | cut -d'=' -f2)
        if [ "$domain" = "your-shop.myshopify.com" ]; then
            print_warning "Please update RECHARGE_STOREFRONT_DOMAIN with your actual domain"
        else
            print_status "Domain configured: $domain"
        fi
    else
        print_warning "RECHARGE_STOREFRONT_DOMAIN not found in .env file"
    fi
fi

# Create logs directory if it doesn't exist
if [ ! -d "logs" ]; then
    print_info "Creating logs directory..."
    mkdir -p logs
    print_status "Logs directory created"
fi

# Validate the setup
print_info "Validating setup..."
if npm run validate; then
    print_status "Setup validation passed"
else
    print_error "Setup validation failed"
    exit 1
fi

# Check Docker availability (optional)
if command -v docker >/dev/null 2>&1; then
    docker_version=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
    print_status "Docker available: $docker_version"
    
    if command -v docker-compose >/dev/null 2>&1; then
        compose_version=$(docker-compose --version | cut -d' ' -f3 | cut -d',' -f1)
        print_status "Docker Compose available: $compose_version"
    else
        print_warning "Docker Compose not found (optional for containerized deployment)"
    fi
else
    print_warning "Docker not found (optional for containerized deployment)"
fi

# Display project statistics
print_info "Project Statistics:"
tool_count=$(find src/tools -name "*-tools.js" | wc -l)
echo "  🔧 Tool categories: $tool_count"
echo "  📁 Source files: $(find src -name "*.js" | wc -l)"
echo "  📋 Scripts available: $(node -p "Object.keys(require('./package.json').scripts).length")"

print_status "Setup complete!"
echo ""
print_info "Next steps:"
echo "  1. Edit .env file with your Recharge API credentials"
echo "  2. Run 'npm start' to start the server"
echo "  3. Run 'npm run dev' for development mode with file watching"
echo "  4. Run 'npm run dev:debug' for development with debug logging"
echo ""
print_info "Available commands:"
echo "  npm run validate    - Validate configuration and syntax"
echo "  npm run coverage    - Show API coverage report"
echo "  npm run test        - Run tests"
echo "  npm run docker:build - Build Docker image"
echo ""
print_info "For more information, see README.md"