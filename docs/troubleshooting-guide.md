# Troubleshooting Guide

This comprehensive guide helps you diagnose and resolve common issues with the Recharge Storefront API MCP Server.

## Table of Contents

- [Quick Diagnostics](#quick-diagnostics)
- [Authentication Issues](#authentication-issues)
- [Redirect Errors](#redirect-errors)
- [Configuration Problems](#configuration-problems)
- [Network and Connection Issues](#network-and-connection-issues)
- [Performance Issues](#performance-issues)
- [Debug Mode](#debug-mode)
- [Common Error Messages](#common-error-messages)

## Quick Diagnostics

### Step 1: Basic Health Check

```bash
# Check if server starts
npm start

# Validate configuration
npm run validate

# Run comprehensive tests
npm run test:full

# Check API coverage
npm run coverage
```

### Step 2: Environment Check

```bash
# Verify environment variables
node -e "
require('dotenv').config();
console.log('Store URL:', process.env.RECHARGE_STOREFRONT_DOMAIN);
console.log('Has Merchant Token:', !!process.env.RECHARGE_MERCHANT_TOKEN);
console.log('Has Session Token:', !!process.env.RECHARGE_SESSION_TOKEN);
"
```

### Step 3: Enable Debug Mode

```bash
DEBUG=true npm start
```

## Authentication Issues

### Issue: "No authentication token available"

**Symptoms:**
```
Error: No authentication token available. Please provide either:
1. 'session_token' parameter in your tool call, or
2. 'customer_id' or 'customer_email' parameter (requires merchant token), or
3. Set RECHARGE_SESSION_TOKEN or RECHARGE_MERCHANT_TOKEN in your environment variables.
```

**Solutions:**

1. **Set environment variables:**
   ```bash
   # In .env file
   RECHARGE_MERCHANT_TOKEN=your_merchant_token_here
   RECHARGE_STOREFRONT_DOMAIN=your-shop.myshopify.com
   ```

2. **Provide customer identification in tool calls:**
   ```json
   {
     "name": "get_customer",
     "arguments": {
       "customer_email": "customer@example.com"
     }
   }
   ```

3. **Use explicit session token:**
   ```json
   {
     "name": "get_customer",
     "arguments": {
       "session_token": "your_session_token_here"
     }
   }
   ```

### Issue: "Customer not found with email address"

**Symptoms:**
```
Error: Customer not found with email address: customer@example.com
```

**Solutions:**

1. **Verify customer exists in Recharge:**
   - Check Recharge admin panel
   - Ensure customer has active subscriptions
   - Verify email address spelling

2. **Check merchant token permissions:**
   ```bash
   # Test merchant token
   curl -H "X-Recharge-Access-Token: your_token" \
        "https://api.rechargeapps.com/customers?email=customer@example.com"
   ```

3. **Enable debug mode to see API responses:**
   ```bash
   DEBUG=true npm start
   ```

### Issue: "Invalid merchant token"

**Symptoms:**
- Authentication redirects
- 401/403 errors
- OAuth redirect errors

**Solutions:**

1. **Verify token type:**
   - Use **Storefront API** token (not Admin API)
   - Token should start with your store prefix
   - Check token hasn't expired

2. **Check token permissions:**
   - Ensure token has Storefront API access
   - Verify customer read permissions
   - Check subscription management permissions

3. **Test token directly:**
   ```bash
   curl -H "X-Recharge-Access-Token: your_token" \
        "https://api.rechargeapps.com/store"
   ```

## Redirect Errors

### Issue: "API returned redirect" or "Too many redirects"

**Symptoms:**
```
Error: API returned redirect 302 to https://shop.myshopify.com/admin/oauth
```

**Root Causes & Solutions:**

#### 1. Admin API Token Usage
**Problem:** Using Admin API token instead of Storefront API token

**Solution:**
- Create new **Storefront API** token in Recharge admin
- Replace Admin API token with Storefront API token
- Verify token type in Recharge settings

#### 2. Incorrect Store URL Format
**Problem:** Wrong domain format or protocol

**Examples of incorrect formats:**
```bash
# Wrong - includes protocol
RECHARGE_STOREFRONT_DOMAIN=https://shop.myshopify.com

# Wrong - includes trailing slash
RECHARGE_STOREFRONT_DOMAIN=shop.myshopify.com/

# Wrong - not a Shopify domain
RECHARGE_STOREFRONT_DOMAIN=shop.com
```

**Correct format:**
```bash
RECHARGE_STOREFRONT_DOMAIN=shop.myshopify.com
```

#### 3. Recharge Not Installed
**Problem:** Recharge app not properly installed on Shopify store

**Solution:**
- Verify Recharge is installed in Shopify admin
- Check Recharge app permissions
- Reinstall Recharge if necessary

#### 4. Session Token Expired
**Problem:** Session token has expired (sessions last 1 hour)

**Solution:**
- Use customer_email or customer_id for automatic session creation
- Don't rely on long-lived session tokens
- Let the server handle session management

### Debug Redirect Issues

Enable debug mode to see detailed redirect information:

```bash
DEBUG=true npm start
```

Look for debug output like:
```
[DEBUG] Redirect 302 to: https://shop.myshopify.com/admin/oauth
[DEBUG] Original URL: https://shop.myshopify.com/tools/recurring/portal/customer
[DEBUG] This indicates Admin API token usage
```

## Configuration Problems

### Issue: "No store URL available"

**Symptoms:**
```
Error: No store URL available. Please provide a 'store_url' parameter in your tool call or set RECHARGE_STOREFRONT_DOMAIN in your environment variables.
```

**Solutions:**

1. **Set environment variable:**
   ```bash
   # In .env file
   RECHARGE_STOREFRONT_DOMAIN=your-shop.myshopify.com
   ```

2. **Provide in tool calls:**
   ```json
   {
     "name": "get_customer",
     "arguments": {
       "store_url": "your-shop.myshopify.com",
       "customer_email": "customer@example.com"
     }
   }
   ```

### Issue: "Domain must end with .myshopify.com"

**Symptoms:**
```
Error: Store URL must be a valid Shopify domain ending with .myshopify.com
```

**Solutions:**

1. **Use correct Shopify domain:**
   ```bash
   # Correct
   RECHARGE_STOREFRONT_DOMAIN=your-shop.myshopify.com
   
   # Wrong
   RECHARGE_STOREFRONT_DOMAIN=your-shop.com
   RECHARGE_STOREFRONT_DOMAIN=yourshop.rechargeapps.com
   ```

2. **Find your Shopify domain:**
   - Check Shopify admin URL
   - Look in Recharge settings
   - Check your Shopify store settings

### Issue: Environment Variables Not Loading

**Symptoms:**
- Configuration not found
- Default values being used
- Variables showing as undefined

**Solutions:**

1. **Check .env file location:**
   ```bash
   # .env file must be in project root
   ls -la .env
   ```

2. **Verify .env file format:**
   ```bash
   # No spaces around equals sign
   RECHARGE_STOREFRONT_DOMAIN=shop.myshopify.com
   
   # Not this:
   RECHARGE_STOREFRONT_DOMAIN = shop.myshopify.com
   ```

3. **Check file permissions:**
   ```bash
   chmod 644 .env
   ```

## Network and Connection Issues

### Issue: "Request timeout" or "ECONNABORTED"

**Symptoms:**
```
Error: Request timeout - the server took too long to respond
```

**Solutions:**

1. **Check network connectivity:**
   ```bash
   # Test basic connectivity
   ping api.rechargeapps.com
   
   # Test HTTPS connectivity
   curl -I https://api.rechargeapps.com
   ```

2. **Increase timeout (if needed):**
   - Default timeout is 30 seconds
   - Network issues may require investigation
   - Check firewall settings

3. **Retry logic:**
   - Server automatically retries failed requests
   - Check debug logs for retry attempts
   - Persistent failures indicate network issues

### Issue: "ENOTFOUND" or "ECONNRESET"

**Symptoms:**
```
Error: Network error: No response received from server
```

**Solutions:**

1. **DNS resolution:**
   ```bash
   # Test DNS resolution
   nslookup api.rechargeapps.com
   dig api.rechargeapps.com
   ```

2. **Firewall/proxy issues:**
   - Check corporate firewall settings
   - Verify proxy configuration
   - Test from different network

3. **SSL/TLS issues:**
   ```bash
   # Test SSL connection
   openssl s_client -connect api.rechargeapps.com:443
   ```

## Performance Issues

### Issue: Slow API Responses

**Symptoms:**
- Long response times
- Timeouts on large requests
- Poor user experience

**Solutions:**

1. **Enable circuit breaker monitoring:**
   ```bash
   DEBUG=true npm start
   # Look for circuit breaker status in logs
   ```

2. **Check API rate limits:**
   - Recharge has rate limits
   - Monitor for 429 responses
   - Implement request throttling if needed

3. **Optimize request patterns:**
   - Use pagination for large datasets
   - Cache frequently accessed data
   - Batch related operations

### Issue: Memory Usage Growing

**Symptoms:**
- Increasing memory usage over time
- Server becoming unresponsive
- Out of memory errors

**Solutions:**

1. **Monitor session cache:**
   ```bash
   # Check cache size in debug mode
   DEBUG=true npm start
   # Look for "Cached sessions: X" in logs
   ```

2. **Session cache cleanup:**
   - Sessions automatically expire after 1 hour
   - Cache is cleaned up automatically
   - Restart server if memory issues persist

## Debug Mode

### Enabling Debug Mode

```bash
# Enable debug logging
DEBUG=true npm start

# Or for development
npm run dev:debug
```

### Debug Output Examples

**Authentication Flow:**
```
[DEBUG] Server initialization: {"defaultStoreUrl":"shop.myshopify.com","hasDefaultSessionToken":false,"hasDefaultMerchantToken":true}
[DEBUG] Looking up customer by email: {"customerEmail":"alice@example.com","hasMerchantToken":true}
[DEBUG] Found customer ID for email: {"customerEmail":"alice@example.com","customerId":"123456"}
[DEBUG] Auto-creating session for customer: {"customerId":"123456"}
[DEBUG] Using cached session: {"cacheKey":"customer_123456"}
```

**API Requests:**
```
[DEBUG] Making API request: {"method":"GET","endpoint":"/customer","hasData":false,"hasParams":false}
[DEBUG] Full URL: https://shop.myshopify.com/tools/recurring/portal/customer
[DEBUG] API request successful: {"method":"GET","endpoint":"/customer","status":200}
```

**Error Debugging:**
```
[DEBUG] Redirect 302 to: https://shop.myshopify.com/admin/oauth
[DEBUG] Original URL: https://shop.myshopify.com/tools/recurring/portal/customer
[DEBUG] This indicates Admin API token usage
```

## Common Error Messages

### "Security Error: Cannot use default session token"

**Cause:** Trying to use default session when customer-specific sessions exist

**Solution:** Always specify customer identification:
```json
{
  "name": "get_subscriptions",
  "arguments": {
    "customer_email": "customer@example.com"
  }
}
```

### "Circuit breaker is OPEN"

**Cause:** Too many API failures, circuit breaker protecting against cascading failures

**Solution:**
1. Wait for circuit breaker to reset (1 minute)
2. Check underlying API issues
3. Verify authentication and configuration

### "Subscription not found"

**Cause:** Invalid subscription ID or access permissions

**Solution:**
1. Verify subscription ID exists
2. Check customer has access to subscription
3. Ensure customer authentication is correct

### "Rate limit exceeded"

**Cause:** Too many API requests in short time period

**Solution:**
1. Implement request throttling
2. Use pagination for large datasets
3. Cache frequently accessed data
4. Wait before retrying requests

## Getting Additional Help

### Collect Debug Information

When reporting issues, include:

1. **Debug logs:**
   ```bash
   DEBUG=true npm start > debug.log 2>&1
   ```

2. **Configuration (sanitized):**
   ```bash
   npm run validate
   ```

3. **System information:**
   ```bash
   node --version
   npm --version
   cat package.json | grep version
   ```

4. **Error reproduction steps:**
   - Exact tool calls made
   - Expected vs actual behavior
   - Timing of issues

### Support Channels

1. **GitHub Issues:** For bugs and feature requests
2. **GitHub Discussions:** For questions and community support
3. **Debug Mode:** For detailed troubleshooting information

### Before Reporting Issues

1. **Search existing issues** for similar problems
2. **Try debug mode** to get detailed error information
3. **Test with minimal configuration** to isolate the issue
4. **Verify Recharge service status** at status.rechargeapps.com

This troubleshooting guide should help you resolve most common issues. If you continue to experience problems, enable debug mode and collect the detailed logs for further investigation.