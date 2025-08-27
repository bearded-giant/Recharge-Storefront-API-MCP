/**
 * Runtime Type Validation Utilities
 * Provides comprehensive runtime type checking and validation
 */

/**
 * Type validation error
 */
export class TypeValidationError extends Error {
  /**
   * Create a type validation error
   * @param {string} message Error message
   * @param {string} path Property path where validation failed
   * @param {any} value The invalid value
   * @param {string} expectedType Expected type
   */
  constructor(message, path, value, expectedType) {
    super(message);
    this.name = 'TypeValidationError';
    this.path = path;
    this.value = value;
    this.expectedType = expectedType;
  }
}

/**
 * Check if value is of expected type
 * @param {any} value Value to check
 * @param {string} expectedType Expected type
 * @returns {boolean} Whether value matches expected type
 */
function isType(value, expectedType) {
  switch (expectedType) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && !isNaN(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value);
    case 'array':
      return Array.isArray(value);
    case 'null':
      return value === null;
    case 'undefined':
      return value === undefined;
    case 'function':
      return typeof value === 'function';
    case 'date':
      return value instanceof Date && !isNaN(value.getTime());
    case 'email':
      return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    case 'url':
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    case 'uuid':
      return typeof value === 'string' && 
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
    case 'iso-date':
      return typeof value === 'string' && 
        /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/.test(value);
    default:
      return false;
  }
}

/**
 * Validate object against schema
 * @param {any} obj Object to validate
 * @param {Object} schema Validation schema
 * @param {string} [path=''] Current path for error reporting
 * @throws {TypeValidationError} If validation fails
 */
export function validateSchema(obj, schema, path = '') {
  if (schema.type && !isType(obj, schema.type)) {
    throw new TypeValidationError(
      `Expected ${schema.type} at ${path || 'root'}, got ${typeof obj}`,
      path,
      obj,
      schema.type
    );
  }

  if (schema.required && (obj === null || obj === undefined)) {
    throw new TypeValidationError(
      `Required value missing at ${path || 'root'}`,
      path,
      obj,
      'required'
    );
  }

  if (schema.enum && !schema.enum.includes(obj)) {
    throw new TypeValidationError(
      `Value at ${path || 'root'} must be one of: ${schema.enum.join(', ')}`,
      path,
      obj,
      `enum[${schema.enum.join(', ')}]`
    );
  }

  if (schema.min !== undefined && obj < schema.min) {
    throw new TypeValidationError(
      `Value at ${path || 'root'} must be >= ${schema.min}`,
      path,
      obj,
      `min:${schema.min}`
    );
  }

  if (schema.max !== undefined && obj > schema.max) {
    throw new TypeValidationError(
      `Value at ${path || 'root'} must be <= ${schema.max}`,
      path,
      obj,
      `max:${schema.max}`
    );
  }

  if (schema.minLength !== undefined && obj.length < schema.minLength) {
    throw new TypeValidationError(
      `Value at ${path || 'root'} must have length >= ${schema.minLength}`,
      path,
      obj,
      `minLength:${schema.minLength}`
    );
  }

  if (schema.maxLength !== undefined && obj.length > schema.maxLength) {
    throw new TypeValidationError(
      `Value at ${path || 'root'} must have length <= ${schema.maxLength}`,
      path,
      obj,
      `maxLength:${schema.maxLength}`
    );
  }

  if (schema.pattern && !schema.pattern.test(obj)) {
    throw new TypeValidationError(
      `Value at ${path || 'root'} does not match required pattern`,
      path,
      obj,
      `pattern:${schema.pattern}`
    );
  }

  // Validate object properties
  if (schema.properties && typeof obj === 'object' && obj !== null) {
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      const propPath = path ? `${path}.${key}` : key;
      if (obj.hasOwnProperty(key)) {
        validateSchema(obj[key], propSchema, propPath);
      } else if (propSchema.required) {
        throw new TypeValidationError(
          `Required property ${key} missing at ${path || 'root'}`,
          propPath,
          undefined,
          'required'
        );
      }
    }
  }

  // Validate array items
  if (schema.items && Array.isArray(obj)) {
    obj.forEach((item, index) => {
      const itemPath = `${path}[${index}]`;
      validateSchema(item, schema.items, itemPath);
    });
  }
}

/**
 * Validate API response structure
 * @param {any} response API response to validate
 * @param {Object} expectedSchema Expected response schema
 * @throws {TypeValidationError} If response doesn't match schema
 */
export function validateApiResponse(response, expectedSchema) {
  try {
    validateSchema(response, expectedSchema, 'response');
  } catch (error) {
    if (error instanceof TypeValidationError) {
      throw new TypeValidationError(
        `API response validation failed: ${error.message}`,
        error.path,
        error.value,
        error.expectedType
      );
    }
    throw error;
  }
}

/**
 * Common validation schemas for Recharge API
 */
export const RECHARGE_SCHEMAS = {
  customer: {
    type: 'object',
    properties: {
      id: { type: 'number', required: true },
      email: { type: 'email', required: true },
      first_name: { type: 'string' },
      last_name: { type: 'string' },
      created_at: { type: 'iso-date' },
      updated_at: { type: 'iso-date' }
    }
  },
  
  subscription: {
    type: 'object',
    properties: {
      id: { type: 'number', required: true },
      customer_id: { type: 'number', required: true },
      status: { 
        type: 'string', 
        enum: ['active', 'cancelled', 'expired'],
        required: true 
      },
      next_charge_scheduled_at: { type: 'iso-date' },
      order_interval_frequency: { type: 'number', min: 1 },
      order_interval_unit: { 
        type: 'string', 
        enum: ['day', 'week', 'month'] 
      }
    }
  },
  
  address: {
    type: 'object',
    properties: {
      id: { type: 'number', required: true },
      customer_id: { type: 'number', required: true },
      first_name: { type: 'string', required: true },
      last_name: { type: 'string', required: true },
      address1: { type: 'string', required: true },
      city: { type: 'string', required: true },
      province: { type: 'string', required: true },
      zip: { type: 'string', required: true },
      country: { type: 'string', required: true }
    }
  }
};

/**
 * Create a validator function for a specific schema
 * @param {Object} schema Validation schema
 * @returns {Function} Validator function
 */
export function createValidator(schema) {
  return (obj) => {
    validateSchema(obj, schema);
    return obj;
  };
}