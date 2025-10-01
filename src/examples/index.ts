/**
 * Examples Index
 * 
 * Centralized export of all example modules for easy access.
 */

// Advanced wallet usage examples
export {
  advancedWalletCreation,
  multipleWalletDerivation,
  walletPerformanceBenchmark,
  advancedTransactionCreation,
  errorHandlingExample,
  runAllAdvancedExamples
} from './advanced-wallet-usage.js';

// gRPC client usage examples
export {
  basicGRPCClientUsage,
  grpcCallWithErrorHandling,
  grpcPerformanceBenchmark,
  grpcConfigurationManagement,
  grpcErrorRecoveryStrategies,
  runAllGRPCExamples
} from './grpc-client-usage.js';

/**
 * Run all examples
 */
export async function runAllExamples(): Promise<void> {
  console.log('🚀 Running All SDK Examples');
  console.log('============================');

  try {
    // Import and run all example modules
    const { runAllAdvancedExamples } = await import('./advanced-wallet-usage.js');
    const { runAllGRPCExamples } = await import('./grpc-client-usage.js');

    await runAllAdvancedExamples();
    await runAllGRPCExamples();

    console.log('\n🎉 All examples completed successfully!');
  } catch (error) {
    console.error('\n💥 Examples failed:', error);
    throw error;
  }
}
