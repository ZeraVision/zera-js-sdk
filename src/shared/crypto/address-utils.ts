/**
 * Address Utilities for ZERA SDK
 * 
 * This module provides utilities for working with ZERA addresses and public key identifiers.
 */

import { KEY_TYPE, HASH_TYPE, KEY_TYPE_PREFIXES, HASH_TYPE_PREFIXES, SPECIAL_PREFIXES, isValidKeyType, isValidHashType } from './constants.js';
import { createHashChain } from '../../wallet-creation/hash-utils.js';
import bs58 from 'bs58';
import type { KeyType, HashType } from './constants.js';

/**
 * Generate ZERA address from public key and hash types
 * 
 * ZERA Network uses a simple address format: base58-encoded hashed public key
 * This is different from Bitcoin-style addresses which include version bytes and checksums.
 */
export function generateZeraAddress(
  publicKey: Uint8Array, 
  keyType: KeyType, 
  hashTypes: HashType[] = []
): string {
  if (!publicKey || !(publicKey instanceof Uint8Array)) {
    throw new Error('Public key must be a Uint8Array');
  }

  if (!isValidKeyType(keyType)) {
    throw new Error(`Invalid key type: ${keyType}`);
  }

  if (!Array.isArray(hashTypes) || hashTypes.length === 0) {
    throw new Error('Hash types must be a non-empty array');
  }

  // Validate all hash types
  for (const hashType of hashTypes) {
    if (!isValidHashType(hashType)) {
      throw new Error(`Invalid hash type: ${hashType}`);
    }
  }

  // Apply hash chain to public key
  const hashedPublicKey = createHashChain(hashTypes, publicKey);
  
  // Return simple base58-encoded hashed public key (ZERA Network format)
  return bs58.encode(hashedPublicKey);
}

/**
 * Generate ZERA address from raw public key bytes with auto-detection
 * 
 * This function automatically detects the key type and hash types from a public key identifier
 * string (e.g., "A_c_5KJvsngHeMby884zrh6A5u6b4SqzZzAb") and generates the address.
 */
export function generateAddressFromPublicKey(publicKeyIdentifier: string): string {
  if (!publicKeyIdentifier || typeof publicKeyIdentifier !== 'string') {
    throw new Error('Public key identifier must be a non-empty string');
  }

  const hashTypes = getHashTypesFromPublicKey(publicKeyIdentifier);

  // Extract the raw public key bytes from the identifier
  const lastUnderscoreIndex = publicKeyIdentifier.lastIndexOf('_');
  if (lastUnderscoreIndex === -1) {
    throw new Error('Invalid public key identifier: no underscore found');
  }

  const base58Part = publicKeyIdentifier.substring(lastUnderscoreIndex + 1);
  if (!base58Part) {
    throw new Error('Invalid public key identifier: nothing after last underscore');
  }

  try {
    // Decode the base58 part to get raw public key bytes
    const publicKeyBytes = bs58.decode(base58Part);
    
    // Apply hash chain to public key
    const hashedPublicKey = createHashChain(hashTypes, publicKeyBytes);
    
    // Return simple base58-encoded hashed public key (ZERA Network format)
    return bs58.encode(hashedPublicKey);
  } catch (error) {
    throw new Error(`Invalid public key identifier: failed to decode base58 part - ${(error as Error).message}`);
  }
}

/**
 * Parse a base58 public key identifier and extract the address
 */
export function getAddressFromPublicKey(publicKeyIdentifier: string): string {
  // This function now uses the proper address generation
  return generateAddressFromPublicKey(publicKeyIdentifier);
}

/**
 * Validate ZERA address format
 * 
 * ZERA addresses are simple base58-encoded hashed public keys.
 * This function validates that the address is properly base58 encoded
 * and has a reasonable length for a hashed public key.
 */
export function validateAddress(address: string): boolean {
  if (!address || typeof address !== 'string') {
    return false;
  }

  try {
    // Decode base58
    const decoded = bs58.decode(address);
    
    // ZERA addresses should be hashed public keys (typically 32 bytes for SHA3-256, 64 for SHA3-512, etc.)
    // Allow reasonable range for different hash algorithms
    if (decoded.length < 16 || decoded.length > 128) {
      return false;
    }

    // Check that it's not all zeros or all ones (basic sanity check)
    const allZeros = decoded.every(byte => byte === 0);
    const allOnes = decoded.every(byte => byte === 255);
    
    if (allZeros || allOnes) {
      return false;
    }

    return true;
  } catch (error) {
    // Invalid base58 encoding
    return false;
  }
}

/**
 * Validate if a string is a valid ZERA public key identifier format
 */
export function isValidPublicKeyIdentifier(publicKeyIdentifier: string): boolean {
  try {
    generateAddressFromPublicKey(publicKeyIdentifier);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Extract key type from public key identifier
 */
export function getKeyTypeFromPublicKey(publicKeyIdentifier: string): KeyType {
  if (!publicKeyIdentifier || typeof publicKeyIdentifier !== 'string') {
    throw new Error('Public key identifier must be a non-empty string');
  }

  // Special cases: sc_ and gov_ don't have key types
  if (publicKeyIdentifier.startsWith(SPECIAL_PREFIXES.SMART_CONTRACT) || publicKeyIdentifier.startsWith(SPECIAL_PREFIXES.GOVERNANCE)) {
    throw new Error(`Special identifiers (${SPECIAL_PREFIXES.SMART_CONTRACT}, ${SPECIAL_PREFIXES.GOVERNANCE}) do not have key types`);
  }

  if (publicKeyIdentifier.startsWith(KEY_TYPE_PREFIXES[KEY_TYPE.ED25519])) {
    return KEY_TYPE.ED25519;
  } else if (publicKeyIdentifier.startsWith(KEY_TYPE_PREFIXES[KEY_TYPE.ED448])) {
    return KEY_TYPE.ED448;
  } else {
    throw new Error(`Invalid public key identifier: missing key type prefix (${KEY_TYPE_PREFIXES[KEY_TYPE.ED25519]} or ${KEY_TYPE_PREFIXES[KEY_TYPE.ED448]})`);
  }
}

/**
 * Extract public key identifier with decoded bytes
 */
export function getPublicKeyBytes(publicKeyIdentifier: string): Uint8Array {
  if (!publicKeyIdentifier || typeof publicKeyIdentifier !== 'string') {
    throw new Error('Public key identifier must be a non-empty string');
  }

  // Special cases: if it starts with sc_ or gov_, return as-is
  if (publicKeyIdentifier.startsWith(SPECIAL_PREFIXES.SMART_CONTRACT) || publicKeyIdentifier.startsWith(SPECIAL_PREFIXES.GOVERNANCE)) {
    return new Uint8Array(Buffer.from(publicKeyIdentifier, 'utf8'));
  }

  // For other cases, take everything after the last underscore and base58 decode it
  const lastUnderscoreIndex = publicKeyIdentifier.lastIndexOf('_');
  if (lastUnderscoreIndex === -1) {
    throw new Error('Invalid public key identifier: no underscore found');
  }

  const prefix = publicKeyIdentifier.substring(0, lastUnderscoreIndex + 1); // Keep "A_c_" part
  const base58Part = publicKeyIdentifier.substring(lastUnderscoreIndex + 1);
  if (!base58Part) {
    throw new Error('Invalid public key identifier: nothing after last underscore');
  }

  try {
    const decodedBytes = bs58.decode(base58Part);
    // Combine prefix (as UTF-8 bytes) with decoded base58 bytes
    const prefixBytes = Buffer.from(prefix, 'utf8');
    const result = new Uint8Array(prefixBytes.length + decodedBytes.length);
    result.set(prefixBytes, 0);
    result.set(decodedBytes, prefixBytes.length);
    return result;
  } catch (error) {
    throw new Error(`Invalid public key identifier: failed to decode base58 part - ${(error as Error).message}`);
  }
}

/**
 * Extract hash types from public key identifier
 */
export function getHashTypesFromPublicKey(publicKeyIdentifier: string): HashType[] {
  if (!publicKeyIdentifier || typeof publicKeyIdentifier !== 'string') {
    throw new Error('Public key identifier must be a non-empty string');
  }

  // Special cases: sc_ and gov_ don't have hash types
  if (publicKeyIdentifier.startsWith(SPECIAL_PREFIXES.SMART_CONTRACT) || publicKeyIdentifier.startsWith(SPECIAL_PREFIXES.GOVERNANCE)) {
    throw new Error(`Special identifiers (${SPECIAL_PREFIXES.SMART_CONTRACT}, ${SPECIAL_PREFIXES.GOVERNANCE}) do not have hash types`);
  }

  let remaining = publicKeyIdentifier;
  
  // Skip key type prefix
  if (remaining.startsWith(KEY_TYPE_PREFIXES[KEY_TYPE.ED25519]) || remaining.startsWith(KEY_TYPE_PREFIXES[KEY_TYPE.ED448])) {
    remaining = remaining.substring(2);
    // Skip the separator underscore if present
    if (remaining.startsWith('_')) {
      remaining = remaining.substring(1);
    }
  } else {
    throw new Error(`Invalid public key identifier: missing key type prefix (${KEY_TYPE_PREFIXES[KEY_TYPE.ED25519]} or ${KEY_TYPE_PREFIXES[KEY_TYPE.ED448]})`);
  }

  // Extract hash types
  const hashTypes: HashType[] = [];
  while (remaining.startsWith(HASH_TYPE_PREFIXES[HASH_TYPE.SHA3_256]) || 
         remaining.startsWith(HASH_TYPE_PREFIXES[HASH_TYPE.SHA3_512]) || 
         remaining.startsWith(HASH_TYPE_PREFIXES[HASH_TYPE.BLAKE3])) {
    if (remaining.startsWith(HASH_TYPE_PREFIXES[HASH_TYPE.SHA3_256])) {
      hashTypes.push(HASH_TYPE.SHA3_256);
      remaining = remaining.substring(2);
    } else if (remaining.startsWith(HASH_TYPE_PREFIXES[HASH_TYPE.SHA3_512])) {
      hashTypes.push(HASH_TYPE.SHA3_512);
      remaining = remaining.substring(2);
    } else if (remaining.startsWith(HASH_TYPE_PREFIXES[HASH_TYPE.BLAKE3])) {
      hashTypes.push(HASH_TYPE.BLAKE3);
      remaining = remaining.substring(2);
    }
    
    // Skip separator underscore if present
    if (remaining.startsWith('_')) {
      remaining = remaining.substring(1);
    }
  }

  if (hashTypes.length === 0) {
    throw new Error('Invalid public key identifier: missing hash type prefix');
  }

  return hashTypes;
}
