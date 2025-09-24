/**
 * Universal Protobuf Utilities
 * 
 * Provides comprehensive sanitization for protobuf objects to ensure
 * they never contain empty strings for optional fields and properly
 * handle BigInt serialization.
 */

import { create } from '@bufbuild/protobuf';

/**
 * Universal sanitization function for protobuf objects
 * Handles both empty field removal and BigInt conversion
 * 
 * @param {Object} obj - Object to sanitize
 * @param {Object} options - Sanitization options
 * @param {boolean} options.removeEmptyFields - Remove empty strings, arrays, objects
 * @param {boolean} options.convertBigInt - Convert BigInt to strings
 * @returns {Object} Sanitized object
 */
export function sanitizeProtobufObject(obj, options = {}) {
  const { removeEmptyFields = false, convertBigInt = false } = options;
  
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  // Convert BigInt to string if requested
  if (convertBigInt && typeof obj === 'bigint') {
    return obj.toString();
  }
  
  // Preserve Uint8Array objects (they're needed for key extraction)
  if (obj instanceof Uint8Array) {
    return obj.length === 0 && removeEmptyFields ? undefined : obj;
  }
  
  if (Array.isArray(obj)) {
    const sanitized = obj.map(item => sanitizeProtobufObject(item, options));
    const filtered = removeEmptyFields ? sanitized.filter(item => item !== undefined) : sanitized;
    return filtered.length > 0 ? filtered : (removeEmptyFields ? undefined : []);
  }
  
  if (typeof obj === 'object') {
    const result = {};
    
    for (const [key, value] of Object.entries(obj)) {
      // Always preserve protobuf metadata fields (starting with $)
      if (key.startsWith('$')) {
        result[key] = value;
        continue;
      }
      
      const sanitized = sanitizeProtobufObject(value, options);
      
      // For string fields, convert empty strings to undefined if requested
      if (removeEmptyFields && typeof sanitized === 'string' && sanitized.length === 0) {
        result[key] = undefined;
        continue;
      }
      
      // Always include the field - don't skip undefined values
      result[key] = sanitized;
    }
    
    return Object.keys(result).length > 0 ? result : (removeEmptyFields ? undefined : {});
  }
  
  // Handle primitive types
  if (typeof obj === 'string') {
    if (removeEmptyFields && obj.length === 0) {
      return undefined;
    }
    return obj;
  }
  
  if (typeof obj === 'boolean') {
    return obj;
  }
  
  if (typeof obj === 'number') {
    return obj;
  }
  
  return obj;
}

/**
 * Create a protobuf object with comprehensive sanitization
 * This ensures optional fields are never empty strings
 * 
 * @param {Object} schema - Protobuf schema
 * @param {Object} data - Data to create protobuf object from
 * @returns {Object} Sanitized protobuf object
 */
export function createSanitized(schema, data) {
  // First sanitize the input data to remove empty optional fields
  const sanitizedData = sanitizeProtobufObject(data, { removeEmptyFields: true });
  
  // Then create the protobuf object
  return create(schema, sanitizedData);
}

/**
 * Sanitize object for serialization (BigInt conversion)
 * 
 * @param {Object} obj - Object to sanitize
 * @returns {Object} Sanitized object with BigInt converted to strings
 */
export function sanitizeForSerialization(obj) {
  return sanitizeProtobufObject(obj, { convertBigInt: true });
}

/**
 * Create multiple protobuf objects with sanitization
 * Useful for creating arrays of protobuf objects
 * 
 * @param {Object} schema - Protobuf schema
 * @param {Array} dataArray - Array of data objects
 * @returns {Array} Array of sanitized protobuf objects
 */
export function createSanitizedArray(schema, dataArray) {
  return dataArray.map(data => createSanitized(schema, data));
}

/**
 * Conditionally create sanitized protobuf object
 * Only creates if data is not null/undefined
 * 
 * @param {Object} schema - Protobuf schema
 * @param {Object} data - Data to create protobuf object from
 * @returns {Object|undefined} Sanitized protobuf object or undefined
 */
export function createSanitizedConditional(schema, data) {
  if (data === null || data === undefined) {
    return undefined;
  }
  return createSanitized(schema, data);
}