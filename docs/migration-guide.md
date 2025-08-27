# Migration Guide

This guide helps you migrate between versions of the Recharge Storefront API MCP Server and upgrade your integration.

## Table of Contents

- [Version Compatibility](#version-compatibility)
- [Migration from Pre-1.0 Versions](#migration-from-pre-10-versions)
- [Breaking Changes](#breaking-changes)
- [Configuration Updates](#configuration-updates)
- [API Changes](#api-changes)
- [Best Practices for Upgrades](#best-practices-for-upgrades)

## Version Compatibility

### Current Version: 1.0.0

**Supported Node.js Versions:**
- Node.js 18.0.0 or higher (recommended: 18.x LTS or 20.x LTS)

**Supported Recharge API Versions:**
- Recharge Storefront API (current version)
- Backward compatible with existing Recharge integrations

**MCP Protocol Version:**
- Model Context Protocol 1.0+

## Migration from Pre-1.0 Versions

### Overview

Version 1.0.0 is the first stable release. If you were using development versions (0.x.x), follow this migration guide.

### Key Changes in 1.0.0

1. **Stable API Interface** - All tool names and parameters are now stable
2. **Enhanced Authentication** - Improved session management and multi-customer support
3. **Better Error Handling** - More detailed error messages and guidance
4. **Production Features** - Docker support, monitoring, and reliability improvements

### Migration Steps

#### Step 1: Backup Current Configuration

```bash
# Backup your current .env file
cp .env .env.backup

# Backup any custom configurations
cp -r config/ config.backup/ 2>/dev/null || true
```

#### Step 2: Update Dependencies

```bash
# Update to latest version
npm install recharge-storefront-api-mcp@latest

# Or if using git
git pull origin main
npm install
```

#### Step 3: Update Configuration

**Old .env format (if applicable):**
```bash
RECHARGE_ACCESS_TOKEN=your_token_here
RECHARGE_DOMAIN=shop.myshopify.com
```

**New .env format:**
```bash
RECHARGE_MERCHANT_TOKEN=your_merchant_token_here
RECHARGE_STOREFRONT_DOMAIN=shop.myshopify.com
RECHARGE_SESSION_TOKEN=optional_session_token
```

#### Step 4: Update Tool Calls

**Authentication Changes:**

Old approach (if you were using development versions):
```json
{
  "name": "get_customer",
  "arguments": {
    "access_token": "your_token_here"
  }
}
```

New approach:
```json
{
  "name": "get_customer",
  "arguments": {
    "customer_email": "customer@example.com"
  }
}
```

#### Step 5: Test Migration

```bash
# Validate new configuration
npm run validate

# Run comprehensive tests
npm run test:full

# Test with debug mode
DEBUG=true npm start
```

## Breaking Changes

### Version 1.0.0 Breaking Changes

**None** - Version 1.0.0 is the initial stable release.

### Future Breaking Changes Policy

Starting with 1.0.0, we follow semantic versioning:

- **Patch versions (1.0.x)** - Bug fixes, no breaking changes
- **Minor versions (1.x.0)** - New features, backward compatible
- **Major versions (x.0.0)** - Breaking changes, migration required

## Configuration Updates

### Environment Variables

#### New Variables in 1.0.0

```bash
# Enhanced authentication
RECHARGE_MERCHANT_TOKEN=your_merchant_token_here  # Recommended
RECHARGE_SESSION_TOKEN=optional_session_token     # Optional

# Improved naming
RECHARGE_STOREFRONT_DOMAIN=shop.myshopify.com     # Clearer naming

# Debug and monitoring
DEBUG=true                                         # Enhanced debugging
LOG_LEVEL=INFO                                     # Structured logging
```

#### Deprecated Variables

None in 1.0.0 (initial stable release).

### Docker Configuration

#### New Docker Features in 1.0.0

```yaml
# docker-compose.yml - Production ready
version: '3.8'
services:
  recharge-storefront-api-mcp:
    build: .
    environment:
      - RECHARGE_STOREFRONT_DOMAIN=${RECHARGE_STOREFRONT_DOMAIN}
      - RECHARGE_MERCHANT_TOKEN=${RECHARGE_MERCHANT_TOKEN}
    restart: unless-stopped
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## API Changes

### Tool Interface Changes

#### Authentication Parameters

**All tools now support consistent authentication:**

```json
{
  "name": "any_tool",
  "arguments": {
    // Automatic session management (recommended)
    "customer_email": "customer@example.com",
    
    // Or explicit customer ID
    "customer_id": "123456",
    
    // Or explicit session token
    "session_token": "session_token_here",
    
    // Optional overrides
    "merchant_token": "override_merchant_token",
    "store_url": "override-shop.myshopify.com"
  }
}
```

#### Error Response Format

**Enhanced error responses with guidance:**

```json
{
  "error": {
    "code": -32603,
    "message": "Detailed error message with specific guidance and troubleshooting steps"
  }
}
```

### New Features in 1.0.0

1. **Multi-Customer Support** - Handle multiple customers in single connection
2. **Session Caching** - Automatic session management and caching
3. **Circuit Breaker** - Resilience against API failures
4. **Retry Logic** - Exponential backoff for failed requests
5. **Structured Logging** - JSON-formatted logs for better parsing
6. **Type Validation** - Runtime validation of API responses

## Best Practices for Upgrades

### Pre-Upgrade Checklist

1. **Review changelog** for your current version to target version
2. **Test in development environment** before production upgrade
3. **Backup configuration files** and any customizations
4. **Document current integration** for rollback if needed
5. **Plan maintenance window** for production upgrades

### Upgrade Process

#### 1. Development Environment Testing

```bash
# Create test environment
git checkout -b upgrade-test
npm install recharge-storefront-api-mcp@latest

# Update configuration
cp .env.example .env.test
# Edit .env.test with test credentials

# Run comprehensive tests
npm run test:full
DEBUG=true npm start
```

#### 2. Staging Environment Deployment

```bash
# Deploy to staging
./scripts/deploy.sh staging

# Run integration tests
npm run test:integration

# Monitor for issues
docker logs -f recharge-storefront-api-mcp
```

#### 3. Production Deployment

```bash
# Deploy to production
./scripts/deploy.sh production

# Monitor deployment
npm run health
docker ps
docker logs recharge-storefront-api-mcp
```

### Post-Upgrade Verification

#### 1. Functional Testing

```bash
# Test core functionality
npm run validate
npm run coverage

# Test authentication flows
DEBUG=true npm start
# Make test tool calls
```

#### 2. Performance Monitoring

```bash
# Monitor resource usage
docker stats recharge-storefront-api-mcp

# Check logs for errors
docker logs --tail=100 recharge-storefront-api-mcp

# Monitor API response times
# (Enable debug mode to see timing information)
```

#### 3. Integration Testing

Test your MCP client integration:

```json
// Test basic functionality
{
  "name": "get_customer",
  "arguments": {"customer_email": "test@example.com"}
}

// Test error handling
{
  "name": "get_customer",
  "arguments": {"customer_email": "nonexistent@example.com"}
}

// Test multi-customer support
{
  "name": "get_customer",
  "arguments": {"customer_email": "customer1@example.com"}
}
{
  "name": "get_customer", 
  "arguments": {"customer_email": "customer2@example.com"}
}
```

### Rollback Procedures

If issues occur after upgrade:

#### 1. Quick Rollback

```bash
# Rollback to previous version
npm install recharge-storefront-api-mcp@previous-version

# Restore configuration
cp .env.backup .env

# Restart service
npm start
```

#### 2. Docker Rollback

```bash
# Rollback Docker deployment
docker tag recharge-storefront-api-mcp:previous recharge-storefront-api-mcp:latest
docker compose restart

# Or use specific version
docker pull recharge-storefront-api-mcp:previous-version
docker compose up -d
```

### Common Upgrade Issues

#### Issue: Configuration Not Found

**Solution:**
```bash
# Verify .env file format
cat .env | grep -v '^#' | grep '='

# Check for required variables
npm run validate
```

#### Issue: Authentication Failures

**Solution:**
```bash
# Test tokens directly
curl -H "X-Recharge-Access-Token: $RECHARGE_MERCHANT_TOKEN" \
     "https://api.rechargeapps.com/store"

# Enable debug mode
DEBUG=true npm start
```

#### Issue: Docker Build Failures

**Solution:**
```bash
# Clean Docker cache
docker system prune -f

# Rebuild from scratch
docker build --no-cache -t recharge-storefront-api-mcp .
```

### Support During Migration

#### Getting Help

1. **Check troubleshooting guide** - See [troubleshooting-guide.md](troubleshooting-guide.md)
2. **Enable debug mode** - Use `DEBUG=true` for detailed logs
3. **Review examples** - See [api-examples.md](api-examples.md)
4. **GitHub Issues** - Report migration-specific issues
5. **GitHub Discussions** - Ask questions about upgrade process

#### Migration Support Checklist

When asking for help, provide:

- [ ] Current version and target version
- [ ] Configuration files (sanitized)
- [ ] Error messages and logs
- [ ] Steps to reproduce issues
- [ ] Environment details (Node.js version, OS, etc.)

This migration guide should help you successfully upgrade to newer versions of the Recharge Storefront API MCP Server. Always test thoroughly in development environments before upgrading production systems.