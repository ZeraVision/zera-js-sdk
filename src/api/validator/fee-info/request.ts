/**
 * Validator Fee Info Service
 * 
 * Handles fee information retrieval from the ZERA validator via gRPC.
 * Uses the new GetTokenFeeInfo API to get comprehensive token fee information.
 */

import Decimal from 'decimal.js';
import { createValidatorAPIClient } from '../../../grpc/api/validator-api-client.js';
import type { GRPCConfig, GRPCOverrideConfig } from '../../../types/index.js';
import type { TokenFeeInfo as ProtoTokenFeeInfo } from '../../../../proto/generated/api_pb.js';

/**
 * Fee information interface for token and contract fees
 */
export interface TokenFeeInfo {
  contractId: string;
  rate: Decimal;
  authorized: boolean;
  denomination: string;
  contractFees?: {
    fee: string;
    feeAddress?: Uint8Array;
    burn: string;
    validator: string;
    allowedFeeInstrument: string[];
    contractFeeType: 'FIXED' | 'CUR_EQUIVALENT' | 'PERCENTAGE' | 'NONE';
  } | undefined;
}

/**
 * Parameters for GetTokenFeeInfo API call
 */
export interface GetTokenFeeInfoParams {
  contractIds?: string[];
  includeRates?: boolean;
  includeContractFees?: boolean;
}

/**
 * Get comprehensive token fee information from the validator
 * 
 * @param params - Parameters to customize the fee information retrieval
 * @param options - gRPC configuration options
 * @returns Promise<TokenFeeInfo[]> - Array of token fee information
 */
export async function getTokenFeeInfo(
  params: GetTokenFeeInfoParams = {},
  options: GRPCConfig = {}
): Promise<TokenFeeInfo[]> {
  try {
    const client = createValidatorAPIClient(options);
    
    // Call the new GetTokenFeeInfo API
    const response = await client.getTokenFeeInfo({
      contractIds: params.contractIds || []
    });

    if (!response.tokens || response.tokens.length === 0) {
      return [];
    }

    // Convert proto response to our interface
    const feeInfo: TokenFeeInfo[] = response.tokens.map((token) => ({
      contractId: token.contractId,
      rate: new Decimal(token.rate).div(new Decimal(10).pow(18)), // Convert from 1e18 scale to decimal
      authorized: token.authorized || false,
      denomination: token.denomination,
      contractFees: token.contractFees ? {
        fee: token.contractFees.fee,
        feeAddress: token.contractFees.feeAddress,
        burn: token.contractFees.burn,
        validator: token.contractFees.validator,
        allowedFeeInstrument: token.contractFees.allowedFeeInstrument || [],
        contractFeeType: token.contractFees.contractFeeType as 'FIXED' | 'CUR_EQUIVALENT' | 'PERCENTAGE' | 'NONE'
      } : undefined
    }));

    return feeInfo;
  } catch (error) {
    throw new Error(`Failed to get token fee info from validator: ${(error as Error).message}`);
  }
}

/**
 * Get ACE token rates from the validator (legacy function for backward compatibility)
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
