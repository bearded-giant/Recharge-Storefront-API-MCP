#!/usr/bin/env node

/**
 * Main entry point for Recharge Storefront API MCP Server
 * This file serves as the primary entry point and delegates to the actual server implementation
 */

import('./src/server.js').catch((error) => {
  console.error('[FATAL] Failed to start Recharge Storefront API MCP Server:', error.message);
  if (process.env.DEBUG === 'true') {
    console.error('[DEBUG] Error stack:', error.stack);
  }
  process.exit(1);
});