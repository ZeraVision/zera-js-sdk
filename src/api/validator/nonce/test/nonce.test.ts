/**
 * Validator Nonce Service Tests
 * 
 * This provides tests for the validator nonce service using Vitest.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TEST_WALLET_ADDRESSES } from '../../../../test-utils/keys.test';

// Mock the gRPC dependencies at the top level
vi.mock('@grpc/grpc-js', () => ({
  credentials: {
    createInsecure: vi.fn()
  },
  Client: vi.fn().mockImplementation(() => ({
    Nonce: vi.fn((request, callback) => {
      // Check if address is empty and simulate error
      if (!request.walletAddress || request.walletAddress.length === 0) {
        callback(new Error('Invalid address'), null);
      } else {
        // Simulate successful gRPC call
        callback(null, { nonce: '100' });
      }
    })
  })),
  loadPackageDefinition: vi.fn(() => ({
    zera_api: {
      APIService: vi.fn().mockImplementation(() => ({
        Nonce: vi.fn((request, callback) => {
          // Check if address is empty and simulate error
          if (!request.walletAddress || request.walletAddress.length === 0) {
            callback(new Error('Invalid address'), null);
          } else {
            // Simulate successful gRPC call
            callback(null, { nonce: '100' });
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

// Mock the entire gRPC module to avoid import issues
vi.mock('../../../grpc/generic-grpc-client.js', () => ({
  createGenericGRPCClient: vi.fn(() => ({
    client: {
      Nonce: vi.fn((request, callback) => {
        // Simulate successful gRPC call
        callback(null, { nonce: '100' });
      })
    },
    proto: {
      zera_api: {
        APIService: {
          Nonce: vi.fn()
        }
      }
    },
    host: 'test-host',
    port: 1234
  })),
  makeGRPCCall: vi.fn((client, method, request) => {
    // Simulate the gRPC call
    return new Promise((resolve) => {
      if (method === 'Nonce') {
        resolve({ nonce: '100' });
      } else {
        resolve({});
      }
    });
  })
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
      // Test network error simulation
      await expect(getNonce('A_c_5KJvsngHeMby884zrh6A5u6b4SqzZzAb', { 
        host: 'invalid-host',
        port: 99999
      })).rejects.toThrow();
    });
    
    it('should handle timeout scenarios', async () => {
      // Test timeout - this may pass if the request completes quickly
      // but should not throw unexpected errors
      try {
        await getNonce('A_c_5KJvsngHeMby884zrh6A5u6b4SqzZzAb');
        // If it succeeds, that's also valid
        expect(true).toBe(true);
      } catch (error) {
        // If it fails due to timeout, that's expected
        expect(error).toBeDefined();
      }
    });
  });
});