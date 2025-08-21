#!/bin/bash

# Recharge MCP Server Deployment Script
# This script handles deployment to various environments

set -e

ENVIRONMENT=${1:-production}
VERSION=$(node -p "require('./package.json').version")

echo "🚀 Deploying Recharge MCP Server v$VERSION to $ENVIRONMENT..."

# Validate environment
case $ENVIRONMENT in
    development|staging|production)
        echo "✅ Deploying to $ENVIRONMENT environment"
        ;;
    *)
        echo "❌ Invalid environment: $ENVIRONMENT"
        echo "Valid environments: development, staging, production"
        exit 1
        ;;
esac

# Run pre-deployment checks
echo "🔍 Running pre-deployment checks..."
npm run validate

# Build Docker image
echo "🐳 Building Docker image..."
docker build -t recharge-mcp-server:$VERSION .
docker tag recharge-mcp-server:$VERSION recharge-mcp-server:latest

# Deploy based on environment
case $ENVIRONMENT in
    development)
        echo "🔧 Starting development deployment..."
        docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
        ;;
    staging)
        echo "🧪 Starting staging deployment..."
        docker-compose -f docker-compose.yml -f docker-compose.staging.yml up -d
        ;;
    production)
        echo "🏭 Starting production deployment..."
        docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
        ;;
esac

echo "✅ Deployment complete!"
echo "📊 Container status:"
docker-compose ps

echo ""
echo "🔗 Useful commands:"
echo "  View logs: docker-compose logs -f recharge-mcp-server"
echo "  Stop: docker-compose down"
echo "  Restart: docker-compose restart recharge-mcp-server"