/**
 * Validator Fee Info Service
 * 
 * Handles fee information retrieval from the ZERA validator via gRPC.
 * Uses the GetTokenFeeInfo API to get comprehensive token fee information.
 */

import type { TokenFeeInfoResponse } from '../../../../proto/generated/api_pb.js';
import { CONTRACT_FEE_TYPE } from '../../../../proto/generated/txn_pb.js';
import { createValidatorAPIClient } from '../../../grpc/api/validator-api-client.js';
import type { GRPCConfig } from '../../../types/index.js';

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

    // Process contract fee types for each token to ensure they're valid and always numeric
    response.tokens.forEach(token => {
      if (token.contractFees && Object.keys(token.contractFees).length > 0) {
        const feeType = token.contractFees.contractFeeType;
        
        // Always ensure contractFeeType is set to a valid numeric enum value
        if (feeType === undefined || feeType === null) {
          // Default to FIXED (value 0) if not specified by validator
          token.contractFees.contractFeeType = CONTRACT_FEE_TYPE.FIXED;
        } else if (typeof feeType === 'string') {
          // Handle string representations from validator
          const feeTypeStr = (feeType as string).toUpperCase();
          switch (feeTypeStr) {
          case 'FIXED':
            token.contractFees.contractFeeType = CONTRACT_FEE_TYPE.FIXED;
            break;
          case 'CUR_EQUIVALENT':
            token.contractFees.contractFeeType = CONTRACT_FEE_TYPE.CUR_EQUIVALENT;
            break;
          case 'PERCENTAGE':
            token.contractFees.contractFeeType = CONTRACT_FEE_TYPE.PERCENTAGE;
            break;
          case 'NONE':
            token.contractFees.contractFeeType = CONTRACT_FEE_TYPE.NONE;
            break;
          default:
            console.warn(`Unknown string contract fee type "${feeType}" for contract ${token.contractId}, defaulting to FIXED`);
            token.contractFees.contractFeeType = CONTRACT_FEE_TYPE.FIXED;
            break;
          }
        }
      }
    });

    // Return the proto response directly
    return response;
  } catch (error) {
    throw new Error(`Failed to get token fee info from validator: ${(error as Error).message}`);
  }
}
