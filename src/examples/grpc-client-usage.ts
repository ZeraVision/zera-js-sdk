/**
 * gRPC Client Usage Examples
 * 
 * Comprehensive examples demonstrating gRPC client usage,
 * error handling, and performance optimization.
 */

import { 
  createGenericGRPCClient,
  makeGRPCCall,
  createTypedGRPCClient
} from '../grpc/generic-grpc-client.js';
import { 
  createValidatorAPIClient
} from '../grpc/api/validator-api-client.js';
import { 
  createTransactionClient
} from '../grpc/transaction/transaction-client.js';
import { 
  ErrorHandler,
  createNetworkError,
  grpcErrorContext
} from '../shared/utils/error-handler.js';
import { 
  benchmark,
  PerformanceBenchmark
} from '../shared/utils/performance-benchmark.js';
import { 
  getConfig,
  setEnvironment
} from '../shared/config/index.js';
import type { 
  GRPCConfig,
  GRPCClient
} from '../types/index.js';

/**
 * Example 1: Basic gRPC Client Usage
 * 
 * Demonstrates basic gRPC client creation and usage.
 */
export async function basicGRPCClientUsage(): Promise<void> {
  console.log('🔌 Basic gRPC Client Usage Example');
  console.log('==================================');

  try {
    // Set environment
    setEnvironment('development');
    const config = getConfig();

    // Create a generic gRPC client
    const grpcClient = createGenericGRPCClient({
      protoFile: 'proto/api.proto',
      packageName: 'zera_api',
      serviceName: 'APIService',
      host: config.network.defaultHost,
      port: config.network.defaultPort
    });

    console.log('✅ Generic gRPC client created:');
    console.log('  Host:', grpcClient.host);
    console.log('  Port:', grpcClient.port);
    console.log('  Service:', grpcClient.serviceName);

    // Create a validator API client
    const validatorClient = createValidatorAPIClient({
      host: config.network.defaultHost,
      port: 50053 // Different port for validator API
    });

    console.log('✅ Validator API client created:');
    console.log('  Host:', validatorClient.host);
    console.log('  Port:', validatorClient.port);

    // Create a transaction client
    const transactionClient = createTransactionClient({
      host: config.network.defaultHost,
      port: config.network.defaultPort
    });

    console.log('✅ Transaction client created:');
    console.log('  Host:', transactionClient.host);
    console.log('  Port:', transactionClient.port);

  } catch (error) {
    console.error('❌ Basic gRPC client usage failed:', ErrorHandler.formatError(error as Error));
    throw error;
  }
}

/**
 * Example 2: gRPC Call with Error Handling
 * 
 * Demonstrates gRPC calls with comprehensive error handling.
 */
export async function grpcCallWithErrorHandling(): Promise<void> {
  console.log('\n🛡️ gRPC Call with Error Handling Example');
  console.log('=========================================');

  try {
    const config = getConfig();
    
    // Create validator API client
    const validatorClient = createValidatorAPIClient({
      host: config.network.defaultHost,
      port: 50053,
      timeout: 10000
    });

    // Example address for nonce retrieval
    const testAddress = 'test-address-for-nonce';

    console.log('Attempting to get nonce for address:', testAddress);

    try {
      // This will likely fail in a test environment, but demonstrates error handling
      const nonce = await validatorClient.getNonce(testAddress);
      console.log('✅ Nonce retrieved successfully:', nonce);
    } catch (error) {
      console.log('✅ Caught expected error:', ErrorHandler.formatError(error as Error));
      console.log('  Error severity:', ErrorHandler.getErrorSeverity(error as Error));
      console.log('  Is retryable:', ErrorHandler.isRetryableError(error as Error));
      
      // Demonstrate error context
      if (error instanceof Error && 'context' in error) {
        console.log('  Error context:', (error as any).context);
      }
    }

    // Demonstrate retry logic
    console.log('\nDemonstrating retry logic...');
    
    let attempts = 0;
    const maxAttempts = 3;
    let lastError: Error | null = null;

    while (attempts < maxAttempts) {
      try {
        attempts++;
        console.log(`Attempt ${attempts}...`);
        
        const nonce = await validatorClient.getNonce(testAddress);
        console.log('✅ Success on attempt', attempts);
        break;
      } catch (error) {
        lastError = error as Error;
        console.log(`❌ Attempt ${attempts} failed:`, ErrorHandler.formatError(lastError));
        
        if (attempts >= maxAttempts) {
          break;
        }
        
        // Check if error is retryable
        if (ErrorHandler.isRetryableError(lastError)) {
          console.log('  Error is retryable, waiting before retry...');
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        } else {
          console.log('  Error is not retryable, stopping retries');
          break;
        }
      }
    }

    if (lastError) {
      console.log('❌ All retry attempts failed');
    }

  } catch (error) {
    console.error('❌ gRPC call with error handling failed:', ErrorHandler.formatError(error as Error));
    throw error;
  }
}

/**
 * Example 3: gRPC Performance Benchmarking
 * 
 * Demonstrates performance benchmarking of gRPC operations.
 */
export async function grpcPerformanceBenchmark(): Promise<void> {
  console.log('\n⚡ gRPC Performance Benchmark Example');
  console.log('=====================================');

  try {
    const config = getConfig();
    const benchmark = new PerformanceBenchmark();

    // Create clients
    const validatorClient = createValidatorAPIClient({
      host: config.network.defaultHost,
      port: 50053
    });

    const transactionClient = createTransactionClient({
      host: config.network.defaultHost,
      port: config.network.defaultPort
    });

    // Benchmark client creation
    const clientCreationResult = await benchmark.benchmark(
      'gRPC Client Creation',
      () => {
        return createValidatorAPIClient({
          host: config.network.defaultHost,
          port: 50053
        });
      },
      {
        iterations: 100,
        warmupIterations: 5,
        measureMemory: true
      }
    );

    console.log('gRPC Client Creation Results:');
    console.log(`  Average Time: ${clientCreationResult.averageTime.toFixed(4)}ms`);
    console.log(`  Min Time: ${clientCreationResult.minTime.toFixed(4)}ms`);
    console.log(`  Max Time: ${clientCreationResult.maxTime.toFixed(4)}ms`);
    console.log(`  Std Dev: ${clientCreationResult.standardDeviation.toFixed(4)}ms`);

    if (clientCreationResult.memoryUsage) {
      console.log(`  Memory Delta: ${clientCreationResult.memoryUsage.delta} bytes`);
    }

    // Benchmark gRPC calls (these will likely fail in test environment)
    const grpcCallResult = await benchmark.benchmark(
      'gRPC Call (Expected to Fail)',
      async () => {
        try {
          await validatorClient.getNonce('test-address');
          return 'success';
        } catch (error) {
          // Return error type for benchmarking
          return 'error';
        }
      },
      {
        iterations: 50,
        warmupIterations: 3,
        measureMemory: true
      }
    );

    console.log('\ngRPC Call Results:');
    console.log(`  Average Time: ${grpcCallResult.averageTime.toFixed(4)}ms`);
    console.log(`  Min Time: ${grpcCallResult.minTime.toFixed(4)}ms`);
    console.log(`  Max Time: ${grpcCallResult.maxTime.toFixed(4)}ms`);
    console.log(`  Std Dev: ${grpcCallResult.standardDeviation.toFixed(4)}ms`);

    if (grpcCallResult.memoryUsage) {
      console.log(`  Memory Delta: ${grpcCallResult.memoryUsage.delta} bytes`);
    }

    // Generate performance report
    console.log('\n📊 Performance Report:');
    console.log(benchmark.generateReport());

  } catch (error) {
    console.error('❌ gRPC performance benchmark failed:', ErrorHandler.formatError(error as Error));
    throw error;
  }
}

/**
 * Example 4: gRPC Configuration Management
 * 
 * Demonstrates different gRPC configurations for different environments.
 */
export async function grpcConfigurationManagement(): Promise<void> {
  console.log('\n⚙️ gRPC Configuration Management Example');
  console.log('========================================');

  try {
    // Development configuration
    console.log('Creating development configuration...');
    setEnvironment('development');
    const devConfig = getConfig();
    
    const devClient = createValidatorAPIClient({
      host: devConfig.network.defaultHost,
      port: 50053,
      timeout: devConfig.network.connectionTimeout
    });

    console.log('Development client:');
    console.log('  Host:', devClient.host);
    console.log('  Port:', devClient.port);

    // Staging configuration
    console.log('\nCreating staging configuration...');
    setEnvironment('staging');
    const stagingConfig = getConfig();
    
    const stagingClient = createValidatorAPIClient({
      host: stagingConfig.network.defaultHost,
      port: 50053,
      timeout: stagingConfig.network.connectionTimeout
    });

    console.log('Staging client:');
    console.log('  Host:', stagingClient.host);
    console.log('  Port:', stagingClient.port);

    // Production configuration
    console.log('\nCreating production configuration...');
    setEnvironment('production');
    const prodConfig = getConfig();
    
    const prodClient = createValidatorAPIClient({
      host: prodConfig.network.defaultHost,
      port: 50053,
      timeout: prodConfig.network.connectionTimeout
    });

    console.log('Production client:');
    console.log('  Host:', prodClient.host);
    console.log('  Port:', prodClient.port);

    // Test configuration
    console.log('\nCreating test configuration...');
    setEnvironment('test');
    const testConfig = getConfig();
    
    const testClient = createValidatorAPIClient({
      host: testConfig.network.defaultHost,
      port: 50053,
      timeout: testConfig.network.connectionTimeout
    });

    console.log('Test client:');
    console.log('  Host:', testClient.host);
    console.log('  Port:', testClient.port);

    console.log('\n✅ All environment configurations created successfully');

  } catch (error) {
    console.error('❌ gRPC configuration management failed:', ErrorHandler.formatError(error as Error));
    throw error;
  }
}

/**
 * Example 5: gRPC Error Recovery Strategies
 * 
 * Demonstrates various error recovery strategies for gRPC operations.
 */
export async function grpcErrorRecoveryStrategies(): Promise<void> {
  console.log('\n🔄 gRPC Error Recovery Strategies Example');
  console.log('==========================================');

  try {
    const config = getConfig();
    
    // Strategy 1: Exponential Backoff
    console.log('Strategy 1: Exponential Backoff');
    
    const exponentialBackoff = async (fn: () => Promise<unknown>, maxAttempts = 3) => {
      let attempts = 0;
      let delay = 1000; // Start with 1 second
      
      while (attempts < maxAttempts) {
        try {
          attempts++;
          console.log(`  Attempt ${attempts} (delay: ${delay}ms)`);
          return await fn();
        } catch (error) {
          console.log(`  ❌ Attempt ${attempts} failed:`, ErrorHandler.formatError(error as Error));
          
          if (attempts >= maxAttempts) {
            throw error;
          }
          
          if (ErrorHandler.isRetryableError(error as Error)) {
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2; // Double the delay
          } else {
            throw error;
          }
        }
      }
    };

    try {
      await exponentialBackoff(async () => {
        const client = createValidatorAPIClient({
          host: config.network.defaultHost,
          port: 50053
        });
        return await client.getNonce('test-address');
      });
    } catch (error) {
      console.log('  ✅ Exponential backoff strategy completed (expected failure)');
    }

    // Strategy 2: Circuit Breaker Pattern
    console.log('\nStrategy 2: Circuit Breaker Pattern');
    
    class CircuitBreaker {
      private failures = 0;
      private lastFailureTime = 0;
      private state: 'closed' | 'open' | 'half-open' = 'closed';
      
      constructor(
        private threshold = 3,
        private timeout = 5000
      ) {}
      
      async execute<T>(fn: () => Promise<T>): Promise<T> {
        if (this.state === 'open') {
          if (Date.now() - this.lastFailureTime > this.timeout) {
            this.state = 'half-open';
            console.log('  Circuit breaker: Moving to half-open state');
          } else {
            throw new Error('Circuit breaker is open');
          }
        }
        
        try {
          const result = await fn();
          this.onSuccess();
          return result;
        } catch (error) {
          this.onFailure();
          throw error;
        }
      }
      
      private onSuccess() {
        this.failures = 0;
        this.state = 'closed';
        console.log('  Circuit breaker: Reset to closed state');
      }
      
      private onFailure() {
        this.failures++;
        this.lastFailureTime = Date.now();
        
        if (this.failures >= this.threshold) {
          this.state = 'open';
          console.log('  Circuit breaker: Opened due to failures');
        }
      }
    }

    const circuitBreaker = new CircuitBreaker(2, 3000);
    
    try {
      await circuitBreaker.execute(async () => {
        const client = createValidatorAPIClient({
          host: config.network.defaultHost,
          port: 50053
        });
        return await client.getNonce('test-address');
      });
    } catch (error) {
      console.log('  ✅ Circuit breaker strategy completed (expected failure)');
    }

    // Strategy 3: Fallback Mechanism
    console.log('\nStrategy 3: Fallback Mechanism');
    
    const fallbackStrategy = async (primaryFn: () => Promise<unknown>, fallbackFn: () => Promise<unknown>) => {
      try {
        console.log('  Trying primary function...');
        return await primaryFn();
      } catch (error) {
        console.log('  Primary function failed, trying fallback...');
        try {
          return await fallbackFn();
        } catch (fallbackError) {
          console.log('  Fallback function also failed');
          throw fallbackError;
        }
      }
    };

    try {
      await fallbackStrategy(
        async () => {
          const client = createValidatorAPIClient({
            host: config.network.defaultHost,
            port: 50053
          });
          return await client.getNonce('test-address');
        },
        async () => {
          // Simulate fallback to cached data or alternative service
          console.log('  Using fallback data...');
          return { nonce: 'fallback-nonce' };
        }
      );
      console.log('  ✅ Fallback strategy completed successfully');
    } catch (error) {
      console.log('  ✅ Fallback strategy completed (expected failure)');
    }

  } catch (error) {
    console.error('❌ gRPC error recovery strategies failed:', ErrorHandler.formatError(error as Error));
    throw error;
  }
}

/**
 * Run all gRPC examples
 */
export async function runAllGRPCExamples(): Promise<void> {
  console.log('🚀 Running All gRPC Examples');
  console.log('============================');

  try {
    await basicGRPCClientUsage();
    await grpcCallWithErrorHandling();
    await grpcPerformanceBenchmark();
    await grpcConfigurationManagement();
    await grpcErrorRecoveryStrategies();

    console.log('\n🎉 All gRPC examples completed successfully!');
  } catch (error) {
    console.error('\n💥 gRPC examples failed:', ErrorHandler.formatError(error as Error));
    throw error;
  }
}

// Export individual examples for selective execution
export {
  basicGRPCClientUsage,
  grpcCallWithErrorHandling,
  grpcPerformanceBenchmark,
  grpcConfigurationManagement,
  grpcErrorRecoveryStrategies
};
