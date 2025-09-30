/**
 * Validator Fee Info Service
 * 
 * Handles fee information retrieval from the ZERA validator via gRPC.
 * Uses the GetTokenFeeInfo API to get comprehensive token fee information.
 */

import { createValidatorAPIClient } from '../../../grpc/api/validator-api-client.js';
import type { GRPCConfig } from '../../../types/index.js';
import type { TokenFeeInfoResponse } from '../../../../proto/generated/api_pb.js';

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
 * @returns Promise<TokenFeeInfoResponse> - Token fee information response
 */
export async function getTokenFeeInfo(
  params: GetTokenFeeInfoParams = {},
  options: GRPCConfig = {}
): Promise<TokenFeeInfoResponse> {
  try {
    const client = createValidatorAPIClient(options);
    
    // Call the new GetTokenFeeInfo API
    const response = await client.getTokenFeeInfo({
      contractIds: params.contractIds || []
    });

    // Return the proto response directly
    return response;
  } catch (error) {
    throw new Error(`Failed to get token fee info from validator: ${(error as Error).message}`);
  }
}
