/**
 * Validator ACE Tokens Service
 * 
 * Handles ACE token rate retrieval from the ZERA validator via gRPC.
 * Contains all business logic for ACE token operations.
 */

import Decimal from 'decimal.js';
import { createValidatorAPIClient } from '../../../grpc/api/validator-api-client.js';
import type { GRPCConfig, GRPCOverrideConfig } from '../../../types/index.js';

/**
 * Get ACE token rates from the validator
 */
export async function getACETokenRates(options: GRPCConfig = {}): Promise<{ contractId: string; rate: Decimal }[]> {
  try {
    const client = createValidatorAPIClient(options);
    const response = await client.getACETokens();

    if (!response.tokens || response.tokens.length === 0) {
      return [];
    }

    return response.tokens.map((token: { contractId: string; rate: string }) => ({
      contractId: token.contractId,
      rate: new Decimal(token.rate).div(new Decimal(10).pow(18)) // Convert from 1e18 scale to decimal
    }));
  } catch (error) {
    throw new Error(`Failed to get ACE token rates from validator: ${(error as Error).message}`);
  }
}

/**
 * Get a specific ACE token rate by contract ID
 */
export async function getACETokenRate(contractId: string, options: GRPCOverrideConfig = {}): Promise<Decimal | null> {
  if (!contractId || typeof contractId !== 'string') {
    throw new Error('Contract ID must be a non-empty string');
  }

  try {
    const tokens = await getACETokenRates(options);
    const token = tokens.find(t => t.contractId === contractId);
    
    return token ? token.rate : null;
  } catch (error) {
    throw new Error(`Failed to get ACE token rate for contract ${contractId}: ${(error as Error).message}`);
  }
}
