# Recharge Storefront API MCP Server

A comprehensive Model Context Protocol (MCP) server that provides complete access to the Recharge Storefront API. This server enables AI assistants and other MCP clients to interact with Recharge subscription management functionality through a standardized interface.

## Features

### Complete API Coverage
- **Customer Management**: Profile updates, preferences, settings
- **Subscription Management**: Create, update, pause, resume, cancel, skip deliveries
- **Address Management**: Shipping and billing address CRUD operations
- **Payment Methods**: Payment method management and updates
- **Product Catalog**: Browse available products and variants
- **Order History**: View past orders and their status
- **Charge Management**: View upcoming and past charges
- **One-time Products**: Add products to upcoming deliveries
- **Bundle Management**: Handle product bundles and selections
- **Discount Management**: Apply and manage discount codes
- **Notification System**: View and manage customer notifications
- **Session Management**: Customer authentication and session handling
- **Store Configuration**: Access store settings and delivery schedules
- **Async Operations**: Bulk operations via async batch processing
- **Shopify Integration**: Connector configuration and sync settings

### Key Capabilities
- **Flexible Authentication**: Support for environment variables or per-tool API tokens
- **Comprehensive Error Handling**: Detailed error messages with proper HTTP status codes
- **Input Validation**: Zod schema validation for all tool parameters
- **Debug Support**: Optional debug logging for development and troubleshooting
- **Docker Support**: Complete containerization with multi-environment configurations
- **Production Ready**: Health checks, logging, resource limits, and monitoring

## Quick Start

### Prerequisites
- Node.js 18.0.0 or higher
- Recharge Storefront API access token (see instructions below)
- Shopify store with Recharge integration

### Getting Your API Access Token

Before you can use this MCP server, you need to obtain a Recharge Storefront API access token:

#### For Merchants (Store Owners):
1. **Log into your Recharge merchant portal** at `https://rechargepayments.com/`
2. **Navigate to Integrations** in your merchant dashboard
3. **Go to API tokens** or **Developer settings**
4. **Create a new Storefront API token** with the following permissions:
   - Customer read/write access
   - Subscription read/write access
   - Address read/write access
   - Payment method read/write access
   - Order read access
   - Product read access
5. **Copy the generated token** - it will start with a prefix like `sk_test_` (for test mode) or `sk_live_` (for production)
6. **Store the token securely** - you'll need it for the configuration step below

#### For Developers/Partners:
1. **Contact Recharge Support** or your Recharge partner manager to request Storefront API access
2. **Provide your use case** and integration requirements
3. **Follow the merchant steps above** once access is granted to your development store

#### Important Notes:
- **Test vs Production**: Use test tokens (`sk_test_`) for development and live tokens (`sk_live_`) for production
- **Token Security**: Never commit tokens to version control or share them publicly
- **Permissions**: Ensure your token has the necessary permissions for the operations you plan to perform
- **Rate Limits**: Be aware of Recharge API rate limits when making requests

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
   RECHARGE_ACCESS_TOKEN=your_access_token_here        # Optional (can use per-tool)
   ```

4. **Start the server:**
   ```bash
   npm start
   ```

## Configuration

### Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `RECHARGE_STOREFRONT_DOMAIN` | Yes* | Your Shopify domain | `your-shop.myshopify.com` |
| `RECHARGE_ACCESS_TOKEN` | Yes* | Default API token | `sk_test_...` |
| `MCP_SERVER_NAME` | No | Server name | `recharge-storefront-api-mcp` |
| `MCP_SERVER_VERSION` | No | Server version | `1.0.0` |
| `DEBUG` | No | Enable debug logging | `true` |

*Required unless provided as tool parameters in each call

### Authentication Options

The server supports flexible authentication:

1. **Environment Variable (Default)**: Set `RECHARGE_ACCESS_TOKEN` in your environment
2. **Per-Tool Token**: Provide `access_token` parameter in individual tool calls
3. **Token Precedence**: Tool parameter > Environment variable

The server also supports flexible store URL configuration:

1. **Environment Variable (Default)**: Set `RECHARGE_STOREFRONT_DOMAIN` in your environment
2. **Per-Tool Store URL**: Provide `store_url` parameter in individual tool calls
3. **Store URL Precedence**: Tool parameter > Environment variable

**Important**: You must provide either environment variables OR tool parameters for each call. At least one method of authentication and store identification is required.

Example tool call with token:
```json
{
  "name": "get_customer_subscriptions",
  "arguments": {
    "access_token": "sk_test_your_token_here",
    "store_url": "your-shop.myshopify.com",
    "status": "active"
  }
}
```

## Available Tools

### Customer Management
- `get_customer` - Retrieve current customer information
- `update_customer` - Update customer profile and preferences

### Subscription Management
- `get_customer_subscriptions` - List all customer subscriptions
- `get_subscription` - Get detailed subscription information
- `update_subscription` - Modify subscription details
- `skip_subscription` - Skip a delivery date
- `unskip_subscription` - Restore a skipped delivery
- `swap_subscription_product` - Change subscription product
- `cancel_subscription` - Cancel a subscription
- `activate_subscription` - Reactivate a cancelled subscription
- `pause_subscription` - Temporarily pause subscription
- `resume_subscription` - Resume a paused subscription
- `set_subscription_next_charge_date` - Update next charge date

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
- `get_bundle_selections` - List bundle selections
- `get_bundle_selection` - Get bundle details
- `create_bundle_selection` - Create bundle selection
- `update_bundle_selection` - Modify bundle selection
- `delete_bundle_selection` - Remove bundle selection

### Discount Management
- `get_discounts` - List applied discounts
- `get_discount` - Get discount details
- `apply_discount` - Apply discount code
- `remove_discount` - Remove discount

### Notifications
- `get_notifications` - List notifications
- `get_notification` - Get notification details
- `mark_notification_as_read` - Mark as read

### Session Management
- `create_session` - Create customer session
- `validate_session` - Validate current session
- `destroy_session` - End session (logout)

### Store & Settings
- `get_store` - Get store configuration
- `get_delivery_schedule` - Get delivery schedule
- `get_settings` - Get customer settings
- `update_settings` - Update preferences

### Advanced Operations
- `get_async_batch` - Check batch operation status
- `create_async_batch` - Create bulk operation
- `get_shopify_connector` - Get Shopify integration status
- `update_shopify_connector` - Update integration settings

## Usage Examples

### Basic Subscription Management
```json
{
  "name": "get_customer_subscriptions",
  "arguments": {
    "status": "active",
    "limit": 10
  }
}
```

### Update Subscription Frequency
```json
{
  "name": "update_subscription",
  "arguments": {
    "subscriptionId": "12345",
    "order_interval_frequency": 2,
    "order_interval_unit": "month"
  }
}
```

### Skip Next Delivery
```json
{
  "name": "skip_subscription",
  "arguments": {
    "subscriptionId": "12345",
    "date": "2024-02-15"
  }
}
```

### Add One-time Product
```json
{
  "name": "create_onetime",
  "arguments": {
    "variant_id": 67890,
    "quantity": 1,
    "next_charge_scheduled_at": "2024-02-01"
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
- **Token Security**: Never commit API tokens to version control
- **Environment Variables**: Use `.env` files for sensitive data
- **Docker Secrets**: Use Docker secrets in production
- **Access Control**: Implement proper access controls
- **Token Rotation**: Regularly rotate API tokens

### Production Security
- Non-root container user
- Resource limits and monitoring
- Secure environment variable handling
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

This MCP server provides **complete coverage** of the Recharge Storefront API:

- ✅ **Customer Management** - Profile, preferences, settings
- ✅ **Subscription Lifecycle** - Full CRUD operations
- ✅ **Address Management** - Shipping and billing addresses
- ✅ **Payment Methods** - Payment method management
- ✅ **Product Catalog** - Product browsing and details
- ✅ **Order Management** - Order history and tracking
- ✅ **Charge Management** - Billing and payment tracking
- ✅ **One-time Products** - Add-on product management
- ✅ **Bundle Management** - Product bundle handling
- ✅ **Discount System** - Coupon and discount management
- ✅ **Notification System** - Customer communication
- ✅ **Session Management** - Authentication and sessions
- ✅ **Store Configuration** - Settings and preferences
- ✅ **Async Operations** - Bulk operation support
- ✅ **Shopify Integration** - Connector management

**Total Tools**: 50+ comprehensive API tools covering all Recharge Storefront endpoints.

## Troubleshooting

### Common Issues

#### Missing API Token
```
Error: No API access token available
```
**Solution**: Set `RECHARGE_ACCESS_TOKEN` environment variable or provide `access_token` in tool calls.

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
- 50+ comprehensive API tools
- Flexible authentication system
- Docker deployment support
- Comprehensive error handling
- Production-ready configuration