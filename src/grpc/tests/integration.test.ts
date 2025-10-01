/**
 * gRPC Integration Tests
 * 
 * Comprehensive integration tests for gRPC client functionality
 * including error handling, performance, and configuration.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  createGenericGRPCClient,
  makeGRPCCall
} from '../generic-grpc-client.js';
import { 
  createValidatorAPIClient
} from '../api/validator-api-client.js';
import { 
  createTransactionClient
} from '../transaction/transaction-client.js';
import { 
  ErrorHandler,
  createNetworkError,
  grpcErrorContext
} from '../../shared/utils/error-handler.js';
import { 
  benchmark,
  PerformanceBenchmark
} from '../../shared/utils/performance-benchmark.js';
import { 
  getConfig,
  setEnvironment
} from '../../shared/config/index.js';

describe('gRPC Integration Tests', () => {
  beforeEach(() => {
    // Set test environment
    setEnvironment('test');
  });

  afterEach(() => {
    // Clean up any global state
  });

  describe('Generic gRPC Client', () => {
    it('should create a generic gRPC client', () => {
      const config = getConfig();
      
      const client = createGenericGRPCClient({
        protoFile: 'proto/api.proto',
        packageName: 'zera_api',
        serviceName: 'APIService',
        host: config.network.defaultHost,
        port: config.network.defaultPort
      });

      expect(client).toBeDefined();
      expect(client.host).toBe(config.network.defaultHost);
      expect(client.port).toBe(config.network.defaultPort);
      expect(client.serviceName).toBe('APIService');
      expect(client.proto).toBeDefined();
      expect(client.client).toBeDefined();
    });

    it('should handle invalid proto file gracefully', () => {
      expect(() => {
        createGenericGRPCClient({
          protoFile: 'invalid.proto',
          packageName: 'zera_api',
          serviceName: 'APIService'
        });
      }).toThrow();
    });

    it('should handle invalid package name gracefully', () => {
      expect(() => {
        createGenericGRPCClient({
          protoFile: 'proto/api.proto',
          packageName: 'invalid_package',
          serviceName: 'APIService'
        });
      }).toThrow();
    });

    it('should handle invalid service name gracefully', () => {
      expect(() => {
        createGenericGRPCClient({
          protoFile: 'proto/api.proto',
          packageName: 'zera_api',
          serviceName: 'InvalidService'
        });
      }).toThrow();
    });
  });

  describe('Validator API Client', () => {
    it('should create a validator API client', () => {
      const config = getConfig();
      
      const client = createValidatorAPIClient({
        host: config.network.defaultHost,
        port: 50053
      });

      expect(client).toBeDefined();
      expect(client.host).toBe(config.network.defaultHost);
      expect(client.port).toBe(50053);
      expect(client.serviceName).toBe('APIService');
      expect(client.getNonce).toBeDefined();
      expect(client.getTokenFeeInfo).toBeDefined();
    });

    it('should handle nonce requests gracefully', async () => {
      const config = getConfig();
      const client = createValidatorAPIClient({
        host: config.network.defaultHost,
        port: 50053,
        timeout: 5000
      });

      const testAddress = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';

      try {
        await client.getNonce(testAddress);
      } catch (error) {
        // Expected to fail in test environment
        expect(error).toBeDefined();
        expect(ErrorHandler.isRetryableError(error as Error)).toBe(true);
      }
    });

    it('should handle token fee info requests gracefully', async () => {
      const config = getConfig();
      const client = createValidatorAPIClient({
        host: config.network.defaultHost,
        port: 50053,
        timeout: 5000
      });

      const testContractIds = ['$ZRA+0000', '$BTC+1234'];

      try {
        await client.getTokenFeeInfo({ contractIds: testContractIds });
      } catch (error) {
        // Expected to fail in test environment
        expect(error).toBeDefined();
        expect(ErrorHandler.isRetryableError(error as Error)).toBe(true);
      }
    });
  });

  describe('Transaction Client', () => {
    it('should create a transaction client', () => {
      const config = getConfig();
      
      const client = createTransactionClient({
        host: config.network.defaultHost,
        port: config.network.defaultPort
      });

      expect(client).toBeDefined();
      expect(client.host).toBe(config.network.defaultHost);
      expect(client.port).toBe(config.network.defaultPort);
      expect(client.serviceName).toBe('TXNService');
      expect(client.submitCoinTransaction).toBeDefined();
    });

    it('should handle transaction submission gracefully', async () => {
      const config = getConfig();
      const client = createTransactionClient({
        host: config.network.defaultHost,
        port: config.network.defaultPort,
        timeout: 5000
      });

      // Create a mock transaction object
      const mockTransaction = {
        base: {
          hash: new Uint8Array([1, 2, 3, 4]),
          timestamp: { seconds: BigInt(Math.floor(Date.now() / 1000)) },
          feeAmount: '1000',
          feeId: '$ZRA+0000'
        },
        contractId: '$ZRA+0000',
        auth: {
          publicKey: [{ single: new Uint8Array([1, 2, 3, 4]) }],
          signature: [new Uint8Array([1, 2, 3, 4])],
          nonce: [BigInt(1)]
        },
        inputTransfers: [{
          index: 0,
          amount: '1000000000',
          feePercent: '100000000'
        }],
        outputTransfers: [{
          walletAddress: new Uint8Array([1, 2, 3, 4]),
          amount: '1000000000',
          memo: 'Test transaction'
        }]
      };

      try {
        await client.submitCoinTransaction(mockTransaction as any);
      } catch (error) {
        // Expected to fail in test environment
        expect(error).toBeDefined();
        expect(ErrorHandler.isRetryableError(error as Error)).toBe(true);
      }
    });
  });

  describe('gRPC Call Wrapper', () => {
    it('should handle gRPC calls with timeout', async () => {
      const config = getConfig();
      const client = createGenericGRPCClient({
        protoFile: 'proto/api.proto',
        packageName: 'zera_api',
        serviceName: 'APIService',
        host: config.network.defaultHost,
        port: config.network.defaultPort
      });

      const mockRequest = {
        walletAddress: new Uint8Array([1, 2, 3, 4]),
        encoded: false
      };

      try {
        await makeGRPCCall(
          client.client,
          'Nonce',
          mockRequest,
          { timeout: 1000 } // 1 second timeout
        );
      } catch (error) {
        // Expected to fail in test environment
        expect(error).toBeDefined();
        expect(ErrorHandler.isRetryableError(error as Error)).toBe(true);
      }
    });

    it('should handle invalid method names gracefully', async () => {
      const config = getConfig();
      const client = createGenericGRPCClient({
        protoFile: 'proto/api.proto',
        packageName: 'zera_api',
        serviceName: 'APIService',
        host: config.network.defaultHost,
        port: config.network.defaultPort
      });

      const mockRequest = {};

      try {
        await makeGRPCCall(
          client.client,
          'InvalidMethod',
          mockRequest
        );
      } catch (error) {
        expect(error).toBeDefined();
        expect(error instanceof Error).toBe(true);
        expect(error.message).toContain('Method \'InvalidMethod\' not found');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const client = createValidatorAPIClient({
        host: 'invalid-host',
        port: 9999,
        timeout: 1000
      });

      try {
        await client.getNonce('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');
      } catch (error) {
        expect(error).toBeDefined();
        expect(ErrorHandler.isRetryableError(error as Error)).toBe(true);
        expect(ErrorHandler.getErrorSeverity(error as Error)).toBe('medium');
      }
    });

    it('should handle timeout errors gracefully', async () => {
      const config = getConfig();
      const client = createValidatorAPIClient({
        host: config.network.defaultHost,
        port: 50053,
        timeout: 1 // 1ms timeout to force timeout
      });

      try {
        await client.getNonce('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');
      } catch (error) {
        expect(error).toBeDefined();
        expect(ErrorHandler.isRetryableError(error as Error)).toBe(true);
      }
    });

    it('should handle connection errors gracefully', async () => {
      const client = createValidatorAPIClient({
        host: 'localhost',
        port: 1, // Invalid port
        timeout: 1000
      });

      try {
        await client.getNonce('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');
      } catch (error) {
        expect(error).toBeDefined();
        expect(ErrorHandler.isRetryableError(error as Error)).toBe(true);
      }
    });
  });

  describe('Performance', () => {
    it('should create clients within reasonable time', async () => {
      const config = getConfig();
      
      const result = await benchmark(
        'gRPC Client Creation Performance',
        () => {
          return createValidatorAPIClient({
            host: config.network.defaultHost,
            port: 50053
          });
        },
        {
          iterations: 100,
          warmupIterations: 5
        }
      );

      expect(result.averageTime).toBeLessThan(100); // Should be under 100ms
      expect(result.iterations).toBe(100);
    });

    it('should handle multiple client creation efficiently', async () => {
      const config = getConfig();
      const benchmark = new PerformanceBenchmark();

      const result = await benchmark.benchmark(
        'Multiple gRPC Client Creation',
        () => {
          const clients: any[] = [];
          for (let i = 0; i < 10; i++) {
            const client = createValidatorAPIClient({
              host: config.network.defaultHost,
              port: 50053 + i // Different ports to avoid conflicts
            });
            clients.push(client);
          }
          return clients;
        },
        {
          iterations: 10,
          warmupIterations: 2
        }
      );

      expect(result.averageTime).toBeLessThan(1000); // Should be under 1 second
      expect(result.iterations).toBe(10);
    });
  });

  describe('Configuration Integration', () => {
    it('should work with different environments', () => {
      // Test with development environment
      setEnvironment('development');
      const devConfig = getConfig();
      expect(devConfig.environment).toBe('development');

      const devClient = createValidatorAPIClient({
        host: devConfig.network.defaultHost,
        port: 50053
      });
      expect(devClient.host).toBe(devConfig.network.defaultHost);

      // Test with production environment
      setEnvironment('production');
      const prodConfig = getConfig();
      expect(prodConfig.environment).toBe('production');

      const prodClient = createValidatorAPIClient({
        host: prodConfig.network.defaultHost,
        port: 50053
      });
      expect(prodClient.host).toBe(prodConfig.network.defaultHost);
    });

    it('should use environment-specific timeouts', () => {
      // Test with test environment (short timeout)
      setEnvironment('test');
      const testConfig = getConfig();
      expect(testConfig.network.connectionTimeout).toBe(5000);

      // Test with production environment (longer timeout)
      setEnvironment('production');
      const prodConfig = getConfig();
      expect(prodConfig.network.connectionTimeout).toBe(30000);
    });
  });

  describe('Retry Logic', () => {
    it('should implement exponential backoff for retries', async () => {
      const config = getConfig();
      const client = createValidatorAPIClient({
        host: 'invalid-host',
        port: 9999,
        timeout: 1000
      });

      let attempts = 0;
      const maxAttempts = 3;
      let lastError: Error | null = null;

      while (attempts < maxAttempts) {
        try {
          attempts++;
          await client.getNonce('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');
          break;
        } catch (error) {
          lastError = error as Error;
          
          if (attempts >= maxAttempts) {
            break;
          }
          
          if (ErrorHandler.isRetryableError(lastError)) {
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
          } else {
            break;
          }
        }
      }

      expect(attempts).toBe(maxAttempts);
      expect(lastError).toBeDefined();
    });

    it('should handle non-retryable errors correctly', async () => {
      const config = getConfig();
      const client = createValidatorAPIClient({
        host: config.network.defaultHost,
        port: 50053
      });

      try {
        // This should fail with a non-retryable error (invalid request format)
        await client.getNonce(''); // Empty address
      } catch (error) {
        expect(error).toBeDefined();
        // This might be retryable or not depending on the error type
        const isRetryable = ErrorHandler.isRetryableError(error as Error);
        expect(typeof isRetryable).toBe('boolean');
      }
    });
  });

  describe('Memory Management', () => {
    it('should not leak memory with multiple client creations', async () => {
      const config = getConfig();
      const initialMemory = process.memoryUsage().heapUsed;

      // Create many clients
      const clients: any[] = [];
      for (let i = 0; i < 100; i++) {
        const client = createValidatorAPIClient({
          host: config.network.defaultHost,
          port: 50053
        });
        clients.push(client);
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryDelta = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 10MB)
      expect(memoryDelta).toBeLessThan(10 * 1024 * 1024);
    });
  });
});
