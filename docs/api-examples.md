# Recharge Storefront API Examples

This document provides comprehensive examples of using the Recharge Storefront API MCP Server with real API responses and error handling scenarios.

## Table of Contents

- [Authentication Examples](#authentication-examples)
- [Customer Management Examples](#customer-management-examples)
- [Subscription Management Examples](#subscription-management-examples)
- [Error Handling Examples](#error-handling-examples)
- [Advanced Usage Patterns](#advanced-usage-patterns)

## Authentication Examples

### Basic Authentication with Customer Email

```json
{
  "name": "get_customer",
  "arguments": {
    "customer_email": "alice@example.com"
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Customer Information:\n{\n  \"customer\": {\n    \"id\": 123456,\n    \"email\": \"alice@example.com\",\n    \"first_name\": \"Alice\",\n    \"last_name\": \"Johnson\",\n    \"created_at\": \"2023-01-15T10:30:00Z\",\n    \"updated_at\": \"2024-01-10T14:22:33Z\",\n    \"phone\": \"+1234567890\"\n  }\n}"
    }
  ]
}
```

### Authentication with Customer ID

```json
{
  "name": "get_subscriptions",
  "arguments": {
    "customer_id": "123456",
    "status": "active"
  }
}
```

### Per-Tool Authentication Override

```json
{
  "name": "get_customer",
  "arguments": {
    "store_url": "different-shop.myshopify.com",
    "merchant_token": "different_token_here",
    "customer_email": "customer@example.com"
  }
}
```

## Customer Management Examples

### Get Customer Information

**Request:**
```json
{
  "name": "get_customer",
  "arguments": {
    "customer_email": "alice@example.com"
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Customer Information:\n{\n  \"customer\": {\n    \"id\": 123456,\n    \"email\": \"alice@example.com\",\n    \"first_name\": \"Alice\",\n    \"last_name\": \"Johnson\",\n    \"created_at\": \"2023-01-15T10:30:00Z\",\n    \"updated_at\": \"2024-01-10T14:22:33Z\",\n    \"phone\": \"+1234567890\",\n    \"billing_address\": {\n      \"id\": 789012,\n      \"first_name\": \"Alice\",\n      \"last_name\": \"Johnson\",\n      \"address1\": \"123 Main St\",\n      \"city\": \"New York\",\n      \"province\": \"NY\",\n      \"zip\": \"10001\",\n      \"country\": \"United States\"\n    }\n  }\n}"
    }
  ]
}
```

### Update Customer Information

**Request:**
```json
{
  "name": "update_customer",
  "arguments": {
    "customer_email": "alice@example.com",
    "first_name": "Alice",
    "last_name": "Smith",
    "phone": "+1987654321"
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Updated Customer:\n{\n  \"customer\": {\n    \"id\": 123456,\n    \"email\": \"alice@example.com\",\n    \"first_name\": \"Alice\",\n    \"last_name\": \"Smith\",\n    \"phone\": \"+1987654321\",\n    \"updated_at\": \"2024-01-15T16:45:22Z\"\n  }\n}"
    }
  ]
}
```

## Subscription Management Examples

### Get Active Subscriptions

**Request:**
```json
{
  "name": "get_subscriptions",
  "arguments": {
    "customer_email": "alice@example.com",
    "status": "active",
    "limit": 10
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Subscriptions:\n{\n  \"subscriptions\": [\n    {\n      \"id\": 789123,\n      \"customer_id\": 123456,\n      \"status\": \"active\",\n      \"next_charge_scheduled_at\": \"2024-02-15T00:00:00Z\",\n      \"order_interval_frequency\": 1,\n      \"order_interval_unit\": \"month\",\n      \"quantity\": 2,\n      \"variant_id\": 456789,\n      \"product\": {\n        \"id\": 123789,\n        \"title\": \"Premium Coffee Beans\",\n        \"handle\": \"premium-coffee-beans\"\n      },\n      \"variant\": {\n        \"id\": 456789,\n        \"title\": \"Medium Roast - 1lb\",\n        \"price\": \"24.99\"\n      },\n      \"created_at\": \"2023-06-01T12:00:00Z\",\n      \"updated_at\": \"2024-01-10T09:30:15Z\"\n    }\n  ],\n  \"count\": 1\n}"
    }
  ]
}
```

### Update Subscription Frequency

**Request:**
```json
{
  "name": "update_subscription",
  "arguments": {
    "customer_email": "alice@example.com",
    "subscription_id": "789123",
    "order_interval_frequency": 2,
    "order_interval_unit": "month"
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Updated Subscription:\n{\n  \"subscription\": {\n    \"id\": 789123,\n    \"customer_id\": 123456,\n    \"status\": \"active\",\n    \"next_charge_scheduled_at\": \"2024-03-15T00:00:00Z\",\n    \"order_interval_frequency\": 2,\n    \"order_interval_unit\": \"month\",\n    \"quantity\": 2,\n    \"updated_at\": \"2024-01-15T16:50:33Z\"\n  }\n}"
    }
  ]
}
```

### Skip Subscription Delivery

**Request:**
```json
{
  "name": "skip_subscription",
  "arguments": {
    "customer_email": "alice@example.com",
    "subscription_id": "789123",
    "date": "2024-02-15"
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Skipped Subscription:\n{\n  \"subscription\": {\n    \"id\": 789123,\n    \"status\": \"active\",\n    \"next_charge_scheduled_at\": \"2024-03-15T00:00:00Z\",\n    \"skipped_deliveries\": [\n      {\n        \"date\": \"2024-02-15\",\n        \"reason\": \"Customer requested skip\",\n        \"created_at\": \"2024-01-15T16:55:10Z\"\n      }\n    ]\n  }\n}"
    }
  ]
}
```

### Swap Subscription Product

**Request:**
```json
{
  "name": "swap_subscription",
  "arguments": {
    "customer_email": "alice@example.com",
    "subscription_id": "789123",
    "variant_id": 456790,
    "quantity": 1
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Swapped Subscription Product:\n{\n  \"subscription\": {\n    \"id\": 789123,\n    \"variant_id\": 456790,\n    \"quantity\": 1,\n    \"product\": {\n      \"id\": 123789,\n      \"title\": \"Premium Coffee Beans\"\n    },\n    \"variant\": {\n      \"id\": 456790,\n      \"title\": \"Dark Roast - 2lb\",\n      \"price\": \"39.99\"\n    },\n    \"updated_at\": \"2024-01-15T17:00:45Z\"\n  }\n}"
    }
  ]
}
```

## Error Handling Examples

### Invalid Customer Email

**Request:**
```json
{
  "name": "get_customer",
  "arguments": {
    "customer_email": "nonexistent@example.com"
  }
}
```

**Error Response:**
```json
{
  "error": {
    "code": -32603,
    "message": "Tool 'get_customer' execution failed: Failed to find customer with email nonexistent@example.com: Customer not found"
  }
}
```

### Authentication Error

**Request:**
```json
{
  "name": "get_subscriptions",
  "arguments": {
    "merchant_token": "invalid_token",
    "customer_email": "alice@example.com"
  }
}
```

**Error Response:**
```json
{
  "error": {
    "code": -32603,
    "message": "Recharge API Error (401): Invalid authentication credentials\n\nThis redirect error often indicates:\n1. Invalid or expired authentication tokens\n2. Using Admin API token instead of Storefront API token\n3. Incorrect store URL configuration\n4. Recharge not properly installed on the store\n\nPlease verify your authentication tokens and store URL configuration."
  }
}
```

### Validation Error

**Request:**
```json
{
  "name": "create_subscription",
  "arguments": {
    "customer_email": "alice@example.com",
    "address_id": "invalid_id"
  }
}
```

**Error Response:**
```json
{
  "error": {
    "code": -32602,
    "message": "Invalid parameters for tool 'create_subscription': next_charge_scheduled_at: Required, order_interval_frequency: Required, order_interval_unit: Required, quantity: Required, variant_id: Required"
  }
}
```

### Rate Limit Error

**Error Response:**
```json
{
  "error": {
    "code": -32603,
    "message": "API Error (429): Rate limit exceeded\n\nTip: You have exceeded the API rate limit. Please wait before making more requests."
  }
}
```

## Advanced Usage Patterns

### Multi-Customer Workflow

```json
// Customer A operations
{
  "name": "get_customer",
  "arguments": {"customer_email": "alice@example.com"}
}

{
  "name": "get_subscriptions",
  "arguments": {"customer_email": "alice@example.com"}
}

// Customer B operations (automatic session switching)
{
  "name": "get_customer",
  "arguments": {"customer_email": "bob@example.com"}
}

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

### Complete Order Management Workflow

```json
// 1. Get customer information
{
  "name": "get_customer",
  "arguments": {"customer_email": "alice@example.com"}
}

// 2. Check active subscriptions
{
  "name": "get_subscriptions",
  "arguments": {
    "customer_email": "alice@example.com",
    "status": "active"
  }
}

// 3. View recent orders
{
  "name": "get_orders",
  "arguments": {
    "customer_email": "alice@example.com",
    "limit": 5
  }
}

// 4. Check upcoming charges
{
  "name": "get_charges",
  "arguments": {
    "customer_email": "alice@example.com",
    "status": "queued"
  }
}

// 5. Add one-time product to next delivery
{
  "name": "create_onetime",
  "arguments": {
    "customer_email": "alice@example.com",
    "variant_id": 789456,
    "quantity": 1,
    "next_charge_scheduled_at": "2024-02-15"
  }
}
```

### Address and Payment Management

```json
// 1. Get current addresses
{
  "name": "get_addresses",
  "arguments": {"customer_email": "alice@example.com"}
}

// 2. Create new address
{
  "name": "create_address",
  "arguments": {
    "customer_email": "alice@example.com",
    "first_name": "Alice",
    "last_name": "Johnson",
    "address1": "456 Oak Avenue",
    "city": "Los Angeles",
    "province": "CA",
    "zip": "90210",
    "country": "United States"
  }
}

// 3. Get payment methods
{
  "name": "get_payment_methods",
  "arguments": {"customer_email": "alice@example.com"}
}

// 4. Update payment method billing address
{
  "name": "update_payment_method",
  "arguments": {
    "customer_email": "alice@example.com",
    "payment_method_id": "pm_123456",
    "billing_address1": "456 Oak Avenue",
    "billing_city": "Los Angeles",
    "billing_province": "CA",
    "billing_zip": "90210",
    "billing_country": "United States"
  }
}
```

### Bundle Management Example

```json
// 1. Get customer bundles
{
  "name": "get_bundles",
  "arguments": {
    "customer_email": "alice@example.com",
    "subscription_id": "789123"
  }
}

// 2. Get bundle selections
{
  "name": "get_bundle_selections",
  "arguments": {
    "customer_email": "alice@example.com",
    "bundle_id": "bundle_456"
  }
}

// 3. Update bundle selection
{
  "name": "update_bundle_selection",
  "arguments": {
    "customer_email": "alice@example.com",
    "bundle_selection_id": "selection_789",
    "variant_id": 987654,
    "quantity": 2
  }
}
```

### Discount Management Example

```json
// 1. Apply discount code
{
  "name": "apply_discount",
  "arguments": {
    "customer_email": "alice@example.com",
    "discount_code": "SAVE20"
  }
}

// 2. Check applied discounts
{
  "name": "get_discounts",
  "arguments": {"customer_email": "alice@example.com"}
}

// 3. Remove discount if needed
{
  "name": "remove_discount",
  "arguments": {
    "customer_email": "alice@example.com",
    "discount_id": "discount_123"
  }
}
```

## Response Structure Patterns

### Standard Success Response
```json
{
  "content": [
    {
      "type": "text",
      "text": "Operation Result:\n{JSON_DATA}"
    }
  ]
}
```

### Error Response with Guidance
```json
{
  "error": {
    "code": -32603,
    "message": "Detailed error message with context and guidance"
  }
}
```

### Paginated Response Example
```json
{
  "subscriptions": [...],
  "count": 25,
  "page": 1,
  "limit": 10,
  "has_more": true
}
```

This comprehensive example guide should help you understand how to effectively use the Recharge Storefront API MCP Server in various scenarios.