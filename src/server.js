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
import { formatErrorResponse } from "./utils/error-handler.js";

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
    // Validate required domain (always required)
    const domain = process.env.RECHARGE_STOREFRONT_DOMAIN;
    
    if (!domain) {
      const errorMessage = [
        "Error: Missing required RECHARGE_STOREFRONT_DOMAIN environment variable.",
        "Please copy .env.example to .env and configure your Recharge domain:",
        "- RECHARGE_STOREFRONT_DOMAIN=your-shop.myshopify.com",
        "",
        "Note: API token can be provided via environment variable or tool calls."
      ].join("\n");
      
      console.error(errorMessage);
      process.exit(1);
    }

    // Validate domain format
    if (!domain.includes('.myshopify.com')) {
      console.error(`Error: Invalid domain format '${domain}'. Domain must end with '.myshopify.com'`);
      process.exit(1);
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

    // Store domain for client creation
    this.domain = domain;
    this.defaultAccessToken = process.env.RECHARGE_ACCESS_TOKEN;
    
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
   * Get or create a Recharge client with the appropriate access token
   * @param {string|undefined} toolAccessToken - Access token from tool call (optional, takes precedence over env)
   * @returns {RechargeClient} Configured Recharge client
   * @throws {Error} If no access token is available
   */
  getRechargeClient(toolAccessToken) {
    // Token precedence: tool parameter > environment variable
    const accessToken = toolAccessToken || this.defaultAccessToken;
    
    if (!accessToken) {
      throw new Error(
        "No API access token available. Please provide an 'access_token' parameter in your tool call or set RECHARGE_ACCESS_TOKEN in your environment variables."
      );
    }

    if (process.env.DEBUG === 'true') {
      const tokenSource = toolAccessToken ? 'tool parameter' : 'environment variable';
      const maskedToken = accessToken.length > 8 ? `${accessToken.substring(0, 8)}...` : '***';
      console.error(`[DEBUG] Using access token from: ${tokenSource} (${maskedToken})`);
    }

    // Create a new client instance with the appropriate token
    return new RechargeClient({
      domain: this.domain,
      accessToken: accessToken,
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
      // Don't exit in production, log and continue
      if (process.env.NODE_ENV !== 'production') {
        process.exit(1);
      }
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('[ERROR] Unhandled Rejection at:', promise, 'reason:', reason);
      this.stats.errors++;
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

  setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: tools.map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        })),
      };
    });

    // Handle tool calls
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
        
        // Extract access_token from validated args (undefined if not provided)
        const { access_token, ...toolArgs } = validatedArgs;
        
        if (process.env.DEBUG === 'true') {
          console.error(`[DEBUG] Tool '${name}' called`);
          console.error(`[DEBUG] Access token: ${access_token ? 'provided in call' : 'using environment default'}`);
          console.error(`[DEBUG] Arguments:`, JSON.stringify(toolArgs, null, 2));
        }
        
        // Get client with token precedence: tool parameter > environment variable
        const rechargeClient = this.getRechargeClient(access_token);
        
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
        
        // Handle missing API token error
        if (error.message.includes('No API access token available')) {
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
    const hasDefaultToken = this.defaultAccessToken ? 'Yes' : 'No (will require token in tool calls)';
    const toolCount = tools.length;
    const nodeVersion = process.version;
    const platform = process.platform;
    
    console.error(`🚀 Recharge Storefront API MCP Server v${version}`);
    console.error(`🖥️  Platform: ${platform} | Node.js: ${nodeVersion}`);
    console.error(`🏪 Connected to: ${this.domain}`);
    console.error(`🔑 Default token configured: ${hasDefaultToken}`);
    console.error(`🛠️  Available tools: ${toolCount}`);
    console.error(`📊 API Coverage: Complete Recharge Storefront API`);
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