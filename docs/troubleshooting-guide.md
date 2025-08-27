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

### Understanding Redirect Errors

Redirect errors occur when the Recharge API returns a 3xx redirect response instead of the expected data. This usually indicates configuration or authentication issues.

**Common redirect patterns and their meanings:**

### Admin API Token Usage
**Problem:** Using Admin API token instead of Storefront API token

**Symptoms:**
- Redirects to `/admin/oauth` endpoints
- 302/303 redirect responses
- OAuth-related error messages

**Solution:** Create new **Storefront API** token in Recharge admin

```bash
# Check if you're getting OAuth redirects
curl -v -H "X-Recharge-Access-Token: your_token" \
     "https://your-shop.myshopify.com/tools/recurring/portal/customer"
```

### Incorrect Store URL Format
**Problem:** Wrong domain format

**Common mistakes and correct formats:**

```bash
# ✅ CORRECT - Use myshopify.com domain
RECHARGE_STOREFRONT_DOMAIN=shop.myshopify.com

# ❌ WRONG - Don't include protocol
RECHARGE_STOREFRONT_DOMAIN=https://shop.myshopify.com

# ❌ WRONG - Don't include trailing slash
RECHARGE_STOREFRONT_DOMAIN=shop.myshopify.com/

# ❌ WRONG - Don't use custom domains
RECHARGE_STOREFRONT_DOMAIN=shop.com

# ❌ WRONG - Don't use admin URLs
RECHARGE_STOREFRONT_DOMAIN=admin.shopify.com
```

### Session Token Issues
**Problem:** Invalid or expired session tokens

**Symptoms:**
- Redirects to `/account/login` endpoints
- 401 Unauthorized responses
- Login page redirects

**Solutions:**
```bash
# Use customer identification for auto-session creation
{
  "name": "get_customer",
  "arguments": {
    "customer_email": "customer@example.com"
  }
}

# Or provide valid session token
{
  "name": "get_customer", 
  "arguments": {
    "session_token": "valid_session_token_here"
  }
}
```

### Store Configuration Issues
**Problem:** Recharge not properly installed or configured

**Symptoms:**
- External redirects to different domains
- 404 Not Found errors
- Redirects to Shopify admin

**Diagnostic steps:**
```bash
# 1. Verify store URL format
echo "Store URL: your-shop.myshopify.com"

# 2. Check if Recharge is installed
curl -I "https://your-shop.myshopify.com/tools/recurring/portal"

# 3. Verify API endpoint accessibility
curl -v "https://your-shop.myshopify.com/tools/recurring/portal/customer" \
     -H "Authorization: Bearer your_session_token"
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