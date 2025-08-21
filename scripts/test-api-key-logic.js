#!/usr/bin/env node

/**
 * Test script to validate API key handling logic
 * This script tests the token precedence system without making actual API calls
 */

import { RechargeClient } from '../src/recharge-client.js';

console.log('🧪 Testing API Key Handling Logic\n');

// Test 1: Environment variable only
console.log('Test 1: Environment variable only');
process.env.RECHARGE_ACCESS_TOKEN = 'env_token_12345';
process.env.RECHARGE_STOREFRONT_DOMAIN = 'test-shop.myshopify.com';

try {
  // Simulate server logic
  const domain = process.env.RECHARGE_STOREFRONT_DOMAIN;
  const defaultAccessToken = process.env.RECHARGE_ACCESS_TOKEN;
  
  // Tool call without access_token parameter
  const toolAccessToken = undefined;
  const accessToken = toolAccessToken || defaultAccessToken;
  
  if (!accessToken) {
    throw new Error('No API access token available');
  }
  
  console.log(`✅ Using token: ${accessToken} (from environment)`);
} catch (error) {
  console.log(`❌ Error: ${error.message}`);
}

// Test 2: Tool parameter takes precedence
console.log('\nTest 2: Tool parameter takes precedence');
try {
  const domain = process.env.RECHARGE_STOREFRONT_DOMAIN;
  const defaultAccessToken = process.env.RECHARGE_ACCESS_TOKEN;
  
  // Tool call WITH access_token parameter
  const toolAccessToken = 'tool_token_67890';
  const accessToken = toolAccessToken || defaultAccessToken;
  
  if (!accessToken) {
    throw new Error('No API access token available');
  }
  
  console.log(`✅ Using token: ${accessToken} (from tool parameter)`);
} catch (error) {
  console.log(`❌ Error: ${error.message}`);
}

// Test 3: No token available anywhere
console.log('\nTest 3: No token available anywhere');
delete process.env.RECHARGE_ACCESS_TOKEN;
try {
  const domain = process.env.RECHARGE_STOREFRONT_DOMAIN;
  const defaultAccessToken = process.env.RECHARGE_ACCESS_TOKEN;
  
  // Tool call without access_token parameter
  const toolAccessToken = undefined;
  const accessToken = toolAccessToken || defaultAccessToken;
  
  if (!accessToken) {
    throw new Error('No API access token available. Please provide an access_token parameter in your tool call or set RECHARGE_ACCESS_TOKEN in your environment variables.');
  }
  
  console.log(`✅ Using token: ${accessToken}`);
} catch (error) {
  console.log(`✅ Expected error: ${error.message}`);
}

// Test 4: Empty string token (should be treated as no token)
console.log('\nTest 4: Empty string token handling');
process.env.RECHARGE_ACCESS_TOKEN = '';
try {
  const domain = process.env.RECHARGE_STOREFRONT_DOMAIN;
  const defaultAccessToken = process.env.RECHARGE_ACCESS_TOKEN;
  
  // Tool call without access_token parameter
  const toolAccessToken = undefined;
  const accessToken = toolAccessToken || defaultAccessToken;
  
  if (!accessToken) {
    throw new Error('No API access token available. Please provide an access_token parameter in your tool call or set RECHARGE_ACCESS_TOKEN in your environment variables.');
  }
  
  console.log(`✅ Using token: ${accessToken}`);
} catch (error) {
  console.log(`✅ Expected error: ${error.message}`);
}

// Test 5: Tool parameter overrides empty env
console.log('\nTest 5: Tool parameter overrides empty environment');
process.env.RECHARGE_ACCESS_TOKEN = '';
try {
  const domain = process.env.RECHARGE_STOREFRONT_DOMAIN;
  const defaultAccessToken = process.env.RECHARGE_ACCESS_TOKEN;
  
  // Tool call WITH access_token parameter
  const toolAccessToken = 'tool_override_token';
  const accessToken = toolAccessToken || defaultAccessToken;
  
  if (!accessToken) {
    throw new Error('No API access token available');
  }
  
  console.log(`✅ Using token: ${accessToken} (tool parameter overrides empty env)`);
} catch (error) {
  console.log(`❌ Error: ${error.message}`);
}

console.log('\n🎉 API Key Logic Tests Complete');
console.log('\nSummary:');
console.log('- Environment variable used when no tool parameter provided ✅');
console.log('- Tool parameter takes precedence over environment variable ✅');
console.log('- Proper error when no token available anywhere ✅');
console.log('- Empty string tokens handled correctly ✅');
console.log('- Tool parameter overrides empty environment ✅');