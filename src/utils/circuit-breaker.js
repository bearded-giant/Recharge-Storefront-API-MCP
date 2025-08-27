/**
 * Circuit Breaker Pattern Implementation
 * Prevents cascading failures by monitoring API call success/failure rates
 */

export class CircuitBreaker {
  /**
   * Create a circuit breaker
   * @param {Object} options Configuration options
   * @param {number} [options.failureThreshold=5] Number of failures before opening circuit
   * @param {number} [options.resetTimeout=60000] Time in ms before attempting to close circuit
   * @param {number} [options.monitoringPeriod=60000] Time window for monitoring failures
   */
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000; // 1 minute
    this.monitoringPeriod = options.monitoringPeriod || 60000; // 1 minute
    
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.nextAttemptTime = null;
    
    // Track failures in time window
    this.failures = [];
  }

  /**
   * Execute a function with circuit breaker protection
   * @param {Function} fn Function to execute
   * @param {...any} args Arguments to pass to function
   * @returns {Promise<any>} Function result
   * @throws {Error} Circuit breaker error or original function error
   */
  async execute(fn, ...args) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttemptTime) {
        throw new Error('Circuit breaker is OPEN - requests are being rejected');
      }
      // Try to close circuit
      this.state = 'HALF_OPEN';
    }

    try {
      const result = await fn(...args);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Handle successful execution
   * @private
   */
  onSuccess() {
    this.failureCount = 0;
    this.failures = [];
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
    }
  }

  /**
   * Handle failed execution
   * @private
   */
  onFailure() {
    const now = Date.now();
    this.failures.push(now);
    this.lastFailureTime = now;
    
    // Clean old failures outside monitoring period
    this.failures = this.failures.filter(
      time => now - time < this.monitoringPeriod
    );
    
    this.failureCount = this.failures.length;
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttemptTime = now + this.resetTimeout;
    }
  }

  /**
   * Get current circuit breaker status
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      failureThreshold: this.failureThreshold,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime,
      isOpen: this.state === 'OPEN'
    };
  }

  /**
   * Reset circuit breaker to initial state
   */
  reset() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.failures = [];
    this.lastFailureTime = null;
    this.nextAttemptTime = null;
  }
}