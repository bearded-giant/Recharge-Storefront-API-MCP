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
   * Create a new RechargeClient instance with session token
   * 
   * @param {Object} config - Configuration object
   * @param {string} config.storeUrl - Store URL (e.g., 'your-shop.myshopify.com')
   * @param {string} config.sessionToken - Customer session token for authentication
   */
  constructor({ storeUrl, sessionToken, merchantToken }) {
    validateRequiredParams({ storeUrl }, ['storeUrl']);
    
    if (!sessionToken && !merchantToken) {
      throw new Error('Either sessionToken or merchantToken is required');
    }
    
    this.sessionToken = sessionToken;
    this.merchantToken = merchantToken;
    this.storeUrl = storeUrl;
    
    // Construct the Recharge Storefront API base URL
    this.baseURL = `https://${this.storeUrl}/tools/recurring/portal`;
    
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': `Recharge-Storefront-API-MCP/${process.env.MCP_SERVER_VERSION || '1.0.0'}`,
    };
    
    // Set appropriate authentication header
    if (this.sessionToken) {
      headers['Authorization'] = `Bearer ${this.sessionToken}`;
    } else if (this.merchantToken) {
      headers['X-Recharge-Access-Token'] = this.merchantToken;
    }
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers,
      timeout: 30000, // 30 seconds
      maxRedirects: 5,
      validateStatus: (status) => status < 500, // Don't throw for 4xx errors, let our handler deal with them
    });

    this.setupInterceptors();
  }

  /**
   * Create a customer session using customer ID (merchant token required)
   * @param {string} customerId - Customer ID
   * @param {Object} options - Session options
   * @returns {Promise<Object>} Session data including token
   */
  async createCustomerSessionById(customerId, options = {}) {
    if (!this.merchantToken) {
      throw new Error('Merchant token required for session creation');
    }
    
    validateRequiredParams({ customerId }, ['customerId']);
    
    const response = await this.makeRequest('POST', `/api/v1/customers/${customerId}/sessions`, {
      return_url: options.return_url || null
    });
    
    if (response.session && response.session.token) {
      // Update client to use the new session token
      this.sessionToken = response.session.token;
      this.client.defaults.headers['Authorization'] = `Bearer ${this.sessionToken}`;
      delete this.client.defaults.headers['X-Recharge-Access-Token'];
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

  /**
   * Get customer by email address (requires merchant token)
   * @param {string} email - Customer email address
   * @returns {Promise<Object>} Customer data including customer ID
   */
  async getCustomerByEmail(email) {
    if (!this.merchantToken) {
      throw new Error('Merchant token required for customer lookup by email');
    }
    
    validateRequiredParams({ email }, ['email']);
    return this.makeRequest('GET', '/customers', null, { email });
  }

  // Customer methods
  /**
   * Get customer information by customer ID
   * @param {string} customerId - Customer ID
   * @returns {Promise<Object>} Customer data
   */
  async getCustomer(customerId) {
    validateRequiredParams({ customerId }, ['customerId']);
    return this.makeRequest('GET', `/customer`);
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
    return this.makeRequest('PUT', `/customer`, data);
  }

  /**
   * Delete a customer
   * @returns {Promise<Object>} Deletion result
   */
  async deleteCustomer() {
    return this.makeRequest('DELETE', `/customer`);
  }

  /**
   * Get customer by email address
   * @param {string} email - Customer email address
   * @returns {Promise<Object>} Customer data
   */
  async getCustomerByEmail(email) {
    validateRequiredParams({ email }, ['email']);
    return this.makeRequest('GET', '/customer', null, { email });
  }

  // Subscription methods
  /**
   * Get subscriptions with optional filtering
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
   * Delete a subscription permanently
   * @param {string} subscriptionId - The subscription ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteSubscription(subscriptionId) {
    validateRequiredParams({ subscriptionId }, ['subscriptionId']);
    return this.makeRequest('DELETE', `/subscriptions/${subscriptionId}`);
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
   * Get addresses with optional filtering
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Addresses data
   */
  async getAddresses(params = {}) {
    return this.makeRequest('GET', '/addresses', null, params);
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
   * Get payment methods with optional filtering
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Payment methods data
   */
  async getPaymentMethods(params = {}) {
    return this.makeRequest('GET', '/payment_methods', null, params);
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

  // Order methods
  /**
   * Get orders with optional filtering
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
   * Get charges with optional filtering
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

  // One-time product methods
  /**
   * Get one-time products with optional filtering
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} One-time products data
   */
  async getOnetimes(params = {}) {
    return this.makeRequest('GET', '/onetimes', null, params);
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

  // Bundle methods
  /**
   * Get bundles with optional filtering
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Bundles data
   */
  async getBundles(params = {}) {
    return this.makeRequest('GET', '/bundles', null, params);
  }

  /**
   * Get detailed information about a specific bundle
   * @param {string} bundleId - The bundle ID
   * @returns {Promise<Object>} Bundle data
   */
  async getBundle(bundleId) {
    validateRequiredParams({ bundleId }, ['bundleId']);
    return this.makeRequest('GET', `/bundles/${bundleId}`);
  }

  /**
   * Get bundle selections for a specific bundle
   * @param {string} bundleId - The bundle ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Bundle selections data
   */
  async getBundleSelections(bundleId, params = {}) {
    validateRequiredParams({ bundleId }, ['bundleId']);
    return this.makeRequest('GET', `/bundles/${bundleId}/bundle_selections`, null, params);
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
   * @param {Object} selectionData - Bundle selection data
   * @returns {Promise<Object>} Created bundle selection data
   */
  async createBundleSelection(selectionData) {
    const required = ['bundle_id', 'variant_id', 'quantity'];
    validateRequiredParams(selectionData, required);
    return this.makeRequest('POST', '/bundle_selections', selectionData);
  }

  /**
   * Update a bundle selection
   * @param {string} bundleSelectionId - The bundle selection ID
   * @param {Object} selectionData - Updated bundle selection data
   * @returns {Promise<Object>} Updated bundle selection data
   */
  async updateBundleSelection(bundleSelectionId, selectionData) {
    validateRequiredParams({ bundleSelectionId }, ['bundleSelectionId']);
    if (!selectionData || Object.keys(selectionData).length === 0) {
      throw new Error('Bundle selection update data is required');
    }
    return this.makeRequest('PUT', `/bundle_selections/${bundleSelectionId}`, selectionData);
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

  // Discount methods
  /**
   * Get discounts with optional filtering
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Discounts data
   */
  async getDiscounts(params = {}) {
    return this.makeRequest('GET', '/discounts', null, params);
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
}