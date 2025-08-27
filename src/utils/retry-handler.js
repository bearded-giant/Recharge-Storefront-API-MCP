/**
 * Exponential Backoff Retry Handler
 * Implements intelligent retry logic with exponential backoff
 */

/**
 * Sleep for specified milliseconds
 * @param {number} ms Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry configuration options
 * @typedef {Object} RetryOptions
 * @property {number} [maxRetries=3] Maximum number of retry attempts
 * @property {number} [baseDelay=1000] Base delay in milliseconds
 * @property {number} [maxDelay=30000] Maximum delay in milliseconds
 * @property {number} [backoffFactor=2] Exponential backoff multiplier
 * @property {Function} [shouldRetry] Function to determine if error should be retried
 * @property {Function} [onRetry] Callback called before each retry attempt
 */

/**
 * Default function to determine if an error should be retried
 * @param {Error} error The error that occurred
 * @param {number} attempt Current attempt number (0-based)
 * @returns {boolean} Whether to retry
 */
function defaultShouldRetry(error, attempt) {
  // Don't retry client errors (4xx), but retry server errors (5xx) and network errors
  if (error.statusCode) {
    return error.statusCode >= 500;
  }
  
  // Retry network errors, timeouts, and connection issues
  if (error.code === 'ECONNABORTED' || 
      error.code === 'ENOTFOUND' || 
      error.code === 'ECONNRESET' ||
      error.code === 'ETIMEDOUT') {
    return true;
  }
  
  // Don't retry redirect errors or authentication errors
  if (error.isRedirect || error.statusCode === 401 || error.statusCode === 403) {
    return false;
  }
  
  return false;
}

/**
 * Execute a function with exponential backoff retry logic
 * @param {Function} fn Function to execute
 * @param {RetryOptions} [options={}] Retry configuration
 * @returns {Promise<any>} Function result
 * @throws {Error} Last error if all retries failed
 */
export async function withRetry(fn, options = {}) {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    backoffFactor = 2,
    shouldRetry = defaultShouldRetry,
    onRetry = null
  } = options;

  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }
      
      // Check if we should retry this error
      if (!shouldRetry(error, attempt)) {
        break;
      }
      
      // Calculate delay with exponential backoff and jitter
      const delay = Math.min(
        baseDelay * Math.pow(backoffFactor, attempt),
        maxDelay
      );
      
      // Add jitter (±25% of delay)
      const jitter = delay * 0.25 * (Math.random() * 2 - 1);
      const finalDelay = Math.max(0, delay + jitter);
      
      if (process.env.DEBUG === 'true') {
        console.error(`[DEBUG] Retry attempt ${attempt + 1}/${maxRetries} after ${Math.round(finalDelay)}ms delay`);
        console.error(`[DEBUG] Error: ${error.message}`);
      }
      
      // Call retry callback if provided
      if (onRetry) {
        try {
          await onRetry(error, attempt, finalDelay);
        } catch (callbackError) {
          console.error('[ERROR] Retry callback failed:', callbackError.message);
        }
      }
      
      await sleep(finalDelay);
    }
  }
  
  // All retries failed, throw the last error
  throw lastError;
}

/**
 * Create a retry wrapper for a function
 * @param {Function} fn Function to wrap
 * @param {RetryOptions} [options={}] Retry configuration
 * @returns {Function} Wrapped function with retry logic
 */
export function createRetryWrapper(fn, options = {}) {
  return async (...args) => {
    return withRetry(() => fn(...args), options);
  };
}