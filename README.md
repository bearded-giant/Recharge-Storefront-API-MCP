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

The Recharge Storefront API supports **two authentication methods**:

### Method 1: Direct Session Creation (Recommended)

This method allows the MCP server to create customer sessions directly without portal dependency:

1. **Merchant Authentication**: Use merchant token to authenticate with Recharge
2. **Customer Credentials**: Provide customer email/password or customer ID
3. **Session Creation**: MCP server creates customer session via API
4. **Token Usage**: Use generated session token for subsequent operations
5. **Automatic Scoping**: Token automatically scopes to the authenticated customer

### Method 2: Portal-Generated Sessions (Legacy)

Traditional method requiring portal integration:

1. **Portal Login**: Customer logs into Recharge customer portal
2. **Token Extraction**: Extract session token from customer's browser session
3. **MCP Usage**: Provide extracted token to MCP server
4. **API Operations**: Use token for Storefront API calls

### Authentication Comparison

| Method | Token Type | Requirements | Portal Dependency | Use Case |
|--------|------------|--------------|-------------------|----------|
| **Direct Session** | Merchant + Customer credentials | Merchant token + email/password | ❌ No | Customer service, automation |
| **Portal Session** | Customer session token | Portal integration | ✅ Yes | Customer self-service portals |

## Getting Your Authentication Tokens

### Authentication Types Comparison

| API Type | Authentication | Use Case | Scope | Customer ID Required? |
|----------|---------------|----------|-------|----------------------|
| **Storefront API** | Bearer session token | Customer portals | Single customer session | ❌ No |
| **Admin API** | X-Recharge-Access-Token | Merchant tools | All customers | ✅ Yes |

### Authentication Configuration Options

### Option 1: Direct Session Creation (Recommended)

Set merchant token in environment, create sessions as needed:

```bash
RECHARGE_STOREFRONT_DOMAIN=your-shop.myshopify.com
RECHARGE_MERCHANT_TOKEN=your_merchant_token_here
```

Then create customer sessions:

```json
{
  "name": "create_customer_session",
  "arguments": {
    "email": "customer@example.com",
    "password": "customer_password"
  }
}
```

### Option 2: Pre-Generated Session Token

Set session token directly in environment:

```bash
RECHARGE_STOREFRONT_DOMAIN=your-shop.myshopify.com
RECHARGE_SESSION_TOKEN=session_token_from_portal
```

### Option 3: Per-Tool Authentication

Provide authentication in each tool call:

```json
{
  "name": "get_customer",
  "arguments": {
    "merchant_token": "your_merchant_token",
    "store_url": "your-shop.myshopify.com"
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
// Session token is automatically scoped to logged-in customer
{
  "name": "get_subscriptions",
  "arguments": {
    "session_token": "session_abc123_token"
  }
}
// Returns only subscriptions for the customer who owns this session
```

### Multi-Customer Support

To work with multiple customers:
- Each customer needs their own session token
- Tokens are generated when customers log into the portal
- Switch tokens per customer operation

```json
// Customer A's session
{
  "name": "get_customer",
  "arguments": {
    "session_token": "customer_a_session_token"
  }
}

// Customer B's session
{
  "name": "get_customer",
  "arguments": {
    "session_token": "customer_b_session_token"
  }
}
```

## Prerequisites and Limitations

### Requirements
- **Shopify Store**: Must have a Shopify store
- **Recharge Integration**: Recharge subscription app must be installed and configured
- **Session Token**: Must have customer session token from Recharge portal login
- **Server-Side**: This MCP server runs server-side, no browser required

### Limitations
- **Session-Based**: All operations are scoped to the customer session
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
   RECHARGE_SESSION_TOKEN=your_session_token_here      # Required*
   ```
   
   *Required unless you provide `session_token` parameter in each tool call

4. **Start the server:**
   ```bash
   npm start
   ```

## Configuration

### Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `RECHARGE_STOREFRONT_DOMAIN` | Conditional* | Your Shopify domain | `your-shop.myshopify.com` |
| `RECHARGE_SESSION_TOKEN` | Conditional* | Recharge customer session token | `your_session_token_here` |
| `MCP_SERVER_NAME` | No | Server name | `recharge-storefront-api-mcp` |
| `MCP_SERVER_VERSION` | No | Server version | `1.0.0` |
| `DEBUG` | No | Enable debug logging | `true` |


### Authentication Configuration


## Available Tools

### Customer Management
- `get_customer` - Retrieve current customer information
- `delete_customer` - Delete current customer account
- `update_customer` - Update current customer profile
- `get_customer_by_email` - Find customer by email address

### Subscription Management
- `delete_subscription` - Delete a subscription permanently
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

### Customer ID Usage Patterns

**Important**: The Storefront API is customer-scoped, so you typically don't need customer IDs. However, some operations still use them for filtering or reference:

#### Pattern 1: Get Current Customer (Most Common)

The token identifies the customer automatically:

```json
{
  "name": "get_customer",
  "arguments": {}
}
```

**Response:**
```json
{
  "customer": {
    "id": "123456",
    "email": "customer@example.com",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

#### Pattern 2: Get Customer Data (No Customer ID Needed)

Most operations work without customer ID:

```json
{
  "name": "get_subscriptions",
  "arguments": {}
}
```

#### Pattern 3: Find Customer by Email (Alternative Method)

If you need to verify customer identity:

```json
{
  "name": "get_customer_by_email",
  "arguments": {
    "email": "customer@example.com"
  }
}
```

#### Pattern 4: Optional Customer ID Filtering

Some list operations accept customer_id as an optional filter:

```json
{
  "name": "get_subscriptions",
  "arguments": {
    "customer_id": "123456",  // Optional filter
    "status": "active"
  }
}
```

### Complete Use Case Examples

#### Use Case 1: Customer Service - View All Customer Information

**Scenario**: Customer logs into portal, token identifies them automatically

```json
// Step 1: Get customer details (token identifies customer)
{
  "name": "get_customer",
  "arguments": {}
}

// Step 2: Get their subscriptions
{
  "name": "get_subscriptions",
  "arguments": {}
}

// Step 3: Get their addresses
{
  "name": "get_addresses",
  "arguments": {}
}
```

#### Use Case 2: Subscription Management - Skip Next Delivery

**Scenario**: Customer wants to skip their next delivery (token identifies customer)

```json
// Step 1: Get their active subscriptions
{
  "name": "get_subscriptions",
  "arguments": {}
}

// Step 2: Skip specific subscription (using subscription_id from step 1)
{
  "name": "skip_subscription",
  "arguments": {
    "subscription_id": "sub_456",
    "date": "2024-02-15"
  }
}
```

#### Use Case 3: Order Management - Check Recent Orders

**Scenario**: Customer checks recent order status in portal

```json
// Step 1: Get recent orders (token identifies customer)
{
  "name": "get_orders",
  "arguments": {}
}

// Step 2: Get specific order details (using order_id from step 1)
{
  "name": "get_order",
  "arguments": {
    "order_id": "order_789"
  }
}
```

#### Use Case 4: Address Management - Update Shipping Address

**Scenario**: Customer updates address in portal

```json
// Step 1: Get current addresses (token identifies customer)
{
  "name": "get_addresses",
  "arguments": {}
}

// Step 2: Update existing address (using address_id from step 1)
{
  "name": "update_address",
  "arguments": {
    "address_id": "addr_123",
    "address1": "456 New Street",
    "city": "New City",
    "zip": "54321"
  }
}
```

#### Use Case 5: Product Management - Add One-time Product

**Scenario**: Customer adds product to next delivery

```json
// Step 1: Browse available products
{
  "name": "get_products",
  "arguments": {}
}

// Step 2: Add one-time product (using variant_id from step 1)
{
  "name": "create_onetime",
  "arguments": {
    "variant_id": 12345,
    "quantity": 1,
    "next_charge_scheduled_at": "2024-02-01"
  }
}
```

### Customer ID Best Practices

#### 1. **Understand Token Scoping**
```json
// Token automatically identifies customer - no ID needed
{
  "name": "get_customer",
  "arguments": {}
}
```

#### 2. **Use Customer ID Only When Needed**
```javascript
// Most operations don't need customer_id
const customer = await callTool("get_customer", {});
const subscriptions = await callTool("get_subscriptions", {});
const addresses = await callTool("get_addresses", {});
```

#### 3. **Handle Authentication Errors**
```json
// If token is invalid or expired
{
  "error": "Unauthorized: Invalid or expired token"
}
```

### Token vs Customer ID Relationship

**Important**: In Storefront API:
- **Token identifies customer** automatically
- **Customer ID** is returned in responses for reference
- **No need to provide customer ID** in most requests
- **Token scope** determines data access

### Basic Operations (No Customer ID Needed)

These are the most common operations using customer-scoped tokens:

```json
{
  "name": "get_subscriptions",
  "arguments": {}
}
```

```json
{
  "name": "get_orders",
  "arguments": {}
}
```

```json
{
  "name": "get_charges",
  "arguments": {}
}
```

```json
{
  "name": "get_addresses",
  "arguments": {}
}
```

```json
{
  "name": "get_payment_methods",
  "arguments": {}
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

This MCP server provides **complete coverage** of the Recharge Storefront API with **37 tools**:

- ✅ **Customer Management** - Current customer profile operations (4 tools)
- ✅ **Subscription Lifecycle** - Complete subscription management (get, update, cancel, delete)
- ✅ **Address Management** - Shipping and billing addresses
- ✅ **Payment Methods** - Payment method management
- ✅ **Product Catalog** - Product browsing and details
- ✅ **Order Management** - Order history and tracking
- ✅ **Charge Management** - Billing and payment tracking
- ✅ **One-time Products** - Add-on product management
- ✅ **Bundle Management** - Product bundle and selection management
- ✅ **Discount System** - Coupon and discount management

#### Authentication Confusion
```
Error: Unauthorized access
```
**Solution**: Ensure you're using a valid customer session token:
1. Customer must be logged into the Recharge portal
2. Session token is generated automatically during login
3. Set `RECHARGE_SESSION_TOKEN` environment variable or provide in tool calls
4. Token must not be expired

**Example of correct authentication**:
```json
{"name": "get_customer", "arguments": {"session_token": "session_token_here"}}
```

#### Invalid Token Type
```
Error: Invalid token permissions
```
**Solution**: Ensure you're using the correct token type:
- ✅ Correct: Customer session token (Bearer authentication)
- ❌ Wrong: Admin API token (X-Recharge-Access-Token header)
- ❌ Wrong: Expired or revoked token

#### Resource Access Issues
```
Error: Resource not found
```
**Solution**: Ensure the resource belongs to the authenticated customer:
- Storefront API only shows resources for the authenticated customer
- Use correct resource IDs from previous API responses
- Verify the customer has access to the requested resource

**Correct usage examples**:
```json
// Get current customer info
{"name": "get_customer", "arguments": {}}

// Get customer subscriptions
{"name": "get_subscriptions", "arguments": {}}

// Get specific subscription
{"name": "get_subscription", "arguments": {"subscription_id": "sub_789"}}

// Get specific order
{"name": "get_order", "arguments": {"order_id": "order_456"}}
```

#### Missing Session Token
```
Error: No session token available
```
**Solution**: 
1. Customer must log into Recharge customer portal
2. Extract session token from customer's authenticated portal session
3. Provide token via `RECHARGE_SESSION_TOKEN` environment variable
4. Or provide `session_token` parameter in individual tool calls

#### Session Token Extraction
```
Error: Cannot create session token
```
**Solution**: 
- MCP server cannot create session tokens directly
- Tokens must be obtained from Recharge's customer portal authentication
- Implement portal integration or browser session extraction
- Consider using Recharge's session creation APIs if available
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
- 39 comprehensive API tools covering all Recharge Storefront API endpoints
- Flexible authentication system
- Docker deployment support
- Comprehensive error handling
- Production-ready configuration