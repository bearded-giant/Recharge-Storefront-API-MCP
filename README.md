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


## Prerequisites and Limitations

### Requirements
- **Shopify Store**: Must have a Shopify store
- **Recharge Integration**: Recharge subscription app must be installed and configured
- **API Token**: Must have Recharge API token with Storefront permissions
- **Server-Side**: This MCP server runs server-side, no browser required

### Limitations
- **Customer Scoped**: All operations are scoped to individual customers via customer IDs
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
   RECHARGE_ACCESS_TOKEN=your_token_here               # Required*
   ```
   
   *Required unless you provide `access_token` parameter in each tool call

4. **Start the server:**
   ```bash
   npm start
   ```

## Configuration

### Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `RECHARGE_STOREFRONT_DOMAIN` | Conditional* | Your Shopify domain | `your-shop.myshopify.com` |
| `RECHARGE_ACCESS_TOKEN` | Conditional* | Recharge Storefront API access token | `your_storefront_token_here` |
| `MCP_SERVER_NAME` | No | Server name | `recharge-storefront-api-mcp` |
| `MCP_SERVER_VERSION` | No | Server version | `1.0.0` |
| `DEBUG` | No | Enable debug logging | `true` |


### Authentication Configuration

The server supports flexible authentication configuration:

1. **Environment Variables** (Recommended): Set both `RECHARGE_STOREFRONT_DOMAIN` and `RECHARGE_ACCESS_TOKEN`
2. **Per-Tool Parameters**: Provide `store_url` and `access_token` in individual tool calls if needed

### Authentication Model

The Storefront API uses **customer-scoped authentication**:


### Customer Authentication Examples

**Get Current Customer Information**
```json
{
  "name": "get_customer",
  "arguments": {
    "access_token": "customer_scoped_token"
  }
}
```

**Find Customer by Email**
```json
{
  "name": "get_customer_by_email",
  "arguments": {
    "email": "customer@example.com"
  }
}
```

**Get Customer Subscriptions**
```json
{
  "name": "get_subscriptions",
  "arguments": {
    "status": "active"
  }
}
```

### Important Notes About Storefront API

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

The Recharge Storefront API requires customer IDs for most operations. Here are the main patterns for obtaining and using customer IDs:

#### Pattern 1: Find Customer by Email (Most Common)

When you only have a customer's email address, use this two-step process:

**Step 1: Find Customer by Email**
```json
{
  "name": "get_customer_by_email",
  "arguments": {
    "email": "john.doe@example.com"
  }
}
```

**Response includes customer ID:**
```json
{
  "customer": {
    "id": "123456",
    "email": "john.doe@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

**Step 2: Use Customer ID in Other Operations**
```json
{
  "name": "get_subscriptions",
  "arguments": {
    "customer_id": "123456"
  }
}
```

#### Pattern 2: Direct Customer ID Usage (When Known)

If you already have the customer ID, use it directly:

```json
{
  "name": "get_customer",
  "arguments": {
    "customer_id": "789012"
  }
}
```

#### Pattern 3: Customer ID from Previous Operations

Customer IDs can be extracted from responses of other operations:

```json
// From subscription response
{
  "subscription": {
    "id": "sub_123",
    "customer_id": "456789",  // Use this ID for other operations
    "status": "active"
  }
}
```

### Complete Use Case Examples

#### Use Case 1: Customer Service - View All Customer Information

**Scenario**: Customer calls support, you have their email

```json
// Step 1: Find customer
{
  "name": "get_customer_by_email",
  "arguments": {
    "email": "sarah.smith@example.com"
  }
}

// Step 2: Get full customer details (using customer_id from step 1)
{
  "name": "get_customer",
  "arguments": {
    "customer_id": "345678"
  }
}

// Step 3: Get their subscriptions
{
  "name": "get_subscriptions",
  "arguments": {
    "customer_id": "345678",
    "status": "active"
  }
}

// Step 4: Get their addresses
{
  "name": "get_addresses",
  "arguments": {
    "customer_id": "345678"
  }
}
```

#### Use Case 2: Subscription Management - Skip Next Delivery

**Scenario**: Customer wants to skip their next delivery

```json
// Step 1: Find customer
{
  "name": "get_customer_by_email",
  "arguments": {
    "email": "mike.jones@example.com"
  }
}

// Step 2: Get their active subscriptions
{
  "name": "get_subscriptions",
  "arguments": {
    "customer_id": "567890",
    "status": "active"
  }
}

// Step 3: Skip specific subscription (using subscription_id from step 2)
{
  "name": "skip_subscription",
  "arguments": {
    "subscription_id": "sub_456",
    "date": "2024-02-15"
  }
}
```

#### Use Case 3: Order Management - Check Recent Orders

**Scenario**: Customer asks about recent order status

```json
// Step 1: Find customer
{
  "name": "get_customer_by_email",
  "arguments": {
    "email": "lisa.brown@example.com"
  }
}

// Step 2: Get recent orders
{
  "name": "get_orders",
  "arguments": {
    "customer_id": "678901",
    "limit": 5
  }
}

// Step 3: Get specific order details (using order_id from step 2)
{
  "name": "get_order",
  "arguments": {
    "order_id": "order_789"
  }
}
```

#### Use Case 4: Address Management - Update Shipping Address

**Scenario**: Customer moved and needs to update their address

```json
// Step 1: Find customer
{
  "name": "get_customer_by_email",
  "arguments": {
    "email": "tom.wilson@example.com"
  }
}

// Step 2: Get current addresses
{
  "name": "get_addresses",
  "arguments": {
    "customer_id": "789012"
  }
}

// Step 3: Update existing address (using address_id from step 2)
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

**Scenario**: Customer wants to add a product to their next delivery

```json
// Step 1: Find customer
{
  "name": "get_customer_by_email",
  "arguments": {
    "email": "anna.davis@example.com"
  }
}

// Step 2: Browse available products
{
  "name": "get_products",
  "arguments": {
    "limit": 20
  }
}

// Step 3: Add one-time product (using variant_id from step 2)
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

#### 1. **Always Validate Customer ID**
```json
// Good: Verify customer exists before other operations
{
  "name": "get_customer",
  "arguments": {
    "customer_id": "123456"
  }
}
```

#### 2. **Store Customer ID for Session**
```javascript
// In your application, store the customer ID for the session
const customerId = "123456"; // From get_customer_by_email response

// Use throughout the session
const subscriptions = await callTool("get_subscriptions", { customer_id: customerId });
const addresses = await callTool("get_addresses", { customer_id: customerId });
```

#### 3. **Handle Customer Not Found**
```json
// If customer doesn't exist, you'll get an error
{
  "error": "Customer not found with email: nonexistent@example.com"
}
```

### Legacy vs Current Customer IDs

**Important**: Customer IDs in Recharge are:
- **Numeric strings** (e.g., "123456", "789012")
- **Unique per store** 
- **Persistent** (don't change over time)
- **Different from Shopify customer IDs**

### Basic Operations by Customer ID

Once you have a customer ID, these are the most common operations:

```json
{
  "name": "get_subscriptions",
  "arguments": {
    "customer_id": "123456",
    "status": "active",
    "limit": 10
  }
}
```

```json
{
  "name": "get_orders",
  "arguments": {
    "customer_id": "123456",
    "limit": 5
  }
}
```

```json
{
  "name": "get_charges",
  "arguments": {
    "customer_id": "123456",
    "status": "success"
  }
}
```

```json
{
  "name": "get_addresses",
  "arguments": {
    "customer_id": "123456"
  }
}
```

```json
{
  "name": "get_payment_methods",
  "arguments": {
    "customer_id": "123456"
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
**Solution**: Ensure you're using a Storefront API token, not Admin API token:
1. Get Storefront API token from Recharge merchant portal
2. Token should be customer-scoped for the specific customer
3. Set `RECHARGE_ACCESS_TOKEN` environment variable or provide in tool calls

**Example of correct authentication**:
```json
{"name": "get_customer", "arguments": {"access_token": "storefront_token_here"}}
```

#### Invalid Token Type
```
Error: Invalid token permissions
```
**Solution**: Ensure you're using the correct token type:
- ✅ Correct: Storefront API token (customer-scoped)
- ❌ Wrong: Admin API token (merchant-scoped)
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

#### Missing Storefront Token
```
Error: No Storefront API access token available
```
**Solution**: 
1. Get your Storefront API token from Recharge merchant portal
2. Either set `RECHARGE_ACCESS_TOKEN` environment variable
3. Or provide `access_token` parameter in individual tool calls

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