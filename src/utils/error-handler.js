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
   */
  constructor(message, statusCode, errorCode = null) {
    super(message);
    this.name = 'RechargeAPIError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
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
    const message = data?.message || data?.error || data?.errors?.[0]?.message || error.message;
    const errorCode = data?.error_code || null;
    
    // Log detailed error information for debugging
    if (process.env.DEBUG) {
      console.error(`[DEBUG] API Error ${status}:`, {
        url: error.config?.url,
        method: error.config?.method,
        data: data,
        headers: error.config?.headers
      });
    }
    
    throw new RechargeAPIError(message, status, errorCode);
  } else if (error.request) {
    console.error('[ERROR] Network error - no response received:', error.message);
    throw new RechargeAPIError('Network error: No response received', 500);
  } else {
    console.error('[ERROR] Request setup error:', error.message);
    throw new RechargeAPIError(`Request setup error: ${error.message}`, 500);
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
    return {
      content: [
        {
          type: 'text',
          text: `API Error (${error.statusCode}): ${error.message}${error.errorCode ? ` (Code: ${error.errorCode})` : ''}`,
        },
      ],
    };
  }
  
  return {
    content: [
      {
        type: 'text',
        text: `Error: ${error.message}`,
      },
    ],
  };
}