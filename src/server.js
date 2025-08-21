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

class RechargeMCPServer {
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

    this.server = new Server(
      {
        name: process.env.MCP_SERVER_NAME || "recharge-mcp-server",
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

    this.setupToolHandlers();
  }

  /**
   * Get or create a Recharge client with the appropriate access token
   * @param {string|null} toolAccessToken - Access token from tool call (takes precedence)
   * @returns {RechargeClient} Configured Recharge client
   * @throws {Error} If no access token is available
   */
  getRechargeClient(toolAccessToken = null) {
    const accessToken = toolAccessToken || this.defaultAccessToken;
    
    if (!accessToken) {
      throw new Error(
        "No API access token available. Please provide an access_token parameter or set RECHARGE_ACCESS_TOKEN environment variable."
      );
    }

    // Create a new client instance with the appropriate token
    return new RechargeClient({
      domain: this.domain,
      accessToken: accessToken,
    });
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
      
      const tool = tools.find(t => t.name === name);
      if (!tool) {
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${name}`
        );
      }

      try {
        // Validate arguments against schema
        const validatedArgs = tool.inputSchema.parse(args || {});
        
        // Extract access_token if provided and get appropriate client
        const { access_token, ...toolArgs } = validatedArgs;
        const rechargeClient = this.getRechargeClient(access_token);
        
        const result = await tool.execute(rechargeClient, toolArgs);
        return result;
      } catch (error) {
        // Handle Zod validation errors
        if (error.name === 'ZodError') {
          throw new McpError(
            ErrorCode.InvalidParams,
            `Invalid parameters: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
          );
        }
        
        // Handle RechargeAPIError
        if (error.name === 'RechargeAPIError') {
          throw new McpError(
            ErrorCode.InternalError,
            `Recharge API Error (${error.statusCode}): ${error.message}`
          );
        }
        
        // Handle missing API token error
        if (error.message.includes('No API access token available')) {
          throw new McpError(
            ErrorCode.InvalidParams,
            error.message
          );
        }
        
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error.message}`
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
    
    console.error(`🚀 Recharge MCP Server v${version} running on stdio`);
    console.error(`🏪 Connected to: ${this.domain}`);
    console.error(`🔑 Default token configured: ${hasDefaultToken}`);
    console.error(`🛠️  Available tools: ${toolCount}`);
    console.error(`📊 API Coverage: Complete Recharge Storefront API`);
    console.error(`✅ Server ready for MCP connections`);
    
    if (process.env.DEBUG === 'true') {
      console.error(`🐛 Debug mode enabled`);
      console.error(`📋 Tool list: ${tools.map(t => t.name).join(', ')}`);
    }
  }
}

const server = new RechargeMCPServer();
server.run().catch(console.error);