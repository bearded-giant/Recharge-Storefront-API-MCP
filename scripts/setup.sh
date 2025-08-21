#!/bin/bash

# Recharge MCP Server Setup Script
# This script sets up the development environment

set -e

echo "🚀 Setting up Recharge MCP Server..."

# Check Node.js version
echo "📋 Checking Node.js version..."
node_version=$(node -v | cut -d'v' -f2)
required_version="18.0.0"

if [ "$(printf '%s\n' "$required_version" "$node_version" | sort -V | head -n1)" != "$required_version" ]; then
    echo "❌ Node.js version $node_version is not supported. Please install Node.js $required_version or higher."
    exit 1
fi

echo "✅ Node.js version $node_version is supported"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your Recharge API credentials"
else
    echo "✅ .env file already exists"
fi

# Validate the setup
echo "🔍 Validating setup..."
npm run validate

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your Recharge API credentials"
echo "2. Run 'npm start' to start the server"
echo "3. Run 'npm run dev' for development mode"
echo ""
echo "For more information, see README.md"