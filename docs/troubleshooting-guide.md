# Troubleshooting Guide

Common issues and solutions for the Recharge Storefront API MCP Server.

## Quick Diagnostics

```bash
# Check if server starts
npm start

# Validate configuration
npm run validate

# Enable debug mode
DEBUG=true npm start
```

## Authentication Issues

### No authentication token available

**Solution:** Set environment variables or provide in tool calls:

```bash
# In .env file
RECHARGE_MERCHANT_TOKEN=your_merchant_token_here
RECHARGE_STOREFRONT_DOMAIN=your-shop.myshopify.com
```

### Customer not found

**Solution:** Verify customer exists and check token permissions:

```bash
# Test merchant token
curl -H "X-Recharge-Access-Token: your_token" \
     "https://api.rechargeapps.com/customers?email=customer@example.com"
```

## Redirect Errors

### Admin API Token Usage
**Problem:** Using Admin API token instead of Storefront API token

**Solution:** Create new **Storefront API** token in Recharge admin

### Incorrect Store URL Format
**Problem:** Wrong domain format

**Correct format:**
```bash
RECHARGE_STOREFRONT_DOMAIN=shop.myshopify.com
```

**Wrong formats:**
```bash
# Don't include protocol
RECHARGE_STOREFRONT_DOMAIN=https://shop.myshopify.com

# Don't include trailing slash
RECHARGE_STOREFRONT_DOMAIN=shop.myshopify.com/
```

## Debug Mode

Enable debug mode for detailed logging:

```bash
DEBUG=true npm start
```

This will show:
- Authentication flow details
- API request/response logging
- Session creation and caching
- Error stack traces