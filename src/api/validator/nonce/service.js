/**
 * Validator Nonce Service
 * 
 * Handles nonce retrieval from the ZERA validator via gRPC.
 * Contains all business logic for nonce operations.
 */

import Decimal from 'decimal.js';
import { createValidatorAPIClient } from '../../../grpc/api/validator-api-client.js';

/**
 * Get a single nonce for an address
 * @param {string} address - Base58 encoded address
 * @param {Object} options - Configuration options
 * @returns {Promise<Decimal>} Nonce value (server nonce + 1)
 */
export async function getNonce(address, options = {}) {
  try {
    const client = createValidatorAPIClient(options);
    const response = await client.getNonce(address);

    // Address likely doesn't exist, default to 1
    if (!response.nonce) {
      return new Decimal(1);
    }
    
    return new Decimal(response.nonce.toString()).add(1);
  } catch (error) {
    throw new Error(`Failed to get nonce from validator: ${error.message}`);
  }
}

/**
 * Get nonces for multiple addresses
 * @param {string[]} addresses - Array of base58 encoded addresses
 * @param {Object} options - Configuration options
 * @returns {Promise<Decimal[]>} Array of nonce values
 */
export async function getNonces(addresses, options = {}) {
  if (!Array.isArray(addresses) || addresses.length === 0) {
    throw new Error('Addresses must be a non-empty array');
  }

  try {
    const nonces = [];
    for (const address of addresses) {
      const nonce = await getNonce(address, options);
      nonces.push(nonce);
    }
    return nonces;
  } catch (error) {
    throw new Error(`Failed to get nonces from validator: ${error.message}`);
  }
}
