import axios from 'axios';
import { handleAPIError, validateRequiredParams } from './utils/error-handler.js';

/**
 * Recharge Storefront API Client
 * 
 * Provides methods for interacting with the Recharge Storefront API.
 * Uses merchant API tokens for authentication and customer identification.
 * 
 * @class RechargeClient
 */
export class RechargeClient {
  /**
   * Create a new RechargeClient instance
   * 
   * @param {Object} config - Configuration object
   * @param {string} config.storeUrl - Store URL (e.g., 'your-shop.myshopify.com' or full URL)
   * @param {string} config.apiToken - Merchant API token for authentication
   */
  constructor({ storeUrl, apiToken }) {
    validateRequiredParams({ storeUrl }, ['storeUrl']);

    this.apiToken = apiToken;
    this.domain = storeUrl;
    this.storeUrl = storeUrl;
    
    // Construct the correct Recharge Storefront API base URL
    this.baseURL = `https://storefront-checkout.rechargepayments.com`;
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Recharge-Access-Token': this.apiToken,
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
          console.error(`[DEBUG] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
          console.error(`[DEBUG] Headers:`, config.headers);
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
   * Make a safe API request
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
        headers: {
          'X-Recharge-Domain': this.storeUrl
        }
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

  // Authentication methods
  /**
   * Authenticate a customer and get session token
   * @param {string} email - Customer email address
   * @param {string} password - Customer password
   * @returns {Promise<Object>} Authentication response with session token
   */
  async authenticateCustomer(email, password) {
    validateRequiredParams({ email, password }, ['email', 'password']);
    return this.makeRequest('POST', '/auth', { 
      email, 
      password 
    });
  }

  /**
   * Get customer by email (for authentication purposes)
   * @param {string} email - Customer email address
   * @returns {Promise<Object>} Customer data
   */
  async getCustomerByEmail(email) {
    validateRequiredParams({ email }, ['email']);
    return this.makeRequest('GET', '/customers', null, { email });
  }

  /**
   * Create customer session token
   * @param {string} customerId - Customer ID
   * @returns {Promise<Object>} Session token response
   */
  async createCustomerToken(customerId) {
    validateRequiredParams({ customerId }, ['customerId']);
    return this.makeRequest('POST', `/customers/${customerId}/session_token`);
  }

  // Customer methods
  /**
   * Get customer information
   * @param {string} customerId - Customer ID
   * @returns {Promise<Object>} Customer data
   */
  async getCustomer(customerId) {
    validateRequiredParams({ customerId }, ['customerId']);
    return this.makeRequest('GET', `/customers/${customerId}`);
  }

  /**
   * Update customer information
   * @param {string} customerId - Customer ID
   * @param {Object} data - Customer update data
   * @returns {Promise<Object>} Updated customer data
   */
  async updateCustomer(customerId, data) {
    validateRequiredParams({ customerId }, ['customerId']);
    if (!data || Object.keys(data).length === 0) {
      throw new Error('Customer update data is required');
    }
    return this.makeRequest('PUT', `/customers/${customerId}`, data);
  }

  // Subscription methods
  /**
   * Get customer subscriptions with optional filtering
   * @param {string} customerId - Customer ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Subscriptions data
   */
  async getSubscriptions(customerId, params = {}) {
    validateRequiredParams({ customerId }, ['customerId']);
    const queryParams = { ...params, customer_id: customerId };
    return this.makeRequest('GET', '/subscriptions', null, queryParams);
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
   * @param {string} sessionToken - Session token
   * @param {string} subscriptionId - The subscription ID
   * @param {string} date - Date to skip (YYYY-MM-DD)
   * @returns {Promise<Object>} Skip result
   */
  async skipSubscription(sessionToken, subscriptionId, date) {
    validateRequiredParams({ sessionToken, subscriptionId, date }, ['sessionToken', 'subscriptionId', 'date']);
    return this.makeRequest('POST', `/subscriptions/${subscriptionId}/skip`, { date }, null, sessionToken);
  }

  /**
   * Unskip a previously skipped subscription delivery
   * @param {string} sessionToken - Session token
   * @param {string} subscriptionId - The subscription ID
   * @param {string} date - Date to unskip (YYYY-MM-DD)
   * @returns {Promise<Object>} Unskip result
   */
  async unskipSubscription(sessionToken, subscriptionId, date) {
    validateRequiredParams({ sessionToken, subscriptionId, date }, ['sessionToken', 'subscriptionId', 'date']);
    return this.makeRequest('POST', `/subscriptions/${subscriptionId}/unskip`, { date }, null, sessionToken);
  }

  /**
   * Swap subscription product variant
   * @param {string} sessionToken - Session token
   * @param {string} subscriptionId - The subscription ID
   * @param {Object} data - Swap data including variant_id
   * @returns {Promise<Object>} Swap result
   */
  async swapSubscription(sessionToken, subscriptionId, data) {
    validateRequiredParams({ sessionToken, subscriptionId }, ['sessionToken', 'subscriptionId']);
    if (!data?.variant_id) {
      throw new Error('variant_id is required for subscription swap');
    }
    return this.makeRequest('POST', `/subscriptions/${subscriptionId}/swap`, data, null, sessionToken);
  }

  /**
   * Cancel a subscription
   * @param {string} sessionToken - Session token
   * @param {string} subscriptionId - The subscription ID
   * @param {Object} data - Cancellation data
   * @returns {Promise<Object>} Cancellation result
   */
  async cancelSubscription(sessionToken, subscriptionId, data = {}) {
    validateRequiredParams({ sessionToken, subscriptionId }, ['sessionToken', 'subscriptionId']);
    return this.makeRequest('POST', `/subscriptions/${subscriptionId}/cancel`, data, null, sessionToken);
  }

  /**
   * Activate a cancelled subscription
   * @param {string} sessionToken - Session token
   * @param {string} subscriptionId - The subscription ID
   * @returns {Promise<Object>} Activation result
   */
  async activateSubscription(sessionToken, subscriptionId) {
    validateRequiredParams({ sessionToken, subscriptionId }, ['sessionToken', 'subscriptionId']);
    return this.makeRequest('POST', `/subscriptions/${subscriptionId}/activate`, null, null, sessionToken);
  }

  /**
   * Pause a subscription temporarily
   * @param {string} sessionToken - Session token
   * @param {string} subscriptionId - The subscription ID
   * @param {Object} data - Pause data
   * @returns {Promise<Object>} Pause result
   */
  async pauseSubscription(sessionToken, subscriptionId, data = {}) {
    validateRequiredParams({ sessionToken, subscriptionId }, ['sessionToken', 'subscriptionId']);
    return this.makeRequest('POST', `/subscriptions/${subscriptionId}/pause`, data, null, sessionToken);
  }

  /**
   * Resume a paused subscription
   * @param {string} sessionToken - Session token
   * @param {string} subscriptionId - The subscription ID
   * @returns {Promise<Object>} Resume result
   */
  async resumeSubscription(sessionToken, subscriptionId) {
    validateRequiredParams({ sessionToken, subscriptionId }, ['sessionToken', 'subscriptionId']);
    return this.makeRequest('POST', `/subscriptions/${subscriptionId}/resume`, null, null, sessionToken);
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
   * @param {string} sessionToken - Session token
   * @returns {Promise<Object>} Addresses data
   */
  async getAddresses(sessionToken) {
    validateRequiredParams({ sessionToken }, ['sessionToken']);
    return this.makeRequest('GET', '/addresses', null, null, sessionToken);
  }

  /**
   * Get detailed information about a specific address
   * @param {string} sessionToken - Session token
   * @param {string} addressId - The address ID
   * @returns {Promise<Object>} Address data
   */
  async getAddress(sessionToken, addressId) {
    validateRequiredParams({ sessionToken, addressId }, ['sessionToken', 'addressId']);
    return this.makeRequest('GET', `/addresses/${addressId}`, null, null, sessionToken);
  }

  /**
   * Create a new address
   * @param {string} sessionToken - Session token
   * @param {Object} addressData - Address data
   * @returns {Promise<Object>} Created address data
   */
  async createAddress(sessionToken, addressData) {
    validateRequiredParams({ sessionToken }, ['sessionToken']);
    const required = ['address1', 'city', 'province', 'zip', 'country', 'first_name', 'last_name'];
    validateRequiredParams(addressData, required);
    return this.makeRequest('POST', '/addresses', addressData, null, sessionToken);
  }

  /**
   * Update an existing address
   * @param {string} sessionToken - Session token
   * @param {string} addressId - The address ID
   * @param {Object} addressData - Updated address data
   * @returns {Promise<Object>} Updated address data
   */
  async updateAddress(sessionToken, addressId, addressData) {
    validateRequiredParams({ sessionToken, addressId }, ['sessionToken', 'addressId']);
    if (!addressData || Object.keys(addressData).length === 0) {
      throw new Error('Address update data is required');
    }
    return this.makeRequest('PUT', `/addresses/${addressId}`, addressData, null, sessionToken);
  }

  /**
   * Delete an address
   * @param {string} sessionToken - Session token
   * @param {string} addressId - The address ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteAddress(sessionToken, addressId) {
    validateRequiredParams({ sessionToken, addressId }, ['sessionToken', 'addressId']);
    return this.makeRequest('DELETE', `/addresses/${addressId}`, null, null, sessionToken);
  }

  // Payment method methods
  /**
   * Get customer payment methods
   * @param {string} sessionToken - Session token
   * @returns {Promise<Object>} Payment methods data
   */
  async getPaymentMethods(sessionToken) {
    validateRequiredParams({ sessionToken }, ['sessionToken']);
    return this.makeRequest('GET', '/payment_methods', null, null, sessionToken);
  }

  /**
   * Get detailed information about a specific payment method
   * @param {string} sessionToken - Session token
   * @param {string} paymentMethodId - The payment method ID
   * @returns {Promise<Object>} Payment method data
   */
  async getPaymentMethod(sessionToken, paymentMethodId) {
    validateRequiredParams({ sessionToken, paymentMethodId }, ['sessionToken', 'paymentMethodId']);
    return this.makeRequest('GET', `/payment_methods/${paymentMethodId}`, null, null, sessionToken);
  }

  /**
   * Update payment method billing information
   * @param {string} sessionToken - Session token
   * @param {string} paymentMethodId - The payment method ID
   * @param {Object} paymentData - Updated payment data
   * @returns {Promise<Object>} Updated payment method data
   */
  async updatePaymentMethod(sessionToken, paymentMethodId, paymentData) {
    validateRequiredParams({ sessionToken, paymentMethodId }, ['sessionToken', 'paymentMethodId']);
    if (!paymentData || Object.keys(paymentData).length === 0) {
      throw new Error('Payment method update data is required');
    }
    return this.makeRequest('PUT', `/payment_methods/${paymentMethodId}`, paymentData, null, sessionToken);
  }

  // Discount methods
  /**
   * Get customer discounts
   * @param {string} sessionToken - Session token
   * @returns {Promise<Object>} Discounts data
   */
  async getDiscounts(sessionToken) {
    validateRequiredParams({ sessionToken }, ['sessionToken']);
    return this.makeRequest('GET', '/discounts', null, null, sessionToken);
  }

  /**
   * Get detailed information about a specific discount
   * @param {string} sessionToken - Session token
   * @param {string} discountId - The discount ID
   * @returns {Promise<Object>} Discount data
   */
  async getDiscount(sessionToken, discountId) {
    validateRequiredParams({ sessionToken, discountId }, ['sessionToken', 'discountId']);
    return this.makeRequest('GET', `/discounts/${discountId}`, null, null, sessionToken);
  }

  /**
   * Apply a discount code
   * @param {string} sessionToken - Session token
   * @param {string} discountCode - The discount code to apply
   * @returns {Promise<Object>} Applied discount data
   */
  async applyDiscount(sessionToken, discountCode) {
    validateRequiredParams({ sessionToken, discountCode }, ['sessionToken', 'discountCode']);
    return this.makeRequest('POST', '/discounts', { discount_code: discountCode }, null, sessionToken);
  }

  /**
   * Remove a discount
   * @param {string} sessionToken - Session token
   * @param {string} discountId - The discount ID to remove
   * @returns {Promise<Object>} Removal result
   */
  async removeDiscount(sessionToken, discountId) {
    validateRequiredParams({ sessionToken, discountId }, ['sessionToken', 'discountId']);
    return this.makeRequest('DELETE', `/discounts/${discountId}`, null, null, sessionToken);
  }

  // Product methods
  /**
   * Get available products with optional filtering
   * @param {string} sessionToken - Session token
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Products data
   */
  async getProducts(sessionToken, params = {}) {
    validateRequiredParams({ sessionToken }, ['sessionToken']);
    return this.makeRequest('GET', '/products', null, params, sessionToken);
  }

  /**
   * Get detailed product information
   * @param {string} sessionToken - Session token
   * @param {string} productId - The product ID
   * @returns {Promise<Object>} Product data
   */
  async getProduct(sessionToken, productId) {
    validateRequiredParams({ sessionToken, productId }, ['sessionToken', 'productId']);
    return this.makeRequest('GET', `/products/${productId}`, null, null, sessionToken);
  }

  // One-time product methods
  /**
   * Get customer one-time products
   * @param {string} sessionToken - Session token
   * @returns {Promise<Object>} One-time products data
   */
  async getOnetimes(sessionToken) {
    validateRequiredParams({ sessionToken }, ['sessionToken']);
    return this.makeRequest('GET', '/onetimes', null, null, sessionToken);
  }

  /**
   * Get detailed information about a specific one-time product
   * @param {string} sessionToken - Session token
   * @param {string} onetimeId - The one-time product ID
   * @returns {Promise<Object>} One-time product data
   */
  async getOnetime(sessionToken, onetimeId) {
    validateRequiredParams({ sessionToken, onetimeId }, ['sessionToken', 'onetimeId']);
    return this.makeRequest('GET', `/onetimes/${onetimeId}`, null, null, sessionToken);
  }

  /**
   * Create a one-time product
   * @param {string} sessionToken - Session token
   * @param {Object} onetimeData - One-time product data
   * @returns {Promise<Object>} Created one-time product data
   */
  async createOnetime(sessionToken, onetimeData) {
    validateRequiredParams({ sessionToken }, ['sessionToken']);
    const required = ['variant_id', 'quantity', 'next_charge_scheduled_at'];
    validateRequiredParams(onetimeData, required);
    return this.makeRequest('POST', '/onetimes', onetimeData, null, sessionToken);
  }

  /**
   * Update a one-time product
   * @param {string} sessionToken - Session token
   * @param {string} onetimeId - The one-time product ID
   * @param {Object} onetimeData - Updated one-time product data
   * @returns {Promise<Object>} Updated one-time product data
   */
  async updateOnetime(sessionToken, onetimeId, onetimeData) {
    validateRequiredParams({ sessionToken, onetimeId }, ['sessionToken', 'onetimeId']);
    if (!onetimeData || Object.keys(onetimeData).length === 0) {
      throw new Error('One-time product update data is required');
    }
    return this.makeRequest('PUT', `/onetimes/${onetimeId}`, onetimeData, null, sessionToken);
  }

  /**
   * Delete a one-time product
   * @param {string} sessionToken - Session token
   * @param {string} onetimeId - The one-time product ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteOnetime(sessionToken, onetimeId) {
    validateRequiredParams({ sessionToken, onetimeId }, ['sessionToken', 'onetimeId']);
    return this.makeRequest('DELETE', `/onetimes/${onetimeId}`, null, null, sessionToken);
  }

  // Bundle selection methods
  /**
   * Get customer bundle selections
   * @param {string} customerId - Customer ID
   * @returns {Promise<Object>} Bundle selections data
   */
  async getBundleSelections(customerId) {
    validateRequiredParams({ customerId }, ['customerId']);
    return this.makeRequest('GET', '/bundle_selections', null, { customer_id: customerId });
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
   * @param {string} customerId - Customer ID
   * @param {Object} bundleSelectionData - Bundle selection data
   * @returns {Promise<Object>} Created bundle selection data
   */
  async createBundleSelection(customerId, bundleSelectionData) {
    validateRequiredParams({ customerId }, ['customerId']);
    const required = ['bundle_id', 'variant_selections'];
    validateRequiredParams(bundleSelectionData, required);
    const dataWithCustomer = { ...bundleSelectionData, customer_id: customerId };
    return this.makeRequest('POST', '/bundle_selections', dataWithCustomer);
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
    return this.makeRequest('GET', '/shop');
  }

  // Settings methods
  /**
   * Get customer settings and preferences
   * @param {string} customerId - Customer ID
   * @returns {Promise<Object>} Settings data
   */
  async getSettings(customerId) {
    validateRequiredParams({ customerId }, ['customerId']);
    return this.makeRequest('GET', `/customers/${customerId}/delivery_schedule`);
  }

  /**
   * Update customer settings and preferences
   * @param {string} customerId - Customer ID
   * @param {Object} settingsData - Updated settings data
   * @returns {Promise<Object>} Updated settings data
   */
  async updateSettings(customerId, settingsData) {
    validateRequiredParams({ customerId }, ['customerId']);
    if (!settingsData || Object.keys(settingsData).length === 0) {
      throw new Error('Settings update data is required');
    }
    return this.makeRequest('PUT', `/customers/${customerId}`, settingsData);
  }

  // Session methods
  /**
   * Get customers (for finding customer by email)
   * @param {string} email - Customer email address
   * @returns {Promise<Object>} Customer search results
   */
  async findCustomerByEmail(email) {
    validateRequiredParams({ email }, ['email']);
    return this.makeRequest('GET', '/customers', null, { email });
  }

  /**
   * Get all customers
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Customers data
   */
  async getCustomers(params = {}) {
    return this.makeRequest('GET', '/customers', null, params);
  }

  /**
   * Create a new customer
   * @param {Object} customerData - Customer data
   * @returns {Promise<Object>} Created customer data
   */
  async createCustomer(customerData) {
    const required = ['email', 'first_name', 'last_name'];
    validateRequiredParams(customerData, required);
    return this.makeRequest('POST', '/customers', customerData);
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
   * @param {string} customerId - Customer ID
   * @returns {Promise<Object>} Notifications data
   */
  async getNotifications(customerId) {
    validateRequiredParams({ customerId }, ['customerId']);
    return this.makeRequest('GET', '/notifications', null, { customer_id: customerId });
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
   * @param {string} sessionToken - Session token
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Orders data
   */
  async getOrders(sessionToken, params = {}) {
    validateRequiredParams({ sessionToken }, ['sessionToken']);
    return this.makeRequest('GET', '/orders', null, params, sessionToken);
  }

  /**
   * Get detailed order information
   * @param {string} sessionToken - Session token
   * @param {string} orderId - The order ID
   * @returns {Promise<Object>} Order data
   */
  async getOrder(sessionToken, orderId) {
    validateRequiredParams({ sessionToken, orderId }, ['sessionToken', 'orderId']);
    return this.makeRequest('GET', `/orders/${orderId}`, null, null, sessionToken);
  }

  // Charge methods
  /**
   * Get customer charges with optional filtering
   * @param {string} sessionToken - Session token
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Charges data
   */
  async getCharges(sessionToken, params = {}) {
    validateRequiredParams({ sessionToken }, ['sessionToken']);
    return this.makeRequest('GET', '/charges', null, params, sessionToken);
  }

  /**
   * Get detailed charge information
   * @param {string} sessionToken - Session token
   * @param {string} chargeId - The charge ID
   * @returns {Promise<Object>} Charge data
   */
  async getCharge(sessionToken, chargeId) {
    validateRequiredParams({ sessionToken, chargeId }, ['sessionToken', 'chargeId']);
    return this.makeRequest('GET', `/charges/${chargeId}`, null, null, sessionToken);
  }
}