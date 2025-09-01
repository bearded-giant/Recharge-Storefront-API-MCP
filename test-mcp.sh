#!/bin/bash

# Test MCP Server - Interactive testing script

echo "🧪 Recharge MCP Server Testing"
echo "=============================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating from example..."
    cat > .env << 'EOF'
RECHARGE_STOREFRONT_DOMAIN=your-shop.myshopify.com
RECHARGE_ADMIN_TOKEN=your_admin_token_here
DEBUG=true
EOF
    echo "Please edit .env with your credentials"
    exit 1
fi

# Source environment variables
source .env

echo "1. Testing server startup and tool listing..."
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | npm start 2>/dev/null | grep "^{" | jq '.'

echo ""
echo "2. Test customer lookup by email:"
read -p "Enter customer email: " customer_email

cat << EOF | npm start 2>/dev/null | grep "^{" | jq '.'
{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{
  "name": "get_customer_by_email",
  "arguments": {
    "email": "$customer_email"
  }
}}
EOF

echo ""
echo "3. Test getting customer subscriptions:"
cat << EOF | npm start 2>/dev/null | grep "^{" | jq '.'
{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{
  "name": "get_subscriptions",
  "arguments": {
    "customer_email": "$customer_email",
    "status": "active"
  }
}}
EOF

echo ""
echo "✅ Basic tests complete. Check output above for results."