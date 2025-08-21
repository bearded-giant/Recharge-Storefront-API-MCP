import axios from 'axios';
import { handleAPIError } from './utils/error-handler.js';

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
   * @param {string} config.domain - Shopify domain (e.g., 'your-shop.myshopify.com')
   * @param {string} config.accessToken - Recharge Storefront API access token
   */
  constructor({ domain, accessToken }) {
    if (!domain || !accessToken) {
      throw new Error('Both domain and access token are required for RechargeClient initialization');
    }

    if (!domain.includes('.myshopify.com')) {
      throw new Error('Domain must be a valid Shopify domain ending with .myshopify.com (e.g., your-shop.myshopify.com)');
    }
    
    this.domain = domain;
    this.accessToken = accessToken;
    // Use the correct Recharge Storefront API base URL
    this.baseURL = `https://${domain}/tools/recurring/portal`;
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'X-Recharge-Access-Token': accessToken,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': `Recharge-MCP-Server/${process.env.MCP_SERVER_VERSION || '1.0.0'}`,
      },
      timeout: 30000,
    });

    this.setupInterceptors();
  }

  setupInterceptors() {
    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        if (process.env.DEBUG === 'true') {
          console.error(`[DEBUG] ${config.method?.toUpperCase()} ${config.url}`);
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
          console.error(`[DEBUG] Response ${response.status}:`, JSON.stringify(response.data, null, 2));
        }
        return response;
      },
      (error) => {
        handleAPIError(error);
      }
    );
  }

  // Customer methods
  /**
   * Get current customer information
   * @returns {Promise<Object>} Customer data
   */
  async getCustomer() {
    try {
      const response = await this.client.get(`/customer`);
      return response.data;
    } catch (error) {
      handleAPIError(error);
    }
  }

  /**
   * Update customer information
   * @param {Object} data - Customer update data
   * @returns {Promise<Object>} Updated customer data
   */
  async updateCustomer(data) {
    try {
      const response = await this.client.put(`/customer`, data);
      return response.data;
    } catch (error) {
      handleAPIError(error);
    }
  }

  // Subscription methods
  /**
   * Get customer subscriptions with optional filtering
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Subscriptions data
   */
  async getSubscriptions(params = {}) {
    try {
      const response = await this.client.get(`/subscriptions`, { params });
      return response.data;
    } catch (error) {
      handleAPIError(error);
    }
  }

  /**
   * Get detailed information about a specific subscription
   * @param {string} subscriptionId - The subscription ID
   * @returns {Promise<Object>} Subscription data
   */
  async getSubscription(subscriptionId) {
    try {
      const response = await this.client.get(`/subscriptions/${subscriptionId}`);
      return response.data;
    } catch (error) {
      handleAPIError(error);
    }
  }

  /**
   * Update subscription details
   * @param {string} subscriptionId - The subscription ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>} Updated subscription data
   */
  async updateSubscription(subscriptionId, data) {
    try {
      const response = await this.client.put(`/subscriptions/${subscriptionId}`, data);
      return response.data;
    } catch (error) {
      handleAPIError(error);
    }
  }

  /**
   * Skip a subscription delivery for a specific date
   * @param {string} subscriptionId - The subscription ID
   * @param {string} date - Date to skip (YYYY-MM-DD)
   * @returns {Promise<Object>} Skip result
   */
  async skipSubscription(subscriptionId, date) {
    try {
      const response = await this.client.post(`/subscriptions/${subscriptionId}/skip`, { date });
      return response.data;
    } catch (error) {
      handleAPIError(error);
    }
  }

  /**
   * Unskip a previously skipped subscription delivery
   * @param {string} subscriptionId - The subscription ID
   * @param {string} date - Date to unskip (YYYY-MM-DD)
   * @returns {Promise<Object>} Unskip result
   */
  async unskipSubscription(subscriptionId, date) {
    try {
      const response = await this.client.post(`/subscriptions/${subscriptionId}/unskip`, { date });
      return response.data;
    } catch (error) {
      handleAPIError(error);
    }
  }

  /**
   * Swap subscription product variant
   * @param {string} subscriptionId - The subscription ID
   * @param {Object} data - Swap data including variant_id
   * @returns {Promise<Object>} Swap result
   */
  async swapSubscription(subscriptionId, data) {
    try {
      const response = await this.client.post(`/subscriptions/${subscriptionId}/swap`, data);
      return response.data;
    } catch (error) {
      handleAPIError(error);
    }
  }

  /**
   * Cancel a subscription
   * @param {string} subscriptionId - The subscription ID
   * @param {Object} data - Cancellation data
   * @returns {Promise<Object>} Cancellation result
   */
  async cancelSubscription(subscriptionId, data = {}) {
    try {
      const response = await this.client.post(`/subscriptions/${subscriptionId}/cancel`, data);
      return response.data;
    } catch (error) {
      handleAPIError(error);
    }
  }

  /**
   * Activate a cancelled subscription
   * @param {string} subscriptionId - The subscription ID
   * @returns {Promise<Object>} Activation result
   */
  async activateSubscription(subscriptionId) {
    try {
      const response = await this.client.post(`/subscriptions/${subscriptionId}/activate`);
      return response.data;
    } catch (error) {
      handleAPIError(error);
    }
  }

  /**
   * Pause a subscription temporarily
   * @param {string} subscriptionId - The subscription ID
   * @param {Object} data - Pause data
   * @returns {Promise<Object>} Pause result
   */
  async pauseSubscription(subscriptionId, data = {}) {
    try {
      const response = await this.client.post(`/subscriptions/${subscriptionId}/pause`, data);
      return response.data;
    } catch (error) {
      handleAPIError(error);
    }
  }

  /**
   * Resume a paused subscription
   * @param {string} subscriptionId - The subscription ID
   * @returns {Promise<Object>} Resume result
   */
  async resumeSubscription(subscriptionId) {
    try {
      const response = await this.client.post(`/subscriptions/${subscriptionId}/resume`);
      return response.data;
    } catch (error) {
      handleAPIError(error);
    }
  }

  /**
   * Set next charge date for subscription
   * @param {string} subscriptionId - The subscription ID
   * @param {string} date - Next charge date (YYYY-MM-DD)
   * @returns {Promise<Object>} Update result
   */
  async setNextChargeDate(subscriptionId, date) {
    try {
      const response = await this.client.post(`/subscriptions/${subscriptionId}/set_next_charge_date`, { date });
      return response.data;
    } catch (error) {
      handleAPIError(error);
    }
  }

  // Address methods
  /**
   * Get all customer addresses
   * @returns {Promise<Object>} Addresses data
   */
  async getAddresses() {
    try {
      const response = await this.client.get(`/addresses`);
      return response.data;
    } catch (error) {
      handleAPIError(error);
    }
  }

  /**
   * Get detailed information about a specific address
   * @param {string} addressId - The address ID
   * @returns {Promise<Object>} Address data
   */
  async getAddress(addressId) {
    try {
      const response = await this.client.get(`/addresses/${addressId}`);
      return response.data;
    } catch (error) {
      handleAPIError(error);
    }
  }

  /**
   * Create a new address
   * @param {Object} addressData - Address data
   * @returns {Promise<Object>} Created address data
   */
  async createAddress(addressData) {
    try {
      const response = await this.client.post(`/addresses`, addressData);
      return response.data;
    } catch (error) {
      handleAPIError(error);
    }
  }

  /**
   * Update an existing address
   * @param {string} addressId - The address ID
   * @param {Object} addressData - Updated address data
   * @returns {Promise<Object>} Updated address data
   */
  async updateAddress(addressId, addressData) {
    try {
      const response = await this.client.put(`/addresses/${addressId}`, addressData);
      return response.data;
    } catch (error) {
      handleAPIError(error);
    }
  }

  /**
   * Delete an address
   * @param {string} addressId - The address ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteAddress(addressId) {
    try {
      const response = await this.client.delete(`/addresses/${addressId}`);
      return response.data;
    } catch (error) {
      handleAPIError(error);
    }
  }

  // Payment method methods
  /**
   * Get customer payment methods
   * @returns {Promise<Object>} Payment methods data
   */
  async getPaymentMethods() {
    try {
      const response = await this.client.get(`/payment_methods`);
      return response.data;
    } catch (error) {
      handleAPIError(error);
    }
  }

  /**
   * Get detailed information about a specific payment method
   * @param {string} paymentMethodId - The payment method ID
   * @returns {Promise<Object>} Payment method data
   */
  async getPaymentMethod(paymentMethodId) {
    try {
      const response = await this.client.get(`/payment_methods/${paymentMethodId}`);
      return response.data;
    } catch (error) {
      handleAPIError(error);
    }
  }

  /**
   * Update payment method billing information
   * @param {string} paymentMethodId - The payment method ID
   * @param {Object} paymentData - Updated payment data
   * @returns {Promise<Object>} Updated payment method data
   */
  async updatePaymentMethod(paymentMethodId, paymentData) {
    try {
      const response = await this.client.put(`/payment_methods/${paymentMethodId}`, paymentData);
      return response.data;
    } catch (error) {
      handleAPIError(error);
    }
  }

  // Discount methods
  /**
   * Get customer discounts
   * @returns {Promise<Object>} Discounts data
   */
  async getDiscounts() {
    try {
      const response = await this.client.get(`/discounts`);
      return response.data;
    } catch (error) {
      handleAPIError(error);
    }
  }

  /**
   * Get detailed information about a specific discount
   * @param {string} discountId - The discount ID
   * @returns {Promise<Object>} Discount data
   */
  async getDiscount(discountId) {
    try {
      const response = await this.client.get(`/discounts/${discountId}`);
      return response.data;
    } catch (error) {
      handleAPIError(error);
    }
  }

  /**
   * Apply a discount code
   * @param {string} discountCode - The discount code to apply
   * @returns {Promise<Object>} Applied discount data
   */
  async applyDiscount(discountCode) {
    try {
      const response = await this.client.post(`/discounts`, { discount_code: discountCode });
      return response.data;
    } catch (error) {
      handleAPIError(error);
    }
  }

  /**
   * Remove a discount
   * @param {string} discountId - The discount ID to remove
   * @returns {Promise<Object>} Removal result
   */
  async removeDiscount(discountId) {
    try {
      const response = await this.client.delete(`/discounts/${discountId}`);
      return response.data;
    } catch (error) {
      handleAPIError(error);
    }
  }

  // Product methods
  /**
   * Get available products with optional filtering
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Products data
   */
  async getProducts(params = {}) {
    try {
      const response = await this.client.get('/products', { params });
      return response.data;
    } catch (error) {
      handleAPIError(error);
    }
  }

  /**
   * Get detailed product information
   * @param {string} productId - The product ID
   * @returns {Promise<Object>} Product data
   */
  async getProduct(productId) {
    try {
      const response = await this.client.get(`/products/${productId}`);
      return response.data;
    } catch (error) {
      handleAPIError(error);
    }
  }

  // One-time product methods
  /**
   * Get customer one-time products
   * @returns {Promise<Object>} One-time products data
   */
  async getOnetimes() {
    try {
      const response = await this.client.get(`/onetimes`);
      return response.data;
    } catch (error) {
      handleAPIError(error);
    }
  }

  /**
   * Get detailed information about a specific one-time product
   * @param {string} onetimeId - The one-time product ID
   * @returns {Promise<Object>} One-time product data
   */
  async getOnetime(onetimeId) {
    try {
      const response = await this.client.get(`/onetimes/${onetimeId}`);
      return response.data;
    } catch (error) {
      handleAPIError(error);
    }
  }

  /**
   * Create a one-time product
   * @param {Object} onetimeData - One-time product data
   * @returns {Promise<Object>} Created one-time product data
   */
  async createOnetime(onetimeData) {
    try {
      const response = await this.client.post(`/onetimes`, onetimeData);
      return response.data;
    } catch (error) {
      handleAPIError(error);
    }
  }

  /**
   * Update a one-time product
   * @param {string} onetimeId - The one-time product ID
   * @param {Object} onetimeData - Updated one-time product data
   * @returns {Promise<Object>} Updated one-time product data
   */
  async updateOnetime(onetimeId, onetimeData) {
    try {
      const response = await this.client.put(`/onetimes/${onetimeId}`, onetimeData);
      return response.data;
    } catch (error) {
      handleAPIError(error);
    }
  }

  /**
   * Delete a one-time product
   * @param {string} onetimeId - The one-time product ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteOnetime(onetimeId) {
    try {
      const response = await this.client.delete(`/onetimes/${onetimeId}`);
      return response.data;
    } catch (error) {
      handleAPIError(error);
    }
  }

  // Bundle selection methods
  /**
   * Get customer bundle selections
   * @returns {Promise<Object>} Bundle selections data
   */
  async getBundleSelections() {
    try {
      const response = await this.client.get(`/bundle_selections`);
      return response.data;
    } catch (error) {
      handleAPIError(error);
    }
  }

  /**
   * Get detailed information about a specific bundle selection
   * @param {string} bundleSelectionId - The bundle selection ID
   * @returns {Promise<Object>} Bundle selection data
   */
  async getBundleSelection(bundleSelectionId) {
    try {
      const response = await this.client.get(`/bundle_selections/${bundleSelectionId}`);
      return response.data;
    } catch (error) {
      handleAPIError(error);
    }
  }

  /**
   * Create a bundle selection
   * @param {Object} bundleSelectionData - Bundle selection data
   * @returns {Promise<Object>} Created bundle selection data
   */
  async createBundleSelection(bundleSelectionData) {
    try {
      const response = await this.client.post(`/bundle_selections`, bundleSelectionData);
      return response.data;
    } catch (error) {
      handleAPIError(error);
    }
  }

  /**
   * Update a bundle selection
   * @param {string} bundleSelectionId - The bundle selection ID
   * @param {Object} bundleSelectionData - Updated bundle selection data
   * @returns {Promise<Object>} Updated bundle selection data
   */
  async updateBundleSelection(bundleSelectionId, bundleSelectionData) {
    try {
      const response = await this.client.put(`/bundle_selections/${bundleSelectionId}`, bundleSelectionData);
      return response.data;
    } catch (error) {
      handleAPIError(error);
    }
  }

  /**
   * Delete a bundle selection
   * @param {string} bundleSelectionId - The bundle selection ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteBundleSelection(bundleSelectionId) {
    try {
      const response = await this.client.delete(`/bundle_selections/${bundleSelectionId}`);
      return response.data;
    } catch (error) {
      handleAPIError(error);
    }
  }

  // Delivery schedule methods
  /**
   * Get delivery schedule information
   * @returns {Promise<Object>} Delivery schedule data
   */
  async getDeliverySchedule() {
    try {
      const response = await this.client.get(`/delivery_schedule`);
      return response.data;
    } catch (error) {
      handleAPIError(error);
    }
  }

  // Store methods
  /**
   * Get store information and configuration
   * @returns {Promise<Object>} Store data
   */
  async getStore() {
    try {
      const response = await this.client.get(`/store`);
      return response.data;
    } catch (error) {
      handleAPIError(error);
    }
  }

  // Settings methods
  /**
   * Get customer settings and preferences
   * @returns {Promise<Object>} Settings data
   */
  async getSettings() {
    try {
      const response = await this.client.get(`/settings`);
      return response.data;
    } catch (error) {
      handleAPIError(error);
    }
  }

  /**
   * Update customer settings and preferences
   * @param {Object} settingsData - Updated settings data
   * @returns {Promise<Object>} Updated settings data
   */
  async updateSettings(settingsData) {
    try {
      const response = await this.client.put(`/settings`, settingsData);
      return response.data;
    } catch (error) {
      handleAPIError(error);
    }
  }

  // Session methods
  /**
   * Create a customer session
   * @param {string} email - Customer email address
   * @returns {Promise<Object>} Session data
   */
  async createSession(email) {
    try {
      const response = await this.client.post(`/sessions`, { email });
      return response.data;
    } catch (error) {
      handleAPIError(error);
    }
  }

  /**
   * Validate the current session
   * @returns {Promise<Object>} Session validation data
   */
  async validateSession() {
    try {
      const response = await this.client.get(`/sessions/validate`);
      return response.data;
    } catch (error) {
      handleAPIError(error);
    }
  }

  /**
   * Destroy the current session (logout)
   * @returns {Promise<Object>} Session destruction result
   */
  async destroySession() {
    try {
      const response = await this.client.delete(`/sessions`);
      return response.data;
    } catch (error) {
      handleAPIError(error);
    }
  }

  // Async batch methods
  /**
   * Get async batch operation status and results
   * @param {string} batchId - The batch ID
   * @returns {Promise<Object>} Batch data
   */
  async getAsyncBatch(batchId) {
    try {
      const response = await this.client.get(`/async_batches/${batchId}`);
      return response.data;
    } catch (error) {
      handleAPIError(error);
    }
  }

  /**
   * Create an async batch operation
   * @param {Object} batchData - Batch operation data
   * @returns {Promise<Object>} Created batch data
   */
  async createAsyncBatch(batchData) {
    try {
      const response = await this.client.post(`/async_batches`, batchData);
      return response.data;
    } catch (error) {
      handleAPIError(error);
    }
  }

  // Shopify connector methods
  /**
   * Get Shopify connector configuration
   * @returns {Promise<Object>} Connector data
   */
  async getShopifyConnector() {
    try {
      const response = await this.client.get(`/shopify_connector`);
      return response.data;
    } catch (error) {
      handleAPIError(error);
    }
  }

  /**
   * Update Shopify connector configuration
   * @param {Object} connectorData - Updated connector data
   * @returns {Promise<Object>} Updated connector data
   */
  async updateShopifyConnector(connectorData) {
    try {
      const response = await this.client.put(`/shopify_connector`, connectorData);
      return response.data;
    } catch (error) {
      handleAPIError(error);
    }
  }

  // Notification methods
  /**
   * Get customer notifications
   * @returns {Promise<Object>} Notifications data
   */
  async getNotifications() {
    try {
      const response = await this.client.get(`/notifications`);
      return response.data;
    } catch (error) {
      handleAPIError(error);
    }
  }

  /**
   * Get detailed information about a specific notification
   * @param {string} notificationId - The notification ID
   * @returns {Promise<Object>} Notification data
   */
  async getNotification(notificationId) {
    try {
      const response = await this.client.get(`/notifications/${notificationId}`);
      return response.data;
    } catch (error) {
      handleAPIError(error);
    }
  }

  /**
   * Mark a notification as read
   * @param {string} notificationId - The notification ID
   * @returns {Promise<Object>} Mark as read result
   */
  async markNotificationAsRead(notificationId) {
    try {
      const response = await this.client.put(`/notifications/${notificationId}/mark_as_read`);
      return response.data;
    } catch (error) {
      handleAPIError(error);
    }
  }

  // Order methods
  /**
   * Get customer orders with optional filtering
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Orders data
   */
  async getOrders(params = {}) {
    try {
      const response = await this.client.get(`/orders`, { params });
      return response.data;
    } catch (error) {
      handleAPIError(error);
    }
  }

  /**
   * Get detailed order information
   * @param {string} orderId - The order ID
   * @returns {Promise<Object>} Order data
   */
  async getOrder(orderId) {
    try {
      const response = await this.client.get(`/orders/${orderId}`);
      return response.data;
    } catch (error) {
      handleAPIError(error);
    }
  }

  // Charge methods
  /**
   * Get customer charges with optional filtering
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Charges data
   */
  async getCharges(params = {}) {
    try {
      const response = await this.client.get(`/charges`, { params });
      return response.data;
    } catch (error) {
      handleAPIError(error);
    }
  }

  /**
   * Get detailed charge information
   * @param {string} chargeId - The charge ID
   * @returns {Promise<Object>} Charge data
   */
  async getCharge(chargeId) {
    try {
      const response = await this.client.get(`/charges/${chargeId}`);
      return response.data;
    } catch (error) {
      handleAPIError(error);
    }
  }
}