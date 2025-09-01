#!/usr/bin/env node

/**
 * Main entry point for Recharge Storefront API MCP Server
 * This file serves as the primary entry point and delegates to the actual server implementation
 */

// Validate Node.js version before importing ES modules
const nodeVersion = process.version.slice(1).split('.').map(Number);
const requiredVersion = [18, 0, 0];
const isValidVersion = nodeVersion[0] > requiredVersion[0] || 
  (nodeVersion[0] === requiredVersion[0] && nodeVersion[1] > requiredVersion[1]) ||
  (nodeVersion[0] === requiredVersion[0] && nodeVersion[1] === requiredVersion[1] && nodeVersion[2] >= requiredVersion[2]);

if (!isValidVersion) {
  console.error(`[FATAL] Node.js version ${process.version} is not supported.`);
  console.error('[INFO] Please install Node.js 18.0.0 or higher.');
  console.error('[INFO] Visit https://nodejs.org/ to download the latest version.');
  process.exit(1);
}

// Import and start the server
import('./src/server.js').catch((error) => {
  console.error('[FATAL] Failed to start Recharge Storefront API MCP Server:', error.message);
  
  // Provide helpful error messages for common issues
  if (error.code === 'MODULE_NOT_FOUND') {
    console.error('[INFO] Missing dependencies. Please run: npm install');
  } else if (error.message.includes('Cannot resolve module')) {
    console.error('[INFO] Module resolution error. Please check your Node.js installation.');
  } else if (error.message.includes('Permission denied')) {
    console.error('[INFO] Permission error. Please check file permissions.');
  }
  
  if (process.env.DEBUG === 'true') {
    console.error('[DEBUG] Error stack:', error.stack);
  }
  
  process.exit(1);
});