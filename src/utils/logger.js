/**
 * Structured Logger Implementation
 * Provides consistent, structured logging throughout the application
 */

/**
 * Log levels in order of severity
 */
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

/**
 * Get current log level from environment
 * @returns {number} Current log level
 */
function getCurrentLogLevel() {
  const level = process.env.LOG_LEVEL || (process.env.DEBUG === 'true' ? 'DEBUG' : 'INFO');
  return LOG_LEVELS[level.toUpperCase()] ?? LOG_LEVELS.INFO;
}

/**
 * Sanitize sensitive data from objects
 * @param {any} data Data to sanitize
 * @returns {any} Sanitized data
 */
function sanitizeData(data) {
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  if (Array.isArray(data)) {
    return data.map(sanitizeData);
  }
  
  const sanitized = {};
  const sensitiveKeys = [
    'token', 'password', 'secret', 'key', 'authorization', 
    'x-recharge-access-token', 'bearer', 'auth'
  ];
  
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
      sanitized[key] = '***REDACTED***';
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeData(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Format log entry as JSON
 * @param {string} level Log level
 * @param {string} message Log message
 * @param {Object} [meta={}] Additional metadata
 * @returns {string} Formatted log entry
 */
function formatLogEntry(level, message, meta = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level: level.toUpperCase(),
    message,
    ...sanitizeData(meta)
  };
  
  // Add process information
  entry.process = {
    pid: process.pid,
    version: process.version,
    platform: process.platform
  };
  
  return JSON.stringify(entry);
}

/**
 * Logger class with structured logging capabilities
 */
export class Logger {
  /**
   * Create a logger instance
   * @param {string} [component] Component name for logging context
   */
  constructor(component = 'app') {
    this.component = component;
    this.currentLevel = getCurrentLogLevel();
  }

  /**
   * Log an error message
   * @param {string} message Error message
   * @param {Object} [meta={}] Additional metadata
   * @param {Error} [error] Error object
   */
  error(message, meta = {}, error = null) {
    if (this.currentLevel >= LOG_LEVELS.ERROR) {
      const logMeta = {
        component: this.component,
        ...meta
      };
      
      if (error) {
        logMeta.error = {
          name: error.name,
          message: error.message,
          stack: error.stack,
          ...(error.statusCode && { statusCode: error.statusCode }),
          ...(error.errorCode && { errorCode: error.errorCode })
        };
      }
      
      console.error(formatLogEntry('ERROR', message, logMeta));
    }
  }

  /**
   * Log a warning message
   * @param {string} message Warning message
   * @param {Object} [meta={}] Additional metadata
   */
  warn(message, meta = {}) {
    if (this.currentLevel >= LOG_LEVELS.WARN) {
      console.error(formatLogEntry('WARN', message, {
        component: this.component,
        ...meta
      }));
    }
  }

  /**
   * Log an info message
   * @param {string} message Info message
   * @param {Object} [meta={}] Additional metadata
   */
  info(message, meta = {}) {
    if (this.currentLevel >= LOG_LEVELS.INFO) {
      console.error(formatLogEntry('INFO', message, {
        component: this.component,
        ...meta
      }));
    }
  }

  /**
   * Log a debug message
   * @param {string} message Debug message
   * @param {Object} [meta={}] Additional metadata
   */
  debug(message, meta = {}) {
    if (this.currentLevel >= LOG_LEVELS.DEBUG) {
      console.error(formatLogEntry('DEBUG', message, {
        component: this.component,
        ...meta
      }));
    }
  }

  /**
   * Create a child logger with additional context
   * @param {string} childComponent Child component name
   * @param {Object} [context={}] Additional context to include in all logs
   * @returns {Logger} Child logger instance
   */
  child(childComponent, context = {}) {
    const child = new Logger(`${this.component}:${childComponent}`);
    child.defaultContext = context;
    
    // Override logging methods to include default context
    const originalMethods = ['error', 'warn', 'info', 'debug'];
    originalMethods.forEach(method => {
      const originalMethod = child[method].bind(child);
      child[method] = (message, meta = {}, ...args) => {
        return originalMethod(message, { ...child.defaultContext, ...meta }, ...args);
      };
    });
    
    return child;
  }
}

/**
 * Default logger instance
 */
export const logger = new Logger('recharge-mcp');

/**
 * Create a logger for a specific component
 * @param {string} component Component name
 * @returns {Logger} Logger instance
 */
export function createLogger(component) {
  return new Logger(component);
}