# Recharge Storefront API MCP Server

A comprehensive Model Context Protocol (MCP) server that provides complete access to the Recharge Storefront API. This server enables AI assistants and other MCP clients to interact with Recharge subscription management functionality through a standardized interface.

## Features

### Complete Storefront API Coverage
- **Customer Management**: Customer profile and information retrieval
- **Subscription Management**: View, update, cancel, skip, swap subscriptions
- **Address Management**: Shipping and billing address operations
- **Payment Methods**: Payment method viewing and updates
- **Product Catalog**: Browse subscription products and variants
- **Order History**: View past orders and delivery status
- **Charge Management**: View upcoming and past billing charges
- **One-time Products**: Add products to next delivery
- **Bundle Management**: Product bundle and selection management
- **Discount Management**: Apply and manage discount codes

### Key Capabilities
- **Merchant Authentication**: Uses merchant API tokens for secure access
- **Customer Scoping**: All operations properly scoped to specific customers
- **Comprehensive Error Handling**: Detailed error messages with proper HTTP status codes
- **Input Validation**: Zod schema validation for all tool parameters
- **Debug Support**: Optional debug logging for development and troubleshooting
- **Docker Support**: Complete containerization with multi-environment configurations
- **Production Ready**: Health checks, logging, resource limits, and monitoring

## Quick Start

### Prerequisites
- Node.js 18.0.0 or higher
- Recharge Storefront API access token
- Shopify store with Recharge integration

### Getting Your API Access Token

To use this MCP server, you need a Recharge Storefront API access token:

1. **Log into your Recharge merchant portal**
2. **Navigate to Apps & integrations > API tokens**
3. **Create a new Storefront API token** (not Admin API)
4. **Copy the token** (starts with your store prefix)

## Authentication Model

The Recharge Storefront API uses a **merchant token + customer ID authentication process**:

### How It Works: Super Simple Authentication
You need a **customer ID** to create sessions. Here's how to get it:

#### Option A: Lookup by Email (Most Common)
```json
{
  "name": "get_customer_by_email",

### Step 2: Automatic Session Creation
The MCP server automatically creates session tokens when you provide a `customer_id`:
- Provide `customer_id` in any tool call (recommended)
- Or manually call `create_customer_session_by_id` first, then use returned token

### How It Works
```
Merchant Token + Customer ID → Session Token → API Operations
```

1. **Merchant Token**: Authenticates you with Recharge (set in environment)
2. **Customer ID**: Identifies which customer to create session for
3. **Session Token**: Customer-scoped token for API operations
4. **API Operations**: All operations automatically scoped to that customer

### Authentication Examples

**Option A: Using Email (Easiest)**
```json
{
  "name": "get_subscriptions",
  "arguments": {
    "customer_email": "customer@example.com"
  }
}
```

**Option B: Using Customer ID**
```json
{
  "name": "get_subscriptions",
  "arguments": {
    "customer_id": "123456"
  }
}
```

### Authentication Configuration Options

**Important**: Session tokens are created automatically using merchant token + customer ID.

**Option 1: Environment Variables (Recommended)**
```bash
RECHARGE_STOREFRONT_DOMAIN=your-shop.myshopify.com
RECHARGE_MERCHANT_TOKEN=your_merchant_token_here
```

**Option 2: Per-Tool Parameters**
```json
{
  "name": "create_customer_session_by_id",
  "arguments": {
    "store_url": "your-shop.myshopify.com",
    "merchant_token": "your_merchant_token_here",
    "customer_id": "123456"
  }
}
```

**Option 3: Mixed (Environment + Override)**
```bash
# Set default in environment
RECHARGE_STOREFRONT_DOMAIN=your-shop.myshopify.com
RECHARGE_MERCHANT_TOKEN=your_merchant_token_here
```
```json
{
  "name": "create_customer_session_by_id",
  "arguments": {
    "customer_id": "123456"
  }
}
```

### How Customer Scoping Works

When you call any tool, the API automatically:
1. Uses the provided token to identify the customer
2. Returns only data for that specific customer
3. Applies all operations to that customer's account

**Example Flow:**
```json
// Create session for specific customer
{
  "name": "create_customer_session_by_id",
  "arguments": {
    "customer_id": "123456"
  }
}
// Returns session token scoped to customer 123456
```

### Multi-Customer Support

To work with multiple customers, simply provide different customer identifiers:

```json
// Get data for Customer A
{
  "name": "get_subscriptions",
  "arguments": {
    "customer_email": "customer-a@example.com"
  }
}

// Get data for Customer B  
{
  "name": "get_subscriptions",
  "arguments": {
    "customer_email": "customer-b@example.com"
  }
}

// Or mix identification methods
{
  "name": "get_orders",
  "arguments": {
    "customer_id": "789012"
  }
}
```

## Prerequisites and Limitations

### Requirements
- **Shopify Store**: Must have a Shopify store
- **Recharge Integration**: Recharge subscription app must be installed and configured
- **Merchant Token**: Must have merchant token with Storefront API permissions
- **Server-Side**: This MCP server runs server-side, no browser required

### Limitations
- **Customer ID Required**: Need customer ID to create sessions
- **Temporary Tokens**: Session tokens expire and need to be refreshed
- **Shopify Integration**: Requires Shopify store with Recharge app installed

### Installation

1. **Clone and setup:**
   ```bash
   git clone <repository-url>
   cd recharge-storefront-api-mcp
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Required environment variables:**
   ```bash
   RECHARGE_STOREFRONT_DOMAIN=your-shop.myshopify.com  # Required
   RECHARGE_MERCHANT_TOKEN=your_merchant_token_here    # Required*
   ```
   
   *Required unless you provide `merchant_token` parameter in each tool call

4. **Start the server:**
   ```bash
   npm start
   ```

## Configuration

### Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `RECHARGE_STOREFRONT_DOMAIN` | Conditional* | Your Shopify domain | `your-shop.myshopify.com` |
| `RECHARGE_MERCHANT_TOKEN` | Conditional* | Recharge merchant token | `your_merchant_token_here` |
| `MCP_SERVER_NAME` | No | Server name | `recharge-storefront-api-mcp` |
| `MCP_SERVER_VERSION` | No | Server version | `1.0.0` |
| `DEBUG` | No | Enable debug logging | `true` |


### Authentication Configuration


## Available Tools

### Automatic Session Creation

The MCP server **automatically creates session tokens** when you provide a `customer_id` parameter instead of a `session_token`. This eliminates the need for manual session creation in most cases.

**Option A: Using Customer Email (Easiest)**
```json
{
  "name": "get_subscriptions",
  "arguments": {
    "customer_email": "customer@example.com"
  }
}
```

#### Manual Mode (Advanced)
```json
// Step 1: Create session manually
{
  "name": "create_customer_session_by_id",
  "arguments": {
    "customer_id": "123456"
  }
}

// Step 2: Use session token
{
  "name": "get_subscriptions",
  "arguments": {
    "session_token": "returned_session_token"
  }
}
```

### Customer Management
- `get_customer` - Retrieve current customer information
- `create_customer_session_by_id` - Create customer session using customer ID (requires merchant token)
- `update_customer` - Update current customer profile
- `get_customer_by_email` - Find customer by email address

### Subscription Management
- `create_subscription` - Create a new subscription
- `get_subscriptions` - List customer subscriptions
- `get_subscription` - Get detailed subscription information
- `update_subscription` - Modify subscription details
- `skip_subscription` - Skip a delivery date
- `unskip_subscription` - Restore a skipped delivery
- `swap_subscription` - Change subscription product
- `cancel_subscription` - Cancel a subscription
- `activate_subscription` - Reactivate a cancelled subscription
- `set_subscription_next_charge_date` - Set next charge date

### Address Management
- `get_addresses` - List all customer addresses
- `get_address` - Get specific address details
- `create_address` - Add new address
- `update_address` - Modify existing address
- `delete_address` - Remove address

### Payment Methods
- `get_payment_methods` - List payment methods
- `get_payment_method` - Get payment method details
- `update_payment_method` - Update billing information

### Product Catalog
- `get_products` - Browse available products
- `get_product` - Get detailed product information

### Order & Charge History
- `get_orders` - List customer orders
- `get_order` - Get order details
- `get_charges` - List charges
- `get_charge` - Get charge details

### One-time Products
- `get_onetimes` - List one-time products
- `get_onetime` - Get one-time product details
- `create_onetime` - Add one-time product
- `update_onetime` - Modify one-time product
- `delete_onetime` - Remove one-time product

### Bundle Management
- `get_bundles` - List customer bundles
- `get_bundle` - Get bundle details
- `get_bundle_selections` - List bundle selections
- `get_bundle_selection` - Get bundle selection details
- `create_bundle_selection` - Create bundle selection
- `update_bundle_selection` - Update bundle selection
- `delete_bundle_selection` - Remove bundle selection

### Discount Management
- `get_discounts` - List applied discounts
- `get_discount` - Get discount details
- `apply_discount` - Apply discount code
- `remove_discount` - Remove discount

## Usage Examples

### Session Creation and Customer Operations

**Important**: You need a customer ID to create sessions, but once you have a session token, operations are automatically scoped to that customer:

#### Pattern 1: Create Session and Get Customer Data

Create a session for a specific customer, then use the token:

```json
// Step 1: Create session (requires customer ID)
{
  "name": "create_customer_session_by_id",
  "arguments": {
    "customer_id": "123456"
  }
}

// Step 2: Use the returned session token
{
  "name": "get_customer",
  "arguments": {
    "session_token": "returned_session_token"
**Option B: Using Customer ID (If Known)**
}
  }
}
```
    "customer_id": "123456"
#### Pattern 2: Use Session Token for Operations

Once you have a session token, operations are customer-scoped:

```json
{
Merchant Token + Customer Email/ID → Session Token → API Operations
  "arguments": {
    "session_token": "session_abc123"
  }
2. **Customer Email/ID**: Identifies which customer to create session for
```

#### Pattern 3: Find Customer by Email (Alternative Method)
  "arguments": {
    "session_token": "session_abc123",
    "email": "customer@example.com"
  }
}
```

#### Pattern 4: Optional Customer ID Filtering

Some list operations accept customer_id as an optional filter (rarely needed):

```json
{
  "name": "get_subscriptions",
  "arguments": {
    "session_token": "session_abc123",
    "customer_id": "123456",  // Optional filter
    "status": "active"
  }
}
```

### Complete Use Case Examples

#### Use Case 1: Customer Service - Automatic Session (Recommended)

**Scenario**: Customer service agent helps customer - just use their email!

```json
// Get customer details (auto-looks up by email and creates session)
{
  "name": "get_customer",
  "arguments": {
    "customer_email": "customer@example.com"
  }
}

// Get their subscriptions (reuses session automatically)
{
  "name": "get_subscriptions",
  "arguments": {
    "customer_email": "customer@example.com"
  }
}
```

#### Use Case 2: Customer Service - Manual Session (Advanced)

**Scenario**: Customer service agent helps customer starting with their email

```json
// Step 1: Find customer by email
{
  "name": "get_customer_by_email",
  "arguments": {
    "email": "customer@example.com"
  }
}

// Step 2: Create session using customer ID from step 1
{
  "name": "create_customer_session_by_id",
  "arguments": {
    "customer_id": "123456"  // From step 1 response
  }
}

// Step 3: Get customer details using session token
{
  "name": "get_customer",
  "arguments": {
    "session_token": "session_token_from_step_2"
  }
}

// Step 4: Get their subscriptions
{
  "name": "get_subscriptions",
  "arguments": {
    "session_token": "session_token_from_step_2"
  }
}

// Step 5: Get their addresses
{
  "name": "get_addresses",
  "arguments": {
    "session_token": "session_token_from_step_2"
  }
}
```

#### Use Case 2: Subscription Management - Skip Next Delivery

**Scenario**: Customer emails asking to skip delivery

```json
// Step 1: Find customer by email
{
  "name": "get_customer_by_email",
  "arguments": {
    "email": "customer@example.com"
  }
}

// Step 2: Create session for customer
{
  "name": "create_customer_session_by_id",
  "arguments": {
    "customer_id": "123456"  // From step 1
  }
}

// Step 3: Get their active subscriptions
{
  "name": "get_subscriptions",
  "arguments": {
    "session_token": "session_token_from_step_2"
  }
}

// Step 4: Skip specific subscription
{
  "name": "skip_subscription",
  "arguments": {
    "session_token": "session_token_from_step_2",
    "subscription_id": "sub_456",
    "date": "2024-02-15"
  }
}
```

#### Use Case 3: Order Management - Check Recent Orders

**Scenario**: Check customer's recent orders

```json
// Step 1: Create session for customer
{
  "name": "create_customer_session_by_id",
  "arguments": {
    "customer_id": "123456"
  }
}

// Step 2: Get recent orders
{
  "name": "get_orders",
  "arguments": {
    "session_token": "returned_session_token"
  }
}

// Step 3: Get specific order details
{
  "name": "get_order",
  "arguments": {
    "session_token": "returned_session_token",
    "order_id": "order_789"
  }
}
```

#### Use Case 4: Address Management - Update Shipping Address

**Scenario**: Update customer's shipping address

```json
// Step 1: Create session for customer
{
  "name": "create_customer_session_by_id",
  "arguments": {
    "customer_id": "123456"
  }
}

// Step 2: Get current addresses
{
  "name": "get_addresses",
  "arguments": {
    "session_token": "returned_session_token"
  }
}

// Step 3: Update existing address
{
  "name": "update_address",
  "arguments": {
    "session_token": "returned_session_token",
    "address_id": "addr_123",
    "address1": "456 New Street",
    "city": "New City",
    "zip": "54321"
  }
}
```

#### Use Case 5: Product Management - Add One-time Product

**Scenario**: Add product to customer's next delivery

```json
// Step 1: Create session for customer
{
  "name": "create_customer_session_by_id",
  "arguments": {
    "customer_id": "123456"
  }
}

// Step 2: Browse available products
{
  "name": "get_products",
  "arguments": {
    "session_token": "returned_session_token"
  }
}

// Step 3: Add one-time product
{
  "name": "create_onetime",
  "arguments": {
    "session_token": "returned_session_token",
    "variant_id": 12345,
    "quantity": 1,
    "next_charge_scheduled_at": "2024-02-01"
  }
}
```

### Customer ID Best Practices

#### 1. **Email-First Workflow (Most Common)**
```json
// Always start with email lookup if you don't have customer ID
{
  "name": "get_customer_by_email",
  "arguments": {
    "email": "customer@example.com"
  }
}

// Then create session with returned customer ID
{
  "name": "create_customer_session_by_id",
  "arguments": {
    "customer_id": "returned_customer_id"
  }
}
```

#### 2. **Always Create Sessions Before Operations**
```json
// Create session first (after getting customer ID)
{
  "name": "create_customer_session_by_id",
  "arguments": {
    "customer_id": "123456"
  }
}
```

#### 3. **Use Session Tokens for All Operations**
```javascript
// Email → Customer ID → Session → Operations
const customer = await callTool("get_customer_by_email", { email: "customer@example.com" });
const session = await callTool("create_customer_session_by_id", { customer_id: customer.id });
const customer = await callTool("get_customer", { session_token: session.token });
const subscriptions = await callTool("get_subscriptions", { session_token: session.token });
```

#### 4. **Handle Authentication Errors**
```json
// If customer lookup fails
{
  "error": "Customer not found with email address"
}

// If session creation fails
{
  "error": "Customer not found or invalid merchant token"
}
```

### Token vs Customer ID Relationship

**Important**: In this implementation:
- **Customer ID** is required to create sessions
- **Session token** identifies customer automatically after creation
- **Merchant token** is required for session creation
- **Session scope** determines data access

### Basic Operations (No Customer ID Needed)

These operations use customer-scoped session tokens (after session creation):

```json
{
  "name": "get_subscriptions",
  "arguments": {
    "session_token": "session_abc123"
  }
}
```

```json
{
  "name": "get_orders",
  "arguments": {
    "session_token": "session_abc123"
  }
}
```

```json
{
  "name": "get_charges",
  "arguments": {
    "session_token": "session_abc123"
  }
}
```

```json
{
  "name": "get_addresses",
  "arguments": {
    "session_token": "session_abc123"
  }
}
```

```json
{
  "name": "get_payment_methods",
  "arguments": {
    "session_token": "session_abc123"
  }
}
```

## Development

### Development Mode
```bash
npm run dev          # Start with file watching
npm run dev:debug    # Start with debug logging
```

### Validation and Testing
```bash
npm run validate     # Validate configuration and syntax
npm run coverage     # Show API coverage report
npm run test:full    # Run comprehensive tests
npm run lint         # Check code syntax
```

### Docker Development
```bash
npm run docker:build     # Build Docker image with version tag
npm run docker:run       # Run with Docker Compose
npm run docker:logs      # View container logs
npm run docker:stop      # Stop containers
npm run docker:clean     # Clean up containers and volumes
```

## Docker Deployment

### Quick Docker Setup
```bash
# Development
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Production
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Automated Deployment
```bash
./scripts/deploy.sh development   # Deploy to dev
./scripts/deploy.sh production    # Deploy to prod
```

### Environment-Specific Configuration
- `docker-compose.yml` - Base configuration
- `docker-compose.dev.yml` - Development overrides
- `docker-compose.prod.yml` - Production settings

See [DOCKER.md](DOCKER.md) for detailed Docker deployment guide.

## Error Handling

The server provides comprehensive error handling:

### API Errors
- **HTTP Status Codes**: Proper status code mapping
- **Error Messages**: Detailed, actionable error descriptions
- **Error Codes**: Recharge-specific error code preservation
- **Debug Information**: Optional detailed logging

### Common Error Scenarios
- **Authentication**: Missing or invalid API tokens
- **Validation**: Invalid parameter formats or values
- **Network**: Connection timeouts and network issues
- **Rate Limiting**: API rate limit handling

### Debug Mode
Enable debug logging for troubleshooting:
```bash
DEBUG=true npm start
```

## Security

### Best Practices
- **API Token Security**: Keep your merchant API tokens secure
- **Environment Variables**: Use `.env` files for sensitive data
- **Customer Privacy**: Only access customer data you're authorized to view

### Production Security
- Non-root container user
- Resource limits and monitoring
- Secure API token handling
- Network isolation options

## Monitoring and Maintenance

### Health Checks
```bash
npm run health       # Basic health check
docker compose ps    # Container status
```

### Log Management
```bash
npm run docker:logs  # View container logs
docker compose logs --tail=100 recharge-storefront-api-mcp
```

### Performance Monitoring
- Resource usage tracking
- API response time monitoring
- Error rate monitoring
- Container health checks

## API Coverage

This MCP server provides **complete coverage** of the Recharge Storefront API with **33 tools**:

- ✅ **Customer Management** - Current customer profile operations (4 tools)
- ✅ **Subscription Lifecycle** - Complete subscription management (10 tools)
- ✅ **Address Management** - Shipping and billing addresses (5 tools)
- ✅ **Payment Methods** - Payment method management (3 tools)
- ✅ **Product Catalog** - Product browsing and details (2 tools)
- ✅ **Order Management** - Order history and tracking (2 tools)
- ✅ **Charge Management** - Billing and payment tracking (2 tools)
- ✅ **One-time Products** - Add-on product management (5 tools)
- ✅ **Bundle Management** - Product bundle and selection management (7 tools)
- ✅ **Discount System** - Coupon and discount management (4 tools)

#### Authentication Confusion
```
Error: Customer not found
```
**Solution**: Ensure you're using a valid customer ID and merchant token:
1. Use a valid customer ID from your customer database
2. Ensure merchant token has Storefront API permissions
3. Set `RECHARGE_MERCHANT_TOKEN` environment variable or provide in tool calls
4. Customer must exist in Recharge system

**Example of correct session creation**:
```json
{"name": "create_customer_session_by_id", "arguments": {"customer_id": "123456"}}
```

#### Invalid Token Type
```
Error: Invalid merchant token
```
**Solution**: Ensure you're using the correct merchant token:
- ✅ Correct: Merchant token with Storefront API permissions
- ❌ Wrong: Admin API token without Storefront permissions
- ❌ Wrong: Expired or revoked merchant token

#### Resource Access Issues
```
Error: Resource not found
```
**Solution**: Ensure the resource belongs to the customer session:
- Create session first using customer ID
- Use session token for subsequent operations
- Use correct resource IDs from previous API responses

**Correct usage examples**:
```json
// Create session first
{"name": "create_customer_session_by_id", "arguments": {"customer_id": "123456"}}

// Then use session token
{"name": "get_customer", "arguments": {"session_token": "session_token_here"}}

// Get customer subscriptions
{"name": "get_subscriptions", "arguments": {"session_token": "session_token_here"}}

// Get specific subscription
{"name": "get_subscription", "arguments": {"session_token": "session_token_here", "subscription_id": "sub_789"}}
```

#### Token Expiration
```
Error: Session token expired
```
**Solution**: Create a new session token using the customer ID:
```json
{
  "name": "create_customer_session_by_id",
  "arguments": {
    "customer_id": "123456"
  }
}
```

#### Multiple Authentication Methods
```
Error: Multiple authentication tokens provided
```
#### Invalid Domain
```
Error: Domain must be a valid Shopify domain
```
**Solution**: Ensure `RECHARGE_STOREFRONT_DOMAIN` ends with `.myshopify.com`.

#### Connection Issues
```
Error: Network error: No response received
```
**Solution**: Check internet connection and API endpoint availability.

#### Docker Issues
```
Error: command not found
```
**Solution**: Ensure all required packages are installed in Dockerfile.

### Debug Information
Enable debug mode for detailed logging:
```bash
DEBUG=true npm start
```

This will show:
- API request/response details
- Token usage information
- Error stack traces
- Performance metrics

## Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run validation: `npm run validate`
5. Test thoroughly: `npm run test:full`
6. Submit a pull request

### Code Standards
- Use ESM modules
- Follow existing code style
- Add comprehensive error handling
- Include input validation
- Update documentation
- Add tests for new features

### Testing
- Validate all changes with `npm run validate`
- Test Docker builds with `npm run docker:build`
- Verify API coverage with `npm run coverage`
- Run full test suite with `npm run test:full`

## License

MIT License - see LICENSE file for details.

## Support

For issues, questions, or contributions:
1. Check existing GitHub issues
2. Create a new issue with detailed information
3. Include debug logs when reporting problems
4. Provide reproduction steps for bugs

## Changelog

### v1.0.0
- Initial release with complete Recharge Storefront API coverage
- 32 comprehensive API tools covering all Recharge Storefront API endpoints
- Flexible authentication system
- Docker deployment support
- Comprehensive error handling
- Production-ready configuration