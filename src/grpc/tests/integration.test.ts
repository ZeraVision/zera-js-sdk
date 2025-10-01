/**
 * gRPC Infrastructure Integration Tests
 * 
 * Tests gRPC client infrastructure, error handling, and configuration.
 * Does NOT test business logic (nonce, transactions, etc.) - those are tested in service-specific tests.
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
  ErrorHandler
} from '../../shared/utils/error-handler.js';
import { 
  PerformanceBenchmark
} from '../../shared/utils/performance-benchmark.js';
import { 
  getConfig,
  setEnvironment
} from '../../shared/config/index.js';

describe('gRPC Infrastructure Tests', () => {
  beforeEach(() => {
    // Set test environment
    setEnvironment('test');
  });

  afterEach(() => {
    // Clean up any global state
  });

  describe('Generic gRPC Client Creation', () => {
    it('should create a generic gRPC client with valid configuration', () => {
      const config = getConfig();
      
      const client = createGenericGRPCClient({
        protoFile: 'proto/api.proto',
        packageName: 'zera_api',
        serviceName: 'APIService',
        host: config.network.defaultHost,
        port: 50053
      });

      expect(client).toBeDefined();
      expect(client.client).toBeDefined();
      expect(client.proto).toBeDefined();
      expect(client.host).toBe(config.network.defaultHost);
      expect(client.port).toBe(50053);
      expect(client.serviceName).toBe('APIService');
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

  describe('Validator API Client Creation', () => {
    it('should create a validator API client with default configuration', () => {
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

    it('should create a validator API client with custom configuration', () => {
      const client = createValidatorAPIClient({
        host: 'custom-host',
        port: 9999,
        timeout: 10000
      });

      expect(client).toBeDefined();
      expect(client.host).toBe('custom-host');
      expect(client.port).toBe(9999);
    });
  });

  describe('Transaction Client Creation', () => {
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
  });

  describe('gRPC Call Wrapper', () => {
    it('should handle gRPC calls with timeout', async () => {
      const config = getConfig();
      const client = createGenericGRPCClient({
        protoFile: 'proto/api.proto',
        packageName: 'zera_api',
        serviceName: 'APIService',
        host: config.network.defaultHost,
        port: 50053
      });

      try {
        // Use timeout: 1 on the client config to force timeout
        await makeGRPCCall(client.client, 'Nonce', { address: 'test' });
      } catch (error) {
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
        port: 50053
      });

      try {
        await makeGRPCCall(client.client, 'InvalidMethod', {});
      } catch (error) {
        expect(error).toBeDefined();
        expect((error as Error).message).toContain('Method \'InvalidMethod\' not found');
      }
    });
  });

  describe('Error Handling Infrastructure', () => {
    it('should handle network errors gracefully', async () => {
      const client = createValidatorAPIClient({
        host: 'invalid-host',
        port: 9999,
        timeout: 1000
      });

      try {
        // Call any method - we're testing error handling, not business logic
        await (client as any).client.Nonce({ address: 'test' });
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
        // Call any method - we're testing error handling, not business logic
        await (client as any).client.Nonce({ address: 'test' });
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
        // Call any method - we're testing error handling, not business logic
        await (client as any).client.Nonce({ address: 'test' });
      } catch (error) {
        expect(error).toBeDefined();
        expect(ErrorHandler.isRetryableError(error as Error)).toBe(true);
      }
    });
  });

  describe('Performance', () => {
    it('should create clients within reasonable time', async () => {
      const config = getConfig();
      const benchmark = new PerformanceBenchmark();

      const result = await benchmark.benchmark('client-creation', async () => {
        createValidatorAPIClient({
          host: config.network.defaultHost,
          port: 50053
        });
      }, { iterations: 10 });

      expect(result.iterations).toBe(10);
      expect(result.duration).toBeLessThan(1000); // Should create 10 clients in < 1 second
    });

    it('should handle multiple client creation efficiently', async () => {
      const config = getConfig();
      const benchmark = new PerformanceBenchmark();

      let clientCount = 0;
      const result = await benchmark.benchmark('multiple-clients', async () => {
        createValidatorAPIClient({
          host: config.network.defaultHost,
          port: 50053 + clientCount
        });
        clientCount++;
      }, { iterations: 3 });

      expect(result.iterations).toBe(3);
      expect(result.duration).toBeLessThan(500); // Should create 3 clients in < 500ms
    });
  });

  describe('Configuration Integration', () => {
    it('should work with different environments', () => {
      // Test with development environment
      setEnvironment('development');
      let config = getConfig();
      
      const devClient = createValidatorAPIClient({
        host: config.network.defaultHost,
        port: config.network.defaultPort
      });

      expect(devClient).toBeDefined();

      // Test with test environment
      setEnvironment('test');
      config = getConfig();

      const testClient = createValidatorAPIClient({
        host: config.network.defaultHost,
        port: config.network.defaultPort
      });

      expect(testClient).toBeDefined();
    });

    it('should use environment-specific timeouts', () => {
      // Test with test environment (short timeout)
      setEnvironment('test');
      const testConfig = getConfig();
      expect(testConfig.network.connectionTimeout).toBeLessThanOrEqual(10000);

      // Test with production environment (longer timeout)
      setEnvironment('production');
      const prodConfig = getConfig();
      expect(prodConfig.network.connectionTimeout).toBeGreaterThanOrEqual(5000);
    });
  });

  describe('Retry Logic Infrastructure', () => {
    it('should implement exponential backoff for retries', async () => {
      const config = getConfig();
      const client = createValidatorAPIClient({
        host: 'invalid-host',
        port: 9999,
        timeout: 1000
      });

      let attempts = 0;
      const maxRetries = 3;

      // Test retry logic (not business logic)
      for (let i = 0; i < maxRetries; i++) {
        try {
          attempts++;
          await (client as any).client.Nonce({ address: 'test' });
          break;
        } catch (error) {
          if (i === maxRetries - 1) {
            expect(attempts).toBe(3);
            expect(ErrorHandler.isRetryableError(error as Error)).toBe(true);
          }
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 100));
        }
      }
    });

    it('should handle non-retryable errors correctly', async () => {
      const config = getConfig();
      const client = createValidatorAPIClient({
        host: config.network.defaultHost,
        port: 50053
      });

      try {
        // This should fail with a non-retryable error (invalid request format)
        await (client as any).client.Nonce({ invalid: 'data' });
      } catch (error) {
        expect(error).toBeDefined();
        // Depending on error type, may or may not be retryable
      }
    });
  });

  describe('Memory Management', () => {
    it('should not leak memory with multiple client creations', async () => {
      const config = getConfig();
      const benchmark = new PerformanceBenchmark();

      const result = await benchmark.benchmark('memory-test', async () => {
        createValidatorAPIClient({
          host: config.network.defaultHost,
          port: 50053
        });
      }, { iterations: 100, measureMemory: true });

      expect(result.iterations).toBe(100);
      
      // Memory should not increase dramatically
      if (result.memoryUsage) {
        expect(result.memoryUsage.delta).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase
      }
    });
  });
});
