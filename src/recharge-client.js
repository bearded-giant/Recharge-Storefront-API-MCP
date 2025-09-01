import axios from 'axios';
import { handleAPIError } from './utils/error-handler.js';
import { SessionCache } from './utils/session-cache.js';

/**
 * Recharge Storefront API Client
 * Handles authentication, session management, and API requests
 */
export class RechargeClient {
  constructor({ storeUrl, sessionToken = null, adminToken = null }) {
    // Validate and normalize store URL
    if (!storeUrl) {
      throw new Error('Store URL is required');
    }
    
    // Handle URL format - strip protocol if present
    let domain = storeUrl;
    if (storeUrl.startsWith('http://') || storeUrl.startsWith('https://')) {
      try {
        const urlObj = new URL(storeUrl);
        domain = urlObj.hostname;
      } catch (error) {
        throw new Error(`Invalid store URL format: ${storeUrl}`);
      }
    }
    
    // Validate domain format
    if (!domain.includes('.myshopify.com')) {
      throw new Error(
        `Invalid store URL format: ${storeUrl}\n` +
        'Store URL must be a Shopify domain ending with .myshopify.com\n' +
        'Example: your-shop.myshopify.com'
      );
    }
    
    this.storeUrl = domain;
    this.sessionToken = sessionToken;
    this.adminToken = adminToken;
    this.sessionCache = new SessionCache();
    
    // Create axios instance for Storefront API
    this.storefrontApi = axios.create({
      baseURL: 'https://api.rechargeapps.com',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    
    // Create axios instance for Admin API
    this.adminApi = axios.create({
      baseURL: 'https://api.rechargeapps.com',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    
    // Add response interceptor for redirect handling
    this.storefrontApi.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && [301, 302, 303, 307, 308].includes(error.response.status)) {
          const redirectLocation = error.response.headers.location;
          error.isRedirect = true;
          error.redirectLocation = redirectLocation;
          error.originalUrl = error.config?.url;
          error.message = `API returned redirect (${error.response.status}) to: ${redirectLocation}. This usually indicates an authentication or configuration issue.`;
        }
        throw error;
      }
    );
  }

  /**
   * Get or create session token for customer
   */
  async getOrCreateSessionToken(customerId = null, customerEmail = null) {
    // If explicit session token provided, use it
    if (this.sessionToken) {
      if (process.env.DEBUG === 'true') {
        console.error('[DEBUG] Using explicit session token');
      }
      return this.sessionToken;
    }

    // If customer identification provided, get/create customer session
    if (customerId || customerEmail) {
      let finalCustomerId = customerId;
      
      // If only email provided, look up customer ID
      if (!finalCustomerId && customerEmail) {
        finalCustomerId = this.sessionCache.getCustomerIdByEmail(customerEmail);
        
        if (!finalCustomerId) {
          if (process.env.DEBUG === 'true') {
            console.error(`[DEBUG] Looking up customer ID for email: ${customerEmail}`);
          }
          const customer = await this.getCustomerByEmail(customerEmail);
          finalCustomerId = customer.id.toString();
          this.sessionCache.setCustomerIdByEmail(customerEmail, finalCustomerId);
        }
      }
      
      // Check for cached session
      const cachedToken = this.sessionCache.getSessionToken(finalCustomerId);
      if (cachedToken) {
        if (process.env.DEBUG === 'true') {
          console.error(`[DEBUG] Using cached session for customer ${finalCustomerId}`);
        }
        return cachedToken;
      }
      
      // Create new session
      if (process.env.DEBUG === 'true') {
        console.error(`[DEBUG] Creating new session for customer ${finalCustomerId}`);
      }
      const session = await this.createCustomerSessionById(finalCustomerId);
      const newToken = session.customer_session?.token || session.token;
      
      // Cache the new session
      this.sessionCache.setSessionToken(finalCustomerId, newToken, customerEmail);
      
      return newToken;
    }

    // Security check: prevent using default session when customer sessions exist
    if (this.sessionCache.hasCustomerSessions()) {
      throw new Error(
        'Security Error: Cannot use default session token when customer-specific sessions exist. ' +
        'Please specify \'customer_id\', \'customer_email\', or \'session_token\' to ensure correct customer data access.'
      );
    }

    // No customer identification and no default session
    throw new Error(
      'No session token available. Please provide customer_id, customer_email, or session_token parameter, ' +
      'or set RECHARGE_SESSION_TOKEN environment variable.'
    );
  }

  /**
   * Make authenticated request with automatic session management
   */
  async makeRequest(method, endpoint, data = null, params = null, customerId = null, customerEmail = null) {
    const sessionToken = await this.getOrCreateSessionToken(customerId, customerEmail);
    
    const config = {
      method,
      url: endpoint,
      headers: {
        'X-Recharge-Access-Token': sessionToken,
        'X-Recharge-Version': '2021-11',
      },
    };
    
    if (data) {
      config.data = data;
    }
    
    if (params) {
      config.params = params;
    }
    
    try {
      const response = await this.storefrontApi.request(config);
      return response.data;
    } catch (error) {
      // Handle session expiry - clear cache and retry once
      if (error.response?.status === 401 && (customerId || customerEmail)) {
        if (process.env.DEBUG === 'true') {
          console.error(`[DEBUG] Session expired for customer, clearing cache and retrying`);
        }
        
        // Clear the expired session
        const finalCustomerId = customerId || this.sessionCache.getCustomerIdByEmail(customerEmail);
        if (finalCustomerId) {
          this.sessionCache.clearSession(finalCustomerId);
        }
        
        // Retry with new session
        const newSessionToken = await this.getOrCreateSessionToken(customerId, customerEmail);
        config.headers['X-Recharge-Access-Token'] = newSessionToken;
        config.headers['X-Recharge-Version'] = '2021-11';
        
        const retryResponse = await this.storefrontApi.request(config);
        return retryResponse.data;
      }
      
      handleAPIError(error);
    }
  }

  /**
   * Get customer by email (requires admin token)
   */
  async getCustomerByEmail(email) {
    if (!this.adminToken) {
      throw new Error(
        'Admin token required for customer lookup. Please provide admin_token parameter or set RECHARGE_ADMIN_TOKEN environment variable.'
      );
    }

    try {
      const response = await this.adminApi.get('/customers', {
        params: { email },
        headers: {
          'X-Recharge-Access-Token': this.adminToken,
          'X-Recharge-Version': '2021-11',
        },
      });
      
      if (!response.data.customers || response.data.customers.length === 0) {
        throw new Error(`Customer not found with email: ${email}`);
      }
      
      return response.data.customers[0];
    } catch (error) {
      handleAPIError(error);
    }
  }

  /**
   * Create customer session by ID (requires admin token)
   */
  async createCustomerSessionById(customerId, options = {}) {
    if (!this.adminToken) {
      throw new Error(
        'Admin token required for session creation. Please provide admin_token parameter or set RECHARGE_ADMIN_TOKEN environment variable.'
      );
    }

    try {
      const sessionData = {
        customer_id: parseInt(customerId),
        ...options
      };
      
      const response = await this.adminApi.post(`/customers/${customerId}/sessions`, sessionData, {
        headers: {
          'X-Recharge-Access-Token': this.adminToken,
          'X-Recharge-Version': '2021-11',
        },
      });
      
      return response.data;
    } catch (error) {
      handleAPIError(error);
    }
  }

  // Customer methods
  async getCustomer(customerId = null, customerEmail = null) {
    const response = await this.makeRequest('GET', '/storefront/customer', null, null, customerId, customerEmail);
    return response.customer || response;
  }

  async updateCustomer(updateData, customerId = null, customerEmail = null) {
    const response = await this.makeRequest('PUT', '/storefront/customer', updateData, null, customerId, customerEmail);
    return response.customer || response;
  }

  // Subscription methods
  async getSubscriptions(params = {}, customerId = null, customerEmail = null) {
    const response = await this.makeRequest('GET', '/storefront/subscriptions', null, params, customerId, customerEmail);
    return response.subscriptions || response;
  }

  async getSubscription(subscriptionId, customerId = null, customerEmail = null) {
    const response = await this.makeRequest('GET', `/storefront/subscriptions/${subscriptionId}`, null, null, customerId, customerEmail);
    return response.subscription || response;
  }

  async createSubscription(subscriptionData, customerId = null, customerEmail = null) {
    const response = await this.makeRequest('POST', '/storefront/subscriptions', subscriptionData, null, customerId, customerEmail);
    return response.subscription || response;
  }

  async updateSubscription(subscriptionId, updateData, customerId = null, customerEmail = null) {
    const response = await this.makeRequest('PUT', `/storefront/subscriptions/${subscriptionId}`, updateData, null, customerId, customerEmail);
    return response.subscription || response;
  }

  async skipSubscription(subscriptionId, date, customerId = null, customerEmail = null) {
    const response = await this.makeRequest('POST', `/storefront/subscriptions/${subscriptionId}/skip`, { date }, null, customerId, customerEmail);
    return response.subscription || response;
  }

  async unskipSubscription(subscriptionId, date, customerId = null, customerEmail = null) {
    const response = await this.makeRequest('POST', `/storefront/subscriptions/${subscriptionId}/unskip`, { date }, null, customerId, customerEmail);
    return response.subscription || response;
  }

  async swapSubscription(subscriptionId, swapData, customerId = null, customerEmail = null) {
    const response = await this.makeRequest('POST', `/storefront/subscriptions/${subscriptionId}/swap`, swapData, null, customerId, customerEmail);
    return response.subscription || response;
  }

  async cancelSubscription(subscriptionId, cancelData, customerId = null, customerEmail = null) {
    const response = await this.makeRequest('POST', `/storefront/subscriptions/${subscriptionId}/cancel`, cancelData, null, customerId, customerEmail);
    return response.subscription || response;
  }

  async activateSubscription(subscriptionId, customerId = null, customerEmail = null) {
    const response = await this.makeRequest('POST', `/storefront/subscriptions/${subscriptionId}/activate`, {}, null, customerId, customerEmail);
    return response.subscription || response;
  }

  async setNextChargeDate(subscriptionId, date, customerId = null, customerEmail = null) {
    const response = await this.makeRequest('PUT', `/storefront/subscriptions/${subscriptionId}`, { next_charge_scheduled_at: date }, null, customerId, customerEmail);
    return response.subscription || response;
  }

  // Address methods
  async getAddresses(params = {}, customerId = null, customerEmail = null) {
    const response = await this.makeRequest('GET', '/storefront/addresses', null, params, customerId, customerEmail);
    return response.addresses || response;
  }

  async getAddress(addressId, customerId = null, customerEmail = null) {
    const response = await this.makeRequest('GET', `/storefront/addresses/${addressId}`, null, null, customerId, customerEmail);
    return response.address || response;
  }

  async createAddress(addressData, customerId = null, customerEmail = null) {
    const response = await this.makeRequest('POST', '/storefront/addresses', addressData, null, customerId, customerEmail);
    return response.address || response;
  }

  async updateAddress(addressId, addressData, customerId = null, customerEmail = null) {
    const response = await this.makeRequest('PUT', `/storefront/addresses/${addressId}`, addressData, null, customerId, customerEmail);
    return response.address || response;
  }

  async deleteAddress(addressId, customerId = null, customerEmail = null) {
    const response = await this.makeRequest('DELETE', `/storefront/addresses/${addressId}`, null, null, customerId, customerEmail);
    return response;
  }

  // Payment methods
  async getPaymentMethods(params = {}, customerId = null, customerEmail = null) {
    const response = await this.makeRequest('GET', '/storefront/payment_methods', null, params, customerId, customerEmail);
    return response.payment_methods || response;
  }

  async getPaymentMethod(paymentMethodId, customerId = null, customerEmail = null) {
    const response = await this.makeRequest('GET', `/storefront/payment_methods/${paymentMethodId}`, null, null, customerId, customerEmail);
    return response.payment_method || response;
  }

  async updatePaymentMethod(paymentMethodId, paymentData, customerId = null, customerEmail = null) {
    const response = await this.makeRequest('PUT', `/storefront/payment_methods/${paymentMethodId}`, paymentData, null, customerId, customerEmail);
    return response.payment_method || response;
  }

  // Product methods
  async getProducts(params = {}, customerId = null, customerEmail = null) {
    const response = await this.makeRequest('GET', '/storefront/products', null, params, customerId, customerEmail);
    return response.products || response;
  }

  async getProduct(productId, customerId = null, customerEmail = null) {
    const response = await this.makeRequest('GET', `/storefront/products/${productId}`, null, null, customerId, customerEmail);
    return response.product || response;
  }

  // Order methods
  async getOrders(params = {}, customerId = null, customerEmail = null) {
    const response = await this.makeRequest('GET', '/storefront/orders', null, params, customerId, customerEmail);
    return response.orders || response;
  }

  async getOrder(orderId, customerId = null, customerEmail = null) {
    const response = await this.makeRequest('GET', `/storefront/orders/${orderId}`, null, null, customerId, customerEmail);
    return response.order || response;
  }

  // Charge methods
  async getCharges(params = {}, customerId = null, customerEmail = null) {
    const response = await this.makeRequest('GET', '/storefront/charges', null, params, customerId, customerEmail);
    return response.charges || response;
  }

  async getCharge(chargeId, customerId = null, customerEmail = null) {
    const response = await this.makeRequest('GET', `/storefront/charges/${chargeId}`, null, null, customerId, customerEmail);
    return response.charge || response;
  }

  // One-time product methods
  async getOnetimes(params = {}, customerId = null, customerEmail = null) {
    const response = await this.makeRequest('GET', '/storefront/onetimes', null, params, customerId, customerEmail);
    return response.onetimes || response;
  }

  async getOnetime(onetimeId, customerId = null, customerEmail = null) {
    const response = await this.makeRequest('GET', `/storefront/onetimes/${onetimeId}`, null, null, customerId, customerEmail);
    return response.onetime || response;
  }

  async createOnetime(onetimeData, customerId = null, customerEmail = null) {
    const response = await this.makeRequest('POST', '/storefront/onetimes', onetimeData, null, customerId, customerEmail);
    return response.onetime || response;
  }

  async updateOnetime(onetimeId, onetimeData, customerId = null, customerEmail = null) {
    const response = await this.makeRequest('PUT', `/storefront/onetimes/${onetimeId}`, onetimeData, null, customerId, customerEmail);
    return response.onetime || response;
  }

  async deleteOnetime(onetimeId, customerId = null, customerEmail = null) {
    const response = await this.makeRequest('DELETE', `/storefront/onetimes/${onetimeId}`, null, null, customerId, customerEmail);
    return response;
  }

  // Bundle methods
  async getBundles(params = {}, customerId = null, customerEmail = null) {
    const response = await this.makeRequest('GET', '/storefront/bundles', null, params, customerId, customerEmail);
    return response.bundles || response;
  }

  async getBundle(bundleId, customerId = null, customerEmail = null) {
    const response = await this.makeRequest('GET', `/storefront/bundles/${bundleId}`, null, null, customerId, customerEmail);
    return response.bundle || response;
  }

  async getBundleSelections(bundleId, params = {}, customerId = null, customerEmail = null) {
    const response = await this.makeRequest('GET', `/storefront/bundles/${bundleId}/bundle_selections`, null, params, customerId, customerEmail);
    return response.bundle_selections || response;
  }

  async getBundleSelection(bundleSelectionId, customerId = null, customerEmail = null) {
    const response = await this.makeRequest('GET', `/storefront/bundle_selections/${bundleSelectionId}`, null, null, customerId, customerEmail);
    return response.bundle_selection || response;
  }

  async createBundleSelection(selectionData, customerId = null, customerEmail = null) {
    const response = await this.makeRequest('POST', '/storefront/bundle_selections', selectionData, null, customerId, customerEmail);
    return response.bundle_selection || response;
  }

  async updateBundleSelection(bundleSelectionId, selectionData, customerId = null, customerEmail = null) {
    const response = await this.makeRequest('PUT', `/storefront/bundle_selections/${bundleSelectionId}`, selectionData, null, customerId, customerEmail);
    return response.bundle_selection || response;
  }

  async deleteBundleSelection(bundleSelectionId, customerId = null, customerEmail = null) {
    const response = await this.makeRequest('DELETE', `/storefront/bundle_selections/${bundleSelectionId}`, null, null, customerId, customerEmail);
    return response;
  }

  // Discount methods
  async getDiscounts(params = {}, customerId = null, customerEmail = null) {
    const response = await this.makeRequest('GET', '/storefront/discounts', null, params, customerId, customerEmail);
    return response.discounts || response;
  }

  async getDiscount(discountId, customerId = null, customerEmail = null) {
    const response = await this.makeRequest('GET', `/storefront/discounts/${discountId}`, null, null, customerId, customerEmail);
    return response.discount || response;
  }

  async applyDiscount(discountCode, customerId = null, customerEmail = null) {
    const response = await this.makeRequest('POST', '/storefront/discounts', { discount_code: discountCode }, null, customerId, customerEmail);
    return response.discount || response;
  }

  async removeDiscount(discountId, customerId = null, customerEmail = null) {
    const response = await this.makeRequest('DELETE', `/storefront/discounts/${discountId}`, null, null, customerId, customerEmail);
    return response;
  }
}