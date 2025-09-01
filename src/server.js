#!/usr/bin/env node

/**
 * Recharge Storefront API MCP Server
 * 
 * A comprehensive Model Context Protocol server that provides complete access 
 * to the Recharge Storefront API for subscription management.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
import { RechargeClient } from './recharge-client.js';
import { tools } from './tools/index.js';
import { formatErrorResponse } from './utils/error-handler.js';

// Load environment variables
dotenv.config();

/**
 * Server statistics tracking
 */
const serverStats = {
  startTime: new Date(),
  toolCalls: 0,
  errors: 0,
  customers: new Set(),
  lastActivity: new Date(),
};

/**
 * MCP Server instance
 */
const server = new Server(
  {
    name: process.env.MCP_SERVER_NAME || 'recharge-storefront-api-mcp',
    version: process.env.MCP_SERVER_VERSION || '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Health check function
 */
function getHealthStatus() {
  const uptime = Date.now() - serverStats.startTime.getTime();
  const uptimeHours = Math.floor(uptime / (1000 * 60 * 60));
  const uptimeMinutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
  
  return {
    status: 'healthy',
    uptime: `${uptimeHours}h ${uptimeMinutes}m`,
    toolCalls: serverStats.toolCalls,
    errors: serverStats.errors,
    uniqueCustomers: serverStats.customers.size,
    lastActivity: serverStats.lastActivity.toISOString(),
    memoryUsage: process.memoryUsage(),
    nodeVersion: process.version,
    serverName: process.env.MCP_SERVER_NAME || 'recharge-storefront-api-mcp',
    serverVersion: process.env.MCP_SERVER_VERSION || '1.0.0',
  };
}

/**
 * List available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  if (process.env.DEBUG === 'true') {
    console.error(`[DEBUG] Listing ${tools.length} available tools`);
  }
  
  return {
    tools: tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  };
});

/**
 * Handle tool execution
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  // Update statistics
  serverStats.toolCalls++;
  serverStats.lastActivity = new Date();
  
  if (process.env.DEBUG === 'true') {
    console.error(`[DEBUG] Executing tool: ${name}`);
    console.error(`[DEBUG] Arguments:`, JSON.stringify(args, null, 2));
  }

  // Find the requested tool
  const tool = tools.find(t => t.name === name);
  if (!tool) {
    serverStats.errors++;
    const error = new Error(`Tool not found: ${name}`);
    if (process.env.DEBUG === 'true') {
      console.error(`[DEBUG] Tool not found: ${name}`);
    }
    return formatErrorResponse(error);
  }

  try {
    // Validate input schema
    const validatedArgs = tool.inputSchema.parse(args);
    
    // Extract authentication and configuration
    const storeUrl = validatedArgs.store_url || process.env.RECHARGE_STOREFRONT_DOMAIN;
    const sessionToken = validatedArgs.session_token || process.env.RECHARGE_SESSION_TOKEN;
    const adminToken = validatedArgs.admin_token || process.env.RECHARGE_ADMIN_TOKEN;
    
    // SECURITY: Create context for customer identification
    // This ensures tools always know which customer they're operating on
    const context = {
      customerId: validatedArgs.customer_id || null,
      customerEmail: validatedArgs.customer_email || null,
      hasCustomerIdentification: !!(validatedArgs.customer_id || validatedArgs.customer_email || validatedArgs.session_token)
    };
    
    // Validate required configuration
    if (!storeUrl) {
      throw new Error(
        'No store URL available. Please provide store_url parameter in your tool call or set RECHARGE_STOREFRONT_DOMAIN environment variable.\n' +
        'Example: your-shop.myshopify.com'
      );
    }
    
    // Validate store URL format
    let domain;
    if (storeUrl.startsWith('http://') || storeUrl.startsWith('https://')) {
      const urlObj = new URL(storeUrl);
      domain = urlObj.hostname;
    } else {
      domain = storeUrl;
    }
    
    if (!domain.includes('.myshopify.com')) {
      throw new Error(
        `Invalid store URL format: ${storeUrl}\n` +
        'Store URL must be a Shopify domain ending with .myshopify.com\n' +
        'Example: your-shop.myshopify.com'
      );
    }
    
    // Create client with available tokens
    const client = new RechargeClient({
      storeUrl: domain,
      sessionToken,
      adminToken
    });
    
    // Track customer for statistics
    if (validatedArgs.customer_id) {
      serverStats.customers.add(validatedArgs.customer_id);
    }
    if (validatedArgs.customer_email) {
      serverStats.customers.add(validatedArgs.customer_email);
    }
    
    // Execute the tool
    const result = await tool.execute(client, validatedArgs);
    
    if (process.env.DEBUG === 'true') {
      console.error(`[DEBUG] Tool ${name} executed successfully`);
    }
    
    return result;
  } catch (error) {
    serverStats.errors++;
    
    if (process.env.DEBUG === 'true') {
      console.error(`[DEBUG] Tool ${name} failed:`, error.message);
      console.error(`[DEBUG] Error stack:`, error.stack);
    }
    
    return formatErrorResponse(error);
  }
});

/**
 * Handle health check requests
 */
// Note: Health check would be handled by MCP client, not as a custom request handler

/**
 * Graceful shutdown handling
 */
process.on('SIGINT', async () => {
  if (process.env.DEBUG === 'true') {
    console.error('[DEBUG] Received SIGINT, shutting down gracefully...');
    console.error('[DEBUG] Final statistics:', serverStats);
  }
  
  try {
    await server.close();
    if (process.env.DEBUG === 'true') {
      console.error('[DEBUG] Server closed successfully');
    }
  } catch (error) {
    console.error('[ERROR] Error during shutdown:', error.message);
  }
  
  process.exit(0);
});

process.on('SIGTERM', async () => {
  if (process.env.DEBUG === 'true') {
    console.error('[DEBUG] Received SIGTERM, shutting down gracefully...');
  }
  
  try {
    await server.close();
  } catch (error) {
    console.error('[ERROR] Error during shutdown:', error.message);
  }
  
  process.exit(0);
});

/**
 * Start the server
 */
async function main() {
  try {
    // Validate environment
    if (!process.env.RECHARGE_STOREFRONT_DOMAIN && !process.env.RECHARGE_ADMIN_TOKEN) {
      console.error('[WARNING] No environment variables configured. Tools will require parameters for each call.');
    }
    
    if (process.env.RECHARGE_STOREFRONT_DOMAIN === 'your-shop.myshopify.com') {
      console.error('[WARNING] Please update RECHARGE_STOREFRONT_DOMAIN with your actual domain');
    }
    
    if (process.env.RECHARGE_ADMIN_TOKEN === 'your_admin_token_here') {
      console.error('[WARNING] Please update RECHARGE_ADMIN_TOKEN with your actual admin token');
    }
    
    // Start server
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    if (process.env.DEBUG === 'true') {
      console.error('[DEBUG] Recharge Storefront API MCP Server started');
      console.error('[DEBUG] Server name:', process.env.MCP_SERVER_NAME || 'recharge-storefront-api-mcp');
      console.error('[DEBUG] Server version:', process.env.MCP_SERVER_VERSION || '1.0.0');
      console.error('[DEBUG] Available tools:', tools.length);
      console.error('[DEBUG] Store domain:', process.env.RECHARGE_STOREFRONT_DOMAIN || 'Not configured');
      console.error('[DEBUG] Admin token:', process.env.RECHARGE_ADMIN_TOKEN ? 'Configured' : 'Not configured');
      console.error('[DEBUG] Session token:', process.env.RECHARGE_SESSION_TOKEN ? 'Configured' : 'Not configured');
    }
    
    console.error('[INFO] Server ready - listening for MCP requests');
    
  } catch (error) {
    console.error('[FATAL] Failed to start server:', error.message);
    if (process.env.DEBUG === 'true') {
      console.error('[DEBUG] Error stack:', error.stack);
    }
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('[FATAL] Uncaught exception:', error.message);
  if (process.env.DEBUG === 'true') {
    console.error('[DEBUG] Error stack:', error.stack);
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled rejection at:', promise, 'reason:', reason);
  if (process.env.DEBUG === 'true') {
    console.error('[DEBUG] Rejection details:', reason);
  }
  process.exit(1);
});

// Start the server
main().catch((error) => {
  console.error('[FATAL] Server startup failed:', error.message);
  if (process.env.DEBUG === 'true') {
    console.error('[DEBUG] Startup error stack:', error.stack);
  }
  process.exit(1);
});