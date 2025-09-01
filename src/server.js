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
 * Convert Zod schema to JSON Schema for MCP protocol
 * @param {import('zod').ZodSchema} zodSchema - Zod schema to convert
 * @returns {Object} JSON Schema object
 */
function convertZodSchemaToJsonSchema(zodSchema) {
  // Basic conversion - in a real implementation, you'd use a proper converter
  // For now, return a basic object schema
  return {
    type: "object",
    properties: {},
    additionalProperties: true
  };
}

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
    this.defaultSessionToken = process.env.RECHARGE_SESSION_TOKEN; // Customer session token (st_...)
    this.defaultAdminToken = process.env.RECHARGE_ADMIN_TOKEN; // Admin API token for session creation
    
    // Session cache for multi-customer support
    this.sessionCache = new Map(); // customerId -> sessionToken
    this.emailToCustomerIdCache = new Map(); // email -> customerId
    this.sessionExpiryCache = new Map(); // customerId -> expiryTime
    
    if (process.env.DEBUG === 'true') {
      console.error(`[DEBUG] Server initialization: ${JSON.stringify({
        defaultStoreUrl: this.defaultStoreUrl || 'Not set (will require in tool calls)',
        hasDefaultSessionToken: !!this.defaultSessionToken,
        hasDefaultAdminToken: !!this.defaultAdminToken
      }, null, 2)}`);
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
      successfulCalls: 0,
      errors: 0,
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

    // Clean and validate store URL more thoroughly
    let cleanUrl = storeUrl.trim();
    
    // Remove common prefixes that could cause issues
    cleanUrl = cleanUrl.replace(/^https?:\/\//, '');
    cleanUrl = cleanUrl.replace(/^www\./, '');
    
    // Extract domain from URL if full URL is provided
    let domain;
    if (cleanUrl.includes('/')) {
      try {
        // If there are slashes, take only the domain part
        domain = cleanUrl.split('/')[0];
      } catch (error) {
        throw new Error(`Invalid store URL format: ${storeUrl}. Please provide a valid domain.`);
      }
    } else {
      domain = cleanUrl;
    }

    // Remove trailing slashes and clean up domain
    domain = domain.replace(/\/+$/, '').toLowerCase();
    
    // Check for common mistakes
    if (domain.includes('admin.shopify.com')) {
      throw new Error(
        `Invalid store URL: ${storeUrl}. ` +
        `You provided an admin URL. Please use your store's myshopify.com domain instead ` +
        `(e.g., your-shop.myshopify.com).`
      );
    }
    
    if (domain.endsWith('.com') && !domain.endsWith('.myshopify.com')) {
      throw new Error(
        `Invalid store URL: ${storeUrl}. ` +
        `Please use your Shopify store's myshopify.com domain (e.g., your-shop.myshopify.com), ` +
        `not a custom domain.`
      );
    }
    
    if (!domain.includes('.myshopify.com')) {
      throw new Error(
        `Store URL must be a valid Shopify domain ending with .myshopify.com. ` +
        `You provided: ${storeUrl}. Expected format: your-shop.myshopify.com`
      );
    }

    // Validate domain format more strictly
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]\.myshopify\.com$/;
    if (!domainRegex.test(domain)) {
      throw new Error(
        `Invalid Shopify domain format: ${domain}. ` +
        `Expected format: your-shop.myshopify.com (letters, numbers, and hyphens only)`
      );
    }

    if (process.env.DEBUG === 'true') {
      console.error(`[DEBUG] Store URL validation: ${JSON.stringify({
        originalUrl: storeUrl,
        validatedDomain: domain,
        baseUrl: `https://${domain}/tools/recurring/portal`
      }, null, 2)}`);
    }

    return domain;
  }

  /**
   * Get or create a Recharge Storefront client
   * @param {string} [toolStoreUrl] - Store URL from tool call
   * @param {string} [toolSessionToken] - Session token from tool call
   * @param {string} [toolMerchantToken] - Merchant token from tool call
   * @param {string} [customerId] - Customer ID for automatic session creation
   * @param {string} [customerEmail] - Customer email for automatic lookup and session creation
   * @returns {RechargeClient} Configured Recharge Storefront client
   * @throws {Error} If no store URL or authentication token is available
   */
  async getRechargeClient(toolStoreUrl, toolSessionToken, toolMerchantToken, customerId, customerEmail) {
    const storeUrl = toolStoreUrl || this.defaultStoreUrl;
    
    // Validate that we have at least one authentication method available
    const hasSessionToken = toolSessionToken || this.defaultSessionToken;
    const hasMerchantToken = toolMerchantToken || this.defaultAdminToken;
    const hasCustomerIdentification = customerId || customerEmail;
    
    if (!hasSessionToken && !hasMerchantToken) {
      throw new Error(
        "No authentication token available. Please provide either:\n" +
        "1. 'session_token' parameter in your tool call, or\n" +
        "2. 'merchant_token' parameter in your tool call, or\n" +
        "3. Set RECHARGE_SESSION_TOKEN or RECHARGE_ADMIN_TOKEN in your environment variables."
      );
    }
    
    // If only merchant token is available, require customer identification
    if (!hasSessionToken && hasMerchantToken && !hasCustomerIdentification) {
      throw new Error(
        "Merchant token requires customer identification. Please provide either:\n" +
        "1. 'customer_id' parameter for direct session creation, or\n" +
        "2. 'customer_email' parameter for customer lookup and session creation, or\n" +
        "3. Provide a 'session_token' parameter instead."
      );
    }
    
    // Validate store URL
    const validatedDomain = this.validateStoreUrl(storeUrl);
    
    // Check for cached session first if customer identification provided
    let cacheKey = null;
    let resolvedCustomerId = customerId;
    
    if (resolvedCustomerId) {
      cacheKey = `customer_${customerId}`;
    } else if (customerEmail) {
      // Check if we have cached customer ID for this email
      const cachedCustomerId = this.emailToCustomerIdCache.get(customerEmail);
      if (cachedCustomerId) {
        cacheKey = `customer_${cachedCustomerId}`;
        resolvedCustomerId = cachedCustomerId; // Use cached customer ID
      } else {
        cacheKey = `email_${customerEmail}`;
      }
    }
    
    // Try to use cached session if available and not expired
    if (cacheKey && this.sessionCache.has(cacheKey)) {
      const cachedSession = this.sessionCache.get(cacheKey);
      const expiryTime = this.sessionExpiryCache.get(cacheKey);
      
      if (expiryTime && Date.now() < expiryTime) {
        if (process.env.DEBUG === 'true') {
          console.error(`[DEBUG] Using cached session: ${cacheKey}`);
        }
        return new RechargeClient({
          storeUrl: validatedDomain,
          sessionToken: cachedSession,
        });
      } else {
        // Session expired, remove from cache
        if (process.env.DEBUG === 'true') {
          console.error(`[DEBUG] Cached session expired, removing from cache: ${cacheKey}`);
        }
        this.sessionCache.delete(cacheKey);
        this.sessionExpiryCache.delete(cacheKey);
      }
    }
    
    // If email provided but no customer ID, look up customer by email first  
    if (!resolvedCustomerId && customerEmail && (toolMerchantToken || this.defaultAdminToken)) {
      const merchantTokenToUse = toolMerchantToken || this.defaultAdminToken;
      
      if (!merchantTokenToUse) {
        throw new Error(
          "Merchant token required for customer email lookup. Please provide either:\n" +
          "1. 'merchant_token' parameter in your tool call, or\n" +
          "2. Set RECHARGE_ADMIN_TOKEN in your environment variables, or\n" +
          "3. Use 'customer_id' instead of 'customer_email' if you have the customer ID."
        );
      }
      
      if (process.env.DEBUG === 'true') {
        console.error(`[DEBUG] Looking up customer by email: ${JSON.stringify({
          customerEmail,
          hasAdminToken: !!adminTokenToUse
        }, null, 2)}`);
      }
      
      // Create temporary client with admin token to look up customer
      const tempClient = new RechargeClient({
        storeUrl: validatedDomain,
        adminToken: merchantTokenToUse,
      });
      
      try {
        const customerResponse = await tempClient.getCustomerByEmail(customerEmail);
        const foundCustomerId = customerResponse.customer?.id || 
                               customerResponse.customers?.[0]?.id ||
                               (customerResponse.id ? String(customerResponse.id) : null);
        
        if (foundCustomerId) {
          if (process.env.DEBUG === 'true') {
            console.error(`[DEBUG] Found customer ID for email: ${JSON.stringify({
              customerEmail,
              customerId: foundCustomerId
            }, null, 2)}`);
          }
          // Cache the email -> customer ID mapping
          this.emailToCustomerIdCache.set(customerEmail, foundCustomerId);
          resolvedCustomerId = foundCustomerId;
          cacheKey = `customer_${foundCustomerId}`;
        } else {
          if (process.env.DEBUG === 'true') {
            console.error(`[DEBUG] Customer not found: ${JSON.stringify({
              customerEmail,
              response: customerResponse
            }, null, 2)}`);
          }
          throw new Error(`Customer not found with email address: ${customerEmail}`);
        }
      } catch (error) {
        if (process.env.DEBUG === 'true') {
          console.error(`[DEBUG] Failed to lookup customer by email: ${JSON.stringify({
            customerEmail,
            isRedirect: error.isRedirect,
            error: error.message
          }, null, 2)}`);
        }
        
        // Provide more specific error messages based on error type
        if (error.isRedirect) {
          throw new Error(
            `Authentication error during customer lookup for ${customerEmail}. ` +
            `This usually indicates the Admin API token is invalid or doesn't have the required permissions. ` +
            `Please verify your RECHARGE_ADMIN_TOKEN is valid.`
          );
        } else {
          throw new Error(`Failed to find customer with email ${customerEmail}: ${error.message}`);
        }
      }
    }
    
    // If we have admin token and customer ID, create session automatically
    if ((toolMerchantToken || this.defaultAdminToken) && resolvedCustomerId) {
      const merchantTokenToUse = toolMerchantToken || this.defaultAdminToken;
      
      if (!merchantTokenToUse) {
        throw new Error(
          "Merchant token required for automatic session creation. Please provide either:\n" +
          "1. 'merchant_token' parameter in your tool call, or\n" +
          "2. Set RECHARGE_ADMIN_TOKEN in your environment variables."
        );
      }
      
      if (process.env.DEBUG === 'true') {
        console.error(`[DEBUG] Auto-creating session for customer: ${resolvedCustomerId}`);
        console.error(`[DEBUG] Using Admin API for session creation`);
      }
      
      // Create temporary client with admin token to create session
      const tempClient = new RechargeClient({
        storeUrl: validatedDomain,
        adminToken: merchantTokenToUse,
      });
      
      try {
        const sessionResponse = await tempClient.createCustomerSessionById(resolvedCustomerId);
        const autoSessionToken = sessionResponse.session?.token;
        
        if (autoSessionToken) {
          if (process.env.DEBUG === 'true') {
            console.error(`[DEBUG] Auto-created session token for customer ${resolvedCustomerId}`);
          }
          
          // Cache the new session
          if (cacheKey) {
            this.sessionCache.set(cacheKey, autoSessionToken);
            // Sessions expire after 1 hour, cache for 55 minutes to be safe
            this.sessionExpiryCache.set(cacheKey, Date.now() + (55 * 60 * 1000));
            
            if (process.env.DEBUG === 'true') {
              console.error(`[DEBUG] Cached session for ${cacheKey}, expires in 55 minutes`);
            }
          }
          
          return new RechargeClient({
            storeUrl: validatedDomain,
            sessionToken: autoSessionToken,
          });
        } else {
          if (process.env.DEBUG === 'true') {
            console.error(`[DEBUG] Session creation response:`, JSON.stringify(sessionResponse, null, 2));
          }
          throw new Error('Session creation succeeded but no token returned');
        }
      } catch (error) {
        if (process.env.DEBUG === 'true') {
          console.error(`[DEBUG] Failed to auto-create session for customer ${resolvedCustomerId}:`, error.message);
          if (error.isRedirect) {
            console.error(`[DEBUG] Redirect error during session creation - this may indicate authentication issues`);
          }
        }
        
        // Provide more specific error messages based on error type
        if (error.isRedirect) {
          throw new Error(
            `Authentication error during session creation for customer ${resolvedCustomerId}. ` +
            `This usually indicates the Admin API token is invalid or doesn't have the required permissions. ` +
            `Please verify your RECHARGE_ADMIN_TOKEN is valid.`
          );
        } else {
          throw new Error(`Failed to create session for customer ${resolvedCustomerId}: ${error.message}`);
        }
      }
    }
    
    // SECURITY: Only use default session token if no customer identification provided  
    // AND no cached sessions exist (to prevent wrong customer data exposure)
    if (!resolvedCustomerId && !customerEmail && this.defaultSessionToken && !toolSessionToken) {
      if (this.sessionCache.size > 0) {
        throw new Error(
          "Security Error: Cannot use default session token when customer-specific sessions exist. " +
          "Please specify 'customer_id', 'customer_email', or 'session_token' to ensure correct customer data access."
        );
      }
      
      if (process.env.DEBUG === 'true') {
        console.error(`[DEBUG] Using default session token from environment (no customer sessions cached)`);
      }
      
      return new RechargeClient({
        storeUrl: validatedDomain,
        sessionToken: this.defaultSessionToken,
      });
    }
    
    // If we have an explicit session token (from tool call), use it
    if (toolSessionToken) {
      if (process.env.DEBUG === 'true') {
        console.error('[DEBUG] Using explicit session token from tool call');
      }
      
      return new RechargeClient({
        storeUrl: validatedDomain,
        sessionToken: toolSessionToken,
      });
    }
    
    // Fallback to admin token if available
    const merchantTokenToUse = toolMerchantToken || this.defaultAdminToken;
    if (merchantTokenToUse) {
      if (process.env.DEBUG === 'true') {
        console.error('[DEBUG] Using merchant token for authentication');
      }
      
      return new RechargeClient({
        storeUrl: validatedDomain,
        adminToken: merchantTokenToUse,
      });
    }
    
    // Final fallback to session token
    const sessionTokenToUse = toolSessionToken || this.defaultSessionToken;
    if (!sessionTokenToUse) {
      throw new Error(
        "No valid authentication token available. This should not happen - please check your configuration."
      );
    }
    
    return new RechargeClient({
      storeUrl: validatedDomain,
      sessionToken: sessionTokenToUse,
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
          inputSchema: convertZodSchemaToJsonSchema(tool.inputSchema)
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
        
        // Extract authentication parameters from validated args
        const { store_url, session_token, merchant_token, customer_id, customer_email, ...toolArgs } = validatedArgs;
        
        if (process.env.DEBUG === 'true') {
          console.error(`[DEBUG] Tool '${name}' called`);
          console.error(`[DEBUG] Store URL: ${store_url ? 'provided in call' : 'using environment default'}`);
          console.error(`[DEBUG] Session token: ${session_token ? 'provided in call' : 'using environment default'}`);
          console.error(`[DEBUG] Merchant token: ${merchant_token ? 'provided in call' : 'using environment default'}`);
          console.error(`[DEBUG] Customer ID: ${customer_id ? 'provided for auto-session' : 'not provided'}`);
          console.error(`[DEBUG] Customer email: ${customer_email ? 'provided for auto-lookup' : 'not provided'}`);
          console.error(`[DEBUG] Final store URL: ${store_url || this.defaultStoreUrl}`);
          console.error(`[DEBUG] Available tokens: Merchant=${!!(merchant_token || this.defaultAdminToken)}, Session=${!!(session_token || this.defaultSessionToken)}`);
          if (Object.keys(toolArgs).length > 0) {
            console.error(`[DEBUG] Tool arguments:`, JSON.stringify(toolArgs, null, 2));
          }
        }
        
        // Get client with retry logic for expired sessions
        let rechargeClient;
        let result;
        let retryCount = 0;
        const maxRetries = 2;
        
        while (retryCount <= maxRetries) {
          try {
            rechargeClient = await this.getRechargeClient(store_url, session_token, merchant_token, customer_id, customer_email);
            result = await tool.execute(rechargeClient, toolArgs);
            
            this.stats.successfulCalls++;
            
            if (process.env.DEBUG === 'true') {
              console.error(`[DEBUG] Tool '${name}' completed successfully`);
            }
            
            break; // Success, exit retry loop
            
          } catch (error) {
            // Check if this is a session expiry error and we can retry
            if (error.sessionExpired && retryCount < maxRetries && (customer_id || customer_email) && (merchant_token || this.defaultAdminToken)) {
              retryCount++;
              
              if (process.env.DEBUG === 'true') {
                console.error(`[DEBUG] Session expired, attempting retry ${retryCount}/${maxRetries}`);
              }
              
              // Clear cached session for this customer
              let cacheKey = null;
              if (customer_id) {
                cacheKey = `customer_${customer_id}`;
              } else if (customer_email) {
                cacheKey = `email_${customer_email}`;
                // Also clear the customer ID cache for this email
                const cachedCustomerId = this.emailToCustomerIdCache.get(customer_email);
                if (cachedCustomerId) {
                  this.sessionCache.delete(`customer_${cachedCustomerId}`);
                  this.sessionExpiryCache.delete(`customer_${cachedCustomerId}`);
                }
              }
              
              if (cacheKey) {
                this.sessionCache.delete(cacheKey);
                this.sessionExpiryCache.delete(cacheKey);
                if (process.env.DEBUG === 'true') {
                  console.error(`[DEBUG] Cleared cached session for ${cacheKey}`);
                }
              }
              
              continue; // Retry with fresh session
            }
            
            // Not a retryable error or max retries reached
            throw error;
          }
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
          
          // Add specific guidance for redirect errors
          if (error.errorCode === 'REDIRECT_ERROR') {
            errorMessage += '\n\nThis redirect error often indicates:\n';
            errorMessage += '1. Invalid or expired authentication tokens\n';
            errorMessage += '2. Using Admin API token instead of Storefront API token\n';
            errorMessage += '3. Incorrect store URL configuration\n';
            errorMessage += '4. Recharge not properly installed on the store\n';
            errorMessage += '\nPlease verify your authentication tokens and store URL configuration.';
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
        
        // Handle missing access token errors
        if (error.message.includes('No authentication token available')) {
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
    const hasDefaultStoreUrl = this.defaultStoreUrl ? 'Yes' : 'No';
    const toolCount = tools.length;
    const nodeVersion = process.version;
    const platform = process.platform;
    
    console.error(`🚀 Recharge Storefront API MCP Server v${version}`);
    console.error(`🖥️  Platform: ${platform} | Node.js: ${nodeVersion}`);
    console.error(`🏪 Store URL configured: ${hasDefaultStoreUrl}`);
    if (this.defaultStoreUrl) {
      console.error(`🔗 Store: ${this.defaultStoreUrl}`);
    }
    console.error(`Default session token (st_...): ${this.defaultSessionToken ? 'Yes' : 'No'}`);
    console.error(`Default admin token: ${this.defaultAdminToken ? 'Yes' : 'No'}`);
    console.error(`🔐 Authentication: Customer session tokens (st_...) + Admin API tokens`);
    console.error(`🛠️  Available tools: ${toolCount}`);
    console.error(`📊 API Coverage: Complete Recharge Storefront API`);
    console.error(`🔌 Transport: stdio`);
    console.error(`Features: Auto session creation, multi-customer support, session caching, retry logic`);
    console.error(`✅ Server ready for MCP connections`);
    
    if (process.env.DEBUG === 'true') {
      console.error(`🐛 Debug mode enabled`);
      console.error(`📋 Tool categories: ${[...new Set(tools.map(t => {
        const parts = t.name.split('_');
        if (parts.includes('customer')) return 'customer';
        if (parts.includes('subscription')) return 'subscription';
        if (parts.includes('address')) return 'address';
        if (parts.includes('payment')) return 'payment';
        if (parts.includes('product')) return 'product';
        if (parts.includes('order')) return 'order';
        if (parts.includes('charge')) return 'charge';
        if (parts.includes('onetime')) return 'onetime';
        if (parts.includes('bundle')) return 'bundle';
        if (parts.includes('discount')) return 'discount';
        return 'other';
      }))].join(', ')}`);
      console.error(`📈 Statistics tracking enabled`);
    }
    
    // Log stats periodically in debug mode
    if (process.env.DEBUG === 'true') {
      setInterval(() => {
        if (this.stats.toolCalls > 0) {
          this.logStats();
          console.error(`🗂️  Cached sessions: ${this.sessionCache.size}`);
          console.error(`⏰ Session expiry cache: ${this.sessionExpiryCache.size}`);
          console.error(`📧 Cached customer IDs: ${this.emailToCustomerIdCache.size}`);
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