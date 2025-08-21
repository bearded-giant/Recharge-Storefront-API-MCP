#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import dotenv from "dotenv";
import { RechargeClient } from "./recharge-client.js";
import { tools } from "./tools/index.js";

// Load environment variables
dotenv.config();

/**
 * Recharge Storefront API MCP Server
 * 
 * Provides comprehensive access to the Recharge Storefront API through
 * the Model Context Protocol (MCP) interface.
 */
class RechargeStorefrontAPIMCPServer {
  constructor() {
    // Store environment variables for client creation
    this.defaultStoreUrl = process.env.RECHARGE_STOREFRONT_DOMAIN;
    
    if (process.env.DEBUG === 'true') {
      console.error(`[DEBUG] Default store URL: ${this.defaultStoreUrl || 'Not set (will require in tool calls)'}`);
    }

    this.server = new Server(
      {
        name: process.env.MCP_SERVER_NAME || "recharge-storefront-api-mcp",
        version: process.env.MCP_SERVER_VERSION || "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Track server statistics
    this.stats = {
      startTime: new Date(),
      toolCalls: 0,
      errors: 0,
      successfulCalls: 0
    };

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  /**
   * Validate store URL format
   * @param {string} storeUrl - Store URL to validate
   * @returns {string} Validated domain
   * @throws {Error} If store URL is invalid
   */
  validateStoreUrl(storeUrl) {
    if (!storeUrl) {
      throw new Error(
        "No store URL available. Please provide a 'store_url' parameter in your tool call or set RECHARGE_STOREFRONT_DOMAIN in your environment variables."
      );
    }

    // Extract domain from URL if full URL is provided
    let domain;
    if (storeUrl.startsWith('http://') || storeUrl.startsWith('https://')) {
      try {
        const url = new URL(storeUrl);
        domain = url.hostname;
      } catch (error) {
        throw new Error('Invalid store URL format. Please provide a valid URL or domain.');
      }
    } else {
      domain = storeUrl;
    }

    if (!domain.includes('.myshopify.com')) {
      throw new Error('Store URL must be a valid Shopify domain ending with .myshopify.com (e.g., your-shop.myshopify.com)');
    }

    return domain;
  }

  /**
   * Get or create a Recharge client for the store
   * @param {string} [toolStoreUrl] - Store URL from tool call (optional, takes precedence over env)
   * @returns {RechargeClient} Configured Recharge client
   * @throws {Error} If no store URL is available
   */
  getRechargeClient(toolStoreUrl) {
    const storeUrl = toolStoreUrl || this.defaultStoreUrl;
    
    // Validate store URL
    const validatedDomain = this.validateStoreUrl(storeUrl);
    
    if (process.env.DEBUG === 'true') {
      const storeUrlSource = toolStoreUrl ? 'tool parameter' : 'environment variable';
      console.error(`[DEBUG] Using store URL from: ${storeUrlSource} (${validatedDomain})`);
    }

    // Create a new client instance with the store URL
    return new RechargeClient({
      storeUrl: validatedDomain,
    });
  }

  /**
   * Setup error handling for the server
   */
  setupErrorHandling() {
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('[FATAL] Uncaught Exception:', error);
      this.stats.errors++;
      this.logStats();
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('[ERROR] Unhandled Rejection at:', promise, 'reason:', reason);
      this.stats.errors++;
      this.logStats();
      process.exit(1);
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.error('\n[INFO] Received SIGINT, shutting down gracefully...');
      this.logStats();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.error('\n[INFO] Received SIGTERM, shutting down gracefully...');
      this.logStats();
      process.exit(0);
    });
  }

  /**
   * Log server statistics
   */
  logStats() {
    const uptime = Date.now() - this.stats.startTime.getTime();
    const uptimeSeconds = Math.floor(uptime / 1000);
    
    console.error('\n📊 Server Statistics:');
    console.error(`⏱️  Uptime: ${uptimeSeconds}s`);
    console.error(`🔧 Tool calls: ${this.stats.toolCalls}`);
    console.error(`✅ Successful: ${this.stats.successfulCalls}`);
    console.error(`❌ Errors: ${this.stats.errors}`);
    
    if (this.stats.toolCalls > 0) {
      const successRate = ((this.stats.successfulCalls / this.stats.toolCalls) * 100).toFixed(1);
      console.error(`📈 Success rate: ${successRate}%`);
    }
  }

  /**
   * Setup tool handlers for the MCP server
   */
  setupToolHandlers() {
    // Handle tool listing
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: tools.map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema.shape ? {
            type: "object",
            properties: Object.fromEntries(
              Object.entries(tool.inputSchema.shape).map(([key, value]) => [
                key,
                value._def ? { type: value._def.typeName?.toLowerCase() || "string" } : { type: "string" }
              ])
            ),
            required: Object.keys(tool.inputSchema.shape).filter(key => 
              !tool.inputSchema.shape[key]._def?.defaultValue
            )
          } : { type: "object" }
        }))
      };
    });

    // Handle tool execution
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      this.stats.toolCalls++;

      const tool = tools.find(t => t.name === name);
      if (!tool) {
        this.stats.errors++;
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${name}`
        );
      }

      try {
        // Validate arguments against schema
        const validatedArgs = tool.inputSchema.parse(args || {});
        
        // Extract store_url from validated args
        const { store_url, ...toolArgs } = validatedArgs;
        
        if (process.env.DEBUG === 'true') {
          console.error(`[DEBUG] Tool '${name}' called`);
          console.error(`[DEBUG] Store URL: ${store_url ? 'provided in call' : 'using environment default'}`);
          console.error(`[DEBUG] Arguments:`, JSON.stringify(toolArgs, null, 2));
        }
        
        // Get client
        const rechargeClient = this.getRechargeClient(store_url);
        
        const result = await tool.execute(rechargeClient, toolArgs);
        this.stats.successfulCalls++;
        
        if (process.env.DEBUG === 'true') {
          console.error(`[DEBUG] Tool '${name}' completed successfully`);
        }
        
        return result;
      } catch (error) {
        this.stats.errors++;
        
        if (process.env.DEBUG === 'true') {
          console.error(`[DEBUG] Tool '${name}' failed:`, error.message);
          console.error(`[DEBUG] Error stack:`, error.stack);
        }
        
        // Handle Zod validation errors
        if (error.name === 'ZodError') {
          const validationErrors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
          throw new McpError(
            ErrorCode.InvalidParams,
            `Invalid parameters for tool '${name}': ${validationErrors}`
          );
        }
        
        // Handle RechargeAPIError
        if (error.name === 'RechargeAPIError') {
          let errorMessage = `Recharge API Error (${error.statusCode}): ${error.message}`;
          if (error.errorCode) {
            errorMessage += ` (Code: ${error.errorCode})`;
          }
          throw new McpError(
            ErrorCode.InternalError,
            errorMessage
          );
        }
        
        // Handle missing store URL errors
        if (error.message.includes('No store URL available')) {
          throw new McpError(
            ErrorCode.InvalidParams,
            error.message
          );
        }
        
        // Handle missing session token errors
        if (error.message.includes('No session token available')) {
          throw new McpError(
            ErrorCode.InvalidParams,
            error.message
          );
        }
        
        // Handle general errors
        throw new McpError(
          ErrorCode.InternalError,
          `Tool '${name}' execution failed: ${error.message}`
        );
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    // Log startup information to stderr (won't interfere with MCP protocol)
    const version = process.env.MCP_SERVER_VERSION || "1.0.0";
    const hasDefaultStoreUrl = this.defaultStoreUrl ? 'Yes' : 'No (will require store URL in tool calls)';
    const toolCount = tools.length;
    const nodeVersion = process.version;
    const platform = process.platform;
    
    console.error(`🚀 Recharge Storefront API MCP Server v${version}`);
    console.error(`🖥️  Platform: ${platform} | Node.js: ${nodeVersion}`);
    console.error(`🏪 Default store URL: ${hasDefaultStoreUrl}`);
    if (this.defaultStoreUrl) {
      console.error(`🔗 Store: ${this.defaultStoreUrl}`);
    }
    console.error(`🔑 Authentication: Customer sessions and tokens`);
    console.error(`🛠️  Available tools: ${toolCount}`);
    console.error(`📊 API Coverage: Recharge Storefront API`);
    console.error(`🔌 Transport: stdio`);
    console.error(`✅ Server ready for MCP connections`);
    
    if (process.env.DEBUG === 'true') {
      console.error(`🐛 Debug mode enabled`);
      console.error(`📋 Tool list: ${tools.map(t => t.name).join(', ')}`);
      console.error(`📈 Statistics tracking enabled`);
    }
    
    // Log stats periodically in debug mode
    if (process.env.DEBUG === 'true') {
      setInterval(() => {
        if (this.stats.toolCalls > 0) {
          this.logStats();
        }
      }, 60000); // Every minute
    }
  }
}

// Create and start the server
const server = new RechargeStorefrontAPIMCPServer();
server.run().catch((error) => {
  console.error('[FATAL] Failed to start MCP server:', error);
  process.exit(1);
});