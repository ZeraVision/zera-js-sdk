/**
 * Transaction Signature Utilities
 * 
 * This module handles transaction signing with automatic key type detection.
 */

import { Ed25519KeyPair, Ed448KeyPair } from '../../wallet-creation/crypto-core.js';
import { getKeyTypeFromPublicKey } from './address-utils.js';
import bs58 from 'bs58';
import { createHash } from 'crypto';
import type { KeyType } from '../../types/index.js';

/**
 * Sign transaction data with automatic key type detection
 */
export function signTransactionData(
  data: Uint8Array, 
  privateKeyBase58: string, 
  publicKeyIdentifier: string
): Uint8Array {
  const keyType = getKeyTypeFromPublicKey(publicKeyIdentifier);
  let privateKeyBytes = bs58.decode(privateKeyBase58);  
  
  if (keyType === 'ed25519') {
    // Compatibility with some legacy systems
    if (privateKeyBytes.length === 64) {
      privateKeyBytes = privateKeyBytes.slice(0, 32);
    }
  
    const keyPair = Ed25519KeyPair.fromPrivateKey(privateKeyBytes);
    return keyPair.sign(data);
  } else if (keyType === 'ed448') {
    // Ed448KeyPair now supports both 32-byte and 57-byte private keys
    const keyPair = Ed448KeyPair.fromPrivateKey(privateKeyBytes);
    return keyPair.sign(data);
  } else {
    throw new Error(`Unsupported key type: ${keyType}`);
  }
}

/**
 * Create SHA3-256 hash of data
 */
export function createTransactionHash(data: Uint8Array): Uint8Array {
  const hash = createHash('sha3-256');
  hash.update(data);
  return new Uint8Array(hash.digest());
}
