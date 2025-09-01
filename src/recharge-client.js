import axios from 'axios';
import { handleAPIError, validateRequiredParams } from './utils/error-handler.js';

/**
 * Recharge Storefront API Client
 * 
 * Provides methods for interacting with the Recharge Storefront API.
 * Supports both session token authentication and direct customer session creation.
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
        'Invalid token type: Customer session tokens (st_) cannot be used as admin tokens.\n' +
        'Please provide an Admin API token for admin operations (customer lookup, session creation).\n' +
        'Admin API tokens typically start with your store prefix or "sk_".'
      );
    }
    
    // Validate that session token format (customer session tokens start with st_)
    if (sessionToken && !sessionToken.startsWith('st_') && sessionToken.length > 50) {
      throw new Error(
        'Invalid token type: Admin API tokens cannot be used as session tokens.\n' +
        'Please provide one of:\n' +
        '1. sessionToken - Customer session token (st_...)\n' +
        '2. Use customer_id or customer_email for automatic session creation with admin token'
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
    const cleanStoreUrl = this.storeUrl.replace(/\/+$/, '').toLowerCase();
    
    // Construct the base URL for Recharge Storefront API
    this.baseURL = `https://api.rechargeapps.com`;

    if (process.env.DEBUG === 'true') {
      console.error('[DEBUG] RechargeClient initialized with base URL:', this.baseURL);
      console.error('[DEBUG] Session token:', this.sessionToken ? 'Present' : 'Not provided');
      console.error('[DEBUG] Merchant token:', this.merchantToken ? 'Present' : 'Not provided');
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
        console.error('[DEBUG] Using session token authentication:', this.sessionToken.substring(0, 10) + '...');
      }
    }
    
    // Admin token is used for specific admin operations, not as default header
    if (this.adminToken) {
      if (process.env.DEBUG === 'true') {
        console.error('[DEBUG] Admin token available for admin operations:', this.adminToken.substring(0, 10) + '...');
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
      console.error('[DEBUG] Admin token (first 10 chars):', this.adminToken.substring(0, 10) + '...');
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
        console.error('[DEBUG] Session creation response headers:', JSON.stringify(apiResponse.headers, null, 2));
        console.error('[DEBUG] Session creation response data:', JSON.stringify(response, null, 2));
      }
    } catch (error) {
      if (process.env.DEBUG === 'true') {
        console.error(`[DEBUG] Session creation failed for customer ${customerId}:`, error.message);
        if (error.response) {
          console.error('[DEBUG] Error response status:', error.response.status);
          console.error('[DEBUG] Error response headers:', JSON.stringify(error.response.headers, null, 2));
          console.error('[DEBUG] Error response data:', JSON.stringify(error.response.data, null, 2));
          
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
      console.error(`[DEBUG] Session creation response:`, JSON.stringify(response, null, 2));
    }
    
    if (response.customer_session && response.customer_session.apiToken) {
      // Update client to use the new session token
      this.sessionToken = response.customer_session.apiToken;
      this.client.defaults.headers['Authorization'] = `Bearer ${this.sessionToken}`;
      // Remove admin token header since we now have a session token
      delete this.client.defaults.headers['X-Recharge-Access-Token'];
      
      if (process.env.DEBUG === 'true') {
        console.error('[DEBUG] Client updated to use session token:', this.sessionToken.substring(0, 10) + '...');
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
          console.error('[DEBUG] Headers:', JSON.stringify(config.headers, null, 2));
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
          console.error('[DEBUG] Response headers:', JSON.stringify(response.headers, null, 2));
          if (response.data) {
            console.error('[DEBUG] Response body:', JSON.stringify(response.data, null, 2));
          }
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
            console.error('[DEBUG] Request headers:', JSON.stringify(requestHeaders, null, 2));
            console.error('[DEBUG] Response headers:', JSON.stringify(error.response.headers, null, 2));
            console.error('[DEBUG] Request method:', error.config.method?.toUpperCase());
            console.error('[DEBUG] Request data:', error.config.data ? JSON.stringify(error.config.data, null, 2) : 'None');
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
   * Create a customer session using customer ID (merchant token required)
   * @param {string} customerId - Customer ID
   * @param {Object} [options={}] - Session options
   * @param {string} [options.return_url] - URL to redirect to after session
   * @returns {Promise<Object>} Session data including token
   * @throws {Error} If Admin API token is not available
   */
  async createCustomerSessionById(customerId, options = {}) {
    if (!this.adminToken) {
      throw new Error('Admin API token required for session creation');
    }
    
    validateRequiredParams({ customerId }, ['customerId']);
    
    if (process.env.DEBUG === 'true') {
      console.error(`[DEBUG] Creating session for customer: ${customerId}`);
      console.error(`[DEBUG] Using Admin API for session creation`);
      console.error(`[DEBUG] Session creation URL: https://api.rechargeapps.com/customers/${customerId}/sessions`);
      console.error('[DEBUG] Admin token (first 10 chars):', this.adminToken.substring(0, 10) + '...');
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
        console.error('[DEBUG] Session creation response headers:', JSON.stringify(apiResponse.headers, null, 2));
        console.error('[DEBUG] Session creation response data:', JSON.stringify(response, null, 2));
      }
    } catch (error) {
      if (process.env.DEBUG === 'true') {
        console.error(`[DEBUG] Session creation failed for customer ${customerId}:`, error.message);
        if (error.response) {
          console.error('[DEBUG] Error response status:', error.response.status);
          console.error('[DEBUG] Error response headers:', JSON.stringify(error.response.headers, null, 2));
          console.error('[DEBUG] Error response data:', JSON.stringify(error.response.data, null, 2));
          
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
      console.error(`[DEBUG] Session creation response:`, JSON.stringify(response, null, 2));
    }
    
    if (response.customer_session && response.customer_session.apiToken) {
      // Update client to use the new session token
      this.sessionToken = response.customer_session.apiToken;
      this.client.defaults.headers['Authorization'] = `Bearer ${this.sessionToken}`;
      // Remove admin token header since we now have a session token
      delete this.client.defaults.headers['X-Recharge-Access-Token'];
      
      if (process.env.DEBUG === 'true') {
        console.error('[DEBUG] Client updated to use session token:', this.sessionToken.substring(0, 10) + '...');
      }
    }
    
    return response;
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
      console.error('[DEBUG] Admin token (first 10 chars):', this.adminToken.substring(0, 10) + '...');
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
        console.error('[DEBUG] Customer lookup response headers:', JSON.stringify(response.headers, null, 2));
        console.error('[DEBUG] Customer lookup response data:', JSON.stringify(response.data, null, 2));
      }
      
      return response.data;
    } catch (error) {
      if (process.env.DEBUG === 'true') {
        console.error('[DEBUG] Customer lookup failed for email', email + ':', error.message);
        if (error.response) {
          console.error('[DEBUG] Error response status:', error.response.status);
          console.error('[DEBUG] Error response headers:', JSON.stringify(error.response.headers, null, 2));
          console.error('[DEBUG] Error response data:', JSON.stringify(error.response.data, null, 2));
          
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
   * @returns {Promise<Object>} Customer data
   * @throws {Error} If session token is invalid or expired
   */
  async getCustomer() {
    const response = await this.makeRequest('GET', `/customers`);
    return response;
  }

  /**
   * Update customer information
   * @param {Object} data - Customer update data
   * @returns {Promise<Object>} Updated customer data
   * @throws {Error} If update data is empty or invalid
   */
  async updateCustomer(data) {
    if (!data || Object.keys(data).length === 0) {
      throw new Error('Customer update data is required');
    }
    return this.makeRequest('PUT', `/customer`, data);
  }

  /**
   * Get subscriptions with optional filtering
   * @param {Object} params - Query parameters
   * @param {string} [params.status] - Filter by subscription status
   * @param {number} [params.limit] - Number of results to return
   * @param {number} [params.page] - Page number for pagination
   * @returns {Promise<Object>} Subscriptions data
   * @throws {Error} If API request fails
   */
  async getSubscriptions(params = {}) {
    const response = await this.makeRequest('GET', '/subscriptions', null, params);
    return response;
  }

  /**
   * Get detailed information about a specific subscription
   * @param {string} subscriptionId - The subscription ID
   * @returns {Promise<Object>} Subscription data
   * @throws {Error} If subscription ID is invalid or not found
   */
  async getSubscription(subscriptionId) {
    validateRequiredParams({ subscriptionId }, ['subscriptionId']);
    return this.makeRequest('GET', `/subscriptions/${subscriptionId}`);
  }

  /**
   * Create a new subscription
   * @param {Object} subscriptionData - Subscription data
   * @returns {Promise<Object>} Created subscription data
   * @throws {Error} If required fields are missing or invalid
   */
  async createSubscription(subscriptionData) {
    const required = ['address_id', 'next_charge_scheduled_at', 'order_interval_frequency', 'order_interval_unit', 'quantity', 'variant_id'];
    validateRequiredParams(subscriptionData, required);
    
    // Convert string IDs to integers where needed
    const processedData = { ...subscriptionData };
    if (processedData.address_id) {
      processedData.address_id = parseInt(processedData.address_id, 10);
    }
    if (processedData.variant_id) {
      processedData.variant_id = parseInt(processedData.variant_id, 10);
    }
    if (processedData.quantity) {
      processedData.quantity = parseInt(processedData.quantity, 10);
    }
    if (processedData.order_interval_frequency) {
      processedData.order_interval_frequency = parseInt(processedData.order_interval_frequency, 10);
    }
    
    return this.makeRequest('POST', '/subscriptions', processedData);
  }

  /**
   * Update subscription details
   * @param {string} subscriptionId - The subscription ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>} Updated subscription data
   * @throws {Error} If subscription ID is invalid or update data is empty
   */
  async updateSubscription(subscriptionId, data) {
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
    
    return this.makeRequest('PUT', `/subscriptions/${subscriptionId}`, processedData);
  }

  /**
   * Cancel a subscription
   * @param {string} subscriptionId - The subscription ID
   * @param {Object} [data={}] - Cancellation data
   * @returns {Promise<Object>} Cancellation result
   * @throws {Error} If subscription ID is invalid
   */
  async cancelSubscription(subscriptionId, data = {}) {
    validateRequiredParams({ subscriptionId }, ['subscriptionId']);
    return this.makeRequest('POST', `/subscriptions/${subscriptionId}/cancel`, data);
  }

  /**
   * Activate a cancelled subscription
   * @param {string} subscriptionId - The subscription ID
   * @returns {Promise<Object>} Activation result
   * @throws {Error} If subscription ID is invalid or subscription cannot be activated
   */
  async activateSubscription(subscriptionId) {
    validateRequiredParams({ subscriptionId }, ['subscriptionId']);
    return this.makeRequest('POST', `/subscriptions/${subscriptionId}/activate`);
  }

  /**
   * Skip a subscription delivery for a specific date
   * @param {string} subscriptionId - The subscription ID
   * @param {string} date - Date to skip (YYYY-MM-DD)
   * @returns {Promise<Object>} Skip result
   * @throws {Error} If subscription ID or date is invalid
   */
  async skipSubscription(subscriptionId, date) {
    validateRequiredParams({ subscriptionId, date }, ['subscriptionId', 'date']);
    return this.makeRequest('POST', `/subscriptions/${subscriptionId}/skip`, { date });
  }

  /**
   * Unskip a previously skipped subscription delivery
   * @param {string} subscriptionId - The subscription ID
   * @param {string} date - Date to unskip (YYYY-MM-DD)
   * @returns {Promise<Object>} Unskip result
   * @throws {Error} If subscription ID or date is invalid
   */
  async unskipSubscription(subscriptionId, date) {
    validateRequiredParams({ subscriptionId, date }, ['subscriptionId', 'date']);
    return this.makeRequest('POST', `/subscriptions/${subscriptionId}/unskip`, { date });
  }

  /**
   * Swap subscription product variant
   * @param {string} subscriptionId - The subscription ID
   * @param {Object} data - Swap data including variant_id
   * @returns {Promise<Object>} Swap result
   * @throws {Error} If subscription ID is invalid or variant_id is missing
   */
  async swapSubscription(subscriptionId, data) {
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
    
    return this.makeRequest('POST', `/subscriptions/${subscriptionId}/swap`, processedData);
  }

  /**
   * Set next charge date for subscription
   * @param {string} subscriptionId - The subscription ID
   * @param {string} date - Next charge date (YYYY-MM-DD)
   * @returns {Promise<Object>} Update result
   * @throws {Error} If subscription ID or date is invalid
   */
  async setNextChargeDate(subscriptionId, date) {
    validateRequiredParams({ subscriptionId, date }, ['subscriptionId', 'date']);
    return this.makeRequest('POST', `/subscriptions/${subscriptionId}/set_next_charge_date`, { date });
  }

  // Address methods
  /**
   * Get addresses with optional filtering
   * @param {Object} [params={}] - Query parameters
   * @param {number} [params.limit] - Number of results to return
   * @param {number} [params.page] - Page number for pagination
   * @returns {Promise<Object>} Addresses data
   * @throws {Error} If API request fails
   */
  async getAddresses(params = {}) {
    const response = await this.makeRequest('GET', '/addresses', null, params);
    return response;
  }

  /**
   * Get detailed information about a specific address
   * @param {string} addressId - The address ID
   * @returns {Promise<Object>} Address data
   * @throws {Error} If address ID is invalid or not found
   */
  async getAddress(addressId) {
    validateRequiredParams({ addressId }, ['addressId']);
    return this.makeRequest('GET', `/addresses/${addressId}`);
  }

  /**
   * Create a new address
   * @param {Object} addressData - Address data
   * @returns {Promise<Object>} Created address data
   * @throws {Error} If required address fields are missing
   */
  async createAddress(addressData) {
    const required = ['address1', 'city', 'province', 'zip', 'country', 'first_name', 'last_name'];
    validateRequiredParams(addressData, required);
    return this.makeRequest('POST', '/addresses', addressData);
  }

  /**
   * Update an existing address
   * @param {string} addressId - The address ID
   * @param {Object} addressData - Updated address data
   * @returns {Promise<Object>} Updated address data
   * @throws {Error} If address ID is invalid or update data is empty
   */
  async updateAddress(addressId, addressData) {
    validateRequiredParams({ addressId }, ['addressId']);
    if (!addressData || Object.keys(addressData).length === 0) {
      throw new Error('Address update data is required');
    }
    return this.makeRequest('PUT', `/addresses/${addressId}`, addressData);
  }

  /**
   * Delete an address
   * @param {string} addressId - The address ID
   * @returns {Promise<Object>} Deletion result
   * @throws {Error} If address ID is invalid or address cannot be deleted
   */
  async deleteAddress(addressId) {
    validateRequiredParams({ addressId }, ['addressId']);
    return this.makeRequest('DELETE', `/addresses/${addressId}`);
  }

  // Payment method methods
  /**
   * Get payment methods with optional filtering
   * @param {Object} [params={}] - Query parameters
   * @param {number} [params.limit] - Number of results to return
   * @param {number} [params.page] - Page number for pagination
   * @returns {Promise<Object>} Payment methods data
   * @throws {Error} If API request fails
   */
  async getPaymentMethods(params = {}) {
    return this.makeRequest('GET', '/payment_methods', null, params);
  }

  /**
   * Get detailed information about a specific payment method
   * @param {string} paymentMethodId - The payment method ID
   * @returns {Promise<Object>} Payment method data
   * @throws {Error} If payment method ID is invalid or not found
   */
  async getPaymentMethod(paymentMethodId) {
    validateRequiredParams({ paymentMethodId }, ['paymentMethodId']);
    return this.makeRequest('GET', `/payment_methods/${paymentMethodId}`);
  }

  /**
   * Update payment method billing information
   * @param {string} paymentMethodId - The payment method ID
   * @param {Object} paymentData - Updated payment data
   * @returns {Promise<Object>} Updated payment method data
   * @throws {Error} If payment method ID is invalid or update data is empty
   */
  async updatePaymentMethod(paymentMethodId, paymentData) {
    validateRequiredParams({ paymentMethodId }, ['paymentMethodId']);
    if (!paymentData || Object.keys(paymentData).length === 0) {
      throw new Error('Payment method update data is required');
    }
    return this.makeRequest('PUT', `/payment_methods/${paymentMethodId}`, paymentData);
  }

  // Product methods
  /**
   * Get available products with optional filtering
   * @param {Object} [params={}] - Query parameters
   * @param {number} [params.limit] - Number of results to return
   * @param {string} [params.handle] - Filter by product handle
   * @param {boolean} [params.subscription_defaults] - Include subscription defaults
   * @returns {Promise<Object>} Products data
   * @throws {Error} If API request fails
   */
  async getProducts(params = {}) {
    return this.makeRequest('GET', '/products', null, params);
  }

  /**
   * Get detailed product information
   * @param {string} productId - The product ID
   * @returns {Promise<Object>} Product data
   * @throws {Error} If product ID is invalid or not found
   */
  async getProduct(productId) {
    validateRequiredParams({ productId }, ['productId']);
    return this.makeRequest('GET', `/products/${productId}`);
  }

  // Order methods
  /**
   * Get orders with optional filtering
   * @param {Object} [params={}] - Query parameters
   * @param {string} [params.status] - Filter by order status
   * @param {number} [params.limit] - Number of results to return
   * @param {number} [params.page] - Page number for pagination
   * @returns {Promise<Object>} Orders data
   * @throws {Error} If API request fails
   */
  async getOrders(params = {}) {
    return this.makeRequest('GET', '/orders', null, params);
  }

  /**
   * Get detailed order information
   * @param {string} orderId - The order ID
   * @returns {Promise<Object>} Order data
   * @throws {Error} If order ID is invalid or not found
   */
  async getOrder(orderId) {
    validateRequiredParams({ orderId }, ['orderId']);
    return this.makeRequest('GET', `/orders/${orderId}`);
  }

  // Charge methods
  /**
   * Get charges with optional filtering
   * @param {Object} [params={}] - Query parameters
   * @param {string} [params.status] - Filter by charge status
   * @param {number} [params.limit] - Number of results to return
   * @param {number} [params.page] - Page number for pagination
   * @returns {Promise<Object>} Charges data
   * @throws {Error} If API request fails
   */
  async getCharges(params = {}) {
    return this.makeRequest('GET', '/charges', null, params);
  }

  /**
   * Get detailed charge information
   * @param {string} chargeId - The charge ID
   * @returns {Promise<Object>} Charge data
   * @throws {Error} If charge ID is invalid or not found
   */
  async getCharge(chargeId) {
    validateRequiredParams({ chargeId }, ['chargeId']);
    return this.makeRequest('GET', `/charges/${chargeId}`);
  }

  // One-time product methods
  /**
   * Get one-time products with optional filtering
   * @param {Object} [params={}] - Query parameters
   * @param {number} [params.limit] - Number of results to return
   * @param {number} [params.page] - Page number for pagination
   * @returns {Promise<Object>} One-time products data
   * @throws {Error} If API request fails
   */
  async getOnetimes(params = {}) {
    return this.makeRequest('GET', '/onetimes', null, params);
  }

  /**
   * Get detailed information about a specific one-time product
   * @param {string} onetimeId - The one-time product ID
   * @returns {Promise<Object>} One-time product data
   * @throws {Error} If one-time product ID is invalid or not found
   */
  async getOnetime(onetimeId) {
    validateRequiredParams({ onetimeId }, ['onetimeId']);
    return this.makeRequest('GET', `/onetimes/${onetimeId}`);
  }

  /**
   * Create a one-time product
   * @param {Object} onetimeData - One-time product data
   * @returns {Promise<Object>} Created one-time product data
   * @throws {Error} If required fields are missing
   */
  async createOnetime(onetimeData) {
    const required = ['variant_id', 'quantity', 'next_charge_scheduled_at'];
    validateRequiredParams(onetimeData, required);
    
    // Convert numeric fields to proper types
    const processedData = { ...onetimeData };
    processedData.variant_id = parseInt(processedData.variant_id, 10);
    processedData.quantity = parseInt(processedData.quantity, 10);
    if (processedData.price) {
      processedData.price = parseFloat(processedData.price);
    }
    
    return this.makeRequest('POST', '/onetimes', processedData);
  }

  /**
   * Update a one-time product
   * @param {string} onetimeId - The one-time product ID
   * @param {Object} onetimeData - Updated one-time product data
   * @returns {Promise<Object>} Updated one-time product data
   * @throws {Error} If one-time product ID is invalid or update data is empty
   */
  async updateOnetime(onetimeId, onetimeData) {
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
    
    return this.makeRequest('PUT', `/onetimes/${onetimeId}`, processedData);
  }

  /**
   * Delete a one-time product
   * @param {string} onetimeId - The one-time product ID
   * @returns {Promise<Object>} Deletion result
   * @throws {Error} If one-time product ID is invalid or product cannot be deleted
   */
  async deleteOnetime(onetimeId) {
    validateRequiredParams({ onetimeId }, ['onetimeId']);
    return this.makeRequest('DELETE', `/onetimes/${onetimeId}`);
  }

  // Bundle methods
  /**
   * Get bundles with optional filtering
   * @param {Object} [params={}] - Query parameters
   * @param {string} [params.subscription_id] - Filter by subscription ID
   * @param {number} [params.limit] - Number of results to return
   * @param {number} [params.page] - Page number for pagination
   * @returns {Promise<Object>} Bundles data
   * @throws {Error} If API request fails
   */
  async getBundles(params = {}) {
    return this.makeRequest('GET', '/bundles', null, params);
  }

  /**
   * Get detailed information about a specific bundle
   * @param {string} bundleId - The bundle ID
   * @returns {Promise<Object>} Bundle data
   * @throws {Error} If bundle ID is invalid or not found
   */
  async getBundle(bundleId) {
    validateRequiredParams({ bundleId }, ['bundleId']);
    return this.makeRequest('GET', `/bundles/${bundleId}`);
  }

  /**
   * Get bundle selections for a specific bundle
   * @param {string} bundleId - The bundle ID
   * @param {Object} [params={}] - Query parameters
   * @param {number} [params.limit] - Number of results to return
   * @returns {Promise<Object>} Bundle selections data
   * @throws {Error} If bundle ID is invalid
   */
  async getBundleSelections(bundleId, params = {}) {
    validateRequiredParams({ bundleId }, ['bundleId']);
    return this.makeRequest('GET', `/bundles/${bundleId}/bundle_selections`, null, params);
  }

  /**
   * Get detailed information about a specific bundle selection
   * @param {string} bundleSelectionId - The bundle selection ID
   * @returns {Promise<Object>} Bundle selection data
   * @throws {Error} If bundle selection ID is invalid or not found
   */
  async getBundleSelection(bundleSelectionId) {
    validateRequiredParams({ bundleSelectionId }, ['bundleSelectionId']);
    return this.makeRequest('GET', `/bundle_selections/${bundleSelectionId}`);
  }

  /**
   * Create a bundle selection
   * @param {Object} selectionData - Bundle selection data
   * @param {string} selectionData.bundle_id - Bundle ID
   * @param {number} selectionData.variant_id - Selected variant ID
   * @param {number} selectionData.quantity - Quantity selected
   * @returns {Promise<Object>} Created bundle selection data
   * @throws {Error} If required fields are missing
   */
  async createBundleSelection(selectionData) {
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
    
    return this.makeRequest('POST', '/bundle_selections', processedData);
  }

  /**
   * Update a bundle selection
   * @param {string} bundleSelectionId - The bundle selection ID
   * @param {Object} selectionData - Updated bundle selection data
   * @returns {Promise<Object>} Updated bundle selection data
   * @throws {Error} If bundle selection ID is invalid or update data is empty
   */
  async updateBundleSelection(bundleSelectionId, selectionData) {
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
    
    return this.makeRequest('PUT', `/bundle_selections/${bundleSelectionId}`, processedData);
  }

  /**
   * Delete a bundle selection
   * @param {string} bundleSelectionId - The bundle selection ID
   * @returns {Promise<Object>} Deletion result
   * @throws {Error} If bundle selection ID is invalid or selection cannot be deleted
   */
  async deleteBundleSelection(bundleSelectionId) {
    validateRequiredParams({ bundleSelectionId }, ['bundleSelectionId']);
    return this.makeRequest('DELETE', `/bundle_selections/${bundleSelectionId}`);
  }

  // Discount methods
  /**
   * Get discounts with optional filtering
   * @param {Object} [params={}] - Query parameters
   * @param {number} [params.limit] - Number of results to return
   * @param {number} [params.page] - Page number for pagination
   * @returns {Promise<Object>} Discounts data
   * @throws {Error} If API request fails
   */
  async getDiscounts(params = {}) {
    return this.makeRequest('GET', '/discounts', null, params);
  }

  /**
   * Get detailed information about a specific discount
   * @param {string} discountId - The discount ID
   * @returns {Promise<Object>} Discount data
   * @throws {Error} If discount ID is invalid or not found
   */
  async getDiscount(discountId) {
    validateRequiredParams({ discountId }, ['discountId']);
    return this.makeRequest('GET', `/discounts/${discountId}`);
  }

  /**
   * Apply a discount code
   * @param {string} discountCode - The discount code to apply
   * @returns {Promise<Object>} Applied discount data
   * @throws {Error} If discount code is invalid or cannot be applied
   */
  async applyDiscount(discountCode) {
    validateRequiredParams({ discountCode }, ['discountCode']);
    return this.makeRequest('POST', '/discounts', { discount_code: discountCode });
  }

  /**
   * Remove a discount
   * @param {string} discountId - The discount ID to remove
   * @returns {Promise<Object>} Removal result
   * @throws {Error} If discount ID is invalid or discount cannot be removed
   */
  async removeDiscount(discountId) {
    validateRequiredParams({ discountId }, ['discountId']);
    return this.makeRequest('DELETE', `/discounts/${discountId}`);
  }

}