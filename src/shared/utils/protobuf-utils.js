/**
 * Universal Protobuf Utilities
 * 
 * Provides sanitized protobuf creation functions that automatically
 * remove empty optional fields to prevent protobuf from assigning
 * empty string defaults.
 */

import { create } from '@bufbuild/protobuf';
import { sanitizeGrpcPayload } from '../../grpc/utils/sanitize-grpc-payload.js';

/**
 * Universal wrapper for protobuf create function that automatically sanitizes empty optional fields
 * This prevents protobuf from assigning empty string defaults to optional fields
 * 
 * @param {Object} schema - Protobuf schema
 * @param {Object} data - Data to create protobuf object from
 * @returns {Object} Sanitized protobuf object with empty optional fields removed
 * 
 * @example
 * // Instead of: create(CoinTXN, data)
 * // Use: createSanitized(CoinTXN, data)
 * const coinTxn = createSanitized(CoinTXN, {
 *   base: baseTxn,
 *   contractId: '$ZRA+0000',
 *   // contractFeeAmount and contractFeeId will be omitted if not provided
 *   // instead of being set to empty strings
 * });
 */
export function createSanitized(schema, data) {
  const protoObject = create(schema, data);
  return sanitizeGrpcPayload(protoObject);
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
 * Sanitize protobuf object by converting BigInt values to strings for serialization
 * @param {Object} obj - Object to sanitize
 * @returns {Object} Sanitized object
 */
export function sanitizeForSerialization(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'bigint') {
    return obj.toString();
  }
  
  // Preserve Uint8Array objects (they're needed for key extraction)
  if (obj instanceof Uint8Array) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForSerialization(item));
  }
  
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      // Preserve protobuf metadata fields (starting with $)
      if (key.startsWith('$')) {
        sanitized[key] = value;
        continue;
      }
      sanitized[key] = sanitizeForSerialization(value);
    }
    return sanitized;
  }
  
  return obj;
}
