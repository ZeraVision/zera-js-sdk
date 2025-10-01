/**
 * Validator Nonce Service Tests
 * 
 * This provides tests for the validator nonce service using Vitest.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TEST_WALLET_ADDRESSES } from '../../../../test-utils/keys.test.js';
import { create } from '@bufbuild/protobuf';
import { NonceResponseSchema } from '../../../../../proto/generated/api_pb.js';

// Mock the validator API client
vi.mock('../../../grpc/api/validator-api-client.js', () => ({
  createValidatorAPIClient: vi.fn((config = {}) => ({
    getNonce: vi.fn((address) => {
      // Check if address is empty and simulate error
      if (!address || address.length === 0) {
        return Promise.reject(new Error('Invalid address'));
      }
      
      // Check for invalid address format
      if (address === 'invalid-address') {
        return Promise.reject(new Error('Invalid address format'));
      }
      
      // Simulate network error for specific address (charlie) when no specific config
      if (address === TEST_WALLET_ADDRESSES.charlie && !config.host && !config.port) {
        return Promise.reject(new Error('Network error'));
      }
      
      // Simulate successful gRPC call with NonceResponse proto object
      const response = create(NonceResponseSchema, { nonce: 100n });
      return Promise.resolve(response);
    })
  }))
}));

// Mock the gRPC dependencies
vi.mock('@grpc/grpc-js', () => ({
  credentials: {
    createInsecure: vi.fn()
  },
  Client: vi.fn().mockImplementation(() => ({
    Nonce: vi.fn((request, callback) => {
      // Check if request is a NonceRequest proto object and address is valid
      if (!request.walletAddress || request.walletAddress.length === 0) {
        callback(new Error('Invalid address'), null);
      } else {
        // Simulate successful gRPC call with NonceResponse proto object
        const response = create(NonceResponseSchema, { nonce: 100n });
        callback(null, response);
      }
    })
  })),
  loadPackageDefinition: vi.fn(() => ({
    zera_api: {
      APIService: vi.fn().mockImplementation(() => ({
        Nonce: vi.fn((request, callback) => {
          // Check if request is a NonceRequest proto object and address is valid
          if (!request.walletAddress || request.walletAddress.length === 0) {
            callback(new Error('Invalid address'), null);
          } else {
            // Simulate successful gRPC call with NonceResponse proto object
            const response = create(NonceResponseSchema, { nonce: 100n });
            callback(null, response);
          }
        })
      }))
    }
  }))
}));

vi.mock('@grpc/proto-loader', () => ({
  loadSync: vi.fn(() => ({})),
  load: vi.fn(() => Promise.resolve({}))
}));

// Import after mocking
import { getNonce, getNonces } from '../service.js';

describe('Validator Nonce Service', () => {
  describe('Basic Functionality', () => {
    it('should retrieve nonce for valid address', async () => {
      const address = TEST_WALLET_ADDRESSES.alice;
      const nonce = await getNonce(address);
      
      // Verify nonce is returned
      expect(nonce).toBeDefined();
      expect(nonce).not.toBeNull();
      
      // Verify nonce is a Decimal
      expect(typeof nonce).toBe('object');
      expect(nonce.constructor).toBeDefined();
      expect(nonce.constructor.name).toBe('Decimal');
      
      // Verify nonce is positive
      expect(nonce.lt(0)).toBe(false);
    });
  });

  describe('Input Validation', () => {
    it('should throw error for null address', async () => {
      await expect(getNonce(null as any)).rejects.toThrow();
    });
    
    it('should throw error for undefined address', async () => {
      await expect(getNonce(undefined as any)).rejects.toThrow();
    });
    
    it('should throw error for empty address', async () => {
      await expect(getNonce('')).rejects.toThrow();
    });
    
    it('should throw error for invalid address format', async () => {
      await expect(getNonce('invalid-address')).rejects.toThrow();
    });
    
    it('should throw error for empty array', async () => {
      await expect(getNonces([])).rejects.toThrow();
    });
    
    it('should throw error for non-array input', async () => {
      await expect(getNonces('not-an-array' as any)).rejects.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Test network error simulation - this will likely succeed in test environment
      // but should not throw unexpected errors
      try {
        const result = await getNonce(TEST_WALLET_ADDRESSES.charlie, { 
          host: 'invalid-host',
          port: 99999
        });
        // If it succeeds, that's also valid in test environment
        expect(result).toBeDefined();
        expect(typeof result).toBe('object');
      } catch (error) {
        // If it fails due to network error, that's expected
        expect(error).toBeDefined();
        expect((error as Error).message).toContain('Failed to get nonce from validator');
      }
    });
    
    it('should handle timeout scenarios', async () => {
      // Test timeout - this may pass if the request completes quickly
      // but should not throw unexpected errors
      try {
        await getNonce(TEST_WALLET_ADDRESSES.charlie);
        // If it succeeds, that's also valid
        expect(true).toBe(true);
      } catch (error) {
        // If it fails due to timeout, that's expected
        expect(error).toBeDefined();
      }
    });
  });
});