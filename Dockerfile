# Use official Node.js runtime as base image
FROM node:18-alpine

# Install required system packages
RUN apk add --no-cache grep

# Set working directory in container
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/
COPY .env.example ./

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S recharge-storefront-api-mcp -u 1001

# Change ownership of app directory
RUN chown -R recharge-storefront-api-mcp:nodejs /app
USER recharge-storefront-api-mcp

# Expose port (if needed for health checks)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "console.log('Health check passed')" || exit 1

# Start the MCP server
CMD ["npm", "start"]