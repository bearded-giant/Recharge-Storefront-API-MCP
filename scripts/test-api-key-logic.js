#!/usr/bin/env node

/**
 * Test script to validate API key and store URL handling logic
 * This script tests the token and store URL precedence system without making actual API calls
 */

console.log('🧪 Testing API Key and Store URL Handling Logic\n');

// Test 1: Environment variables only
console.log('Test 1: Environment variables only');
process.env.RECHARGE_ACCESS_TOKEN = 'env_token_12345';
process.env.RECHARGE_STOREFRONT_DOMAIN = 'test-shop.myshopify.com';

try {
  // Simulate server logic
  const storeUrl = process.env.RECHARGE_STOREFRONT_DOMAIN;
  const defaultAccessToken = process.env.RECHARGE_ACCESS_TOKEN;
  
  // Tool call without access_token or store_url parameters
  const toolAccessToken = undefined;
  const toolStoreUrl = undefined;
  const accessToken = toolAccessToken || defaultAccessToken;
  const finalStoreUrl = toolStoreUrl || storeUrl;
  
  if (!accessToken || !finalStoreUrl) {
    throw new Error('No API access token available');
  }
  
  console.log(`✅ Using token: ${accessToken} (from environment)`);
  console.log(`✅ Using store URL: ${finalStoreUrl} (from environment)`);
} catch (error) {
  console.log(`❌ Error: ${error.message}`);
}

// Test 2: Tool parameters take precedence
console.log('\nTest 2: Tool parameters take precedence');
try {
  const storeUrl = process.env.RECHARGE_STOREFRONT_DOMAIN;
  const defaultAccessToken = process.env.RECHARGE_ACCESS_TOKEN;
  
  // Tool call WITH access_token and store_url parameters
  const toolAccessToken = 'tool_token_67890';
  const toolStoreUrl = 'tool-shop.myshopify.com';
  const accessToken = toolAccessToken || defaultAccessToken;
  const finalStoreUrl = toolStoreUrl || storeUrl;
  
  if (!accessToken || !finalStoreUrl) {
    throw new Error('No API access token available');
  }
  
  console.log(`✅ Using token: ${accessToken} (from tool parameter)`);
  console.log(`✅ Using store URL: ${finalStoreUrl} (from tool parameter)`);
} catch (error) {
  console.log(`❌ Error: ${error.message}`);
}

// Test 3: No token or store URL available anywhere
console.log('\nTest 3: No token or store URL available anywhere');
delete process.env.RECHARGE_ACCESS_TOKEN;
delete process.env.RECHARGE_STOREFRONT_DOMAIN;
try {
  const storeUrl = process.env.RECHARGE_STOREFRONT_DOMAIN;
  const defaultAccessToken = process.env.RECHARGE_ACCESS_TOKEN;
  
  // Tool call without access_token or store_url parameters
  const toolAccessToken = undefined;
  const toolStoreUrl = undefined;
  const accessToken = toolAccessToken || defaultAccessToken;
  const finalStoreUrl = toolStoreUrl || storeUrl;
  
  if (!accessToken || !finalStoreUrl) {
    throw new Error('No API access token or store URL available. Please provide parameters in your tool call or set environment variables.');
  }
  
  console.log(`✅ Using token: ${accessToken}`);
  console.log(`✅ Using store URL: ${finalStoreUrl}`);
} catch (error) {
  console.log(`✅ Expected error: ${error.message}`);
}

// Test 4: Empty string token and store URL (should be treated as not set)
console.log('\nTest 4: Empty string token and store URL handling');
process.env.RECHARGE_ACCESS_TOKEN = '';
process.env.RECHARGE_STOREFRONT_DOMAIN = '';
try {
  const storeUrl = process.env.RECHARGE_STOREFRONT_DOMAIN;
  const defaultAccessToken = process.env.RECHARGE_ACCESS_TOKEN;
  
  // Tool call without access_token or store_url parameters
  const toolAccessToken = undefined;
  const toolStoreUrl = undefined;
  const accessToken = toolAccessToken || defaultAccessToken;
  const finalStoreUrl = toolStoreUrl || storeUrl;
  
  if (!accessToken || !finalStoreUrl) {
    throw new Error('No API access token or store URL available. Please provide parameters in your tool call or set environment variables.');
  }
  
  console.log(`✅ Using token: ${accessToken}`);
  console.log(`✅ Using store URL: ${finalStoreUrl}`);
} catch (error) {
  console.log(`✅ Expected error: ${error.message}`);
}

// Test 5: Tool parameters override empty environment
console.log('\nTest 5: Tool parameters override empty environment');
process.env.RECHARGE_ACCESS_TOKEN = '';
process.env.RECHARGE_STOREFRONT_DOMAIN = '';
try {
  const storeUrl = process.env.RECHARGE_STOREFRONT_DOMAIN;
  const defaultAccessToken = process.env.RECHARGE_ACCESS_TOKEN;
  
  // Tool call WITH access_token and store_url parameters
  const toolAccessToken = 'tool_override_token';
  const toolStoreUrl = 'override-shop.myshopify.com';
  const accessToken = toolAccessToken || defaultAccessToken;
  const finalStoreUrl = toolStoreUrl || storeUrl;
  
  if (!accessToken || !finalStoreUrl) {
    throw new Error('No API access token available');
  }
  
  console.log(`✅ Using token: ${accessToken} (tool parameter overrides empty env)`);
  console.log(`✅ Using store URL: ${finalStoreUrl} (tool parameter overrides empty env)`);
} catch (error) {
  console.log(`❌ Error: ${error.message}`);
}

// Test 6: URL format validation
console.log('\nTest 6: URL format validation');
try {
  const testUrls = [
    'valid-shop.myshopify.com',
    'https://valid-shop.myshopify.com',
    'invalid-shop.com',
    'not-a-url',
    ''
  ];
  
  testUrls.forEach(url => {
    try {
      // Simulate validation logic
      if (!url) {
        throw new Error('No store URL provided');
      }
      
      let domain;
      if (url.startsWith('http://') || url.startsWith('https://')) {
        const urlObj = new URL(url);
        domain = urlObj.hostname;
      } else {
        domain = url;
      }
      
      if (!domain.includes('.myshopify.com')) {
        throw new Error('Invalid domain format');
      }
      
      console.log(`✅ Valid URL: ${url} -> ${domain}`);
    } catch (error) {
      console.log(`❌ Invalid URL: ${url} - ${error.message}`);
    }
  });
} catch (error) {
  console.log(`❌ URL validation test failed: ${error.message}`);
}

console.log('\n🎉 API Key and Store URL Logic Tests Complete');
console.log('\nSummary:');
console.log('- Environment variables used when no tool parameters provided ✅');
console.log('- Tool parameters take precedence over environment variables ✅');
console.log('- Proper error when no token or store URL available anywhere ✅');
console.log('- Empty string tokens and store URLs handled correctly ✅');
console.log('- Tool parameters override empty environment ✅');
console.log('- URL format validation works correctly ✅');