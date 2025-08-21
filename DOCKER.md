# Docker Deployment Guide

This guide covers Docker deployment options for the Recharge Storefront API MCP Server.

## Prerequisites

- Docker installed on your system
- Docker Compose installed
- `.env` file configured with your Recharge credentials

## Quick Start

### 1. Build and Run with Docker Compose

```bash
# Development environment
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Production environment
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### 2. Using NPM Scripts

```bash
# Build Docker image
npm run docker:build

# Run in development mode
npm run docker:run

# View logs
npm run docker:logs

# Stop containers
npm run docker:stop
```

## Configuration Files

### docker-compose.yml (Base Configuration)

The base configuration includes:
- Service definition for the MCP server
- Environment variable mapping
- Volume mounts for logs
- Network configuration
- Health check service

### docker-compose.dev.yml (Development Overrides)

Development-specific settings:
- Debug mode enabled
- Source code volume mounting for hot reload
- Port exposure for debugging
- Development command override

### docker-compose.prod.yml (Production Overrides)

Production-specific settings:
- Restart policies
- Resource limits
- Logging configuration
- Performance optimizations

## Environment Variables

The following environment variables are required:

```bash
RECHARGE_STOREFRONT_DOMAIN=your-shop.myshopify.com
RECHARGE_ACCESS_TOKEN=your_access_token_here
MCP_SERVER_NAME=recharge-storefront-api-mcp
MCP_SERVER_VERSION=1.0.0
```

## Deployment Environments

### Development Deployment

```bash
# Start development environment
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# View logs
docker-compose logs -f recharge-storefront-api-mcp

# Access container shell
docker-compose exec recharge-storefront-api-mcp sh
```

### Production Deployment

```bash
# Start production environment
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Check status
docker-compose ps

# View logs (limited in production)
docker-compose logs --tail=100 recharge-storefront-api-mcp
```

## Using the Deploy Script

The automated deployment script handles different environments:

```bash
# Deploy to development
./scripts/deploy.sh development

# Deploy to staging
./scripts/deploy.sh staging

# Deploy to production
./scripts/deploy.sh production
```

The script will:
1. Validate the environment parameter
2. Run pre-deployment checks
3. Build the Docker image
4. Deploy using the appropriate compose files
5. Show deployment status

## Monitoring and Maintenance

### Health Checks

The container includes built-in health checks:

```bash
# Check container health
docker-compose ps

# View health check logs
docker inspect --format='{{json .State.Health}}' recharge-storefront-api-mcp_recharge-storefront-api-mcp_1
```

### Log Management

```bash
# View real-time logs
docker-compose logs -f recharge-storefront-api-mcp

# View last 100 lines
docker-compose logs --tail=100 recharge-storefront-api-mcp

# Export logs to file
docker-compose logs recharge-storefront-api-mcp > server.log
```

### Container Management

```bash
# Restart the service
docker-compose restart recharge-storefront-api-mcp

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Rebuild and restart
docker-compose up -d --build
```

## Troubleshooting Docker Issues

### Container Won't Start

1. **Check environment variables:**
   ```bash
   docker-compose config
   ```

2. **Verify .env file:**
   ```bash
   cat .env
   ```

3. **Check container logs:**
   ```bash
   docker-compose logs recharge-storefront-api-mcp
   ```

### Environment Variables Not Loading

1. **Ensure .env file exists in project root**
2. **Check .env file format (no spaces around =)**
3. **Verify docker-compose.yml environment section**

### Permission Issues

```bash
# Fix ownership issues
sudo chown -R $USER:$USER .

# Check container user
docker-compose exec recharge-storefront-api-mcp whoami
```

### Network Issues

```bash
# Check network configuration
docker network ls
docker network inspect recharge-storefront-network

# Recreate network
docker-compose down
docker-compose up -d
```

### Resource Issues

```bash
# Check resource usage
docker stats $(docker-compose ps -q recharge-storefront-api-mcp)

# Adjust resource limits in docker-compose.prod.yml
```

## Security Considerations

### Production Security

1. **Use non-root user** (already configured in Dockerfile)
2. **Limit resource usage** (configured in docker-compose.prod.yml)
3. **Secure environment variables:**
   ```bash
   # Use Docker secrets for sensitive data
   echo "your_token" | docker secret create recharge_token -
   ```

4. **Network isolation:**
   ```bash
   # Use custom networks
   docker network create --driver bridge recharge-network
   ```

### Environment Variable Security

- Never commit `.env` files to version control
- Use Docker secrets in production
- Rotate API tokens regularly
- Monitor access logs

## Performance Optimization

### Resource Limits

Configure appropriate limits in `docker-compose.prod.yml`:

```yaml
deploy:
  resources:
    limits:
      memory: 512M
      cpus: '0.5'
    reservations:
      memory: 256M
      cpus: '0.25'
```

### Logging Optimization

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

## Multi-Environment Setup

### Using Environment-Specific Files

```bash
# Development
cp .env.example .env.dev
# Edit .env.dev with development settings

# Production
cp .env.example .env.prod
# Edit .env.prod with production settings
```

### Automated Deployment Pipeline

```bash
#!/bin/bash
# deploy-pipeline.sh

ENVIRONMENT=$1
ENV_FILE=".env.${ENVIRONMENT}"

if [ -f "$ENV_FILE" ]; then
    cp "$ENV_FILE" .env
    ./scripts/deploy.sh "$ENVIRONMENT"
else
    echo "Environment file $ENV_FILE not found"
    exit 1
fi
```

## Backup and Recovery

### Data Backup

```bash
# Backup logs
docker cp $(docker-compose ps -q recharge-storefront-api-mcp):/app/logs ./backup/logs-$(date +%Y%m%d)

# Backup configuration
tar -czf backup/config-$(date +%Y%m%d).tar.gz .env docker-compose*.yml
```

### Recovery Procedures

```bash
# Restore from backup
docker-compose down
# Restore configuration files
docker-compose up -d
```

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to production
        run: |
          echo "${{ secrets.ENV_PROD }}" > .env
          ./scripts/deploy.sh production
```
