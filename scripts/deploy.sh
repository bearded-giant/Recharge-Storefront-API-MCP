#!/bin/bash

# Recharge Storefront API MCP Server Deployment Script
# This script handles deployment to various environments

set -e

ENVIRONMENT=${1:-production}
VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "1.0.0")

echo "🚀 Deploying Recharge Storefront API MCP Server v$VERSION to $ENVIRONMENT..."

# Check if required commands exist
if ! command -v docker >/dev/null 2>&1; then
    echo "❌ Docker is not installed. Please install Docker to continue."
    exit 1
fi

# Check for Docker Compose (new or legacy)
if ! (command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1) && ! command -v docker-compose >/dev/null 2>&1; then
    echo "❌ Docker Compose is not available. Please install Docker Compose to continue."
    exit 1
fi

# Determine which Docker Compose command to use
if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

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
if command -v npm >/dev/null 2>&1; then
    npm run validate || {
        echo "❌ Pre-deployment validation failed"
        exit 1
    }
else
    echo "⚠️ npm not available, skipping validation"
fi

# Build Docker image
echo "🐳 Building Docker image..."
docker build -t recharge-storefront-api-mcp:$VERSION .
docker tag recharge-storefront-api-mcp:$VERSION recharge-storefront-api-mcp:latest

# Deploy based on environment
case $ENVIRONMENT in
    development)
        echo "🔧 Starting development deployment..."
        $DOCKER_COMPOSE -f docker-compose.yml -f docker-compose.dev.yml up -d
        ;;
    staging)
        echo "🧪 Starting staging deployment..."
        $DOCKER_COMPOSE -f docker-compose.yml -f docker-compose.staging.yml up -d
        ;;
    production)
        echo "🏭 Starting production deployment..."
        $DOCKER_COMPOSE -f docker-compose.yml -f docker-compose.prod.yml up -d
        ;;
esac

echo "✅ Deployment complete!"
echo "📊 Container status:"
$DOCKER_COMPOSE ps

echo ""
echo "🔗 Useful commands:"