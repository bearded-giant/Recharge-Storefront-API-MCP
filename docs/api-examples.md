# API Examples

Basic examples for using the Recharge Storefront API MCP Server.

## Authentication Examples

### Customer Email Authentication
```json
{
  "name": "get_customer",
  "arguments": {
    "customer_email": "customer@example.com"
  }
}
```

### Customer ID Authentication
```json
{
  "name": "get_subscriptions",
  "arguments": {
    "customer_id": "123456"
  }
}
```

## Basic Operations

### Get Customer Information
```json
{
  "name": "get_customer",
  "arguments": {
    "customer_email": "customer@example.com"
  }
}
```

### Get Subscriptions
```json
{
  "name": "get_subscriptions",
  "arguments": {
    "customer_email": "customer@example.com",
    "status": "active"
  }
}
```

### Update Subscription
```json
{
  "name": "update_subscription",
  "arguments": {
    "customer_email": "customer@example.com",
    "subscription_id": "789123",
    "order_interval_frequency": 2,
    "order_interval_unit": "month"
  }
}
```