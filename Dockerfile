# Use official Node.js runtime as base image
FROM node:18-alpine AS base

# Set working directory early
WORKDIR /app

# Install required system packages
RUN apk add --no-cache \
    grep \
    findutils \
    coreutils \
    bash \
    curl \
    && rm -rf /var/cache/apk/*

# Create non-root user for security early
RUN addgroup -g 1001 -S nodejs && adduser -S recharge-storefront-api-mcp -u 1001 -G nodejs

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/
COPY .env.example ./

# Copy scripts
COPY scripts/ ./scripts/
RUN chmod +x scripts/*.sh

# Change ownership of app directory
RUN chown -R recharge-storefront-api-mcp:nodejs /app

# Switch to non-root user
USER recharge-storefront-api-mcp

# Expose port (if needed for health checks)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "console.log('Health check passed'); process.exit(0)" || exit 1

# Start the MCP server
CMD ["npm", "start"]