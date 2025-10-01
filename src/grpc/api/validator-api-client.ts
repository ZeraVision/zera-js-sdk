/**
 * Validator API Client
 * 
 * Pre-configured gRPC client for the ZERA validator API service.
 * Minimal wrapper around the generic gRPC client.
 */

import { createGenericGRPCClient, makeGRPCCall } from '../generic-grpc-client.js';
import bs58 from 'bs58';
import { create } from '@bufbuild/protobuf';
import type { GRPCConfig, GRPCClient } from '../../types/index.js';
import type { TokenFeeInfoResponse, NonceResponse } from '../../../proto/generated/api_pb.js';
import { NonceRequestSchema, TokenFeeInfoRequestSchema } from '../../../proto/generated/api_pb.js';

/**
 * Validator API client interface
 */
export interface ValidatorAPIClient extends GRPCClient {
  /**
   * Get nonce for an address
   */
  getNonce(address: string): Promise<NonceResponse>;
    
  /**
   * Get comprehensive token fee information
   */
  getTokenFeeInfo(request: { contractIds: string[] }): Promise<TokenFeeInfoResponse>;
}

/**
 * Create a pre-configured validator API client
 */
export function createValidatorAPIClient(options: GRPCConfig = {}): ValidatorAPIClient {
  const client = createGenericGRPCClient({
    protoFile: 'proto/api.proto',
    packageName: 'zera_api',
    serviceName: 'APIService',
    host: options.host || 'routing.zerascan.io',
    port: options.port || 50053
  });

  return {
    client: client.client,
    proto: client.proto,
    host: client.host,
    port: client.port,
    serviceName: 'APIService',
    
    /**
     * Get nonce for an address
     */
    async getNonce(address: string): Promise<NonceResponse> {
      const request = create(NonceRequestSchema, {
        walletAddress: bs58.decode(address), // Convert base58 to bytes
        encoded: false // Decode on local side for marginally faster processing
      });
      return await makeGRPCCall(this.client, 'Nonce', request);
    },

    /**
     * Get comprehensive token fee information
     */
    async getTokenFeeInfo(request: { contractIds: string[] }): Promise<TokenFeeInfoResponse> {
      const protoRequest = create(TokenFeeInfoRequestSchema, {
        contractIds: request.contractIds
      });
      return await makeGRPCCall(this.client, 'GetTokenFeeInfo', protoRequest);
    }
  };
}
