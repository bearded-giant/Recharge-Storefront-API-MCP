import axios from 'axios';
import { handleAPIError, validateRequiredParams } from './utils/error-handler.js';

/**
 * Recharge Storefront API Client
 * 
 * Provides methods for interacting with the Recharge Storefront API.
 * All methods handle authentication, error handling, and response formatting.
 * 
 * @class RechargeClient
 */
export class RechargeClient {
  /**
   * Create a new RechargeClient instance
   * 
   * @param {Object} config - Configuration object
   * @param {string} config.storeUrl - Store URL (e.g., 'your-shop.myshopify.com' or full URL)
   * @param {string} config.accessToken - Recharge Storefront API access token
   */
  constructor({ storeUrl, accessToken }) {
    validateRequiredParams({ storeUrl, accessToken }, ['storeUrl', 'accessToken']);

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
    
    this.domain = domain;
    this.storeUrl = storeUrl;
    this.accessToken = accessToken;
    // Use the correct Recharge Storefront API base URL
    this.baseURL = `https://${domain}/tools/recurring/portal`;
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'X-Recharge-Access-Token': accessToken,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': `Recharge-Storefront-API-MCP/${process.env.MCP_SERVER_VERSION || '1.0.0'}`,
      },
      timeout: 30000, // 30 seconds
      maxRedirects: 5,
      validateStatus: (status) => status < 500, // Don't throw for 4xx errors, let our handler deal with them
    });

    this.setupInterceptors();
  }

  /**
   * Setup axios interceptors for logging and error handling
   */
  setupInterceptors() {
    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        if (process.env.DEBUG === 'true') {
          const sanitizedHeaders = { ...config.headers };
          if (sanitizedHeaders['X-Recharge-Access-Token']) {
            sanitizedHeaders['X-Recharge-Access-Token'] = '***';
          }
          
          console.error(`[DEBUG] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
          console.error(`[DEBUG] Headers:`, sanitizedHeaders);
          if (config.data) {
            console.error(`[DEBUG] Request body:`, JSON.stringify(config.data, null, 2));
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
          console.error(`[DEBUG] Response ${response.status} from ${response.config.method?.toUpperCase()} ${response.config.url}`);
          if (response.data) {
            console.error(`[DEBUG] Response body:`, JSON.stringify(response.data, null, 2));
          }
        }
        return response;
      },
      (error) => {
        handleAPIError(error);
      }
    );
  }

  /**
   * Make a safe API request with error handling
   * @param {string} method - HTTP method
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request data
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} API response data
   */
  async makeRequest(method, endpoint, data = null, params = null) {
    try {
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
    } catch (error) {
      // Error is already handled by interceptor
      throw error;
    }
  }

  // Customer methods
  /**
   * Get current customer information
   * @returns {Promise<Object>} Customer data
   */
  async getCustomer() {
    return this.makeRequest('GET', '/customer');
  }

  /**
   * Update customer information
   * @param {Object} data - Customer update data
   * @returns {Promise<Object>} Updated customer data
   */
  async updateCustomer(data) {
    if (!data || Object.keys(data).length === 0) {
      throw new Error('Customer update data is required');
    }
    return this.makeRequest('PUT', '/customer', data);
  }

  // Subscription methods
  /**
   * Get customer subscriptions with optional filtering
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Subscriptions data
   */
  async getSubscriptions(params = {}) {
    return this.makeRequest('GET', '/subscriptions', null, params);
  }

  /**
   * Get detailed information about a specific subscription
   * @param {string} subscriptionId - The subscription ID
   * @returns {Promise<Object>} Subscription data
   */
  async getSubscription(subscriptionId) {
    validateRequiredParams({ subscriptionId }, ['subscriptionId']);
    return this.makeRequest('GET', `/subscriptions/${subscriptionId}`);
  }

  /**
   * Update subscription details
   * @param {string} subscriptionId - The subscription ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>} Updated subscription data
   */
  async updateSubscription(subscriptionId, data) {
    validateRequiredParams({ subscriptionId }, ['subscriptionId']);
    if (!data || Object.keys(data).length === 0) {
      throw new Error('Subscription update data is required');
    }
    return this.makeRequest('PUT', `/subscriptions/${subscriptionId}`, data);
  }

  /**
   * Skip a subscription delivery for a specific date
   * @param {string} subscriptionId - The subscription ID
   * @param {string} date - Date to skip (YYYY-MM-DD)
   * @returns {Promise<Object>} Skip result
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
   */
  async swapSubscription(subscriptionId, data) {
    validateRequiredParams({ subscriptionId }, ['subscriptionId']);
    if (!data?.variant_id) {
      throw new Error('variant_id is required for subscription swap');
    }
    return this.makeRequest('POST', `/subscriptions/${subscriptionId}/swap`, data);
  }

  /**
   * Cancel a subscription
   * @param {string} subscriptionId - The subscription ID
   * @param {Object} data - Cancellation data
   * @returns {Promise<Object>} Cancellation result
   */
  async cancelSubscription(subscriptionId, data = {}) {
    validateRequiredParams({ subscriptionId }, ['subscriptionId']);
    return this.makeRequest('POST', `/subscriptions/${subscriptionId}/cancel`, data);
  }

  /**
   * Activate a cancelled subscription
   * @param {string} subscriptionId - The subscription ID
   * @returns {Promise<Object>} Activation result
   */
  async activateSubscription(subscriptionId) {
    validateRequiredParams({ subscriptionId }, ['subscriptionId']);
    return this.makeRequest('POST', `/subscriptions/${subscriptionId}/activate`);
  }

  /**
   * Pause a subscription temporarily
   * @param {string} subscriptionId - The subscription ID
   * @param {Object} data - Pause data
   * @returns {Promise<Object>} Pause result
   */
  async pauseSubscription(subscriptionId, data = {}) {
    validateRequiredParams({ subscriptionId }, ['subscriptionId']);
    return this.makeRequest('POST', `/subscriptions/${subscriptionId}/pause`, data);
  }

  /**
   * Resume a paused subscription
   * @param {string} subscriptionId - The subscription ID
   * @returns {Promise<Object>} Resume result
   */
  async resumeSubscription(subscriptionId) {
    validateRequiredParams({ subscriptionId }, ['subscriptionId']);
    return this.makeRequest('POST', `/subscriptions/${subscriptionId}/resume`);
  }

  /**
   * Set next charge date for subscription
   * @param {string} subscriptionId - The subscription ID
   * @param {string} date - Next charge date (YYYY-MM-DD)
   * @returns {Promise<Object>} Update result
   */
  async setNextChargeDate(subscriptionId, date) {
    validateRequiredParams({ subscriptionId, date }, ['subscriptionId', 'date']);
    return this.makeRequest('POST', `/subscriptions/${subscriptionId}/set_next_charge_date`, { date });
  }

  // Address methods
  /**
   * Get all customer addresses
   * @returns {Promise<Object>} Addresses data
   */
  async getAddresses() {
    return this.makeRequest('GET', '/addresses');
  }

  /**
   * Get detailed information about a specific address
   * @param {string} addressId - The address ID
   * @returns {Promise<Object>} Address data
   */
  async getAddress(addressId) {
    validateRequiredParams({ addressId }, ['addressId']);
    return this.makeRequest('GET', `/addresses/${addressId}`);
  }

  /**
   * Create a new address
   * @param {Object} addressData - Address data
   * @returns {Promise<Object>} Created address data
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
   */
  async deleteAddress(addressId) {
    validateRequiredParams({ addressId }, ['addressId']);
    return this.makeRequest('DELETE', `/addresses/${addressId}`);
  }

  // Payment method methods
  /**
   * Get customer payment methods
   * @returns {Promise<Object>} Payment methods data
   */
  async getPaymentMethods() {
    return this.makeRequest('GET', '/payment_methods');
  }

  /**
   * Get detailed information about a specific payment method
   * @param {string} paymentMethodId - The payment method ID
   * @returns {Promise<Object>} Payment method data
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
   */
  async updatePaymentMethod(paymentMethodId, paymentData) {
    validateRequiredParams({ paymentMethodId }, ['paymentMethodId']);
    if (!paymentData || Object.keys(paymentData).length === 0) {
      throw new Error('Payment method update data is required');
    }
    return this.makeRequest('PUT', `/payment_methods/${paymentMethodId}`, paymentData);
  }

  // Discount methods
  /**
   * Get customer discounts
   * @returns {Promise<Object>} Discounts data
   */
  async getDiscounts() {
    return this.makeRequest('GET', '/discounts');
  }

  /**
   * Get detailed information about a specific discount
   * @param {string} discountId - The discount ID
   * @returns {Promise<Object>} Discount data
   */
  async getDiscount(discountId) {
    validateRequiredParams({ discountId }, ['discountId']);
    return this.makeRequest('GET', `/discounts/${discountId}`);
  }

  /**
   * Apply a discount code
   * @param {string} discountCode - The discount code to apply
   * @returns {Promise<Object>} Applied discount data
   */
  async applyDiscount(discountCode) {
    validateRequiredParams({ discountCode }, ['discountCode']);
    return this.makeRequest('POST', '/discounts', { discount_code: discountCode });
  }

  /**
   * Remove a discount
   * @param {string} discountId - The discount ID to remove
   * @returns {Promise<Object>} Removal result
   */
  async removeDiscount(discountId) {
    validateRequiredParams({ discountId }, ['discountId']);
    return this.makeRequest('DELETE', `/discounts/${discountId}`);
  }

  // Product methods
  /**
   * Get available products with optional filtering
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Products data
   */
  async getProducts(params = {}) {
    return this.makeRequest('GET', '/products', null, params);
  }

  /**
   * Get detailed product information
   * @param {string} productId - The product ID
   * @returns {Promise<Object>} Product data
   */
  async getProduct(productId) {
    validateRequiredParams({ productId }, ['productId']);
    return this.makeRequest('GET', `/products/${productId}`);
  }

  // One-time product methods
  /**
   * Get customer one-time products
   * @returns {Promise<Object>} One-time products data
   */
  async getOnetimes() {
    return this.makeRequest('GET', '/onetimes');
  }

  /**
   * Get detailed information about a specific one-time product
   * @param {string} onetimeId - The one-time product ID
   * @returns {Promise<Object>} One-time product data
   */
  async getOnetime(onetimeId) {
    validateRequiredParams({ onetimeId }, ['onetimeId']);
    return this.makeRequest('GET', `/onetimes/${onetimeId}`);
  }

  /**
   * Create a one-time product
   * @param {Object} onetimeData - One-time product data
   * @returns {Promise<Object>} Created one-time product data
   */
  async createOnetime(onetimeData) {
    const required = ['variant_id', 'quantity', 'next_charge_scheduled_at'];
    validateRequiredParams(onetimeData, required);
    return this.makeRequest('POST', '/onetimes', onetimeData);
  }

  /**
   * Update a one-time product
   * @param {string} onetimeId - The one-time product ID
   * @param {Object} onetimeData - Updated one-time product data
   * @returns {Promise<Object>} Updated one-time product data
   */
  async updateOnetime(onetimeId, onetimeData) {
    validateRequiredParams({ onetimeId }, ['onetimeId']);
    if (!onetimeData || Object.keys(onetimeData).length === 0) {
      throw new Error('One-time product update data is required');
    }
    return this.makeRequest('PUT', `/onetimes/${onetimeId}`, onetimeData);
  }

  /**
   * Delete a one-time product
   * @param {string} onetimeId - The one-time product ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteOnetime(onetimeId) {
    validateRequiredParams({ onetimeId }, ['onetimeId']);
    return this.makeRequest('DELETE', `/onetimes/${onetimeId}`);
  }

  // Bundle selection methods
  /**
   * Get customer bundle selections
   * @returns {Promise<Object>} Bundle selections data
   */
  async getBundleSelections() {
    return this.makeRequest('GET', '/bundle_selections');
  }

  /**
   * Get detailed information about a specific bundle selection
   * @param {string} bundleSelectionId - The bundle selection ID
   * @returns {Promise<Object>} Bundle selection data
   */
  async getBundleSelection(bundleSelectionId) {
    validateRequiredParams({ bundleSelectionId }, ['bundleSelectionId']);
    return this.makeRequest('GET', `/bundle_selections/${bundleSelectionId}`);
  }

  /**
   * Create a bundle selection
   * @param {Object} bundleSelectionData - Bundle selection data
   * @returns {Promise<Object>} Created bundle selection data
   */
  async createBundleSelection(bundleSelectionData) {
    const required = ['bundle_id', 'variant_selections'];
    validateRequiredParams(bundleSelectionData, required);
    return this.makeRequest('POST', '/bundle_selections', bundleSelectionData);
  }

  /**
   * Update a bundle selection
   * @param {string} bundleSelectionId - The bundle selection ID
   * @param {Object} bundleSelectionData - Updated bundle selection data
   * @returns {Promise<Object>} Updated bundle selection data
   */
  async updateBundleSelection(bundleSelectionId, bundleSelectionData) {
    validateRequiredParams({ bundleSelectionId }, ['bundleSelectionId']);
    if (!bundleSelectionData || Object.keys(bundleSelectionData).length === 0) {
      throw new Error('Bundle selection update data is required');
    }
    return this.makeRequest('PUT', `/bundle_selections/${bundleSelectionId}`, bundleSelectionData);
  }

  /**
   * Delete a bundle selection
   * @param {string} bundleSelectionId - The bundle selection ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteBundleSelection(bundleSelectionId) {
    validateRequiredParams({ bundleSelectionId }, ['bundleSelectionId']);
    return this.makeRequest('DELETE', `/bundle_selections/${bundleSelectionId}`);
  }

  // Delivery schedule methods
  /**
   * Get delivery schedule information
   * @returns {Promise<Object>} Delivery schedule data
   */
  async getDeliverySchedule() {
    return this.makeRequest('GET', '/delivery_schedule');
  }

  // Store methods
  /**
   * Get store information and configuration
   * @returns {Promise<Object>} Store data
   */
  async getStore() {
    return this.makeRequest('GET', '/store');
  }

  // Settings methods
  /**
   * Get customer settings and preferences
   * @returns {Promise<Object>} Settings data
   */
  async getSettings() {
    return this.makeRequest('GET', '/settings');
  }

  /**
   * Update customer settings and preferences
   * @param {Object} settingsData - Updated settings data
   * @returns {Promise<Object>} Updated settings data
   */
  async updateSettings(settingsData) {
    if (!settingsData || Object.keys(settingsData).length === 0) {
      throw new Error('Settings update data is required');
    }
    return this.makeRequest('PUT', '/settings', settingsData);
  }

  // Session methods
  /**
   * Create a customer session
   * @param {string} email - Customer email address
   * @returns {Promise<Object>} Session data
   */
  async createSession(email) {
    validateRequiredParams({ email }, ['email']);
    return this.makeRequest('POST', '/sessions', { email });
  }

  /**
   * Validate the current session
   * @returns {Promise<Object>} Session validation data
   */
  async validateSession() {
    return this.makeRequest('GET', '/sessions/validate');
  }

  /**
   * Destroy the current session (logout)
   * @returns {Promise<Object>} Session destruction result
   */
  async destroySession() {
    return this.makeRequest('DELETE', '/sessions');
  }

  // Async batch methods
  /**
   * Get async batch operation status and results
   * @param {string} batchId - The batch ID
   * @returns {Promise<Object>} Batch data
   */
  async getAsyncBatch(batchId) {
    validateRequiredParams({ batchId }, ['batchId']);
    return this.makeRequest('GET', `/async_batches/${batchId}`);
  }

  /**
   * Create an async batch operation
   * @param {Object} batchData - Batch operation data
   * @returns {Promise<Object>} Created batch data
   */
  async createAsyncBatch(batchData) {
    validateRequiredParams(batchData, ['operations']);
    return this.makeRequest('POST', '/async_batches', batchData);
  }

  // Shopify connector methods
  /**
   * Get Shopify connector configuration
   * @returns {Promise<Object>} Connector data
   */
  async getShopifyConnector() {
    return this.makeRequest('GET', '/shopify_connector');
  }

  /**
   * Update Shopify connector configuration
   * @param {Object} connectorData - Updated connector data
   * @returns {Promise<Object>} Updated connector data
   */
  async updateShopifyConnector(connectorData) {
    if (!connectorData || Object.keys(connectorData).length === 0) {
      throw new Error('Shopify connector update data is required');
    }
    return this.makeRequest('PUT', '/shopify_connector', connectorData);
  }

  // Notification methods
  /**
   * Get customer notifications
   * @returns {Promise<Object>} Notifications data
   */
  async getNotifications() {
    return this.makeRequest('GET', '/notifications');
  }

  /**
   * Get detailed information about a specific notification
   * @param {string} notificationId - The notification ID
   * @returns {Promise<Object>} Notification data
   */
  async getNotification(notificationId) {
    validateRequiredParams({ notificationId }, ['notificationId']);
    return this.makeRequest('GET', `/notifications/${notificationId}`);
  }

  /**
   * Mark a notification as read
   * @param {string} notificationId - The notification ID
   * @returns {Promise<Object>} Mark as read result
   */
  async markNotificationAsRead(notificationId) {
    validateRequiredParams({ notificationId }, ['notificationId']);
    return this.makeRequest('PUT', `/notifications/${notificationId}/mark_as_read`);
  }

  // Order methods
  /**
   * Get customer orders with optional filtering
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Orders data
   */
  async getOrders(params = {}) {
    return this.makeRequest('GET', '/orders', null, params);
  }

  /**
   * Get detailed order information
   * @param {string} orderId - The order ID
   * @returns {Promise<Object>} Order data
   */
  async getOrder(orderId) {
    validateRequiredParams({ orderId }, ['orderId']);
    return this.makeRequest('GET', `/orders/${orderId}`);
  }

  // Charge methods
  /**
   * Get customer charges with optional filtering
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Charges data
   */
  async getCharges(params = {}) {
    return this.makeRequest('GET', '/charges', null, params);
  }

  /**
   * Get detailed charge information
   * @param {string} chargeId - The charge ID
   * @returns {Promise<Object>} Charge data
   */
  async getCharge(chargeId) {
    validateRequiredParams({ chargeId }, ['chargeId']);
    return this.makeRequest('GET', `/charges/${chargeId}`);
  }
}