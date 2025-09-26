/**
 * Validator Nonce Service
 * 
 * Handles nonce retrieval from the ZERA validator via gRPC.
 * Contains all business logic for nonce operations.
 */

import Decimal from 'decimal.js';
import { createValidatorAPIClient } from '../../../grpc/api/validator-api-client.js';
import type { GRPCConfig, GRPCOverrideConfig } from '../../../types/index.js';

/**
 * Get a single nonce for an address
 */
export async function getNonce(address: string, options: GRPCConfig = {}): Promise<Decimal> {
  try {
    const client = createValidatorAPIClient(options);
    const response = await client.getNonce(address);

    // Address likely doesn't exist, default to 1
    if (!response.nonce) {
      return new Decimal(1);
    }
    
    return new Decimal(response.nonce.toString()).add(1);
  } catch (error) {
    throw new Error(`Failed to get nonce from validator: ${(error as Error).message}`);
  }
}

/**
 * Get nonces for multiple addresses
 */
export async function getNonces(addresses: string[], options: GRPCOverrideConfig = {}): Promise<Decimal[]> {
  if (!Array.isArray(addresses) || addresses.length === 0) {
    throw new Error('Addresses must be a non-empty array');
  }

  try {
    const nonces: Decimal[] = [];
    for (const address of addresses) {
      const nonce = await getNonce(address, options);
      nonces.push(nonce);
    }
    return nonces;
  } catch (error) {
    throw new Error(`Failed to get nonces from validator: ${(error as Error).message}`);
  }
}
