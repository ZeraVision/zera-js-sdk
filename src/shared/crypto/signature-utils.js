/**
 * Transaction Signature Utilities
 * 
 * This module handles transaction signing with automatic key type detection.
 */

import { Ed25519KeyPair, Ed448KeyPair } from '../wallet-creation/crypto-core.js';
import { getKeyTypeFromPublicKey } from './address-utils.js';
import bs58 from 'bs58';
import { createHash } from 'crypto';

/**
 * Sign transaction data with automatic key type detection
 * @param {Uint8Array} data - Data to sign
 * @param {string} privateKeyBase58 - Private key in base58 format
 * @param {string} publicKeyIdentifier - Public key identifier for key type detection
 * @returns {Uint8Array} Signature
 */
export function signTransactionData(data, privateKeyBase58, publicKeyIdentifier) {
  const keyType = getKeyTypeFromPublicKey(publicKeyIdentifier);
  const privateKeyBytes = bs58.decode(privateKeyBase58);
  
  if (keyType === 'ed25519') {
    const keyPair = Ed25519KeyPair.fromPrivateKey(privateKeyBytes);
    return keyPair.sign(data);
  } else if (keyType === 'ed448') {
    const keyPair = Ed448KeyPair.fromPrivateKey(privateKeyBytes);
    return keyPair.sign(data);
  } else {
    throw new Error(`Unsupported key type: ${keyType}`);
  }
}

/**
 * Create SHA3-256 hash of data
 * @param {Uint8Array} data - Data to hash
 * @returns {Uint8Array} Hash result
 */
export function createTransactionHash(data) {
  const hash = createHash('sha3-256');
  hash.update(data);
  return new Uint8Array(hash.digest());
}
