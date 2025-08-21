/**
 * Custom error class for Recharge API errors
 * 
 * @class RechargeAPIError
 * @extends Error
 */
export class RechargeAPIError extends Error {
  /**
   * Create a RechargeAPIError
   * 
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {string|null} errorCode - Recharge-specific error code
   * @param {Object|null} details - Additional error details
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
 * @param {Error} error - Axios error object
 * @throws {RechargeAPIError} Formatted API error
 */
export function handleAPIError(error) {
  if (error.response) {
    const { status, data } = error.response;
    
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
 * @param {Error} error - Error object
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
 * @param {Object} params - Parameters to validate
 * @param {string[]} required - Required parameter names
 * @throws {Error} If required parameters are missing
 */
export function validateRequiredParams(params, required) {
  const missing = required.filter(param => 
    params[param] === undefined || 
    params[param] === null || 
    (typeof params[param] === 'string' && params[param].trim() === '') ||
    (Array.isArray(params[param]) && params[param].length === 0)
  );
  
  if (missing.length > 0) {
    throw new Error(`Missing required parameters: ${missing.join(', ')}`);
  }
}

/**
 * Sanitize error message for logging
 * @param {string} message - Error message
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
    .replace(/secret[s]?[:\s=]+[^\s]+/gi, 'secret=***');
}