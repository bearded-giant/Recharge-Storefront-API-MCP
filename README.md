# Recharge Storefront API MCP Server

A comprehensive Model Context Protocol (MCP) server that provides tools for interacting with the Recharge Storefront API. This server enables AI assistants to manage subscription commerce operations including customer management, subscriptions, orders, addresses, payment methods, products, and more.

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-blue.svg)](https://modelcontextprotocol.io/)

## Table of Contents

- [Features](#features)
- [API Compliance](#api-compliance)
- [Quick Start](#quick-start)
- [Local Development Setup](#local-development-setup)
- [Setup](#setup)
- [Build & Deployment](#build--deployment)
- [Usage](#usage)
- [Available Tools](#available-tools)
- [Architecture](#architecture)
- [Error Handling](#error-handling)
- [Security](#security)
- [Development](#development)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## Features

### 🛍️ Core Customer Management
- **Customer Information**: Get and update customer details, preferences, and settings
- **Session Management**: Create, validate, and destroy customer sessions with secure authentication
- **Settings & Preferences**: Manage customer notification preferences, language, and timezone settings

### 📦 Comprehensive Subscription Management
- **Subscription Lifecycle**: List, view, update, skip, unskip, swap, cancel, and activate subscriptions
- **Delivery Control**: Set next charge dates and manage delivery schedules with precision
- **Flexible Frequency**: Update subscription frequency and quantity dynamically
- **Product Swapping**: Change subscription products while maintaining customer preferences

### 📍 Address Management
- **Address CRUD**: Create, read, update, and delete customer addresses with validation
- **Multiple Addresses**: Support for shipping and billing addresses with proper formatting
- **International Support**: Handle addresses across different countries and regions

### 📊 Order & Charge Management
- **Order Tracking**: List and view detailed order information with comprehensive status filtering
- **Charge History**: View charge history, status information, and payment details
- **Delivery Schedules**: Access and manage delivery schedule information

### 💳 Payment Management
- **Payment Methods**: List and update customer payment methods securely
- **Billing Information**: Update billing addresses for payment methods with validation

### 🏷️ Product Management
- **Product Catalog**: Browse available subscription products with filtering capabilities
- **Product Details**: Get detailed product information, variants, and pricing
- **Inventory Integration**: Real-time product availability and variant information

### 💰 Discount Management
- **Discount Codes**: Apply and remove discount codes with validation
- **Active Discounts**: View currently applied discounts and their details
- **Promotional Campaigns**: Support for various discount types and restrictions

### ➕ One-time Products
- **Add-on Products**: Add one-time products to existing subscriptions seamlessly
- **Flexible Scheduling**: Schedule one-time products for specific delivery dates
- **Product Properties**: Support for custom product properties and configurations

### 📦 Bundle Management
- **Bundle Selections**: Create, update, and manage product bundle selections
- **Variant Selection**: Choose specific variants within bundles with quantity control
- **Bundle Optimization**: Intelligent bundle recommendations and management

### 🔧 Advanced Features
- **Notifications**: View and manage customer notifications with read/unread status
- **Async Batch Operations**: Execute bulk operations efficiently with progress tracking
- **Shopify Integration**: Manage Shopify connector settings and synchronization
- **Store Information**: Access store configuration, settings, and operational data

## API Compliance

This MCP server is built to comply with the official **Recharge Storefront API v2021-11** specification:

✅ **Correct Base URL**: Uses the proper Recharge Storefront portal endpoint  
✅ **Proper Authentication**: Implements X-Recharge-Access-Token header authentication  
✅ **Accurate Endpoints**: All endpoints match the official API documentation  
✅ **Comprehensive Error Handling**: Detailed error handling with specific error messages  
✅ **Schema Validation**: Zod schema validation for all tool inputs with type safety  
✅ **Snake Case Fields**: All API fields use snake_case naming convention as per Recharge API standards  
✅ **Consistent Response Format**: All tools return standardized MCP response format  
✅ **Rate Limiting**: Respects API rate limits with proper timeout handling  

## Quick Start

### Automated Setup
```bash
# Clone the repository
git clone <repository-url>
cd recharge-mcp-server

# Run automated setup
npm run setup

# Edit .env with your credentials
nano .env

# Start the server
npm start
```

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your Recharge API credentials
```

### 3. Start the Server
```bash
npm start
```

### 4. Verify Installation
```bash
npm run validate
```

## Local Development Setup

### Prerequisites
- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher
- **Git**: For version control
- **Docker** (optional): For containerized deployment

### Step-by-Step Setup

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd recharge-mcp-server
   ```

2. **Automated Setup**
   ```bash
   npm run setup
   ```
   This script will:
   - Check Node.js version compatibility
   - Install all dependencies
   - Create .env file from template
   - Validate the installation

3. **Manual Setup** (alternative)
   ```bash
   # Install dependencies
   npm install
   
   # Copy environment template
   cp .env.example .env
   
   # Validate setup
   npm run validate
   ```

4. **Configure Environment**
   Edit `.env` file with your Recharge API credentials:
   ```env
   RECHARGE_STOREFRONT_DOMAIN=your-shop.myshopify.com
   RECHARGE_ACCESS_TOKEN=your_storefront_access_token_here
   ```

5. **Start Development Server**
   ```bash
   npm run dev  # Auto-reload on file changes
   ```

### Development Commands

```bash
# Development
npm run dev          # Start with auto-reload
npm run debug        # Start with debug logging
npm start            # Start production mode

# Testing & Validation
npm run test         # Run basic tests
npm run test:full    # Run comprehensive test suite
npm run validate     # Validate syntax and config
npm run lint         # Check code syntax

# Utilities
npm run clean        # Clean install dependencies
npm run health       # Health check
npm run version      # Show version
```

## Setup

### Prerequisites
- **Node.js**: Version 18.0.0 or higher
- **Recharge Account**: Active Recharge merchant account
- **Storefront API Token**: Valid Recharge Storefront API access token

### Environment Configuration

Create a `.env` file in the project root:

```env
# Recharge API Configuration
RECHARGE_STOREFRONT_DOMAIN=your-shop.myshopify.com
RECHARGE_ACCESS_TOKEN=your_storefront_access_token_here  # Optional: can be provided per tool call

# MCP Server Configuration
MCP_SERVER_NAME=recharge-mcp-server
MCP_SERVER_VERSION=1.0.0

# Optional: Enable debug logging
DEBUG=false
```

### API Token Configuration

The server supports two methods for providing API tokens:

1. **Environment Variable (Recommended for single-tenant usage)**:
   ```env
   RECHARGE_ACCESS_TOKEN=your_token_here
   ```

2. **Per-Tool Call (Recommended for multi-tenant usage)**:
   ```javascript
   // Each tool call can include an access_token parameter
   {
     "access_token": "your_token_here",
     "other_parameters": "..."
   }
   ```

**Token Precedence**: Tool-level tokens take precedence over environment variables, allowing for flexible multi-tenant configurations.

### Getting Your Recharge API Credentials

1. **Access Recharge Admin Panel**
   - Log into your Recharge merchant account
   - Navigate to **Apps & integrations** → **API tokens**

2. **Create Storefront API Token**
   - Click **Create API token**
   - Select **Storefront API** (not Admin API)
   - Configure required permissions:
     - Customer read/write
     - Subscription read/write
     - Address read/write
     - Payment method read/write
     - Order read
     - Product read

3. **Configure Domain**
   - Use your Shopify domain format: `your-shop.myshopify.com`
   - Ensure the domain matches your Recharge-enabled Shopify store

⚠️ **Important**: This server requires a **Storefront API** token, not an Admin API token. The two token types have different permissions and endpoints.

### Validation

Verify your setup with the validation command:

```bash
npm run validate
```

This command checks:
- ✅ Syntax validation of all JavaScript files
- ✅ Environment variable configuration (domain required, token optional)
- ✅ API token format and permissions
- ✅ Network connectivity to Recharge API

## Build & Deployment

### Local Build

This is a Node.js project that doesn't require a build step. However, you can validate and prepare for deployment:

```bash
# Validate everything is ready
npm run validate

# Run comprehensive tests
npm run test:full

# Check health
npm run health
```

### Docker Deployment

#### Quick Docker Setup
```bash
# Build and run with Docker Compose
npm run docker:build
npm run docker:run

# View logs
npm run docker:logs

# Stop containers
npm run docker:stop
```

#### Manual Docker Commands
```bash
# Build Docker image
docker build -t recharge-mcp-server .

# Run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f recharge-mcp-server

# Stop and remove containers
docker-compose down
```

#### Environment-Specific Deployment
```bash
# Development deployment
npm run deploy development

# Production deployment
npm run deploy production

# Or manually
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Production Deployment

#### Server Requirements
- **Node.js**: 18.0.0 or higher
- **Memory**: Minimum 256MB, recommended 512MB
- **CPU**: 1 core minimum
- **Storage**: 100MB for application + logs
- **Network**: HTTPS access to Recharge API

#### Deployment Steps

1. **Prepare Server**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js 18
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install Docker (optional)
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   ```

2. **Deploy Application**
   ```bash
   # Clone repository
   git clone <repository-url>
   cd recharge-mcp-server
   
   # Setup production environment
   npm run setup
   
   # Configure production environment
   nano .env
   
   # Deploy
   npm run deploy production
   ```

3. **Process Management** (without Docker)
   ```bash
   # Install PM2 for process management
   npm install -g pm2
   
   # Start with PM2
   pm2 start src/server.js --name recharge-mcp-server
   
   # Save PM2 configuration
   pm2 save
   pm2 startup
   ```

#### Health Monitoring
```bash
# Check container status
docker-compose ps

# View real-time logs
docker-compose logs -f recharge-mcp-server

# Health check
npm run health

# Monitor with PM2 (if not using Docker)
pm2 status
pm2 logs recharge-mcp-server
```

### Environment Configuration

#### Development Environment
```env
NODE_ENV=development
DEBUG=true
RECHARGE_STOREFRONT_DOMAIN=your-dev-shop.myshopify.com
RECHARGE_ACCESS_TOKEN=your_dev_token_here
```

#### Production Environment
```env
NODE_ENV=production
DEBUG=false
RECHARGE_STOREFRONT_DOMAIN=your-shop.myshopify.com
RECHARGE_ACCESS_TOKEN=your_production_token_here
MCP_SERVER_NAME=recharge-mcp-server
MCP_SERVER_VERSION=1.0.0
```

### Deployment Checklist

- [ ] Node.js 18+ installed
- [ ] Dependencies installed (`npm install`)
- [ ] Environment variables configured
- [ ] Validation passed (`npm run validate`)
- [ ] Tests passed (`npm run test:full`)
- [ ] Health check passed (`npm run health`)
- [ ] Firewall configured (if needed)
- [ ] SSL certificates configured (if exposing HTTP endpoints)
- [ ] Monitoring and logging configured
- [ ] Backup strategy implemented

## Usage

### Starting the Server

**Production Mode:**
```bash
npm start
```

**Development Mode (with auto-reload):**
```bash
npm run dev
```

**Debug Mode (with detailed logging):**
```bash
npm run debug
```

**Health Check:**
```bash
npm run health
```

## MCP Client Integration

The Recharge MCP Server can be integrated with various AI-powered development tools that support the Model Context Protocol (MCP). Below are detailed instructions for popular clients.

### 🎯 Cursor IDE Integration

Cursor IDE has built-in support for MCP servers. Here's how to configure it:

#### **1. Install the MCP Server**
```bash
# Clone and setup the server
git clone <repository-url>
cd recharge-mcp-server
npm run setup
```

#### **2. Configure Cursor**

**Option A: Using Cursor Settings UI**
1. Open Cursor IDE
2. Go to **Settings** → **Extensions** → **MCP Servers**
3. Click **Add MCP Server**
4. Configure:
   - **Name**: `recharge`
   - **Command**: `node`
   - **Args**: `["/absolute/path/to/recharge-mcp-server/src/server.js"]`
   - **Environment Variables**:
     ```json
     {
       "RECHARGE_STOREFRONT_DOMAIN": "your-shop.myshopify.com",
       "RECHARGE_ACCESS_TOKEN": "your_token_here"
     }
     ```

**Option B: Using Configuration File**
Create or edit `~/.cursor/mcp_servers.json`:
```json
{
  "mcpServers": {
    "recharge": {
      "command": "node",
      "args": ["/absolute/path/to/recharge-mcp-server/src/server.js"],
      "env": {
        "RECHARGE_STOREFRONT_DOMAIN": "your-shop.myshopify.com",
        "RECHARGE_ACCESS_TOKEN": "your_token_here"
      }
    }
  }
}
```

#### **3. Verify Integration**
1. Restart Cursor IDE
2. Open a new chat session
3. Type: "List my Recharge subscriptions"
4. The AI should now have access to Recharge tools

### 🤖 Claude Desktop Integration

Claude Desktop supports MCP servers through configuration files.

#### **1. Install the MCP Server**
```bash
# Clone and setup the server
git clone <repository-url>
cd recharge-mcp-server
npm run setup
```

#### **2. Configure Claude Desktop**

**macOS Configuration:**
Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "recharge": {
      "command": "node",
      "args": ["/absolute/path/to/recharge-mcp-server/src/server.js"],
      "env": {
        "RECHARGE_STOREFRONT_DOMAIN": "your-shop.myshopify.com",
        "RECHARGE_ACCESS_TOKEN": "your_token_here"
      }
    }
  }
}
```

**Windows Configuration:**
Edit `%APPDATA%\Claude\claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "recharge": {
      "command": "node",
      "args": ["C:\\absolute\\path\\to\\recharge-mcp-server\\src\\server.js"],
      "env": {
        "RECHARGE_STOREFRONT_DOMAIN": "your-shop.myshopify.com",
        "RECHARGE_ACCESS_TOKEN": "your_token_here"
      }
    }
  }
}
```

**Linux Configuration:**
Edit `~/.config/Claude/claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "recharge": {
      "command": "node",
      "args": ["/absolute/path/to/recharge-mcp-server/src/server.js"],
      "env": {
        "RECHARGE_STOREFRONT_DOMAIN": "your-shop.myshopify.com",
        "RECHARGE_ACCESS_TOKEN": "your_token_here"
      }
    }
  }
}
```

#### **3. Verify Integration**
1. Restart Claude Desktop
2. Look for the 🔌 icon indicating MCP servers are connected
3. Start a conversation and ask about Recharge subscriptions

### 🆚 VSCode with GitHub Copilot Integration

VSCode with Copilot can use MCP servers through extensions or direct integration.

#### **Method 1: Using MCP Extension**

1. **Install MCP Extension**
   - Open VSCode
   - Go to Extensions (Ctrl+Shift+X)
   - Search for "Model Context Protocol" or "MCP"
   - Install the MCP extension

2. **Configure MCP Server**
   - Open VSCode Settings (Ctrl+,)
   - Search for "MCP"
   - Add server configuration:
     ```json
     {
       "mcp.servers": {
         "recharge": {
           "command": "node",
           "args": ["/absolute/path/to/recharge-mcp-server/src/server.js"],
           "env": {
             "RECHARGE_STOREFRONT_DOMAIN": "your-shop.myshopify.com",
             "RECHARGE_ACCESS_TOKEN": "your_token_here"
           }
         }
       }
     }
     ```

#### **Method 2: Using Workspace Configuration**

Create `.vscode/settings.json` in your project:
```json
{
  "mcp.servers": {
    "recharge": {
      "command": "node",
      "args": ["./node_modules/.bin/recharge-mcp-server"],
      "env": {
        "RECHARGE_STOREFRONT_DOMAIN": "your-shop.myshopify.com",
        "RECHARGE_ACCESS_TOKEN": "your_token_here"
      }
    }
  }
}
```

#### **Method 3: Using Docker Integration**

For containerized environments:
```json
{
  "mcp.servers": {
    "recharge": {
      "command": "docker",
      "args": [
        "run", "--rm", "-i",
        "--env", "RECHARGE_STOREFRONT_DOMAIN=your-shop.myshopify.com",
        "--env", "RECHARGE_ACCESS_TOKEN=your_token_here",
        "recharge-mcp-server:latest"
      ]
    }
  }
}
```

### 🔧 Generic MCP Client Configuration

For other MCP-compatible clients, use this standard configuration:

```json
{
  "mcpServers": {
    "recharge": {
      "command": "node",
      "args": ["/path/to/recharge-mcp-server/src/server.js"],
      "env": {
        "RECHARGE_STOREFRONT_DOMAIN": "your-shop.myshopify.com",
        "RECHARGE_ACCESS_TOKEN": "your_token_here",
        "DEBUG": "false"
      }
    }
  }
}
```

### 🐳 Docker-based Integration

For clients that support Docker-based MCP servers:

#### **1. Build Docker Image**
```bash
cd recharge-mcp-server
npm run docker:build
```

#### **2. Configure Client**
```json
{
  "mcpServers": {
    "recharge": {
      "command": "docker",
      "args": [
        "run", "--rm", "-i",
        "--env-file", "/path/to/.env",
        "recharge-mcp-server:latest"
      ]
    }
  }
}
```

### 🔍 Troubleshooting MCP Integration

#### **Common Issues**

**1. Server Not Starting**
```bash
# Test server manually
cd recharge-mcp-server
npm start
# Should show: "Recharge MCP Server v1.0.0 running on stdio"
```

**2. Authentication Errors**
- Verify your `.env` file has correct credentials
- Test API connectivity:
```bash
npm run validate
```

**3. Path Issues**
- Use absolute paths in configuration files
- Verify Node.js is in PATH
- Check file permissions

**4. Environment Variables**
- Ensure environment variables are properly set
- Use quotes around values with special characters
- Verify domain format: `your-shop.myshopify.com`

#### **Debug Mode**
Enable debug logging in your MCP client configuration:
```json
{
  "env": {
    "DEBUG": "true",
    "RECHARGE_STOREFRONT_DOMAIN": "your-shop.myshopify.com",
    "RECHARGE_ACCESS_TOKEN": "your_token_here"
  }
}
```

#### **Verification Commands**
Test the integration by asking your AI assistant:
- "What Recharge tools are available?"
- "Show me my subscription information"
- "List my customer addresses"
- "What products are available for subscription?"

### 📋 Integration Checklist

- [ ] MCP server installed and configured
- [ ] Environment variables set correctly
- [ ] Client configuration file updated
- [ ] Server starts without errors
- [ ] Client recognizes MCP server (🔌 icon or similar)
- [ ] AI assistant can access Recharge tools
- [ ] Test queries return expected results
- [ ] Debug logging works (if needed)

### Integration with MCP Clients

This server follows the MCP protocol and can be integrated with any MCP-compatible client. The server communicates via stdio and provides structured tool definitions with comprehensive input validation.

Once integrated, your AI assistant will have access to all 40+ Recharge tools for comprehensive subscription commerce management.

## Available Tools

The server provides **48 comprehensive tools** covering all major Recharge Storefront API endpoints:

### 👤 Customer Management (2 tools)
- **`get_customer`**: Retrieve current customer information
  - **Parameters**: `access_token` (optional) - API token override
- **`update_customer`**: Update customer details
  - **Parameters**: `access_token` (optional), `email`, `first_name`, `last_name`, `phone`, `accepts_marketing` (all optional)

### 🔐 Session Management (3 tools)
- **`create_session`**: Create customer session with email
  - **Parameters**: `access_token` (optional), `email` (required)
- **`validate_session`**: Validate current session
  - **Parameters**: `access_token` (optional)
- **`destroy_session`**: Destroy current session (logout)
  - **Parameters**: `access_token` (optional)

### 📦 Subscription Management (10 tools)
- **`get_customer_subscriptions`**: List subscriptions with filtering
  - **Parameters**: `access_token` (optional), `status`, `limit`, `page` (all optional)
- **`get_subscription`**: Get detailed subscription information
  - **Parameters**: `access_token` (optional), `subscriptionId` (required)
- **`update_subscription`**: Modify subscription details
  - **Parameters**: `access_token` (optional), `subscriptionId` (required), `next_charge_scheduled_at`, `order_interval_frequency`, `order_interval_unit`, `quantity`, `variant_id`, `properties` (all optional)
- **`skip_subscription`**: Skip subscription delivery
  - **Parameters**: `access_token` (optional), `subscriptionId`, `date` (both required)
- **`unskip_subscription`**: Unskip subscription delivery
  - **Parameters**: `access_token` (optional), `subscriptionId`, `date` (both required)
- **`swap_subscription_product`**: Change subscription variant
  - **Parameters**: `access_token` (optional), `subscriptionId`, `variant_id` (both required), `quantity` (optional)
- **`pause_subscription`**: Pause subscription temporarily
  - **Parameters**: `access_token` (optional), `subscriptionId` (required), `pause_reason` (optional)
- **`resume_subscription`**: Resume paused subscription
  - **Parameters**: `access_token` (optional), `subscriptionId` (required)
- **`cancel_subscription`**: Cancel subscription
  - **Parameters**: `access_token` (optional), `subscriptionId` (required), `cancellation_reason`, `cancellation_reason_comments` (both optional)
- **`activate_subscription`**: Activate cancelled subscription
  - **Parameters**: `access_token` (optional), `subscriptionId` (required)
- **`set_subscription_next_charge_date`**: Set next charge date
  - **Parameters**: `access_token` (optional), `subscriptionId`, `date` (both required)

### 📍 Address Management (5 tools)
- **`get_addresses`**: List customer addresses
  - **Parameters**: `access_token` (optional)
- **`get_address`**: Get detailed address information
  - **Parameters**: `access_token` (optional), `addressId` (required)
- **`create_address`**: Create new address
  - **Parameters**: `access_token` (optional), `address1`, `city`, `province`, `zip`, `country`, `first_name`, `last_name` (all required), `address2`, `company`, `phone` (all optional)
- **`update_address`**: Update existing address
  - **Parameters**: `access_token` (optional), `addressId` (required), all address fields (optional for partial updates)
- **`delete_address`**: Delete address
  - **Parameters**: `access_token` (optional), `addressId` (required)

### 📋 Order & Charge Management (4 tools)
- **`get_orders`**: List customer orders
  - **Parameters**: `access_token` (optional), `status`, `limit`, `page` (all optional)
- **`get_order`**: Get detailed order information
  - **Parameters**: `access_token` (optional), `orderId` (required)
- **`get_charges`**: List customer charges
  - **Parameters**: `access_token` (optional), `status`, `limit`, `page` (all optional)
- **`get_charge`**: Get detailed charge information
  - **Parameters**: `access_token` (optional), `chargeId` (required)

### 💳 Payment Management (3 tools)
- **`get_payment_methods`**: List customer payment methods
  - **Parameters**: `access_token` (optional)
- **`get_payment_method`**: Get detailed payment method information
  - **Parameters**: `access_token` (optional), `paymentMethodId` (required)
- **`update_payment_method`**: Update payment method billing
  - **Parameters**: `access_token` (optional), `paymentMethodId` (required), billing address fields (all optional)

### 🏷️ Product Management (2 tools)
- **`get_products`**: List available products
  - **Parameters**: `access_token` (optional), `limit`, `handle`, `subscription_defaults` (all optional)
- **`get_product`**: Get detailed product information
  - **Parameters**: `access_token` (optional), `productId` (required)

### 💰 Discount Management (4 tools)
- **`get_discounts`**: List applied discounts
  - **Parameters**: `access_token` (optional)
- **`get_discount`**: Get detailed discount information
  - **Parameters**: `access_token` (optional), `discountId` (required)
- **`apply_discount`**: Apply discount code
  - **Parameters**: `access_token` (optional), `discount_code` (required)
- **`remove_discount`**: Remove discount
  - **Parameters**: `access_token` (optional), `discountId` (required)

### ➕ One-time Product Management (6 tools)
- **`get_onetimes`**: List one-time products
  - **Parameters**: `access_token` (optional)
- **`get_onetime`**: Get detailed one-time product information
  - **Parameters**: `access_token` (optional), `onetimeId` (required)
- **`create_onetime`**: Add one-time product
  - **Parameters**: `access_token` (optional), `variant_id`, `quantity`, `next_charge_scheduled_at` (all required), `price`, `properties` (both optional)
- **`update_onetime`**: Update one-time product
  - **Parameters**: `access_token` (optional), `onetimeId` (required), other fields (optional)
- **`delete_onetime`**: Remove one-time product
  - **Parameters**: `access_token` (optional), `onetimeId` (required)

### 📦 Bundle Selection Management (5 tools)
- **`get_bundle_selections`**: List bundle selections
  - **Parameters**: `access_token` (optional)
- **`get_bundle_selection`**: Get detailed bundle selection information
  - **Parameters**: `access_token` (optional), `bundleSelectionId` (required)
- **`create_bundle_selection`**: Create bundle selection
  - **Parameters**: `access_token` (optional), `bundle_id`, `variant_selections` (both required)
- **`update_bundle_selection`**: Update bundle selection
  - **Parameters**: `access_token` (optional), `bundleSelectionId` (required), `variant_selections` (optional)
- **`delete_bundle_selection`**: Delete bundle selection
  - **Parameters**: `access_token` (optional), `bundleSelectionId` (required)

### 🏪 Store & Settings Management (4 tools)
- **`get_store`**: Get store information
  - **Parameters**: `access_token` (optional)
- **`get_delivery_schedule`**: Get delivery schedule
  - **Parameters**: `access_token` (optional)
- **`get_settings`**: Get customer settings
  - **Parameters**: `access_token` (optional)
- **`update_settings`**: Update customer settings
  - **Parameters**: `access_token` (optional), `email_notifications`, `sms_notifications`, `language`, `timezone` (all optional)

### 🔔 Notification Management (3 tools)
- **`get_notifications`**: Get customer notifications
  - **Parameters**: `access_token` (optional)
- **`get_notification`**: Get detailed notification information
  - **Parameters**: `access_token` (optional), `notificationId` (required)
- **`mark_notification_as_read`**: Mark notification as read
  - **Parameters**: `access_token` (optional), `notificationId` (required)

### ⚡ Advanced Operations (4 tools)
- **`get_async_batch`**: Get batch operation status
  - **Parameters**: `access_token` (optional), `batchId` (required)
- **`create_async_batch`**: Create bulk operations
  - **Parameters**: `access_token` (optional), `operations` (required)
- **`get_shopify_connector`**: Get Shopify connector config
  - **Parameters**: `access_token` (optional)
- **`update_shopify_connector`**: Update Shopify connector
  - **Parameters**: `access_token` (optional), `sync_enabled`, `sync_frequency`, `webhook_url` (all optional)

## 🔑 API Token Management

All tools support flexible API token configuration:

### **Token Precedence**
1. **Tool-level token** (highest priority): `access_token` parameter in tool calls
2. **Environment variable** (fallback): `RECHARGE_ACCESS_TOKEN` in `.env`

### **Usage Examples**

**Environment Variable (Single-tenant)**:
```env
RECHARGE_ACCESS_TOKEN=sk_test_your_token_here
```

**Tool-level Token (Multi-tenant)**:
```javascript
{
  "access_token": "sk_test_customer_specific_token",
  "subscriptionId": "12345"
}
```

**Error Handling**:
- If no token is available in either location, tools return: "No API access token available. Please provide an access_token parameter or set RECHARGE_ACCESS_TOKEN environment variable."

## 📚 Sample Usage & Examples

This section provides comprehensive examples of how to use the Recharge MCP Server with AI assistants for common subscription commerce tasks.

### 🎯 Getting Started Examples

#### **Basic Customer Information**
```
User: "Show me my customer information"
AI Assistant: I'll retrieve your customer information from Recharge.

Tool Call: get_customer
### Testing Token Logic
```bash
# Test the API key precedence logic
npm run test:api-keys
```

Parameters: {}

Response: Customer Information:
{
  "id": 12345,
  "email": "customer@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890",
  "accepts_marketing": true,
  "created_at": "2024-01-15T10:30:00Z"
}
```

#### **List Active Subscriptions**
```
User: "What subscriptions do I have?"
AI Assistant: Let me check your active subscriptions.

Tool Call: get_customer_subscriptions
Parameters: {
  "status": "active",
  "limit": 10
}

Response: Customer Subscriptions:
{
  "subscriptions": [
    {
      "id": 67890,
      "status": "active",
      "next_charge_scheduled_at": "2024-02-15T00:00:00Z",
      "order_interval_frequency": "1",
      "order_interval_unit": "month",
      "quantity": 2,
      "product_title": "Premium Coffee Beans"
    }
  ]
}
```

### 🔧 Subscription Management Examples

#### **Skip Next Delivery**
```
User: "I need to skip my coffee delivery for February 15th"
AI Assistant: I'll skip your subscription delivery for February 15th.

Tool Call: skip_subscription
Parameters: {
  "subscriptionId": "67890",
  "date": "2024-02-15"
}

Response: Skipped Subscription:
{
  "subscription_id": 67890,
  "skipped_date": "2024-02-15",
  "next_charge_scheduled_at": "2024-03-15T00:00:00Z"
}
```

#### **Change Subscription Frequency**
```
User: "Change my coffee subscription to every 2 months instead of monthly"
AI Assistant: I'll update your subscription frequency to every 2 months.

Tool Call: update_subscription
Parameters: {
  "subscriptionId": "67890",
  "order_interval_frequency": "2",
  "order_interval_unit": "month"
}

Response: Updated Subscription:
{
  "id": 67890,
  "order_interval_frequency": "2",
  "order_interval_unit": "month",
  "next_charge_scheduled_at": "2024-04-15T00:00:00Z"
}
```

#### **Swap Product Variant**
```
User: "Switch my subscription from medium roast to dark roast coffee"
AI Assistant: I'll swap your subscription to the dark roast variant.

Tool Call: swap_subscription_product
Parameters: {
  "subscriptionId": "67890",
  "variant_id": 98765,
  "quantity": 2
}

Response: Swapped Subscription Product:
{
  "subscription_id": 67890,
  "variant_id": 98765,
  "product_title": "Premium Dark Roast Coffee Beans",
  "quantity": 2
}
```

### 📍 Address Management Examples

#### **Add New Shipping Address**
```
User: "Add a new shipping address: 123 Main St, New York, NY 10001"
AI Assistant: I'll add this new shipping address to your account.

Tool Call: create_address
Parameters: {
  "address1": "123 Main St",
  "city": "New York",
  "province": "NY",
  "zip": "10001",
  "country": "US",
  "first_name": "John",
  "last_name": "Doe"
}

Response: Created Address:
{
  "id": 54321,
  "address1": "123 Main St",
  "city": "New York",
  "province": "NY",
  "zip": "10001",
  "country": "US"
}
```

#### **Update Existing Address**
```
User: "Update my address to apartment 4B"
AI Assistant: I'll update your address to include apartment 4B.

Tool Call: update_address
Parameters: {
  "addressId": "54321",
  "address2": "Apt 4B"
}

Response: Updated Address:
{
  "id": 54321,
  "address1": "123 Main St",
  "address2": "Apt 4B",
  "city": "New York",
  "province": "NY"
}
```

### 💰 Discount & Pricing Examples

#### **Apply Discount Code**
```
User: "Apply discount code SAVE20 to my account"
AI Assistant: I'll apply the discount code SAVE20 to your account.

Tool Call: apply_discount
Parameters: {
  "discount_code": "SAVE20"
}

Response: Applied Discount:
{
  "id": 11111,
  "code": "SAVE20",
  "value": 20.0,
  "value_type": "percentage",
  "status": "active"
}
```

#### **Add One-time Product**
```
User: "Add a coffee mug to my next delivery"
AI Assistant: I'll add a coffee mug to your next subscription delivery.

Tool Call: create_onetime
Parameters: {
  "variant_id": 55555,
  "quantity": 1,
  "next_charge_scheduled_at": "2024-02-15",
  "price": 15.99
}

Response: One-time Product Created:
{
  "id": 77777,
  "variant_id": 55555,
  "quantity": 1,
  "price": 15.99,
  "product_title": "Premium Coffee Mug"
}
```

### 📊 Order & Charge History Examples

#### **View Recent Orders**
```
User: "Show me my last 5 orders"
AI Assistant: I'll retrieve your 5 most recent orders.

Tool Call: get_orders
Parameters: {
  "limit": 5,
  "page": 1
}

Response: Orders:
{
  "orders": [
    {
      "id": 88888,
      "status": "shipped",
      "total_price": "45.99",
      "created_at": "2024-01-15T10:00:00Z",
      "shipped_date": "2024-01-16T14:30:00Z"
    }
  ]
}
```

#### **Check Charge Status**
```
User: "What's the status of my latest charge?"
AI Assistant: Let me check your most recent charge status.

Tool Call: get_charges
Parameters: {
  "limit": 1,
  "page": 1
}

Response: Charges:
{
  "charges": [
    {
      "id": 99999,
      "status": "success",
      "total_price": "45.99",
      "processed_at": "2024-01-15T09:00:00Z"
    }
  ]
}
```

### 🔧 Advanced Usage Examples

#### **Multi-tenant with Custom API Token**
```
User: "Check subscriptions for customer with token sk_test_abc123"
AI Assistant: I'll check subscriptions using the provided API token.

Tool Call: get_customer_subscriptions
Parameters: {
  "access_token": "sk_test_abc123",
  "status": "active"
}

Response: Customer Subscriptions:
{
  "subscriptions": [...]
}
```

#### **Bulk Operations with Async Batch**
```
User: "Update multiple subscriptions to skip February deliveries"
AI Assistant: I'll create a batch operation to skip February deliveries for multiple subscriptions.

Tool Call: create_async_batch
Parameters: {
  "operations": [
    {
      "method": "POST",
      "path": "/subscriptions/67890/skip",
      "body": {"date": "2024-02-15"}
    },
    {
      "method": "POST", 
      "path": "/subscriptions/67891/skip",
      "body": {"date": "2024-02-15"}
    }
  ]
}

Response: Created Async Batch:
{
  "batch_id": "batch_123",
  "status": "processing",
  "operations_count": 2
}
```

### 🎯 Common Workflows

#### **Complete Subscription Pause Workflow**
```
User: "I'm going on vacation for 2 months, pause my subscriptions"
AI Assistant: I'll help you pause your subscriptions for your vacation.

Step 1 - Get active subscriptions:
Tool Call: get_customer_subscriptions
Parameters: {"status": "active"}

Step 2 - Pause each subscription:
Tool Call: pause_subscription
Parameters: {
  "subscriptionId": "67890",
  "pause_reason": "Customer vacation"
}

Response: Your subscriptions have been paused for your vacation. You can resume them anytime by asking me to resume your subscriptions.
```

#### **Address Change for All Subscriptions**
```
User: "I moved to a new address, update all my subscriptions"
AI Assistant: I'll help you update your address for all subscriptions.

Step 1 - Create new address:
Tool Call: create_address
Parameters: {
  "address1": "456 New Street",
  "city": "Boston",
  "province": "MA",
  "zip": "02101",
  "country": "US",
  "first_name": "John",
  "last_name": "Doe"
}

Step 2 - Get all subscriptions:
Tool Call: get_customer_subscriptions
Parameters: {"status": "active"}

Step 3 - Update each subscription with new address:
Tool Call: update_subscription
Parameters: {
  "subscriptionId": "67890",
  "shipping_address_id": "new_address_id"
}

Response: All your active subscriptions have been updated with your new address.
```

### 🛠️ Error Handling Examples

#### **Missing API Token**
```
User: "Get my customer info"
AI Assistant: I need an API token to access your Recharge account.

Tool Call: get_customer
Parameters: {}

Error Response: "No API access token available. Please provide an access_token parameter or set RECHARGE_ACCESS_TOKEN environment variable."

AI Assistant: I need your Recharge API token to access your account. You can either:
1. Set the RECHARGE_ACCESS_TOKEN environment variable
2. Provide the token in your request: "Get my customer info with token sk_test_your_token"
```

#### **Invalid Subscription ID**
```
User: "Skip subscription 99999 for next month"
AI Assistant: I'll try to skip that subscription.

Tool Call: skip_subscription
Parameters: {
  "subscriptionId": "99999",
  "date": "2024-02-15"
}

Error Response: "API Error (404): Subscription not found"

AI Assistant: I couldn't find a subscription with ID 99999. Let me show you your active subscriptions so you can choose the correct one.
```

### 💡 Pro Tips for AI Assistants

#### **Chaining Operations**
```
User: "Show me my subscriptions and skip the coffee one for next month"
AI Assistant: I'll first show your subscriptions, then skip the coffee subscription.

Step 1: get_customer_subscriptions → Find coffee subscription ID
Step 2: skip_subscription → Skip the identified subscription
Step 3: Confirm the action was completed
```

#### **Data Validation**
```
User: "Update my subscription frequency to every 3 weeks"
AI Assistant: I'll update your subscription to every 3 weeks.

Note: The AI should validate that "week" is a valid interval unit and "3" is a valid frequency before making the API call.
```

#### **Contextual Responses**
```
User: "When is my next delivery?"
AI Assistant: Let me check your subscription details.

Tool Call: get_customer_subscriptions
Response Analysis: Extract next_charge_scheduled_at from active subscriptions
Human-friendly Response: "Your next delivery is scheduled for February 15th, 2024."
```

These examples demonstrate the full capabilities of the Recharge MCP Server and show how AI assistants can provide natural, conversational interfaces for complex subscription management tasks.
## Architecture

The server follows a clean, modular architecture designed for maintainability and extensibility:

```
src/
├── server.js                 # Main MCP server implementation with request handling
├── recharge-client.js        # Recharge API client with all endpoints and authentication
├── utils/
│   └── error-handler.js      # Centralized error handling with custom error types
└── tools/                    # Tool implementations organized by domain
    ├── index.js              # Tool registry and exports
    ├── customer-tools.js     # Customer management operations
    ├── subscription-tools.js # Subscription lifecycle management
    ├── address-tools.js      # Address CRUD operations
    ├── order-tools.js        # Order tracking and history
    ├── charge-tools.js       # Charge management and history
    ├── payment-tools.js      # Payment method management
    ├── product-tools.js      # Product catalog and details
    ├── discount-tools.js     # Discount code management
    ├── onetimes-tools.js     # One-time product management
    ├── bundle-tools.js       # Bundle selection management
    ├── session-tools.js      # Session authentication management
    ├── store-tools.js        # Store information and configuration
    ├── settings-tools.js     # Customer preference management
    ├── notification-tools.js # Notification management
    ├── async-batch-tools.js  # Bulk operation management
    └── shopify-connector-tools.js # Shopify integration management
```

### Design Principles

- **🔧 Separation of Concerns**: Each tool category handles a specific domain with clear boundaries
- **🛡️ Centralized Error Handling**: All API calls use unified error handling with detailed logging
- **✅ Input Validation**: Comprehensive Zod schemas validate all inputs before API calls
- **📋 Standardized Responses**: All tools return consistent MCP response format
- **🧩 Modular Architecture**: Easy to extend with new tools and endpoints
- **📚 Comprehensive Documentation**: JSDoc comments for all methods and classes
- **🔍 Debug Support**: Optional debug logging for development and troubleshooting

### Key Components

#### **RechargeClient**
- Handles all HTTP communication with Recharge API
- Implements proper authentication with X-Recharge-Access-Token
- Provides comprehensive error handling and retry logic
- Includes request/response logging for debugging
- Validates domain format and token structure

#### **Tool System**
- Each tool category focuses on specific functionality
- Consistent input validation using Zod schemas
- Standardized error handling and response formatting
- Comprehensive parameter documentation
- Type-safe implementations with proper TypeScript support

#### **Error Handling**
- Custom RechargeAPIError class for API-specific errors
- Detailed error logging with request/response context
- Proper error propagation to MCP clients
- Debug mode for development troubleshooting

## Error Handling

The server includes comprehensive error handling for all scenarios:

### Error Types

- **🔐 Authentication Errors**: Invalid or expired tokens with clear resolution steps
- **⏱️ Rate Limiting**: Automatic retry logic and rate limit respect with backoff
- **🌐 Network Timeouts**: Configurable timeout handling (30-second default)
- **❌ Invalid Parameters**: Schema validation with detailed field-level error messages
- **🔍 Resource Not Found**: Clear error messages for missing resources with suggestions
- **⚠️ API Errors**: Detailed error reporting from Recharge API responses
- **📝 Validation Errors**: Comprehensive Zod validation error messages with field paths

### Error Response Format

All errors are returned in a consistent MCP format:

```json
{
  "content": [
    {
      "type": "text",
      "text": "API Error (400): Invalid parameter: email must be a valid email address (Code: INVALID_EMAIL)"
    }
  ]
}
```

### Debug Mode

Enable detailed error logging:

```bash
DEBUG=true npm start
```

Debug mode provides:
- 📝 Detailed request/response logging
- 🔍 API endpoint and parameter information
- ⚠️ Error context and stack traces
- 📊 Performance timing information

## Security

The server implements comprehensive security best practices:

### 🔐 Authentication & Authorization
- **Environment Variables**: Sensitive credentials stored securely in environment variables
- **Token-based Authentication**: Secure API token authentication with proper headers
- **Domain Validation**: Validates Shopify domain format to prevent misconfigurations
- **Session Management**: Secure session creation, validation, and destruction

### 🛡️ Input Validation & Sanitization
- **Schema Validation**: All inputs validated using Zod schemas before API calls
- **Type Safety**: Comprehensive type checking for all parameters
- **SQL Injection Prevention**: Parameterized queries and input sanitization
- **XSS Protection**: Input sanitization and output encoding

### 🔒 Data Protection
- **Error Sanitization**: Sensitive information filtered from error messages
- **Request Logging**: Comprehensive request logging for security auditing (to stderr)
- **Timeout Protection**: 30-second timeout on all API requests to prevent hanging
- **Rate Limit Compliance**: Respects Recharge API rate limits

### 🌐 Network Security
- **HTTPS Only**: All API communications use HTTPS encryption
- **User-Agent Headers**: Proper identification in API requests
- **Connection Timeouts**: Prevents resource exhaustion from slow connections

## Development

### Development Setup

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd recharge-mcp-server
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your development credentials
   ```

3. **Start Development Server**
   ```bash
   npm run dev  # Auto-reload on file changes
   ```

### Available Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server with auto-reload
npm run debug      # Start server with debug logging
npm test           # Run test suite (when implemented)
npm run lint       # Check code syntax and style
npm run validate   # Comprehensive validation of all files
```

### Adding New Tools

When adding new tools or endpoints:

1. **📝 Add API Method**: Implement the new endpoint in `RechargeClient` with proper JSDoc
2. **🔧 Create Tool**: Add the tool in the appropriate tools file with consistent structure
3. **✅ Schema Validation**: Include comprehensive Zod schema validation with proper types
4. **🛡️ Error Handling**: Implement proper error handling using the error handler utility
5. **📚 Documentation**: Update README with new tool information and examples
6. **📤 Export Tool**: Add the new tool to the tools index with proper imports
7. **🐍 Field Naming**: Use snake_case for all API field names to match Recharge standards
8. **📋 Response Format**: Ensure consistent MCP response format across all tools

### Code Quality Standards

- ✅ Use consistent indentation (2 spaces)
- ✅ Include comprehensive JSDoc comments for all functions and classes
- ✅ Follow snake_case naming for API fields, camelCase for internal variables
- ✅ Use descriptive variable and function names
- ✅ Include proper error handling in all async functions
- ✅ Validate all inputs with comprehensive Zod schemas
- ✅ Write self-documenting code with clear logic flow

### Testing Guidelines

- 🧪 Unit tests for all tool functions
- 🔗 Integration tests for API client methods
- ✅ Schema validation tests for all input schemas
- 🛡️ Error handling tests for various failure scenarios
- 📊 Performance tests for bulk operations

## 🔧 Development

### Running in Development Mode

```bash
# Start with file watching
npm run dev

# Start with debug logging
npm run dev:debug
```

### Testing the Server

```bash
# Validate configuration
npm run validate

# Test MCP protocol
npm run mcp:test

# Run comprehensive tests
npm run test:full
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Server Won't Start

**Error**: `Missing required RECHARGE_STOREFRONT_DOMAIN environment variable`

**Solution**:
```bash
# Copy the example environment file
cp .env.example .env

# Edit with your domain
echo "RECHARGE_STOREFRONT_DOMAIN=your-shop.myshopify.com" >> .env
```

**Error**: `Domain must be a valid Shopify domain ending with .myshopify.com`

**Solution**: Ensure your domain follows the correct format:
```bash
# ✅ Correct format
RECHARGE_STOREFRONT_DOMAIN=my-store.myshopify.com

# ❌ Incorrect formats
RECHARGE_STOREFRONT_DOMAIN=my-store.com
RECHARGE_STOREFRONT_DOMAIN=https://my-store.myshopify.com
RECHARGE_STOREFRONT_DOMAIN=my-store
```

#### 2. Authentication Issues

**Error**: `No API access token available`

**Solution**: Provide token via environment variable or tool call:
```bash
# Option 1: Environment variable
echo "RECHARGE_ACCESS_TOKEN=sk_test_your_token_here" >> .env

# Option 2: Per-tool call (see examples above)
```

**Error**: `API Error (401): Unauthorized`

**Solutions**:
- Verify your access token is correct and active
- Check token permissions in Recharge dashboard
- Ensure token matches the correct store domain
- Try regenerating the token if it's expired

**Error**: `API Error (403): Forbidden`

**Solutions**:
- Verify your token has the required permissions
- Check if your Recharge plan supports the API endpoint
- Ensure the customer exists and is accessible with your token

#### 3. MCP Client Integration Issues

**Error**: Client can't find the server

**Solutions**:
```json
// Ensure absolute paths in client config
{
  "mcpServers": {
    "recharge": {
      "command": "node",
      "args": ["/absolute/path/to/recharge-mcp-server/src/server.js"]
    }
  }
}
```

**Error**: Server starts but tools don't work

**Solutions**:
- Check server logs for startup errors
- Verify environment variables are loaded
- Test with `npm run mcp:test`
- Enable debug mode: `DEBUG=true` in environment

#### 4. API Request Failures

**Error**: `Network error: No response received`

**Solutions**:
- Check internet connectivity
- Verify Recharge API status
- Check firewall/proxy settings
- Try increasing timeout in client configuration

**Error**: `API Error (404): Not Found`

**Solutions**:
- Verify the resource ID exists (subscription, address, etc.)
- Check if the resource belongs to the authenticated customer
- Ensure the resource hasn't been deleted

**Error**: `API Error (422): Unprocessable Entity`

**Solutions**:
- Check required fields are provided
- Validate data formats (dates, emails, etc.)
- Review field constraints in API documentation
- Check for conflicting data (e.g., duplicate emails)

#### 5. Docker Issues

**Error**: Docker container won't start

**Solutions**:
```bash
# Check container logs
docker-compose logs recharge-mcp-server

# Rebuild container
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Check environment file
ls -la .env
```

**Error**: Environment variables not loaded in Docker

**Solutions**:
```yaml
# Ensure .env file exists and is readable
services:
  recharge-mcp-server:
    env_file:
      - .env
    # OR specify directly
    environment:
      - RECHARGE_STOREFRONT_DOMAIN=${RECHARGE_STOREFRONT_DOMAIN}
      - RECHARGE_ACCESS_TOKEN=${RECHARGE_ACCESS_TOKEN}
```

### Debugging Steps

#### 1. Enable Debug Mode

```bash
# Method 1: Environment variable
echo "DEBUG=true" >> .env
npm start

# Method 2: Inline
DEBUG=true npm start

# Method 3: Development mode
npm run dev:debug
```

#### 2. Test MCP Protocol

```bash
# Test basic MCP communication
npm run mcp:test

# Manual test with curl (if server exposes HTTP)
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | npm start
```

#### 3. Validate Configuration

```bash
# Check all configuration
npm run validate

# Check environment variables
node -e "
require('dotenv').config();
console.log('Domain:', process.env.RECHARGE_STOREFRONT_DOMAIN);
console.log('Token configured:', !!process.env.RECHARGE_ACCESS_TOKEN);
"
```

#### 4. Test API Connectivity

```bash
# Test with curl (replace with your values)
curl -H "X-Recharge-Access-Token: YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     "https://YOUR_DOMAIN/tools/recurring/portal/customer"
```

#### 5. Check Tool Execution

Enable debug mode and watch for:
- Tool parameter validation
- API request/response details
- Error stack traces
- Client creation and configuration

### Getting Help

#### 1. Check Logs

```bash
# Server logs (if using Docker)
docker-compose logs -f recharge-mcp-server

# Enable debug logging
DEBUG=true npm start 2>&1 | tee debug.log
```

#### 2. Validate Setup

```bash
# Run full validation
npm run test:full

# Check specific components
npm run lint
npm run validate
npm run coverage
```

#### 3. Test Individual Components

```bash
# Test client creation
node -e "
const { RechargeClient } = require('./src/recharge-client.js');
const client = new RechargeClient({
  domain: 'your-shop.myshopify.com',
  accessToken: 'your_token'
});
console.log('Client created successfully');
"
```

#### 4. Common Debug Information to Collect

When reporting issues, include:
- Node.js version (`node --version`)
- Package versions (`npm list`)
- Environment variables (without sensitive values)
- Full error messages and stack traces
- MCP client configuration
- Steps to reproduce the issue

#### 5. Performance Issues

If experiencing slow responses:
- Check network latency to Recharge API
- Monitor API rate limits
- Consider implementing request caching
- Review timeout settings

```bash
# Test API response time
time curl -H "X-Recharge-Access-Token: YOUR_TOKEN" \
          "https://YOUR_DOMAIN/tools/recurring/portal/customer"
```

## 📚 Sample Usage and Examples

### Common Issues

#### 🔐 Authentication Errors

**Problem**: `API Error (401): Unauthorized`

**Solutions**:
- ✅ Verify you're using a **Storefront API** token, not Admin API
- ✅ Check that the token has the required permissions:
  - Customer read/write
  - Subscription read/write
  - Address read/write
  - Payment method read/write
  - Order read
  - Product read
- ✅ Ensure the domain is correctly formatted: `your-shop.myshopify.com`
- ✅ Verify the token hasn't expired or been revoked

#### 🌐 Network Errors

**Problem**: `Network error: No response received`

**Solutions**:
- ✅ Check internet connectivity and DNS resolution
- ✅ Verify the Recharge API is accessible from your network
- ✅ Review firewall settings and proxy configurations
- ✅ Check if your IP is rate-limited or blocked
- ✅ Increase timeout settings if requests are consistently slow

#### ❌ Validation Errors

**Problem**: `Invalid parameters: field_name: Expected string, received number`

**Solutions**:
- ✅ Review the tool schema requirements in the documentation
- ✅ Ensure all required parameters are provided
- ✅ Check data formats (dates should be YYYY-MM-DD, emails should be valid)
- ✅ Verify field names use snake_case format (e.g., `first_name`, not `firstName`)
- ✅ Confirm numeric fields are numbers, not strings (e.g., `variant_id: 123`, not `"123"`)

#### 📦 Import/Export Errors

**Problem**: `SyntaxError: The requested module does not provide an export`

**Solutions**:
- ✅ Ensure all tool files export their tools array correctly
- ✅ Check that the tools index file imports all tool categories
- ✅ Verify file paths and extensions are correct (.js extension required)
- ✅ Confirm export/import naming consistency

#### 🔧 Environment Configuration

**Problem**: `Error: Missing required environment variables`

**Solutions**:
- ✅ Ensure `RECHARGE_STOREFRONT_DOMAIN` is set in `.env`
- ✅ Provide `RECHARGE_ACCESS_TOKEN` in `.env` OR pass `access_token` in tool calls
- ✅ Ensure no extra spaces or quotes around values
- ✅ Verify the `.env` file is in the project root directory

#### 🔑 API Token Errors

**Problem**: `No API access token available`

**Solutions**:
- ✅ Set `RECHARGE_ACCESS_TOKEN` in your `.env` file, OR
- ✅ Pass `access_token` parameter in each tool call
- ✅ Verify the token has the required permissions
- ✅ Check that the token hasn't expired

**Multi-tenant Usage**:
```javascript
// Example tool call with token
{
  "access_token": "sk_test_...",
  "subscriptionId": "12345"
}
```

### Debug Commands

```bash
# Validate server syntax and configuration
npm run validate

# Check for common syntax issues
npm run lint

# Test individual components
node -c src/server.js
node -c src/recharge-client.js

# Enable debug logging
DEBUG=true npm start

# Test API connectivity
curl -H "X-Recharge-Access-Token: your_token" \
     https://your-shop.myshopify.com/tools/recurring/portal/customer
```

### Performance Optimization

- 🚀 Use pagination for large datasets (`limit` and `page` parameters)
- ⚡ Implement caching for frequently accessed data
- 📊 Monitor API rate limits and implement backoff strategies
- 🔄 Use async batch operations for bulk updates
- 📈 Profile memory usage for long-running processes

### Getting Help

1. **📚 Check Documentation**: Review this README and inline code documentation
2. **🐛 Enable Debug Mode**: Use `DEBUG=true` to get detailed logging
3. **✅ Run Validation**: Use `npm run validate` to check configuration
4. **🧪 Run Tests**: Use `npm run test:full` for comprehensive testing
5. **🔍 Check Logs**: Review error messages and stack traces
6. **🐳 Check Docker**: If using Docker, check container logs with `npm run docker:logs`
7. **📞 Contact Support**: Reach out with specific error messages and configuration details

### Build & Deployment Issues

#### Docker Build Failures

**Problem**: `Docker build fails with permission errors`

**Solutions**:
- ✅ Ensure Docker daemon is running
- ✅ Check user permissions for Docker
- ✅ Verify Dockerfile syntax
- ✅ Check available disk space

#### Container Startup Issues

**Problem**: `Container exits immediately`

**Solutions**:
- ✅ Check environment variables in docker-compose.yml
- ✅ Verify .env file is properly configured
- ✅ Check container logs: `docker-compose logs recharge-mcp-server`
- ✅ Ensure proper file permissions

#### Port Conflicts

**Problem**: `Port already in use`

**Solutions**:
- ✅ Change port in docker-compose.yml
- ✅ Stop conflicting services
- ✅ Use `docker-compose down` to stop existing containers

## API Documentation

For detailed information about the Recharge Storefront API:

- **📖 Official Documentation**: [Recharge Storefront API Docs](https://storefront.rechargepayments.com/client/)
- **🔗 API Reference**: Complete endpoint documentation with examples and response schemas
- **🔐 Authentication Guide**: How to obtain and use Storefront API tokens
- **⚡ Rate Limiting**: API usage limits, best practices, and optimization strategies
- **🔄 Webhooks**: Setting up webhooks for real-time event notifications
- **🧪 Testing**: Sandbox environment and testing best practices

## Contributing

We welcome contributions to improve the Recharge MCP Server! Here's how to get started:

### 🤝 How to Contribute

1. **🍴 Fork the Repository**
   ```bash
   git fork https://github.com/your-username/recharge-mcp-server.git
   cd recharge-mcp-server
   ```

2. **🌿 Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **💻 Make Your Changes**
   - Follow the existing code style and patterns
   - Add comprehensive tests for new functionality
   - Update documentation as needed

4. **✅ Test Your Changes**
   ```bash
   npm run validate
   npm test
   ```

5. **📝 Submit a Pull Request**
   - Provide a clear description of your changes
   - Include any relevant issue numbers
   - Ensure all tests pass

### 🎯 Contribution Guidelines

- **🐛 Bug Reports**: Use the issue template and provide detailed reproduction steps
- **✨ Feature Requests**: Describe the use case and expected behavior
- **📚 Documentation**: Help improve documentation clarity and completeness
- **🧪 Testing**: Add tests for new features and bug fixes
- **🎨 Code Style**: Follow existing patterns and use consistent formatting

### 📋 Development Checklist

- [ ] Code follows existing style and patterns
- [ ] All scripts are executable (`chmod +x scripts/*.sh`)
- [ ] All new functions have JSDoc documentation
- [ ] Input validation uses Zod schemas
- [ ] Error handling follows established patterns
- [ ] Tests cover new functionality
- [ ] Documentation is updated
- [ ] All validation checks pass
- [ ] Docker build succeeds
- [ ] Health checks pass

### 🚀 Release Process

1. **Update Version**
   ```bash
   npm version patch|minor|major
   ```

2. **Run Full Test Suite**
   ```bash
   npm run test:full
   ```

3. **Build and Test Docker Image**
   ```bash
   npm run docker:build
   npm run docker:run
   npm run docker:logs
   ```

4. **Tag Release**
   ```bash
   git tag -a v$(npm run version --silent) -m "Release v$(npm run version --silent)"
   git push origin --tags
   ```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Version History

### 🚀 v1.0.0 - Initial Release
- ✅ Complete Recharge Storefront API coverage with 40+ tools
- ✅ Comprehensive input validation with Zod schemas
- ✅ Docker containerization support
- ✅ Automated setup and deployment scripts
- ✅ Robust error handling and detailed logging
- ✅ Snake case field naming consistency with Recharge API
- ✅ Full MCP protocol compliance
- ✅ Production-ready architecture with security best practices
- ✅ Comprehensive documentation and troubleshooting guides
- ✅ Multi-environment deployment support
- ✅ Health monitoring and logging

---

**Built with ❤️ for the subscription commerce community**

*For questions, issues, or contributions, please visit our [GitHub repository](https://github.com/your-username/recharge-mcp-server).*