import { sha256, sha512 } from '@noble/hashes/sha2';
import { sha3_256, sha3_512 } from '@noble/hashes/sha3';
import { blake3 } from '@noble/hashes/blake3';
import { ripemd160 } from '@noble/hashes/ripemd160';
import { hmac } from '@noble/hashes/hmac';
import { HASH_TYPE, VALID_HASH_TYPES } from './constants.js';

/**
 * Utility functions for byte manipulation
 */
const ByteUtils = {
  /**
   * Generate cryptographically secure random bytes
   * @param {number} length - Number of bytes to generate
   * @returns {Uint8Array} Random bytes
   */
  randomBytes(length) {
    const array = new Uint8Array(length);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(array);
    } else {
      // Fallback for Node.js
      const crypto = require('crypto');
      crypto.randomFillSync(array);
    }
    return array;
  },

  /**
   * Compare two byte arrays for equality
   * @param {Uint8Array} a - First byte array
   * @param {Uint8Array} b - Second byte array
   * @returns {boolean} True if equal
   */
  equalBytes(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
};

/**
 * Hash algorithms using @noble libraries
 */
const HASH_ALGORITHMS = {
  [HASH_TYPE.SHA3_256]: sha3_256,
  [HASH_TYPE.SHA3_512]: sha3_512,
  [HASH_TYPE.BLAKE3]: blake3,
  // Additional hash algorithms for compatibility
  'sha256': sha256,
  'sha512': sha512,
  'ripemd160': ripemd160
};

/**
 * Validate hash types array
 * @param {Array<string>} hashTypes - Array of hash types to validate
 * @returns {boolean} True if all hash types are valid
 */
export function validateHashTypes(hashTypes) {
  if (!Array.isArray(hashTypes)) {
    return false;
  }
  
  return hashTypes.every(hashType => VALID_HASH_TYPES.includes(hashType));
}

/**
 * Hash data using specified algorithm
 * @param {string} algorithm - Hash algorithm
 * @param {Uint8Array|Buffer|string} data - Data to hash
 * @returns {Uint8Array} Hash result
 */
export function hashData(algorithm, data) {
  if (!HASH_ALGORITHMS[algorithm]) {
    throw new Error(`Unsupported hash algorithm: ${algorithm}`);
  }

  // Convert data to Uint8Array if needed
  let dataArray;
  if (typeof data === 'string') {
    dataArray = new TextEncoder().encode(data);
  } else if (data instanceof Buffer) {
    dataArray = new Uint8Array(data);
  } else if (data instanceof Uint8Array) {
    dataArray = data;
  } else {
    throw new Error('Data must be string, Buffer, or Uint8Array');
  }

  return HASH_ALGORITHMS[algorithm](dataArray);
}

/**
 * Create hash chain (right to left application)
 * @param {Array<string>} algorithms - Array of hash algorithms to apply
 * @param {Uint8Array|Buffer|string} data - Initial data
 * @returns {Uint8Array} Final hash result
 */
export function createHashChain(algorithms, data) {
  if (!Array.isArray(algorithms) || algorithms.length === 0) {
    throw new Error('Algorithms must be a non-empty array');
  }

  let currentData = data;
  
  // Apply hashes from right to left (last to first)
  for (let i = algorithms.length - 1; i >= 0; i--) {
    const algorithm = algorithms[i];
    currentData = hashData(algorithm, currentData);
  }

  return currentData;
}

/**
 * Create HMAC using specified algorithm
 * @param {string} algorithm - Hash algorithm for HMAC
 * @param {Uint8Array|Buffer|string} key - HMAC key
 * @param {Uint8Array|Buffer|string} data - Data to HMAC
 * @returns {Uint8Array} HMAC result
 */
export function createHMAC(algorithm, key, data) {
  if (!HASH_ALGORITHMS[algorithm]) {
    throw new Error(`Unsupported hash algorithm for HMAC: ${algorithm}`);
  }

  // Convert inputs to Uint8Array
  const keyArray = key instanceof Buffer ? new Uint8Array(key) : 
                   typeof key === 'string' ? new TextEncoder().encode(key) : key;
  
  const dataArray = data instanceof Buffer ? new Uint8Array(data) : 
                    typeof data === 'string' ? new TextEncoder().encode(data) : data;

  return hmac(HASH_ALGORITHMS[algorithm], keyArray, dataArray);
}

/**
 * Generate cryptographically secure random bytes
 * @param {number} length - Number of bytes to generate
 * @returns {Uint8Array} Random bytes
 */
export function randomBytes(length) {
  return ByteUtils.randomBytes(length);
}

/**
 * Get hash algorithm information
 * @param {string} algorithm - Hash algorithm name
 * @returns {Object} Algorithm information
 */
export function getHashAlgorithmInfo(algorithm) {
  if (!HASH_ALGORITHMS[algorithm]) {
    throw new Error(`Unknown hash algorithm: ${algorithm}`);
  }

  const info = {
    name: algorithm,
    supported: true,
    outputLength: 0,
    description: ''
  };

  switch (algorithm) {
    case HASH_TYPE.SHA3_256:
      info.outputLength = 32;
      info.description = 'SHA3-256 (Keccak) - 256-bit output';
      break;
    case HASH_TYPE.SHA3_512:
      info.outputLength = 64;
      info.description = 'SHA3-512 (Keccak) - 512-bit output';
      break;
    case HASH_TYPE.BLAKE3:
      info.outputLength = 32;
      info.description = 'BLAKE3 - 256-bit output (configurable)';
      break;
    case 'sha256':
      info.outputLength = 32;
      info.description = 'SHA-256 - 256-bit output';
      break;
    case 'sha512':
      info.outputLength = 64;
      info.description = 'SHA-512 - 512-bit output';
      break;
    case 'ripemd160':
      info.outputLength = 20;
      info.description = 'RIPEMD-160 - 160-bit output';
      break;
  }

  return info;
}

/**
 * Get all hash algorithm information
 * @returns {Object} Information about all supported hash algorithms
 */
export function getAllHashInfo() {
  const allInfo = {};
  
  for (const algorithm of Object.keys(HASH_ALGORITHMS)) {
    try {
      allInfo[algorithm] = getHashAlgorithmInfo(algorithm);
    } catch (error) {
      allInfo[algorithm] = {
        name: algorithm,
        supported: false,
        error: error.message
      };
    }
  }

  return allInfo;
}

/**
 * Get supported hash types
 * @returns {Array<string>} Array of supported hash types
 */
export function getSupportedHashTypes() {
  return VALID_HASH_TYPES;
}

/**
 * Benchmark hash algorithm performance
 * @param {string} algorithm - Hash algorithm to benchmark
 * @param {number} iterations - Number of iterations to run
 * @param {number} dataSize - Size of test data in bytes
 * @returns {Object} Benchmark results
 */
export function benchmarkHashAlgorithm(algorithm, iterations = 1000, dataSize = 1024) {
  if (!HASH_ALGORITHMS[algorithm]) {
    throw new Error(`Unsupported hash algorithm: ${algorithm}`);
  }

  // Generate test data
  const testData = randomBytes(dataSize);
  
  // Warm up
  for (let i = 0; i < 100; i++) {
    hashData(algorithm, testData);
  }

  // Benchmark
  const startTime = performance.now();
  for (let i = 0; i < iterations; i++) {
    hashData(algorithm, testData);
  }
  const endTime = performance.now();

  const totalTime = endTime - startTime;
  const avgTime = totalTime / iterations;
  const throughput = (dataSize * iterations) / (totalTime / 1000); // bytes per second

  return {
    algorithm,
    iterations,
    dataSize,
    totalTime: totalTime.toFixed(2) + 'ms',
    averageTime: avgTime.toFixed(4) + 'ms',
    throughput: (throughput / 1024 / 1024).toFixed(2) + ' MB/s'
  };
}

/**
 * Verify hash chain integrity
 * @param {Array<string>} algorithms - Hash algorithms used
 * @param {Uint8Array} originalData - Original data
 * @param {Uint8Array} finalHash - Final hash result
 * @returns {boolean} True if hash chain is valid
 */
export function verifyHashChain(algorithms, originalData, finalHash) {
  const computedHash = createHashChain(algorithms, originalData);
  return ByteUtils.equalBytes(computedHash, finalHash);
}
