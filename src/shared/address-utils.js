/**
 * Address Utilities for ZERA SDK
 * 
 * This module provides utilities for working with ZERA addresses and public key identifiers.
 */

import { generateZeraAddress } from '../wallet-creation/shared.js';
import { KEY_TYPE, HASH_TYPE } from '../wallet-creation/constants.js';
import bs58 from 'bs58';

/**
 * Parse a base58 public key identifier and extract the address
 * 
 * @param {string} publicKeyIdentifier - Base58 public key identifier (e.g., "A_c_5KJvsngHeMby884zrh6A5u6b4SqzZzAb")
 * @returns {string} The ZERA address (base58-encoded hashed public key)
 * @throws {Error} If the public key identifier format is invalid
 */
export function getAddressFromPublicKey(publicKeyIdentifier) {
  if (!publicKeyIdentifier || typeof publicKeyIdentifier !== 'string') {
    throw new Error('Public key identifier must be a non-empty string');
  }

  // Special cases: if it starts with sc_ or gov_, return as-is
  if (publicKeyIdentifier.startsWith('sc_') || publicKeyIdentifier.startsWith('gov_')) {
    return publicKeyIdentifier;
  }

  // For other cases, take everything after the last underscore and base58 decode it
  const lastUnderscoreIndex = publicKeyIdentifier.lastIndexOf('_');
  if (lastUnderscoreIndex === -1) {
    throw new Error('Invalid public key identifier: no underscore found');
  }

  const base58Part = publicKeyIdentifier.substring(lastUnderscoreIndex + 1);
  if (!base58Part) {
    throw new Error('Invalid public key identifier: nothing after last underscore');
  }

  try {
    // Decode the base58 part
    const decodedBytes = bs58.decode(base58Part);
    
    // Re-encode as base58 to return the address
    return bs58.encode(decodedBytes);
  } catch (error) {
    throw new Error(`Invalid public key identifier: failed to decode base58 part - ${error.message}`);
  }
}

/**
 * Validate if a string is a valid ZERA public key identifier format
 * 
 * @param {string} publicKeyIdentifier - String to validate
 * @returns {boolean} True if valid format
 */
export function isValidPublicKeyIdentifier(publicKeyIdentifier) {
  try {
    getAddressFromPublicKey(publicKeyIdentifier);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Extract key type from public key identifier
 * 
 * @param {string} publicKeyIdentifier - Base58 public key identifier
 * @returns {string} Key type ('ed25519' or 'ed448')
 * @throws {Error} If the public key identifier format is invalid
 */
export function getKeyTypeFromPublicKey(publicKeyIdentifier) {
  if (!publicKeyIdentifier || typeof publicKeyIdentifier !== 'string') {
    throw new Error('Public key identifier must be a non-empty string');
  }

  // Special cases: sc_ and gov_ don't have key types
  if (publicKeyIdentifier.startsWith('sc_') || publicKeyIdentifier.startsWith('gov_')) {
    throw new Error('Special identifiers (sc_, gov_) do not have key types');
  }

  if (publicKeyIdentifier.startsWith('A_')) {
    return KEY_TYPE.ED25519;
  } else if (publicKeyIdentifier.startsWith('B_')) {
    return KEY_TYPE.ED448;
  } else {
    throw new Error('Invalid public key identifier: missing key type prefix (A_ or B_)');
  }
}

/**
 * Extract hash types from public key identifier
 * 
 * @param {string} publicKeyIdentifier - Base58 public key identifier
 * @returns {Array<string>} Array of hash types
 * @throws {Error} If the public key identifier format is invalid
 */
export function getHashTypesFromPublicKey(publicKeyIdentifier) {
  if (!publicKeyIdentifier || typeof publicKeyIdentifier !== 'string') {
    throw new Error('Public key identifier must be a non-empty string');
  }

  // Special cases: sc_ and gov_ don't have hash types
  if (publicKeyIdentifier.startsWith('sc_') || publicKeyIdentifier.startsWith('gov_')) {
    throw new Error('Special identifiers (sc_, gov_) do not have hash types');
  }

  let remaining = publicKeyIdentifier;
  
  // Skip key type prefix
  if (remaining.startsWith('A_') || remaining.startsWith('B_')) {
    remaining = remaining.substring(2);
  } else {
    throw new Error('Invalid public key identifier: missing key type prefix (A_ or B_)');
  }

  // Extract hash types
  const hashTypes = [];
  while (remaining.startsWith('a_') || remaining.startsWith('b_') || remaining.startsWith('c_')) {
    if (remaining.startsWith('a_')) {
      hashTypes.push(HASH_TYPE.SHA3_256);
      remaining = remaining.substring(2);
    } else if (remaining.startsWith('b_')) {
      hashTypes.push(HASH_TYPE.SHA3_512);
      remaining = remaining.substring(2);
    } else if (remaining.startsWith('c_')) {
      hashTypes.push(HASH_TYPE.BLAKE3);
      remaining = remaining.substring(2);
    }
  }

  if (hashTypes.length === 0) {
    throw new Error('Invalid public key identifier: missing hash type prefix');
  }

  return hashTypes;
}
