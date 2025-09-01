/**
 * Session Cache Manager
 * Handles caching and automatic renewal of customer session tokens
 */

export class SessionCache {
  constructor() {
    this.sessions = new Map(); // customer_id -> { token, expiresAt, email }
    this.emailToCustomerId = new Map(); // email -> customer_id
    
    // Session tokens expire after 1 hour, we'll refresh 5 minutes early
    this.SESSION_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
    this.REFRESH_BUFFER = 5 * 60 * 1000; // 5 minutes in milliseconds
  }

  /**
   * Get cached session token for customer
   * @param {string} customerId - Customer ID
   * @returns {string|null} Session token if valid, null if expired/missing
   */
  getSessionToken(customerId) {
    const session = this.sessions.get(customerId);
    if (!session) {
      return null;
    }

    // Check if session is expired or needs refresh
    const now = Date.now();
    if (now >= session.expiresAt - this.REFRESH_BUFFER) {
      // Session expired or needs refresh
      this.sessions.delete(customerId);
      return null;
    }

    return session.token;
  }

  /**
   * Cache session token for customer
   * @param {string} customerId - Customer ID
   * @param {string} sessionToken - Session token
   * @param {string} [email] - Customer email for reverse lookup
   */
  setSessionToken(customerId, sessionToken, email = null) {
    // Validate inputs
    if (!customerId || typeof customerId !== 'string') {
      throw new Error('Customer ID is required and must be a string');
    }
    if (!sessionToken || typeof sessionToken !== 'string') {
      throw new Error('Session token is required and must be a string');
    }
    
    const expiresAt = Date.now() + this.SESSION_DURATION;
    
    this.sessions.set(customerId, {
      token: sessionToken,
      expiresAt,
      email
    });

    // Cache email -> customer_id mapping if email provided
    if (email) {
      this.emailToCustomerId.set(email, customerId);
    }

    if (process.env.DEBUG === 'true') {
      // Don't log the actual session token for security
      console.error(`[DEBUG] Cached session for customer ${customerId}, expires at ${new Date(expiresAt).toISOString()}`);
    }
  }

  /**
   * Get customer ID from cached email lookup
   * @param {string} email - Customer email
   * @returns {string|null} Customer ID if cached, null otherwise
   */
  getCustomerIdByEmail(email) {
    if (!email || typeof email !== 'string') {
      return null;
    }
    return this.emailToCustomerId.get(email) || null;
  }

  /**
   * Cache email -> customer_id mapping
   * @param {string} email - Customer email
   * @param {string} customerId - Customer ID
   */
  setCustomerIdByEmail(email, customerId) {
    if (!email || !customerId || typeof email !== 'string' || typeof customerId !== 'string') {
      throw new Error('Both email and customer ID are required and must be strings');
    }
    
    this.emailToCustomerId.set(email, customerId);
    
    if (process.env.DEBUG === 'true') {
      console.error(`[DEBUG] Cached email lookup: ${email} -> ${customerId}`);
    }
  }

  /**
   * Clear session for customer
   * @param {string} customerId - Customer ID
   */
  clearSession(customerId) {
    if (!customerId || typeof customerId !== 'string') {
      return; // Silently ignore invalid input
    }
    
    const session = this.sessions.get(customerId);
    if (session && session.email) {
      this.emailToCustomerId.delete(session.email);
    }
    this.sessions.delete(customerId);
    
    if (process.env.DEBUG === 'true') {
      console.error(`[DEBUG] Cleared session for customer ${customerId}`);
    }
  }

  /**
   * Clear all cached sessions
   */
  clearAll() {
    this.sessions.clear();
    this.emailToCustomerId.clear();
    
    if (process.env.DEBUG === 'true') {
      console.error('[DEBUG] Cleared all cached sessions');
    }
  }

  /**
   * Clean up expired sessions
   * Should be called periodically to prevent memory leaks
   */
  cleanupExpiredSessions() {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [customerId, session] of this.sessions.entries()) {
      if (now >= session.expiresAt) {
        if (session.email) {
          this.emailToCustomerId.delete(session.email);
        }
        this.sessions.delete(customerId);
        cleanedCount++;
      }
    }
    
    if (process.env.DEBUG === 'true' && cleanedCount > 0) {
      console.error(`[DEBUG] Cleaned up ${cleanedCount} expired sessions`);
    }
    
    return cleanedCount;
  }

  /**
   * Check if customer has valid cached session
   * @param {string} customerId - Customer ID
   * @returns {boolean} True if valid session exists
   */
  hasValidSession(customerId) {
    if (!customerId || typeof customerId !== 'string') {
      return false;
    }
    return this.getSessionToken(customerId) !== null;
  }

  /**
   * Check if any customer sessions exist (for security validation)
   * @returns {boolean} True if any customer sessions are cached
   */
  hasCustomerSessions() {
    return this.sessions.size > 0;
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getStats() {
    const now = Date.now();
    let validSessions = 0;
    let expiredSessions = 0;

    for (const session of this.sessions.values()) {
      if (now >= session.expiresAt - this.REFRESH_BUFFER) {
        expiredSessions++;
      } else {
        validSessions++;
      }
    }

    return {
      totalSessions: this.sessions.size,
      validSessions,
      expiredSessions,
      emailMappings: this.emailToCustomerId.size
    };
  }
}