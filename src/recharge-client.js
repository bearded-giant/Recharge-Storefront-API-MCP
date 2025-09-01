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
      baseURL: `https://${this.storeUrl}/tools/recurring/portal`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    
    // Create axios instance for Admin API
    this.adminApi = axios.create({
      baseURL: `https://${this.storeUrl}/admin/api/2021-01/recharge`,
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
      const newToken = session.token;
      
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
  async makeCustomerRequest(method, endpoint, data = null, params = null, customerId = null, customerEmail = null) {
    const sessionToken = await this.getOrCreateSessionToken(customerId, customerEmail);
    
    const config = {
      method,
      url: endpoint,
      headers: {
        'X-Recharge-Access-Token': sessionToken,
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
      
      const response = await this.adminApi.post('/customer_portal/customer_sessions', sessionData, {
        headers: {
          'X-Recharge-Access-Token': this.adminToken,
        },
      });
      
      return response.data.customer_session;
    } catch (error) {
      handleAPIError(error);
    }
  }

  // Customer methods
  async getCustomer(customerId = null, customerEmail = null) {
    return await this.makeCustomerRequest('GET', '/customer', null, null, customerId, customerEmail);
  }

  async updateCustomer(updateData, customerId = null, customerEmail = null) {
    return await this.makeCustomerRequest('PUT', '/customer', updateData, null, customerId, customerEmail);
  }

  // Subscription methods
  async getSubscriptions(params = {}, customerId = null, customerEmail = null) {
    return await this.makeCustomerRequest('GET', '/subscriptions', null, params, customerId, customerEmail);
  }

  async getSubscription(subscriptionId, customerId = null, customerEmail = null) {
    return await this.makeCustomerRequest('GET', `/subscriptions/${subscriptionId}`, null, null, customerId, customerEmail);
  }

  async createSubscription(subscriptionData, customerId = null, customerEmail = null) {
    return await this.makeCustomerRequest('POST', '/subscriptions', subscriptionData, null, customerId, customerEmail);
  }

  async updateSubscription(subscriptionId, updateData, customerId = null, customerEmail = null) {
    return await this.makeCustomerRequest('PUT', `/subscriptions/${subscriptionId}`, updateData, null, customerId, customerEmail);
  }

  async skipSubscription(subscriptionId, date, customerId = null, customerEmail = null) {
    return await this.makeCustomerRequest('POST', `/subscriptions/${subscriptionId}/skip`, { date }, null, customerId, customerEmail);
  }

  async unskipSubscription(subscriptionId, date, customerId = null, customerEmail = null) {
    return await this.makeCustomerRequest('POST', `/subscriptions/${subscriptionId}/unskip`, { date }, null, customerId, customerEmail);
  }

  async swapSubscription(subscriptionId, swapData, customerId = null, customerEmail = null) {
    return await this.makeCustomerRequest('POST', `/subscriptions/${subscriptionId}/swap`, swapData, null, customerId, customerEmail);
  }

  async cancelSubscription(subscriptionId, cancelData, customerId = null, customerEmail = null) {
    return await this.makeCustomerRequest('POST', `/subscriptions/${subscriptionId}/cancel`, cancelData, null, customerId, customerEmail);
  }

  async activateSubscription(subscriptionId, customerId = null, customerEmail = null) {
    return await this.makeCustomerRequest('POST', `/subscriptions/${subscriptionId}/activate`, {}, null, customerId, customerEmail);
  }

  async setNextChargeDate(subscriptionId, date, customerId = null, customerEmail = null) {
    return await this.makeCustomerRequest('POST', `/subscriptions/${subscriptionId}/set_next_charge_date`, { date }, null, customerId, customerEmail);
  }

  // Address methods
  async getAddresses(params = {}, customerId = null, customerEmail = null) {
    return await this.makeCustomerRequest('GET', '/addresses', null, params, customerId, customerEmail);
  }

  async getAddress(addressId, customerId = null, customerEmail = null) {
    return await this.makeCustomerRequest('GET', `/addresses/${addressId}`, null, null, customerId, customerEmail);
  }

  async createAddress(addressData, customerId = null, customerEmail = null) {
    return await this.makeCustomerRequest('POST', '/addresses', addressData, null, customerId, customerEmail);
  }

  async updateAddress(addressId, addressData, customerId = null, customerEmail = null) {
    return await this.makeCustomerRequest('PUT', `/addresses/${addressId}`, addressData, null, customerId, customerEmail);
  }

  async deleteAddress(addressId, customerId = null, customerEmail = null) {
    return await this.makeCustomerRequest('DELETE', `/addresses/${addressId}`, null, null, customerId, customerEmail);
  }

  // Payment methods
  async getPaymentMethods(params = {}, customerId = null, customerEmail = null) {
    return await this.makeCustomerRequest('GET', '/payment_methods', null, params, customerId, customerEmail);
  }

  async getPaymentMethod(paymentMethodId, customerId = null, customerEmail = null) {
    return await this.makeCustomerRequest('GET', `/payment_methods/${paymentMethodId}`, null, null, customerId, customerEmail);
  }

  async updatePaymentMethod(paymentMethodId, paymentData, customerId = null, customerEmail = null) {
    return await this.makeCustomerRequest('PUT', `/payment_methods/${paymentMethodId}`, paymentData, null, customerId, customerEmail);
  }

  // Product methods
  async getProducts(params = {}, customerId = null, customerEmail = null) {
    return await this.makeCustomerRequest('GET', '/products', null, params, customerId, customerEmail);
  }

  async getProduct(productId, customerId = null, customerEmail = null) {
    return await this.makeCustomerRequest('GET', `/products/${productId}`, null, null, customerId, customerEmail);
  }

  // Order methods
  async getOrders(params = {}, customerId = null, customerEmail = null) {
    return await this.makeCustomerRequest('GET', '/orders', null, params, customerId, customerEmail);
  }

  async getOrder(orderId, customerId = null, customerEmail = null) {
    return await this.makeCustomerRequest('GET', `/orders/${orderId}`, null, null, customerId, customerEmail);
  }

  // Charge methods
  async getCharges(params = {}, customerId = null, customerEmail = null) {
    return await this.makeCustomerRequest('GET', '/charges', null, params, customerId, customerEmail);
  }

  async getCharge(chargeId, customerId = null, customerEmail = null) {
    return await this.makeCustomerRequest('GET', `/charges/${chargeId}`, null, null, customerId, customerEmail);
  }

  // One-time product methods
  async getOnetimes(params = {}, customerId = null, customerEmail = null) {
    return await this.makeCustomerRequest('GET', '/onetimes', null, params, customerId, customerEmail);
  }

  async getOnetime(onetimeId, customerId = null, customerEmail = null) {
    return await this.makeCustomerRequest('GET', `/onetimes/${onetimeId}`, null, null, customerId, customerEmail);
  }

  async createOnetime(onetimeData, customerId = null, customerEmail = null) {
    return await this.makeCustomerRequest('POST', '/onetimes', onetimeData, null, customerId, customerEmail);
  }

  async updateOnetime(onetimeId, onetimeData, customerId = null, customerEmail = null) {
    return await this.makeCustomerRequest('PUT', `/onetimes/${onetimeId}`, onetimeData, null, customerId, customerEmail);
  }

  async deleteOnetime(onetimeId, customerId = null, customerEmail = null) {
    return await this.makeCustomerRequest('DELETE', `/onetimes/${onetimeId}`, null, null, customerId, customerEmail);
  }

  // Bundle methods
  async getBundles(params = {}, customerId = null, customerEmail = null) {
    return await this.makeCustomerRequest('GET', '/bundles', null, params, customerId, customerEmail);
  }

  async getBundle(bundleId, customerId = null, customerEmail = null) {
    return await this.makeCustomerRequest('GET', `/bundles/${bundleId}`, null, null, customerId, customerEmail);
  }

  async getBundleSelections(bundleId, params = {}, customerId = null, customerEmail = null) {
    return await this.makeCustomerRequest('GET', `/bundles/${bundleId}/bundle_selections`, null, params, customerId, customerEmail);
  }

  async getBundleSelection(bundleSelectionId, customerId = null, customerEmail = null) {
    return await this.makeCustomerRequest('GET', `/bundle_selections/${bundleSelectionId}`, null, null, customerId, customerEmail);
  }

  async createBundleSelection(selectionData, customerId = null, customerEmail = null) {
    return await this.makeCustomerRequest('POST', '/bundle_selections', selectionData, null, customerId, customerEmail);
  }

  async updateBundleSelection(bundleSelectionId, selectionData, customerId = null, customerEmail = null) {
    return await this.makeCustomerRequest('PUT', `/bundle_selections/${bundleSelectionId}`, selectionData, null, customerId, customerEmail);
  }

  async deleteBundleSelection(bundleSelectionId, customerId = null, customerEmail = null) {
    return await this.makeCustomerRequest('DELETE', `/bundle_selections/${bundleSelectionId}`, null, null, customerId, customerEmail);
  }

  // Discount methods
  async getDiscounts(params = {}, customerId = null, customerEmail = null) {
    return await this.makeCustomerRequest('GET', '/discounts', null, params, customerId, customerEmail);
  }

  async getDiscount(discountId, customerId = null, customerEmail = null) {
    return await this.makeCustomerRequest('GET', `/discounts/${discountId}`, null, null, customerId, customerEmail);
  }

  async applyDiscount(discountCode, customerId = null, customerEmail = null) {
    return await this.makeCustomerRequest('POST', '/discounts', { discount_code: discountCode }, null, customerId, customerEmail);
  }

  async removeDiscount(discountId, customerId = null, customerEmail = null) {
    return await this.makeCustomerRequest('DELETE', `/discounts/${discountId}`, null, null, customerId, customerEmail);
  }
}