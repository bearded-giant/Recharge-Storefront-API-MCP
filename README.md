# Recharge Storefront API MCP Server

A comprehensive Model Context Protocol (MCP) server that provides complete access to the Recharge Storefront API. This server enables AI assistants and other MCP clients to interact with Recharge subscription management functionality through a standardized interface.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Authentication](#authentication)
- [Configuration](#configuration)
- [Usage](#usage)
- [Available Tools](#available-tools)
- [Examples](#examples)
- [Development](#development)
- [Docker Deployment](#docker-deployment)
- [Troubleshooting](#troubleshooting)
- [Security](#security)
- [Contributing](#contributing)
- [License](#license)

## Overview

The Recharge Storefront API MCP Server bridges the gap between AI assistants and Recharge's subscription management platform. It provides a complete, production-ready interface to all Recharge Storefront API endpoints through the standardized Model Context Protocol.

### What is Recharge?

Recharge is a leading subscription commerce platform that powers recurring billing for Shopify stores. It handles subscription management, billing cycles, customer portals, and recurring order processing for thousands of merchants.

### What is MCP?

Model Context Protocol (MCP) is a standardized way for AI assistants to interact with external services and APIs. This server implements MCP to make Recharge's functionality accessible to AI systems.

### Key Benefits

- **Complete API Coverage**: All 37 Recharge Storefront API endpoints
- **Intelligent Authentication**: Automatic session management with multi-customer support
- **Production Ready**: Docker support, error handling, logging, and monitoring
- **Developer Friendly**: Comprehensive documentation, examples, and debugging tools
- **Secure**: Built-in security protections and customer data isolation

## Features

### Complete Storefront API Coverage

| Category | Tools | Description |
|----------|-------|-------------|
| **Customer Management** | 4 tools | Profile management, lookup, and session creation |
| **Subscription Lifecycle** | 10 tools | Create, update, cancel, skip, swap, and activate subscriptions |
| **Address Management** | 5 tools | Full CRUD operations for shipping and billing addresses |
| **Payment Methods** | 3 tools | View and update payment information |
| **Product Catalog** | 2 tools | Browse subscription products and variants |
| **Order Management** | 2 tools | View order history and tracking |
| **Charge Management** | 2 tools | Billing and payment tracking |
| **One-time Products** | 5 tools | Add products to upcoming deliveries |
| **Bundle Management** | 7 tools | Product bundle and selection management |
| **Discount System** | 4 tools | Apply and manage discount codes |

### Advanced Features

- **Automatic Session Management**: Intelligent session creation and caching
- **Multi-Customer Support**: Handle multiple customers in a single MCP connection
- **Flexible Authentication**: Environment variables, per-tool parameters, or explicit tokens
- **Comprehensive Error Handling**: Detailed error messages with actionable guidance
- **Debug Mode**: Extensive logging for development and troubleshooting
- **Input Validation**: Zod schema validation for all tool parameters
- **Security Protection**: Prevents accidental customer data exposure

## Prerequisites

### Required

- **Node.js**: Version 18.0.0 or higher
- **Shopify Store**: Must have a Shopify store with Recharge installed
- **Recharge Account**: Active Recharge merchant account
- **API Access**: Recharge Storefront API access token

### System Requirements

- **Memory**: Minimum 256MB RAM (512MB recommended for production)
- **Storage**: 100MB available disk space
- **Network**: Internet connection for API access
- **Platform**: Linux, macOS, or Windows (Docker recommended for Windows)

## Installation

### Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd recharge-storefront-api-mcp

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Start the server
npm start
```

### Automated Setup

```bash
# Run the setup script
npm run setup
```

The setup script will:
- Validate Node.js version
- Install dependencies
- Create environment file
- Validate configuration
- Check for Docker (optional)
- Display project statistics

### Verification

```bash
# Validate installation
npm run validate

# Run comprehensive tests
npm run test:full

# Check API coverage
npm run coverage
```

## Authentication

### Understanding Recharge Authentication

Recharge uses a two-step authentication process:

1. **Merchant Token**: Authenticates your application with Recharge
2. **Customer Session**: Scopes operations to a specific customer

```
Merchant Token + Customer ID → Customer Session → API Operations
```

### Getting Your API Token

1. **Log into Recharge**: Access your merchant portal
2. **Navigate to API Tokens**: Go to Apps & integrations > API tokens
3. **Create Storefront Token**: Create a new **Storefront API** token (not Admin API)
4. **Copy Token**: Save the token (starts with your store prefix)

⚠️ **Important**: Use **Storefront API** tokens, not Admin API tokens.

### Authentication Methods

The server supports three flexible authentication approaches:

#### Method 1: Customer Email (Recommended)

The simplest approach - just provide the customer's email address:

```json
{
  "name": "get_subscriptions",
  "arguments": {
    "customer_email": "customer@example.com"
  }
}
```

**What happens automatically:**
1. 📧 Email lookup → Customer ID
2. 🔑 Customer ID → Session token  
3. 📊 Session token → Customer data
4. 💾 Session cached for future calls

#### Method 2: Customer ID

If you already have the customer ID:

```json
{
  "name": "get_subscriptions",
  "arguments": {
    "customer_id": "123456"
  }
}
```

#### Method 3: Explicit Session Token

For advanced use cases with existing session tokens:

```json
{
  "name": "get_subscriptions",
  "arguments": {
    "session_token": "existing_session_token"
  }
}
```

### Automatic Session Management

The server intelligently manages customer sessions:

#### Session Creation Flow

```
Customer Email/ID → Lookup → Session Creation → API Call → Cached Session
```

#### Session Persistence

Sessions are cached within your MCP connection with automatic renewal:

```json
// First call - creates and caches session
{
  "name": "get_customer",
  "arguments": {"customer_email": "alice@example.com"}
}

// Subsequent calls - reuses cached session (fast!)
{
  "name": "get_subscriptions", 
  "arguments": {"customer_email": "alice@example.com"}
}

// Different customer - creates new cached session
{
  "name": "get_orders",
  "arguments": {"customer_email": "bob@example.com"}
}
```

#### Automatic Session Renewal

- **⏰ Expiry Tracking**: Sessions expire after 1 hour, server tracks expiry times
- **🔄 Auto Renewal**: Expired sessions automatically renewed on next API call
- **🛡️ Retry Logic**: Failed calls due to expired sessions automatically retried with fresh session
- **📊 Smart Caching**: Sessions renewed 5 minutes before expiry to prevent failures

#### Performance Benefits

- ⚡ **Fast**: No repeated session creation
- 🧠 **Smart**: Email lookups cached too
- 🔒 **Isolated**: Each customer gets separate session
- 🔄 **Automatic**: Works transparently

### Multi-Customer Support

Handle multiple customers seamlessly:

```json
// Customer A operations
{"name": "get_customer", "arguments": {"customer_email": "alice@example.com"}}
{"name": "get_subscriptions", "arguments": {"customer_email": "alice@example.com"}}

// Customer B operations  
{"name": "get_customer", "arguments": {"customer_email": "bob@example.com"}}
{"name": "get_orders", "arguments": {"customer_email": "bob@example.com"}}

// Back to Customer A - reuses cached session
{"name": "get_addresses", "arguments": {"customer_email": "alice@example.com"}}
```

### Security Protection

The server includes built-in security protections:

#### Preventing Wrong Customer Data

```json
// Safe: Default session when no customer sessions exist
{"name": "get_subscriptions", "arguments": {}}  // ✅ Uses default session

// Dangerous: Could expose wrong customer data
{"name": "get_customer", "arguments": {"customer_email": "alice@example.com"}}
{"name": "get_subscriptions", "arguments": {}}  // ❌ BLOCKED! Security error

// Safe: Always specify customer identification
{"name": "get_subscriptions", "arguments": {"customer_email": "alice@example.com"}}  // ✅ Safe
```

**Security Error Message:**
```
Security Error: Cannot use default session token when customer-specific sessions exist. 
Please specify 'customer_id', 'customer_email', or 'session_token' to ensure correct customer data access.
```

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```bash
# Required: Your Shopify domain
RECHARGE_STOREFRONT_DOMAIN=your-shop.myshopify.com

# Required: Merchant token for session creation
RECHARGE_MERCHANT_TOKEN=your_merchant_token_here

# Optional: Default session token (if you have one)
RECHARGE_SESSION_TOKEN=existing_session_token

# Optional: Server configuration
MCP_SERVER_NAME=recharge-storefront-api-mcp
MCP_SERVER_VERSION=1.0.0

# Optional: Enable debug logging
DEBUG=true
```

### Configuration Options

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `RECHARGE_STOREFRONT_DOMAIN` | Yes* | Your Shopify domain | `shop.myshopify.com` |
| `RECHARGE_MERCHANT_TOKEN` | Yes* | Merchant token for session creation | `your_token_here` |
| `RECHARGE_SESSION_TOKEN` | No | Default session token | `session_abc123` |
| `MCP_SERVER_NAME` | No | Server identification | `recharge-mcp` |
| `MCP_SERVER_VERSION` | No | Server version | `1.0.0` |
| `DEBUG` | No | Enable debug logging | `true` |

*Required unless provided in each tool call

### Per-Tool Configuration

Override environment variables in individual tool calls:

```json
{
  "name": "get_subscriptions",
  "arguments": {
    "store_url": "different-shop.myshopify.com",
    "merchant_token": "different_token",
    "customer_email": "customer@example.com"
  }
}
```

### Configuration Validation

```bash
# Validate configuration
npm run validate

# Test environment setup
npm run test:api-keys

# Check configuration format
node -e "require('dotenv').config(); console.log('✅ Configuration loaded')"
```

## Usage

### Starting the Server

```bash
# Production mode
npm start

# Development mode with file watching
npm run dev

# Development with debug logging
npm run dev:debug

# Debug mode (production)
DEBUG=true npm start
```

### Basic Usage Pattern

1. **Start Server**: `npm start`
2. **Connect MCP Client**: Point your MCP client to the server
3. **Make Tool Calls**: Use any of the 37 available tools
4. **Automatic Sessions**: Server handles authentication automatically

### Common Workflows

#### Customer Service Workflow

```json
// 1. Look up customer
{
  "name": "get_customer",
  "arguments": {"customer_email": "customer@example.com"}
}

// 2. Check their subscriptions
{
  "name": "get_subscriptions", 
  "arguments": {"customer_email": "customer@example.com"}
}

// 3. View recent orders
{
  "name": "get_orders",
  "arguments": {"customer_email": "customer@example.com"}
}
```

#### Subscription Management Workflow

```json
// 1. Get subscription details
{
  "name": "get_subscription",
  "arguments": {
    "customer_email": "customer@example.com",
    "subscription_id": "sub_123"
  }
}

// 2. Skip next delivery
{
  "name": "skip_subscription",
  "arguments": {
    "customer_email": "customer@example.com", 
    "subscription_id": "sub_123",
    "date": "2024-02-15"
  }
}
```

## Available Tools

### Customer Management (4 tools)

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `get_customer` | Get current customer information | `customer_email` or `customer_id` |
| `update_customer` | Update customer profile | `email`, `first_name`, `last_name`, `phone` |
| `get_customer_by_email` | Find customer by email (returns ID) | `email` |
| `create_customer_session_by_id` | Create session manually | `customer_id`, `return_url` |

### Subscription Management (10 tools)

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `get_subscriptions` | List customer subscriptions | `status`, `limit`, `page` |
| `get_subscription` | Get subscription details | `subscription_id` |
| `create_subscription` | Create new subscription | `address_id`, `variant_id`, `quantity`, `frequency` |
| `update_subscription` | Modify subscription | `subscription_id`, `quantity`, `frequency` |
| `skip_subscription` | Skip delivery date | `subscription_id`, `date` |
| `unskip_subscription` | Restore skipped delivery | `subscription_id`, `date` |
| `swap_subscription` | Change product variant | `subscription_id`, `variant_id` |
| `cancel_subscription` | Cancel subscription | `subscription_id`, `reason` |
| `activate_subscription` | Reactivate subscription | `subscription_id` |
| `set_subscription_next_charge_date` | Set next charge date | `subscription_id`, `date` |

### Address Management (5 tools)

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `get_addresses` | List customer addresses | - |
| `get_address` | Get address details | `address_id` |
| `create_address` | Add new address | `address1`, `city`, `province`, `zip`, `country` |
| `update_address` | Modify address | `address_id`, address fields |
| `delete_address` | Remove address | `address_id` |

### Payment Methods (3 tools)

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `get_payment_methods` | List payment methods | - |
| `get_payment_method` | Get payment details | `payment_method_id` |
| `update_payment_method` | Update billing info | `payment_method_id`, billing fields |

### Product Catalog (2 tools)

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `get_products` | Browse available products | `limit`, `handle` |
| `get_product` | Get product details | `product_id` |

### Order & Charge History (4 tools)

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `get_orders` | List customer orders | `status`, `limit`, `page` |
| `get_order` | Get order details | `order_id` |
| `get_charges` | List charges | `status`, `limit`, `page` |
| `get_charge` | Get charge details | `charge_id` |

### One-time Products (5 tools)

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `get_onetimes` | List one-time products | - |
| `get_onetime` | Get one-time details | `onetime_id` |
| `create_onetime` | Add to next delivery | `variant_id`, `quantity`, `next_charge_scheduled_at` |
| `update_onetime` | Modify one-time product | `onetime_id`, update fields |
| `delete_onetime` | Remove one-time product | `onetime_id` |

### Bundle Management (7 tools)

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `get_bundles` | List customer bundles | `subscription_id` |
| `get_bundle` | Get bundle details | `bundle_id` |
| `get_bundle_selections` | List bundle selections | `bundle_id` |
| `get_bundle_selection` | Get selection details | `bundle_selection_id` |
| `create_bundle_selection` | Create selection | `bundle_id`, `variant_id`, `quantity` |
| `update_bundle_selection` | Update selection | `bundle_selection_id`, update fields |
| `delete_bundle_selection` | Remove selection | `bundle_selection_id` |

### Discount Management (4 tools)

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `get_discounts` | List applied discounts | - |
| `get_discount` | Get discount details | `discount_id` |
| `apply_discount` | Apply discount code | `discount_code` |
| `remove_discount` | Remove discount | `discount_id` |

## Examples

### Complete Customer Service Example

```json
// 1. Find customer by email
{
  "name": "get_customer_by_email",
  "arguments": {
    "email": "customer@example.com"
  }
}

// 2. Get customer details (automatic session creation)
{
  "name": "get_customer",
  "arguments": {
    "customer_email": "customer@example.com"
  }
}

// 3. Check active subscriptions
{
  "name": "get_subscriptions",
  "arguments": {
    "customer_email": "customer@example.com",
    "status": "active"
  }
}

// 4. View recent orders
{
  "name": "get_orders",
  "arguments": {
    "customer_email": "customer@example.com",
    "limit": 5
  }
}

// 5. Check upcoming charges
{
  "name": "get_charges",
  "arguments": {
    "customer_email": "customer@example.com",
    "status": "queued"
  }
}
```

### Subscription Management Example

```json
// 1. Get subscription details
{
  "name": "get_subscription",
  "arguments": {
    "customer_email": "customer@example.com",
    "subscription_id": "sub_123456"
  }
}

// 2. Update subscription frequency
{
  "name": "update_subscription",
  "arguments": {
    "customer_email": "customer@example.com",
    "subscription_id": "sub_123456",
    "order_interval_frequency": 2,
    "order_interval_unit": "month"
  }
}

// 3. Skip next delivery
{
  "name": "skip_subscription",
  "arguments": {
    "customer_email": "customer@example.com",
    "subscription_id": "sub_123456", 
    "date": "2024-02-15"
  }
}
```

### Multi-Customer Example

```json
// Customer A operations
{
  "name": "get_subscriptions",
  "arguments": {"customer_email": "alice@example.com"}
}

// Customer B operations
{
  "name": "get_orders", 
  "arguments": {"customer_email": "bob@example.com"}
}

// Back to Customer A (reuses cached session)
{
  "name": "get_addresses",
  "arguments": {"customer_email": "alice@example.com"}
}
```

### Error Handling Example

```json
// This will fail with helpful error message
{
  "name": "get_subscription",
  "arguments": {
    "subscription_id": "invalid_id"
  }
}

// Error response:
{
  "error": "API Error (404): Subscription not found (Code: SUBSCRIPTION_NOT_FOUND)",
  "tip": "Verify the subscription ID exists and you have access to it."
}
```

## Development

### Development Setup

```bash
# Clone and install
git clone <repository-url>
cd recharge-storefront-api-mcp
npm install

# Setup environment
npm run setup

# Start development server
npm run dev
```

### Development Commands

```bash
# Development with file watching
npm run dev

# Development with debug logging  
npm run dev:debug

# Validate code and configuration
npm run validate

# Run comprehensive tests
npm run test:full

# Check API coverage
npm run coverage

# View project statistics
npm run stats
```

### Code Quality

```bash
# Lint code
npm run lint

# Validate syntax
npm run validate

# Test API key logic
npm run test:api-keys

# Health check
npm run health
```

### Adding New Tools

1. **Create tool file**: `src/tools/new-feature-tools.js`
2. **Follow patterns**: Use existing tools as templates
3. **Add to index**: Export from `src/tools/index.js`
4. **Add client methods**: Implement in `src/recharge-client.js`
5. **Test thoroughly**: Use `npm run test:full`

### Debugging

Enable debug mode for detailed logging:

```bash
DEBUG=true npm start
```

Debug output includes:
- API request/response details
- Authentication flow tracing
- Session creation and caching
- Error stack traces
- Performance metrics

## Docker Deployment

### Quick Docker Setup

```bash
# Development
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Production  
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Docker Commands

```bash
# Build image
npm run docker:build

# Run containers
npm run docker:run

# View logs
npm run docker:logs

# Stop containers
npm run docker:stop

# Clean up
npm run docker:clean
```

### Automated Deployment

```bash
# Deploy to development
./scripts/deploy.sh development

# Deploy to production
./scripts/deploy.sh production
```

### Docker Configuration

- **Base**: `docker-compose.yml` - Core configuration
- **Development**: `docker-compose.dev.yml` - Debug mode, volume mounts
- **Production**: `docker-compose.prod.yml` - Resource limits, logging

See [DOCKER.md](DOCKER.md) for detailed deployment guide.

## Troubleshooting

### Common Issues

#### Authentication Errors

**Problem**: `Customer not found`
```bash
# Solution: Check customer ID and merchant token
# Ensure customer exists in Recharge system
# Verify merchant token has Storefront API permissions
```

**Problem**: `Invalid merchant token`
```bash
# Solution: Verify token type and permissions
# Use Storefront API token (not Admin API)
# Check token hasn't expired or been revoked
```

#### Configuration Issues

**Problem**: `No store URL available`
```bash
# Solution: Set environment variable or provide in tool calls
export RECHARGE_STOREFRONT_DOMAIN=your-shop.myshopify.com
```

**Problem**: `Domain must end with .myshopify.com`
```bash
# Solution: Use correct Shopify domain format
# Correct: shop.myshopify.com
# Incorrect: shop.com
```

#### Session Issues

**Problem**: `Session token expired`
```bash
# Solution: Sessions are automatically recreated
# Provide customer_id or customer_email in next call
```

**Problem**: `Security Error: Cannot use default session token`
```bash
# Solution: Always specify customer identification
# Add customer_email or customer_id to tool calls
```

### Debug Mode

Enable comprehensive debugging:

```bash
DEBUG=true npm start
```

Debug information includes:
- Authentication flow details
- API request/response logging
- Session creation and caching
- Error stack traces
- Performance metrics

### Getting Help

1. **Check Documentation**: Review this README and [DOCKER.md](DOCKER.md)
2. **Enable Debug Mode**: Use `DEBUG=true` for detailed logging
3. **Validate Setup**: Run `npm run validate` and `npm run test:full`
4. **Check Issues**: Search existing GitHub issues
5. **Create Issue**: Provide debug logs and reproduction steps

## Security

### Security Best Practices

#### API Token Security
- **Never commit tokens** to version control
- **Use environment variables** for sensitive data
- **Rotate tokens regularly** (recommended: every 90 days)
- **Use minimum required permissions**

#### Customer Data Protection
- **Always specify customer identification** in tool calls
- **Verify customer access** before operations
- **Use session tokens** for customer-scoped operations
- **Monitor for unusual access patterns**

#### Network Security
- **Use HTTPS** for all API communications
- **Implement proper firewall rules**
- **Monitor API usage** for anomalies
- **Set up rate limiting** if needed

### Security Features

#### Built-in Protections
- **Customer data isolation**: Each customer gets separate session
- **Wrong customer prevention**: Blocks ambiguous tool calls
- **Input validation**: Zod schema validation for all inputs
- **Error sanitization**: Sensitive data removed from logs

#### Production Security
- **Non-root container user**: Docker runs as non-privileged user
- **Resource limits**: Memory and CPU limits in production
- **Secure logging**: Sensitive data excluded from logs
- **Health checks**: Monitor service availability

### Reporting Security Issues

See [SECURITY.md](SECURITY.md) for security reporting guidelines.

## Contributing

### Getting Started

1. **Fork repository**: Create your own fork
2. **Create branch**: `git checkout -b feature/your-feature`
3. **Make changes**: Follow existing code patterns
4. **Test thoroughly**: Run `npm run test:full`
5. **Submit PR**: Include description and tests

### Development Guidelines

#### Code Standards
- **ESM modules**: Use modern JavaScript modules
- **Error handling**: Comprehensive error handling required
- **Input validation**: Use Zod schemas for all inputs
- **Documentation**: JSDoc comments for all functions
- **Testing**: Include tests for new functionality

#### Pull Request Process
- **Descriptive title**: Clear description of changes
- **Test coverage**: All tests must pass
- **Documentation**: Update README if needed
- **No breaking changes**: Or clearly document them

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

## Support

### Resources
- **Documentation**: This README and [DOCKER.md](DOCKER.md)
- **Security**: [SECURITY.md](SECURITY.md) for security guidelines
- **Contributing**: [CONTRIBUTING.md](CONTRIBUTING.md) for development
- **Changelog**: [CHANGELOG.md](CHANGELOG.md) for version history

### Getting Help
- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Questions and community support
- **Debug Mode**: Enable with `DEBUG=true` for troubleshooting

### Project Statistics
- **37 Tools**: Complete Recharge Storefront API coverage
- **10 Categories**: Comprehensive subscription management
- **Production Ready**: Docker, monitoring, error handling
- **Secure**: Built-in customer data protection
- **Well Documented**: Comprehensive guides and examples

---

*Built with ❤️ for the Recharge and MCP communities*