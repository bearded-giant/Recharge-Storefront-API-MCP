/**
 * Custom error class for Recharge API errors
 * 
 */
export class RechargeAPIError extends Error {
  /**
   * Create a RechargeAPIError
   * 
   * @param {string} message Error message
   * @param {number} statusCode HTTP status code
   * @param {string} [errorCode] Recharge-specific error code
   * @param {Object} [details] Additional error details
   */
  constructor(message, statusCode, errorCode = null, details = null) {
    super(message);
    this.name = 'RechargeAPIError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    
    // Ensure proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RechargeAPIError);
    }
  }
  
  /**
   * Convert error to JSON representation
   * @returns {Object} JSON representation of the error
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      errorCode: this.errorCode,
      details: this.details,
      stack: this.stack
    };
  }
}

/**
 * Handle API errors from axios responses
 * 
 * @param {Error} error Axios error object
 * @throws {RechargeAPIError} Formatted API error
 */
export function handleAPIError(error) {
  if (error.response) {
    const { status, data } = error.response;
    
    // Handle redirect errors specially
    if (error.isRedirect) {
      const details = {
        location: error.response.headers.location,
        originalUrl: error.originalUrl || error.config?.url,
        baseUrl: error.config?.baseURL,
        redirectLocation: error.redirectLocation,
        requestHeaders: error.config?.headers,
        responseHeaders: error.response?.headers
      };
      
      if (process.env.DEBUG === 'true') {
        console.error(`[DEBUG] Redirect error details:`, JSON.stringify(details, null, 2));
      }
      
      throw new RechargeAPIError(error.message, status, 'REDIRECT_ERROR', details);
    }
    
    // Extract error message with fallback chain
    let message = 'Unknown API error';
    if (data?.message) {
      message = data.message;
    } else if (data?.error) {
      message = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
    } else if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
      const firstError = data.errors[0];
      message = typeof firstError === 'string' ? firstError : firstError?.message || JSON.stringify(firstError);
    } else if (status) {
      message = `HTTP ${status} Error`;
    } else {
      message = error.message || 'Request failed';
    }
    
    const errorCode = data?.error_code || null;
    const details = {
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      requestData: error.config?.data,
      responseData: data,
      headers: error.response?.headers
    };
    
    // Log detailed error information for debugging
    if (process.env.DEBUG) {
      console.error(`[DEBUG] API Error ${status}:`, {
        message,
        errorCode,
        details
      });
    }
    
    throw new RechargeAPIError(message, status, errorCode, details);
  } else if (error.request) {
    const details = {
      timeout: error.code === 'ECONNABORTED',
      requestConfig: {
        url: error.config?.url,
        method: error.config?.method?.toUpperCase(),
        timeout: error.config?.timeout
      }
    };
    
    if (process.env.DEBUG) {
      console.error('[DEBUG] Network error - no response received:', {
        message: error.message,
        code: error.code,
        details
      });
    }
    
    const message = error.code === 'ECONNABORTED' 
      ? 'Request timeout - the server took too long to respond'
      : 'Network error: No response received from server';
      
    throw new RechargeAPIError(message, 500, null, details);
  } else {
    const details = {
      originalError: error.message,
      stack: error.stack,
      config: error.config
    };
    
    if (process.env.DEBUG) {
      console.error('[DEBUG] Request setup error:', {
        message: error.message,
        details
      });
    }
    
    throw new RechargeAPIError(`Request setup error: ${error.message}`, 500, null, details);
  }
}

/**
 * Format error response for MCP protocol
 * 
 * @param {Error} error Error object
 * @returns {Object} Formatted MCP error response
 */
export function formatErrorResponse(error) {
  if (error instanceof RechargeAPIError) {
    let errorText = `API Error (${error.statusCode}): ${error.message}`;
    
    if (error.errorCode) {
      errorText += ` (Code: ${error.errorCode})`;
    }
    
    // Add helpful context for common errors
    if (error.statusCode === 401) {
      errorText += '\n\nTip: Check your API access token and ensure it has the required permissions.';
    } else if (error.statusCode === 404) {
      errorText += '\n\nTip: Verify the resource ID exists and you have access to it.';
    } else if (error.statusCode === 429) {
      errorText += '\n\nTip: You have exceeded the API rate limit. Please wait before making more requests.';
    } else if (error.statusCode >= 500) {
      errorText += '\n\nTip: This appears to be a server error. Please try again later.';
    }
    
    return {
      content: [
        {
          type: 'text',
          text: errorText,
        },
      ],
      isError: true,
      _meta: {
        errorType: 'RechargeAPIError',
        statusCode: error.statusCode,
        errorCode: error.errorCode,
        timestamp: new Date().toISOString()
      }
    };
  }
  
  return {
    content: [
      {
        type: 'text',
        text: `Error: ${error.message}`,
      },
    ],
    isError: true,
    _meta: {
      errorType: error.name || 'UnknownError',
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * Validate required parameters
 * @param {Object} params Parameters to validate
 * @param {string[]} required Required parameter names
 * @throws {Error} If required parameters are missing
 * @throws {Error} If parameters are invalid format
 */
export function validateRequiredParams(params, required) {
  if (!params || typeof params !== 'object') {
    throw new Error('Parameters must be an object');
  }
  
  if (!Array.isArray(required)) {
    throw new Error('Required parameters must be an array');
  }
  
  const missing = required.filter(param => 
    params[param] === undefined || 
    params[param] === null || 
    (typeof params[param] === 'string' && params[param].trim() === '') ||
    (typeof params[param] === 'number' && (isNaN(params[param]) || params[param] < 0))
  );
  
  if (missing.length > 0) {
    throw new Error(`Missing required parameters: ${missing.join(', ')}`);
  }
  
  // Validate email format if email parameter exists
  if (params.email && typeof params.email === 'string') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(params.email)) {
      throw new Error('Invalid email format');
    }
  }
  
  // Validate date format if date parameters exist
  const dateFields = ['date', 'next_charge_scheduled_at'];
  dateFields.forEach(field => {
    if (params[field] && typeof params[field] === 'string') {
      // Allow both YYYY-MM-DD and ISO datetime formats
      const dateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
      if (!dateRegex.test(params[field])) {
        throw new Error(`Invalid date format for ${field}. Expected YYYY-MM-DD or ISO datetime format`);
      }
    }
  });
}

/**
 * Sanitize error message for logging
 * @param {string} message Error message
 * @returns {string} Sanitized message
 */
export function sanitizeErrorMessage(message) {
  if (typeof message !== 'string') {
    return 'Invalid error message format';
  }
  
  // Remove potential sensitive information
  return message
    .replace(/token[s]?[:\s=]+[a-zA-Z0-9_-]+/gi, 'token=***')
    .replace(/key[s]?[:\s=]+[a-zA-Z0-9_-]+/gi, 'key=***')
    .replace(/password[s]?[:\s=]+[^\s]+/gi, 'password=***')
    .replace(/secret[s]?[:\s=]+[^\s]+/gi, 'secret=***')
    .replace(/Bearer\s+[a-zA-Z0-9_-]+/gi, 'Bearer ***')
    .replace(/X-Recharge-Access-Token[:\s=]+[a-zA-Z0-9_-]+/gi, 'X-Recharge-Access-Token: ***');
}