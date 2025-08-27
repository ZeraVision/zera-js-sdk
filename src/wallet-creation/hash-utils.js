import { sha3_256, sha3_512 } from '@noble/hashes/sha3';
import { blake3 } from '@noble/hashes/blake3';
import { 
  HASH_TYPE, 
  HASH_TYPE_PREFIXES, 
  isValidHashType,
  VALID_HASH_TYPES 
} from './constants.js';
import { InvalidHashTypeError } from './errors.js';

// Hash type mappings - only use the enum values
export const HASH_FUNCTIONS = {
  [HASH_TYPE.SHA3_256]: sha3_256,
  [HASH_TYPE.SHA3_512]: sha3_512,
  [HASH_TYPE.BLAKE3]: blake3
};

// Hash type prefixes for display - use the enum constants
export const HASH_PREFIXES = HASH_TYPE_PREFIXES;

/**
 * Apply a single hash function to data
 * @param {Buffer|Uint8Array} data - Data to hash
 * @param {string} hashType - Hash type from HASH_TYPE enum
 * @returns {Uint8Array} Hashed data
 */
export function applyHash(data, hashType) {
  if (!isValidHashType(hashType)) {
    throw new InvalidHashTypeError(hashType, VALID_HASH_TYPES);
  }
  
  return HASH_FUNCTIONS[hashType](data);
}

/**
 * Apply multiple hash functions in right-to-left order
 * @param {Buffer|Uint8Array} data - Initial data to hash
 * @param {Array<string>} hashTypes - Array of hash types from HASH_TYPE enum
 * @returns {Uint8Array} Final hashed data
 */
export function applyHashChain(data, hashTypes) {
  if (!Array.isArray(hashTypes) || hashTypes.length === 0) {
    throw new Error('Hash types must be a non-empty array');
  }
  
  // Validate all hash types before processing
  for (const hashType of hashTypes) {
    if (!isValidHashType(hashType)) {
      throw new InvalidHashTypeError(hashType, VALID_HASH_TYPES);
    }
  }
  
  let result = data;
  
  // Apply hashes from right to left (reverse order)
  for (let i = hashTypes.length - 1; i >= 0; i--) {
    const hashType = hashTypes[i];
    result = applyHash(result, hashType);
  }
  
  return result;
}

/**
 * Generate hash chain prefix for display
 * @param {Array<string>} hashTypes - Array of hash types from HASH_TYPE enum
 * @returns {string} Hash chain prefix
 */
export function generateHashPrefix(hashTypes) {
  if (!Array.isArray(hashTypes) || hashTypes.length === 0) {
    return '';
  }
  
  // Build prefix from left to right (as they appear in the array)
  return hashTypes.map(hashType => HASH_PREFIXES[hashType]).join('');
}

/**
 * Validate hash types array
 * @param {Array<string>} hashTypes - Array of hash types to validate
 * @returns {boolean} True if all hash types are valid
 */
export function validateHashTypes(hashTypes) {
  if (!Array.isArray(hashTypes)) {
    return false;
  }
  
  return hashTypes.every(hashType => isValidHashType(hashType));
}

/**
 * Get supported hash types
 * @returns {Array<string>} Array of supported hash type names
 */
export function getSupportedHashTypes() {
  return VALID_HASH_TYPES;
}

/**
 * Get hash function information
 * @param {string} hashType - Hash type name from HASH_TYPE enum
 * @returns {Object} Hash function information
 */
export function getHashInfo(hashType) {
  if (!isValidHashType(hashType)) {
    throw new InvalidHashTypeError(hashType, VALID_HASH_TYPES);
  }
  
  return {
    name: hashType,
    prefix: HASH_PREFIXES[hashType],
    function: HASH_FUNCTIONS[hashType],
    outputSize: hashType === HASH_TYPE.SHA3_256 ? 32 : 64 // sha3-256: 32 bytes, others: 64 bytes
  };
}

/**
 * Get all hash information
 * @returns {Object} All hash functions information
 */
export function getAllHashInfo() {
  const info = {};
  for (const hashType of VALID_HASH_TYPES) {
    info[hashType] = getHashInfo(hashType);
  }
  return info;
}
