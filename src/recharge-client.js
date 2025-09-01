import axios from 'axios';
import { handleAPIError, validateRequiredParams } from './utils/error-handler.js';
import { SessionCache } from './utils/session-cache.js';

/**
 * Recharge Storefront API Client
 * 
 * Provides methods for interacting with the Recharge Storefront API.
 * Supports both session token authentication and automatic session creation with caching.
 * 
 * @class RechargeClient
 */
export class RechargeClient {
  /**
   * Create a new RechargeClient instance
   * 
   * @param {Object} config Configuration object
   * @param {string} config.storeUrl Store URL (e.g., 'your-shop.myshopify.com')
   * @param {string} [config.sessionToken] Customer session token for customer-scoped operations
   * @param {string} [config.adminToken] Admin API token for admin operations and session creation
   * @throws {Error} If neither sessionToken nor adminToken is provided
   */
  constructor({ storeUrl, sessionToken, adminToken }) {
    validateRequiredParams({ storeUrl }, ['storeUrl']);
    
    // Initialize session cache
    this.sessionCache = new SessionCache();
    
    // We need at least one token for authentication
    if (!sessionToken && !adminToken) {
      throw new Error(
        'Authentication required: Please provide one of:\n' +
        '1. sessionToken - Customer session token (st_...) for customer-scoped operations\n' +
        '2. adminToken - Admin API token for admin operations (customer lookup, session creation)\n' +
        '3. Both tokens - for full functionality including automatic session creation'
      );
    }
    
    // Validate token formats and types
    if (sessionToken && typeof sessionToken !== 'string') {
      throw new Error('sessionToken must be a string');
    }
    
    if (adminToken && typeof adminToken !== 'string') {
      throw new Error('adminToken must be a string');
    }
    
    // Validate that admin token is NOT a customer session token
    if (adminToken && adminToken.startsWith('st_')) {
      throw new Error(
        'CRITICAL ERROR: Customer session tokens (st_) cannot be used as admin tokens.\n' +
        'Please provide an Admin API token for admin operations (customer lookup, session creation).\n' +
        'Admin API tokens typically start with your store prefix and are found in Recharge Admin > API Tokens.\n' +
        'Do NOT use Storefront API tokens - they will not work for session creation.'
      );
    }
    
    // Validate that session token format (customer session tokens start with st_)
    if (sessionToken && !sessionToken.startsWith('st_') && sessionToken.length > 50) {
      throw new Error(
        'CRITICAL ERROR: Admin API tokens cannot be used as session tokens.\n' +
        'Please provide one of:\n' +
        '1. sessionToken - Customer session token (st_...)\n' +
        '2. Use customer_id or customer_email for automatic session creation with admin token\n' +
        'Session tokens are created automatically - you typically do not need to provide them manually.'
      );
    }
    
    // Basic token format validation
    if (sessionToken && sessionToken.trim().length === 0) {
      throw new Error('sessionToken cannot be empty');
    }
    
    if (adminToken && adminToken.trim().length === 0) {
      throw new Error('adminToken cannot be empty');
    }
    
    // Store both tokens - they serve different purposes
    this.sessionToken = sessionToken;
    this.adminToken = adminToken;
    this.storeUrl = storeUrl;
    
    // Validate and clean store URL
    let cleanStoreUrl = this.storeUrl.replace(/\/+$/, '').toLowerCase();
    
    // Remove protocol if present
    if (cleanStoreUrl.startsWith('http://') || cleanStoreUrl.startsWith('https://')) {
      const urlObj = new URL(cleanStoreUrl);
      cleanStoreUrl = urlObj.hostname;
    }
    
    // Validate domain format
    if (!cleanStoreUrl.includes('.myshopify.com')) {
      throw new Error(
        `Invalid store URL format: ${storeUrl}\n` +
        'Store URL must be a Shopify domain ending with .myshopify.com\n' +
        'Example: your-shop.myshopify.com'
      );
    }
    
    // Construct the base URL for Recharge Storefront API
    this.baseURL = `https://${cleanStoreUrl}/tools/recurring/portal/api/storefront`;

    if (process.env.DEBUG === 'true') {
      console.error('[DEBUG] RechargeClient initialized with base URL:', this.baseURL);
      console.error('[DEBUG] Session token:', this.sessionToken ? 'Present' : 'Not provided');
      console.error('[DEBUG] Admin token:', this.adminToken ? 'Present' : 'Not provided');
    }
    
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': `Recharge-Storefront-API-MCP/${process.env.MCP_SERVER_VERSION || '1.0.0'}`,
    };
    
    // Set appropriate authentication header
    if (this.sessionToken) {
      headers['Authorization'] = `Bearer ${this.sessionToken}`;
      if (process.env.DEBUG === 'true') {
        console.error('[DEBUG] Using session token authentication');
      }
    }
    
    // Admin token is used for specific admin operations, not as default header
    if (this.adminToken) {
      if (process.env.DEBUG === 'true') {
        console.error('[DEBUG] Admin token available for admin operations');
      }
    }
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers,
      timeout: 30000, // 30 seconds
      maxRedirects: 0, // Disable automatic redirects to prevent loops
      validateStatus: (status) => status < 500, // Don't throw for 4xx errors, let our handler deal with them
    });

    this.setupInterceptors();
    
    // Start cleanup interval for expired sessions
  }

  /**
   * Get or create session token for customer
   * @param {string} [customerId] - Customer ID
   * @param {string} [customerEmail] - Customer email
   * @returns {Promise<string>} Session token
   */
  async getOrCreateSessionToken(customerId = null, customerEmail = null) {
    // CRITICAL SECURITY CHECK: Prevent session token mixups
    // If we have cached customer sessions and no customer is specified,
    // we must not use the default session as it could expose wrong customer data
    if (!customerId && !customerEmail) {
      // If we have customer-specific sessions cached, require explicit customer identification
      if (this.sessionCache.hasCustomerSessions()) {
        throw new Error(
          'Security Error: Cannot use default session token when customer-specific sessions exist. ' +
          'Please specify customer_id, customer_email, or session_token to ensure correct customer data access.'
        );
      }
      
      // If no customer sessions exist and we have a default session token, use it
      if (this.sessionToken) {
        if (process.env.DEBUG === 'true') {
          console.error('[DEBUG] Using default session token (no customer sessions cached)');
        }
        return this.sessionToken;
      }
      
      throw new Error(
        'Authentication Error: No session token available. ' +
        'Please provide customer_id, customer_email, or configure a default session_token.'
      );
    }

    // Resolve customer ID from email if needed
    if (!customerId && customerEmail) {
      // Check cache first
      customerId = this.sessionCache.getCustomerIdByEmail(customerEmail);
      
      if (!customerId) {
        // Look up customer by email
        const customerData = await this.getCustomerByEmail(customerEmail);
        if (customerData.customer) {
          customerId = customerData.customer.id.toString();
          this.sessionCache.setCustomerIdByEmail(customerEmail, customerId);
        } else {
          throw new Error(`Customer not found with email: ${customerEmail}`);
        }
      }
    }

    if (!customerId) {
      throw new Error('Customer ID or email required for session creation');
    }

    // SECURITY: Validate customer ID format to prevent injection
    if (typeof customerId !== 'string' || customerId.trim() === '') {
      throw new Error('Invalid customer ID format');
    }

    // Check for cached session token
    let sessionToken = this.sessionCache.getSessionToken(customerId);
    
    if (process.env.DEBUG === 'true') {
      console.error(`[DEBUG] Session lookup for customer ${customerId}: ${sessionToken ? 'Found in cache' : 'Not cached, will create'}`);
    }
    
    if (!sessionToken) {
      // Create new session
      const sessionData = await this.createCustomerSessionById(customerId);
      if (sessionData.customer_session && sessionData.customer_session.apiToken) {
        sessionToken = sessionData.customer_session.apiToken;
        this.sessionCache.setSessionToken(customerId, sessionToken, customerEmail);
        
        if (process.env.DEBUG === 'true') {
          console.error(`[DEBUG] Created and cached new session for customer ${customerId}`);
        }
      } else {
        throw new Error('Failed to create customer session');
      }
    } else {
      if (process.env.DEBUG === 'true') {
        console.error(`[DEBUG] Using cached session for customer ${customerId}`);
      }
    }

    return sessionToken;
  }

  /**
   * Make an API request with automatic session management
   * @param {string} method - HTTP method
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request data
   * @param {Object} params - Query parameters
   * @param {string} [customerId] - Customer ID for session
   * @param {string} [customerEmail] - Customer email for session
   * @returns {Promise<Object>} API response data
   */
  async makeCustomerRequest(method, endpoint, data = null, params = null, customerId = null, customerEmail = null) {
    // SECURITY: Always get customer-specific session token
    // This ensures we never accidentally use the wrong customer's session
    const sessionToken = await this.getOrCreateSessionToken(customerId, customerEmail);
    
    // SECURITY: Validate that we have proper customer identification
    if (!customerId && !customerEmail && !this.sessionToken) {
      throw new Error(
        'Security Error: Customer identification required for API calls. ' +
        'Please provide customer_id, customer_email, or ensure a default session_token is configured.'
      );
    }
    
    // Create request config with session token
    const config = {
      method: method.toLowerCase(),
      url: endpoint,
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': `Recharge-Storefront-API-MCP/${process.env.MCP_SERVER_VERSION || '1.0.0'}`,
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    if (params) {
      config.params = params;
    }
    
    try {
      const response = await axios.request({
        ...config,
        baseURL: this.baseURL,
        timeout: 30000,
        maxRedirects: 0,
        validateStatus: (status) => status < 500,
      });
      
      return response.data;
    } catch (error) {
      // If session expired, clear cache and retry once
      if (error.response?.status === 401 && customerId) {
        this.sessionCache.clearSession(customerId);
        
        if (process.env.DEBUG === 'true') {
          console.error('[DEBUG] Session expired, retrying with new session...');
        }
        
        // Retry with fresh session
        const newSessionToken = await this.getOrCreateSessionToken(customerId, customerEmail);
        config.headers['Authorization'] = `Bearer ${newSessionToken}`;
        
        try {
          const retryResponse = await axios.request({
            ...config,
            baseURL: this.baseURL,
            timeout: 30000,
            maxRedirects: 0,
            validateStatus: (status) => status < 500,
          });
          
          if (process.env.DEBUG === 'true') {
            console.error('[DEBUG] Retry with fresh session successful');
          }
          
          return retryResponse.data;
        } catch (retryError) {
          if (process.env.DEBUG === 'true') {
            console.error('[DEBUG] Retry with fresh session also failed');
          }
          handleAPIError(retryError);
        }
      }
      
      handleAPIError(error);
    }
  }

  /**
   * Create a customer session using customer ID (admin token required)
   * @param {string} customerId - Customer ID
   * @param {Object} [options={}] - Session options
   * @param {string} [options.return_url] - URL to redirect to after session
   * @returns {Promise<Object>} Session data including token
   * @throws {Error} If admin token is not available
   */
  async createCustomerSessionById(customerId, options = {}) {
    if (!this.adminToken) {
      throw new Error('Admin token required for session creation');
    }
    
    validateRequiredParams({ customerId }, ['customerId']);
    
    if (process.env.DEBUG === 'true') {
      console.error(`[DEBUG] Creating session for customer: ${customerId}`);
      console.error(`[DEBUG] Using Admin API for session creation`);
      console.error(`[DEBUG] Session creation URL: https://api.rechargeapps.com/customers/${customerId}/sessions`);
    }
    
    let response;
    try {
      // Use Admin API for session creation - correct endpoint
      const apiResponse = await axios.post(`https://api.rechargeapps.com/customers/${customerId}/sessions`, {
        customer_id: customerId,
        return_url: options.return_url
      }, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Recharge-Access-Token': this.adminToken,
          'X-Recharge-Version': '2021-11',
          'User-Agent': `Recharge-Storefront-API-MCP/${process.env.MCP_SERVER_VERSION || '1.0.0'}`,
        },
        timeout: 30000,
        maxRedirects: 0,
        validateStatus: (status) => status < 500,
      });
      response = apiResponse.data;
      
      if (process.env.DEBUG === 'true') {
        console.error('[DEBUG] Session creation response status:', apiResponse.status);
        console.error('[DEBUG] Session creation successful');
      }
    } catch (error) {
      if (process.env.DEBUG === 'true') {
        console.error(`[DEBUG] Session creation failed for customer ${customerId}:`, error.message);
        if (error.response) {
          console.error('[DEBUG] Error response status:', error.response.status);
          
          // Special handling for 302 redirects during session creation
          if (error.response.status === 302) {
            const location = error.response.headers.location;
            console.error('[DEBUG] 302 Redirect during session creation to:', location);
            console.error('[DEBUG] This usually indicates:');
            console.error('[DEBUG] 1. Invalid Admin API token');
            console.error('[DEBUG] 2. Token doesn\'t have session creation permissions');
            console.error('[DEBUG] 3. Customer ID doesn\'t exist or access denied');
            console.error('[DEBUG] 4. Wrong authentication method for Admin API');
          }
        }
      }
      handleAPIError(error);
    }
    
    if (process.env.DEBUG === 'true') {
      console.error(`[DEBUG] Session creation response received`);
    }
    
    if (response.customer_session && response.customer_session.apiToken) {
      if (process.env.DEBUG === 'true') {
        console.error('[DEBUG] Session created successfully');
      }
    }
    
    return response;
  }

  /**
   * Setup axios interceptors for logging and error handling
   */
  setupInterceptors() {
    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        // Ensure URL doesn't have double slashes or malformed paths
        if (config.url && config.url.startsWith('//')) {
          config.url = config.url.substring(1);
        }
        
        // Validate the final URL construction
        const fullUrl = `${config.baseURL}${config.url}`;
        if (process.env.DEBUG === 'true') {
          console.error('[DEBUG] Full URL:', fullUrl);
        }
        
        if (process.env.DEBUG === 'true') {
          console.error('[DEBUG]', config.method?.toUpperCase(), config.baseURL + config.url);
          if (config.data) {
            console.error('[DEBUG] Request body:', JSON.stringify(config.data, null, 2));
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        if (process.env.DEBUG === 'true') {
          console.error('[DEBUG] Response', response.status, 'from', response.config.method?.toUpperCase(), response.config.url);
        }
        return response;
      },
      (error) => {
        // Handle redirect responses
        if (error.response && [301, 302, 303, 307, 308].includes(error.response.status)) {
          const location = error.response.headers.location;
          const originalUrl = `${error.config.baseURL}${error.config.url}`;
          const requestHeaders = error.config.headers;
          
          if (process.env.DEBUG === 'true') {
            console.error('[DEBUG] Redirect', error.response.status, 'to:', location);
            console.error('[DEBUG] Original URL:', originalUrl);
            console.error('[DEBUG] Base URL:', error.config.baseURL);
            console.error('[DEBUG] Request method:', error.config.method?.toUpperCase());
          }
          
          // Create a more descriptive error for redirects
          let redirectError;
          
          // Analyze redirect patterns to provide specific guidance
          if (location && (location.includes('/admin/oauth') || location.includes('oauth'))) {
            redirectError = new Error(
              `Authentication redirect detected (${error.response.status}). ` +
              `This usually means there's an authentication issue. Common causes:\n` +
              `1. Invalid or expired token\n` +
              `2. Wrong token type for this endpoint\n` +
              `3. Token doesn't have required permissions\n` +
              `Original URL: ${originalUrl}\n` +
              `Redirect to: ${location}\n` +
              `Token type: ${requestHeaders?.Authorization ? 'Bearer (session)' : requestHeaders?.['X-Recharge-Access-Token'] ? 'Admin API' : 'None'}`
            );
          } else if (location && location.includes('/account/login')) {
            redirectError = new Error(
              `Login redirect detected (${error.response.status}). ` +
              `This indicates the customer session token is invalid or expired. ` +
              `Original URL: ${originalUrl}\n` +
              `Redirect to: ${location}\n` +
              `Solution: Provide customer_id/customer_email for automatic session creation.`
            );
          } else if (location && location.includes('/tools/recurring/portal')) {
            redirectError = new Error(
              `Internal Recharge redirect detected (${error.response.status}). ` +
              `This may indicate a URL structure issue or authentication problem. ` +
              `Original URL: ${originalUrl}\n` +
              `Redirect to: ${location}\n` +
              `Check if the endpoint path is correct.`
            );
          } else if (location && !location.includes(error.config.baseURL)) {
            redirectError = new Error(
              `External redirect detected (${error.response.status}) to ${location}. ` +
              `This may indicate:\n` +
              `1. Store URL is incorrect\n` +
              `2. Recharge is not properly installed\n` +
              `3. Store domain configuration issue\n` +
              `Original URL: ${originalUrl}\n` +
              `Please verify your RECHARGE_STOREFRONT_DOMAIN setting.`
            );
          } else {
            redirectError = new Error(
              `API returned redirect ${error.response.status} to ${location}. ` +
              `Original URL: ${originalUrl}. ` +
              `This may indicate:\n` +
              `1. Authentication issue\n` +
              `2. Incorrect API endpoint\n` +
              `3. Token permissions problem\n` +
              `Request method: ${error.config.method?.toUpperCase()}\n` +
              `Token type: ${requestHeaders?.Authorization ? 'Bearer (session)' : requestHeaders?.['X-Recharge-Access-Token'] ? 'Admin API' : 'None'}\n` +
              `Please verify your store URL and authentication tokens.`
            );
          }
          
          redirectError.response = error.response;
          redirectError.isRedirect = true;
          redirectError.originalUrl = originalUrl;
          redirectError.redirectLocation = location;
          throw redirectError;
        }
        
        // Check for session expiry errors and mark for renewal
        if (error.response?.status === 401 && this.sessionToken) {
          if (process.env.DEBUG === 'true') {
            console.error('[DEBUG] Session token appears to be expired (401 error)');
          }
          // Add a flag to indicate session expiry
          error.sessionExpired = true;
        }
        handleAPIError(error);
      }
    );
  }

  /**
   * Make an API request
   * @param {string} method - HTTP method
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request data
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} API response data
   * @throws {Error} API error
   */
  async makeRequest(method, endpoint, data = null, params = null) {
    const config = {
      method: method.toLowerCase(),
      url: endpoint,
    };
    
    if (data) {
      config.data = data;
    }
    
    if (params) {
      config.params = params;
    }
    
    const response = await this.client.request(config);
    return response.data;
  }

  /**
   * Get customer by email address (requires Admin API token)
   * @param {string} email Customer email address
   * @returns {Promise<Object>} Customer data including customer ID
   * @throws {Error} If admin token is not available
   * @throws {Error} If customer is not found
   */
  async getCustomerByEmail(email) {
    if (!this.adminToken) {
      throw new Error(
        'Admin token required for customer lookup by email. Please provide an admin token when creating the RechargeClient:\n' +
        'new RechargeClient({ storeUrl, adminToken: "your_admin_token" })\n' +
        'Note: Admin tokens are different from customer session tokens (st_...)'
      );
    }
    
    validateRequiredParams({ email }, ['email']);
    
    // Additional email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error(`Invalid email format: ${email}`);
    }
    
    if (process.env.DEBUG === 'true') {
      console.error('[DEBUG] Looking up customer by email:', email);
      console.error('[DEBUG] Using Admin API for customer lookup');
      console.error('[DEBUG] Admin API URL: https://api.rechargeapps.com/customers');
    }
    
    try {
      // Use Admin API for customer lookup
      const response = await axios.get('https://api.rechargeapps.com/customers', {
        params: { email },
        headers: {
          'Accept': 'application/json',
          'X-Recharge-Access-Token': this.adminToken,
          'User-Agent': `Recharge-Storefront-API-MCP/${process.env.MCP_SERVER_VERSION || '1.0.0'}`,
        },
        timeout: 30000,
        maxRedirects: 0, // Disable redirects to catch 302s
        validateStatus: (status) => status < 500,
      });
      
      if (process.env.DEBUG === 'true') {
        console.error('[DEBUG] Customer lookup response status:', response.status);
      }
      
      return response.data;
    } catch (error) {
      if (process.env.DEBUG === 'true') {
        console.error('[DEBUG] Customer lookup failed for email', email + ':', error.message);
        if (error.response) {
          console.error('[DEBUG] Error response status:', error.response.status);
          
          // Special handling for 302 redirects during customer lookup
          if (error.response.status === 302) {
            const location = error.response.headers.location;
            console.error('[DEBUG] 302 Redirect during customer lookup to:', location);
            console.error('[DEBUG] This usually indicates:');
            console.error('[DEBUG] 1. Invalid Admin API token');
            console.error('[DEBUG] 2. Token doesn\'t have customer read permissions');
            console.error('[DEBUG] 3. Wrong API endpoint or authentication method');
            console.error('[DEBUG] 4. Token format issue (should NOT start with st_)');
          }
        }
      }
      handleAPIError(error);
    }
  }

  /**
   * Get customer information (uses current session context)
   * @param {string} [customerId] - Customer ID for session creation
   * @param {string} [customerEmail] - Customer email for session creation
   * @returns {Promise<Object>} Customer data
   * @throws {Error} If session token is invalid or expired
   */
  async getCustomer(customerId = null, customerEmail = null) {
    const response = await this.makeCustomerRequest('GET', '/customer', null, null, customerId, customerEmail);
    return response;
  }

  /**
   * Update customer information
   * @param {Object} data - Customer update data
   * @param {string} [customerId] - Customer ID for session creation
   * @param {string} [customerEmail] - Customer email for session creation
   * @returns {Promise<Object>} Updated customer data
   * @throws {Error} If update data is empty or invalid
   */
  async updateCustomer(data, customerId = null, customerEmail = null) {
    if (!data || Object.keys(data).length === 0) {
      throw new Error('Customer update data is required');
    }
    return this.makeCustomerRequest('PUT', '/customer', data, null, customerId, customerEmail);
  }

  /**
   * Get subscriptions with optional filtering
   * @param {Object} params - Query parameters
   * @param {string} [params.status] - Filter by subscription status
   * @param {number} [params.limit] - Number of results to return
   * @param {number} [params.page] - Page number for pagination
   * @param {string} [customerId] - Customer ID for session creation
   * @param {string} [customerEmail] - Customer email for session creation
   * @returns {Promise<Object>} Subscriptions data
   * @throws {Error} If API request fails
   */
  async getSubscriptions(params = {}, customerId = null, customerEmail = null) {
    return this.makeCustomerRequest('GET', '/subscriptions', null, params, customerId, customerEmail);
  }

  /**
   * Get detailed information about a specific subscription
   * @param {string} subscriptionId - The subscription ID
   * @param {string} [customerId] - Customer ID for session creation
   * @param {string} [customerEmail] - Customer email for session creation
   * @returns {Promise<Object>} Subscription data
   * @throws {Error} If subscription ID is invalid or not found
   */
  async getSubscription(subscriptionId, customerId = null, customerEmail = null) {
    validateRequiredParams({ subscriptionId }, ['subscriptionId']);
    return this.makeCustomerRequest('GET', `/subscriptions/${subscriptionId}`, null, null, customerId, customerEmail);
  }

  /**
   * Create a new subscription
   * @param {Object} subscriptionData - Subscription data
   * @param {string} [customerId] - Customer ID for session creation
   * @param {string} [customerEmail] - Customer email for session creation
   * @returns {Promise<Object>} Created subscription data
   * @throws {Error} If required fields are missing or invalid
   */
  async createSubscription(subscriptionData, customerId = null, customerEmail = null) {
    const required = ['address_id', 'next_charge_scheduled_at', 'order_interval_frequency', 'order_interval_unit', 'quantity', 'variant_id'];
    validateRequiredParams(subscriptionData, required);
    
    // Convert string IDs to integers where needed
    const processedData = { ...subscriptionData };
    if (processedData.variant_id) {
      processedData.variant_id = parseInt(processedData.variant_id, 10);
    }
    if (processedData.quantity) {
      processedData.quantity = parseInt(processedData.quantity, 10);
    }
    if (processedData.order_interval_frequency) {
      processedData.order_interval_frequency = parseInt(processedData.order_interval_frequency, 10);
    }
    
    return this.makeCustomerRequest('POST', '/subscriptions', processedData, null, customerId, customerEmail);
  }

  /**
   * Update subscription details
   * @param {string} subscriptionId - The subscription ID
   * @param {Object} data - Update data
   * @param {string} [customerId] - Customer ID for session creation
   * @param {string} [customerEmail] - Customer email for session creation
   * @returns {Promise<Object>} Updated subscription data
   * @throws {Error} If subscription ID is invalid or update data is empty
   */
  async updateSubscription(subscriptionId, data, customerId = null, customerEmail = null) {
    validateRequiredParams({ subscriptionId }, ['subscriptionId']);
    if (!data || Object.keys(data).length === 0) {
      throw new Error('Subscription update data is required');
    }
    
    // Convert string values to appropriate types
    const processedData = { ...data };
    if (processedData.variant_id) {
      processedData.variant_id = parseInt(processedData.variant_id, 10);
    }
    if (processedData.quantity) {
      processedData.quantity = parseInt(processedData.quantity, 10);
    }
    if (processedData.order_interval_frequency) {
      processedData.order_interval_frequency = parseInt(processedData.order_interval_frequency, 10);
    }
    
    return this.makeCustomerRequest('PUT', `/subscriptions/${subscriptionId}`, processedData, null, customerId, customerEmail);
  }

  /**
   * Cancel a subscription
   * @param {string} subscriptionId - The subscription ID
   * @param {Object} [data={}] - Cancellation data
   * @param {string} [customerId] - Customer ID for session creation
   * @param {string} [customerEmail] - Customer email for session creation
   * @returns {Promise<Object>} Cancellation result
   * @throws {Error} If subscription ID is invalid
   */
  async cancelSubscription(subscriptionId, data = {}, customerId = null, customerEmail = null) {
    validateRequiredParams({ subscriptionId }, ['subscriptionId']);
    return this.makeCustomerRequest('POST', `/subscriptions/${subscriptionId}/cancel`, data, null, customerId, customerEmail);
  }

  /**
   * Activate a cancelled subscription
   * @param {string} subscriptionId - The subscription ID
   * @param {string} [customerId] - Customer ID for session creation
   * @param {string} [customerEmail] - Customer email for session creation
   * @returns {Promise<Object>} Activation result
   * @throws {Error} If subscription ID is invalid or subscription cannot be activated
   */
  async activateSubscription(subscriptionId, customerId = null, customerEmail = null) {
    validateRequiredParams({ subscriptionId }, ['subscriptionId']);
    return this.makeCustomerRequest('POST', `/subscriptions/${subscriptionId}/activate`, {}, null, customerId, customerEmail);
  }

  /**
   * Skip a subscription delivery for a specific date
   * @param {string} subscriptionId - The subscription ID
   * @param {string} date - Date to skip (YYYY-MM-DD)
   * @param {string} [customerId] - Customer ID for session creation
   * @param {string} [customerEmail] - Customer email for session creation
   * @returns {Promise<Object>} Skip result
   * @throws {Error} If subscription ID or date is invalid
   */
  async skipSubscription(subscriptionId, date, customerId = null, customerEmail = null) {
    validateRequiredParams({ subscriptionId, date }, ['subscriptionId', 'date']);
    return this.makeCustomerRequest('POST', `/subscriptions/${subscriptionId}/skip`, { date }, null, customerId, customerEmail);
  }

  /**
   * Unskip a previously skipped subscription delivery
   * @param {string} subscriptionId - The subscription ID
   * @param {string} date - Date to unskip (YYYY-MM-DD)
   * @param {string} [customerId] - Customer ID for session creation
   * @param {string} [customerEmail] - Customer email for session creation
   * @returns {Promise<Object>} Unskip result
   * @throws {Error} If subscription ID or date is invalid
   */
  async unskipSubscription(subscriptionId, date, customerId = null, customerEmail = null) {
    validateRequiredParams({ subscriptionId, date }, ['subscriptionId', 'date']);
    return this.makeCustomerRequest('POST', `/subscriptions/${subscriptionId}/unskip`, { date }, null, customerId, customerEmail);
  }

  /**
   * Swap subscription product variant
   * @param {string} subscriptionId - The subscription ID
   * @param {Object} data - Swap data including variant_id
   * @param {string} [customerId] - Customer ID for session creation
   * @param {string} [customerEmail] - Customer email for session creation
   * @returns {Promise<Object>} Swap result
   * @throws {Error} If subscription ID is invalid or variant_id is missing
   */
  async swapSubscription(subscriptionId, data, customerId = null, customerEmail = null) {
    validateRequiredParams({ subscriptionId }, ['subscriptionId']);
    if (!data?.variant_id) {
      throw new Error('variant_id is required for subscription swap');
    }
    
    // Convert variant_id to integer and quantity if provided
    const processedData = { ...data };
    processedData.variant_id = parseInt(processedData.variant_id, 10);
    if (processedData.quantity) {
      processedData.quantity = parseInt(processedData.quantity, 10);
    }
    
    return this.makeCustomerRequest('POST', `/subscriptions/${subscriptionId}/swap`, processedData, null, customerId, customerEmail);
  }

  /**
   * Set next charge date for subscription
   * @param {string} subscriptionId - The subscription ID
   * @param {string} date - Next charge date (YYYY-MM-DD)
   * @param {string} [customerId] - Customer ID for session creation
   * @param {string} [customerEmail] - Customer email for session creation
   * @returns {Promise<Object>} Update result
   * @throws {Error} If subscription ID or date is invalid
   */
  async setNextChargeDate(subscriptionId, date, customerId = null, customerEmail = null) {
    validateRequiredParams({ subscriptionId, date }, ['subscriptionId', 'date']);
    return this.makeCustomerRequest('POST', `/subscriptions/${subscriptionId}/set_next_charge_date`, { date }, null, customerId, customerEmail);
  }

  // Address methods
  /**
   * Get addresses with optional filtering
   * @param {Object} [params={}] - Query parameters
   * @param {number} [params.limit] - Number of results to return
   * @param {number} [params.page] - Page number for pagination
   * @param {string} [customerId] - Customer ID for session creation
   * @param {string} [customerEmail] - Customer email for session creation
   * @returns {Promise<Object>} Addresses data
   * @throws {Error} If API request fails
   */
  async getAddresses(params = {}, customerId = null, customerEmail = null) {
    return this.makeCustomerRequest('GET', '/addresses', null, params, customerId, customerEmail);
  }

  /**
   * Get detailed information about a specific address
   * @param {string} addressId - The address ID
   * @param {string} [customerId] - Customer ID for session creation
   * @param {string} [customerEmail] - Customer email for session creation
   * @returns {Promise<Object>} Address data
   * @throws {Error} If address ID is invalid or not found
   */
  async getAddress(addressId, customerId = null, customerEmail = null) {
    validateRequiredParams({ addressId }, ['addressId']);
    return this.makeCustomerRequest('GET', `/addresses/${addressId}`, null, null, customerId, customerEmail);
  }

  /**
   * Create a new address
   * @param {Object} addressData - Address data
   * @param {string} [customerId] - Customer ID for session creation
   * @param {string} [customerEmail] - Customer email for session creation
   * @returns {Promise<Object>} Created address data
   * @throws {Error} If required address fields are missing
   */
  async createAddress(addressData, customerId = null, customerEmail = null) {
    const required = ['address1', 'city', 'province', 'zip', 'country', 'first_name', 'last_name'];
    validateRequiredParams(addressData, required);
    return this.makeCustomerRequest('POST', '/addresses', addressData, null, customerId, customerEmail);
  }

  /**
   * Update an existing address
   * @param {string} addressId - The address ID
   * @param {Object} addressData - Updated address data
   * @param {string} [customerId] - Customer ID for session creation
   * @param {string} [customerEmail] - Customer email for session creation
   * @returns {Promise<Object>} Updated address data
   * @throws {Error} If address ID is invalid or update data is empty
   */
  async updateAddress(addressId, addressData, customerId = null, customerEmail = null) {
    validateRequiredParams({ addressId }, ['addressId']);
    if (!addressData || Object.keys(addressData).length === 0) {
      throw new Error('Address update data is required');
    }
    return this.makeCustomerRequest('PUT', `/addresses/${addressId}`, addressData, null, customerId, customerEmail);
  }

  /**
   * Delete an address
   * @param {string} addressId - The address ID
   * @param {string} [customerId] - Customer ID for session creation
   * @param {string} [customerEmail] - Customer email for session creation
   * @returns {Promise<Object>} Deletion result
   * @throws {Error} If address ID is invalid or address cannot be deleted
   */
  async deleteAddress(addressId, customerId = null, customerEmail = null) {
    validateRequiredParams({ addressId }, ['addressId']);
    return this.makeCustomerRequest('DELETE', `/addresses/${addressId}`, null, null, customerId, customerEmail);
  }

  // Payment method methods
  /**
   * Get payment methods with optional filtering
   * @param {Object} [params={}] - Query parameters
   * @param {number} [params.limit] - Number of results to return
   * @param {number} [params.page] - Page number for pagination
   * @param {string} [customerId] - Customer ID for session creation
   * @param {string} [customerEmail] - Customer email for session creation
   * @returns {Promise<Object>} Payment methods data
   * @throws {Error} If API request fails
   */
  async getPaymentMethods(params = {}, customerId = null, customerEmail = null) {
    return this.makeCustomerRequest('GET', '/payment_methods', null, params, customerId, customerEmail);
  }

  /**
   * Get detailed information about a specific payment method
   * @param {string} paymentMethodId - The payment method ID
   * @param {string} [customerId] - Customer ID for session creation
   * @param {string} [customerEmail] - Customer email for session creation
   * @returns {Promise<Object>} Payment method data
   * @throws {Error} If payment method ID is invalid or not found
   */
  async getPaymentMethod(paymentMethodId, customerId = null, customerEmail = null) {
    validateRequiredParams({ paymentMethodId }, ['paymentMethodId']);
    return this.makeCustomerRequest('GET', `/payment_methods/${paymentMethodId}`, null, null, customerId, customerEmail);
  }

  /**
   * Update payment method billing information
   * @param {string} paymentMethodId - The payment method ID
   * @param {Object} paymentData - Updated payment data
   * @param {string} [customerId] - Customer ID for session creation
   * @param {string} [customerEmail] - Customer email for session creation
   * @returns {Promise<Object>} Updated payment method data
   * @throws {Error} If payment method ID is invalid or update data is empty
   */
  async updatePaymentMethod(paymentMethodId, paymentData, customerId = null, customerEmail = null) {
    validateRequiredParams({ paymentMethodId }, ['paymentMethodId']);
    if (!paymentData || Object.keys(paymentData).length === 0) {
      throw new Error('Payment method update data is required');
    }
    return this.makeCustomerRequest('PUT', `/payment_methods/${paymentMethodId}`, paymentData, null, customerId, customerEmail);
  }

  // Product methods
  /**
   * Get available products with optional filtering
   * @param {Object} [params={}] - Query parameters
   * @param {number} [params.limit] - Number of results to return
   * @param {string} [params.handle] - Filter by product handle
   * @param {boolean} [params.subscription_defaults] - Include subscription defaults
   * @param {string} [customerId] - Customer ID for session creation
   * @param {string} [customerEmail] - Customer email for session creation
   * @returns {Promise<Object>} Products data
   * @throws {Error} If API request fails
   */
  async getProducts(params = {}, customerId = null, customerEmail = null) {
    return this.makeCustomerRequest('GET', '/products', null, params, customerId, customerEmail);
  }

  /**
   * Get detailed product information
   * @param {string} productId - The product ID
   * @param {string} [customerId] - Customer ID for session creation
   * @param {string} [customerEmail] - Customer email for session creation
   * @returns {Promise<Object>} Product data
   * @throws {Error} If product ID is invalid or not found
   */
  async getProduct(productId, customerId = null, customerEmail = null) {
    validateRequiredParams({ productId }, ['productId']);
    return this.makeCustomerRequest('GET', `/products/${productId}`, null, null, customerId, customerEmail);
  }

  // Order methods
  /**
   * Get orders with optional filtering
   * @param {Object} [params={}] - Query parameters
   * @param {string} [params.status] - Filter by order status
   * @param {number} [params.limit] - Number of results to return
   * @param {number} [params.page] - Page number for pagination
   * @param {string} [customerId] - Customer ID for session creation
   * @param {string} [customerEmail] - Customer email for session creation
   * @returns {Promise<Object>} Orders data
   * @throws {Error} If API request fails
   */
  async getOrders(params = {}, customerId = null, customerEmail = null) {
    return this.makeCustomerRequest('GET', '/orders', null, params, customerId, customerEmail);
  }

  /**
   * Get detailed order information
   * @param {string} orderId - The order ID
   * @param {string} [customerId] - Customer ID for session creation
   * @param {string} [customerEmail] - Customer email for session creation
   * @returns {Promise<Object>} Order data
   * @throws {Error} If order ID is invalid or not found
   */
  async getOrder(orderId, customerId = null, customerEmail = null) {
    validateRequiredParams({ orderId }, ['orderId']);
    return this.makeCustomerRequest('GET', `/orders/${orderId}`, null, null, customerId, customerEmail);
  }

  // Charge methods
  /**
   * Get charges with optional filtering
   * @param {Object} [params={}] - Query parameters
   * @param {string} [params.status] - Filter by charge status
   * @param {number} [params.limit] - Number of results to return
   * @param {number} [params.page] - Page number for pagination
   * @param {string} [customerId] - Customer ID for session creation
   * @param {string} [customerEmail] - Customer email for session creation
   * @returns {Promise<Object>} Charges data
   * @throws {Error} If API request fails
   */
  async getCharges(params = {}, customerId = null, customerEmail = null) {
    return this.makeCustomerRequest('GET', '/charges', null, params, customerId, customerEmail);
  }

  /**
   * Get detailed charge information
   * @param {string} chargeId - The charge ID
   * @param {string} [customerId] - Customer ID for session creation
   * @param {string} [customerEmail] - Customer email for session creation
   * @returns {Promise<Object>} Charge data
   * @throws {Error} If charge ID is invalid or not found
   */
  async getCharge(chargeId, customerId = null, customerEmail = null) {
    validateRequiredParams({ chargeId }, ['chargeId']);
    return this.makeCustomerRequest('GET', `/charges/${chargeId}`, null, null, customerId, customerEmail);
  }

  // One-time product methods
  /**
   * Get one-time products with optional filtering
   * @param {Object} [params={}] - Query parameters
   * @param {number} [params.limit] - Number of results to return
   * @param {number} [params.page] - Page number for pagination
   * @param {string} [customerId] - Customer ID for session creation
   * @param {string} [customerEmail] - Customer email for session creation
   * @returns {Promise<Object>} One-time products data
   * @throws {Error} If API request fails
   */
  async getOnetimes(params = {}, customerId = null, customerEmail = null) {
    return this.makeCustomerRequest('GET', '/onetimes', null, params, customerId, customerEmail);
  }

  /**
   * Get detailed information about a specific one-time product
   * @param {string} onetimeId - The one-time product ID
   * @param {string} [customerId] - Customer ID for session creation
   * @param {string} [customerEmail] - Customer email for session creation
   * @returns {Promise<Object>} One-time product data
   * @throws {Error} If one-time product ID is invalid or not found
   */
  async getOnetime(onetimeId, customerId = null, customerEmail = null) {
    validateRequiredParams({ onetimeId }, ['onetimeId']);
    return this.makeCustomerRequest('GET', `/onetimes/${onetimeId}`, null, null, customerId, customerEmail);
  }

  /**
   * Create a one-time product
   * @param {Object} onetimeData - One-time product data
   * @param {string} [customerId] - Customer ID for session creation
   * @param {string} [customerEmail] - Customer email for session creation
   * @returns {Promise<Object>} Created one-time product data
   * @throws {Error} If required fields are missing
   */
  async createOnetime(onetimeData, customerId = null, customerEmail = null) {
    const required = ['variant_id', 'quantity', 'next_charge_scheduled_at'];
    validateRequiredParams(onetimeData, required);
    
    // Convert numeric fields to proper types
    const processedData = { ...onetimeData };
    processedData.variant_id = parseInt(processedData.variant_id, 10);
    processedData.quantity = parseInt(processedData.quantity, 10);
    if (processedData.price) {
      processedData.price = parseFloat(processedData.price);
    }
    
    return this.makeCustomerRequest('POST', '/onetimes', processedData, null, customerId, customerEmail);
  }

  /**
   * Update a one-time product
   * @param {string} onetimeId - The one-time product ID
   * @param {Object} onetimeData - Updated one-time product data
   * @param {string} [customerId] - Customer ID for session creation
   * @param {string} [customerEmail] - Customer email for session creation
   * @returns {Promise<Object>} Updated one-time product data
   * @throws {Error} If one-time product ID is invalid or update data is empty
   */
  async updateOnetime(onetimeId, onetimeData, customerId = null, customerEmail = null) {
    validateRequiredParams({ onetimeId }, ['onetimeId']);
    if (!onetimeData || Object.keys(onetimeData).length === 0) {
      throw new Error('One-time product update data is required');
    }
    
    // Convert numeric fields to proper types
    const processedData = { ...onetimeData };
    if (processedData.quantity) {
      processedData.quantity = parseInt(processedData.quantity, 10);
    }
    if (processedData.price) {
      processedData.price = parseFloat(processedData.price);
    }
    
    return this.makeCustomerRequest('PUT', `/onetimes/${onetimeId}`, processedData, null, customerId, customerEmail);
  }

  /**
   * Delete a one-time product
   * @param {string} onetimeId - The one-time product ID
   * @param {string} [customerId] - Customer ID for session creation
   * @param {string} [customerEmail] - Customer email for session creation
   * @returns {Promise<Object>} Deletion result
   * @throws {Error} If one-time product ID is invalid or product cannot be deleted
   */
  async deleteOnetime(onetimeId, customerId = null, customerEmail = null) {
    validateRequiredParams({ onetimeId }, ['onetimeId']);
    return this.makeCustomerRequest('DELETE', `/onetimes/${onetimeId}`, null, null, customerId, customerEmail);
  }

  // Bundle methods
  /**
   * Get bundles with optional filtering
   * @param {Object} [params={}] - Query parameters
   * @param {string} [params.subscription_id] - Filter by subscription ID
   * @param {number} [params.limit] - Number of results to return
   * @param {number} [params.page] - Page number for pagination
   * @param {string} [customerId] - Customer ID for session creation
   * @param {string} [customerEmail] - Customer email for session creation
   * @returns {Promise<Object>} Bundles data
   * @throws {Error} If API request fails
   */
  async getBundles(params = {}, customerId = null, customerEmail = null) {
    return this.makeCustomerRequest('GET', '/bundles', null, params, customerId, customerEmail);
  }

  /**
   * Get detailed information about a specific bundle
   * @param {string} bundleId - The bundle ID
   * @param {string} [customerId] - Customer ID for session creation
   * @param {string} [customerEmail] - Customer email for session creation
   * @returns {Promise<Object>} Bundle data
   * @throws {Error} If bundle ID is invalid or not found
   */
  async getBundle(bundleId, customerId = null, customerEmail = null) {
    validateRequiredParams({ bundleId }, ['bundleId']);
    return this.makeCustomerRequest('GET', `/bundles/${bundleId}`, null, null, customerId, customerEmail);
  }

  /**
   * Get bundle selections for a specific bundle
   * @param {string} bundleId - The bundle ID
   * @param {Object} [params={}] - Query parameters
   * @param {number} [params.limit] - Number of results to return
   * @param {string} [customerId] - Customer ID for session creation
   * @param {string} [customerEmail] - Customer email for session creation
   * @returns {Promise<Object>} Bundle selections data
   * @throws {Error} If bundle ID is invalid
   */
  async getBundleSelections(bundleId, params = {}, customerId = null, customerEmail = null) {
    validateRequiredParams({ bundleId }, ['bundleId']);
    return this.makeCustomerRequest('GET', `/bundles/${bundleId}/bundle_selections`, null, params, customerId, customerEmail);
  }

  /**
   * Get detailed information about a specific bundle selection
   * @param {string} bundleSelectionId - The bundle selection ID
   * @param {string} [customerId] - Customer ID for session creation
   * @param {string} [customerEmail] - Customer email for session creation
   * @returns {Promise<Object>} Bundle selection data
   * @throws {Error} If bundle selection ID is invalid or not found
   */
  async getBundleSelection(bundleSelectionId, customerId = null, customerEmail = null) {
    validateRequiredParams({ bundleSelectionId }, ['bundleSelectionId']);
    return this.makeCustomerRequest('GET', `/bundle_selections/${bundleSelectionId}`, null, null, customerId, customerEmail);
  }

  /**
   * Create a bundle selection
   * @param {Object} selectionData - Bundle selection data
   * @param {string} selectionData.bundle_id - Bundle ID
   * @param {number} selectionData.variant_id - Selected variant ID
   * @param {number} selectionData.quantity - Quantity selected
   * @param {string} [customerId] - Customer ID for session creation
   * @param {string} [customerEmail] - Customer email for session creation
   * @returns {Promise<Object>} Created bundle selection data
   * @throws {Error} If required fields are missing
   */
  async createBundleSelection(selectionData, customerId = null, customerEmail = null) {
    const required = ['bundle_id', 'variant_id', 'quantity'];
    validateRequiredParams(selectionData, required);
    
    // Convert numeric fields to proper types
    const processedData = { ...selectionData };
    processedData.bundle_id = parseInt(processedData.bundle_id, 10);
    processedData.variant_id = parseInt(processedData.variant_id, 10);
    processedData.quantity = parseInt(processedData.quantity, 10);
    if (processedData.external_variant_id) {
      processedData.external_variant_id = parseInt(processedData.external_variant_id, 10);
    }
    
    return this.makeCustomerRequest('POST', '/bundle_selections', processedData, null, customerId, customerEmail);
  }

  /**
   * Update a bundle selection
   * @param {string} bundleSelectionId - The bundle selection ID
   * @param {Object} selectionData - Updated bundle selection data
   * @param {string} [customerId] - Customer ID for session creation
   * @param {string} [customerEmail] - Customer email for session creation
   * @returns {Promise<Object>} Updated bundle selection data
   * @throws {Error} If bundle selection ID is invalid or update data is empty
   */
  async updateBundleSelection(bundleSelectionId, selectionData, customerId = null, customerEmail = null) {
    validateRequiredParams({ bundleSelectionId }, ['bundleSelectionId']);
    if (!selectionData || Object.keys(selectionData).length === 0) {
      throw new Error('Bundle selection update data is required');
    }
    
    // Convert numeric fields to proper types
    const processedData = { ...selectionData };
    if (processedData.variant_id) {
      processedData.variant_id = parseInt(processedData.variant_id, 10);
    }
    if (processedData.quantity) {
      processedData.quantity = parseInt(processedData.quantity, 10);
    }
    if (processedData.external_variant_id) {
      processedData.external_variant_id = parseInt(processedData.external_variant_id, 10);
    }
    
    return this.makeCustomerRequest('PUT', `/bundle_selections/${bundleSelectionId}`, processedData, null, customerId, customerEmail);
  }

  /**
   * Delete a bundle selection
   * @param {string} bundleSelectionId - The bundle selection ID
   * @param {string} [customerId] - Customer ID for session creation
   * @param {string} [customerEmail] - Customer email for session creation
   * @returns {Promise<Object>} Deletion result
   * @throws {Error} If bundle selection ID is invalid or selection cannot be deleted
   */
  async deleteBundleSelection(bundleSelectionId, customerId = null, customerEmail = null) {
    validateRequiredParams({ bundleSelectionId }, ['bundleSelectionId']);
    return this.makeCustomerRequest('DELETE', `/bundle_selections/${bundleSelectionId}`, null, null, customerId, customerEmail);
  }

  // Discount methods
  /**
   * Get discounts with optional filtering
   * @param {Object} [params={}] - Query parameters
   * @param {number} [params.limit] - Number of results to return
   * @param {number} [params.page] - Page number for pagination
   * @param {string} [customerId] - Customer ID for session creation
   * @param {string} [customerEmail] - Customer email for session creation
   * @returns {Promise<Object>} Discounts data
   * @throws {Error} If API request fails
   */
  async getDiscounts(params = {}, customerId = null, customerEmail = null) {
    return this.makeCustomerRequest('GET', '/discounts', null, params, customerId, customerEmail);
  }

  /**
   * Get detailed information about a specific discount
   * @param {string} discountId - The discount ID
   * @param {string} [customerId] - Customer ID for session creation
   * @param {string} [customerEmail] - Customer email for session creation
   * @returns {Promise<Object>} Discount data
   * @throws {Error} If discount ID is invalid or not found
   */
  async getDiscount(discountId, customerId = null, customerEmail = null) {
    validateRequiredParams({ discountId }, ['discountId']);
    return this.makeCustomerRequest('GET', `/discounts/${discountId}`, null, null, customerId, customerEmail);
  }

  /**
   * Apply a discount code
   * @param {string} discountCode - The discount code to apply
   * @param {string} [customerId] - Customer ID for session creation
   * @param {string} [customerEmail] - Customer email for session creation
   * @returns {Promise<Object>} Applied discount data
   * @throws {Error} If discount code is invalid or cannot be applied
   */
  async applyDiscount(discountCode, customerId = null, customerEmail = null) {
    validateRequiredParams({ discountCode }, ['discountCode']);
    return this.makeCustomerRequest('POST', '/discounts', { discount_code: discountCode }, null, customerId, customerEmail);
  }

  /**
   * Remove a discount
   * @param {string} discountId - The discount ID to remove
   * @param {string} [customerId] - Customer ID for session creation
   * @param {string} [customerEmail] - Customer email for session creation
   * @returns {Promise<Object>} Removal result
   * @throws {Error} If discount ID is invalid or discount cannot be removed
   */
  async removeDiscount(discountId, customerId = null, customerEmail = null) {
    validateRequiredParams({ discountId }, ['discountId']);
    return this.makeCustomerRequest('DELETE', `/discounts/${discountId}`, null, null, customerId, customerEmail);
  }

  /**
   * Get server statistics
   * @returns {Object} Server statistics
   */
  getStats() {
    return this.sessionCache.getStats();
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.sessionCache.clearAll();
  }
}