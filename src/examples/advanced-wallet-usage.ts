/**
 * Advanced Wallet Usage Examples
 * 
 * Comprehensive examples demonstrating advanced wallet creation and management
 * features of the ZERA SDK.
 */

import { 
  createWallet, 
  deriveMultipleWallets, 
  generateMnemonicPhrase,
  WalletFactory,
  KEY_TYPE,
  HASH_TYPE
} from '../wallet-creation/index.js';
import { 
  createCoinTXN, 
  sendCoinTXN,
  type CoinTXNInput,
  type CoinTXNOutput,
  type FeeConfig
} from '../coin-txn/index.js';
import { 
  getNonce,
  getNonces
} from '../api/validator/nonce/service.js';
import { 
  validateContractId,
  validateAmount,
  validateBase58Address,
  validateKeyType,
  validateHashTypes,
  validateMnemonic
} from '../shared/utils/validation.js';
import { 
  ErrorHandler,
  createValidationError,
  walletErrorContext
} from '../shared/utils/error-handler.js';
import { 
  benchmark,
  PerformanceBenchmark
} from '../shared/utils/performance-benchmark.js';
import { 
  getConfig,
  setEnvironment,
  type SDKConfig
} from '../shared/config/index.js';

/**
 * Example 1: Advanced Wallet Creation with Validation
 * 
 * Demonstrates comprehensive wallet creation with input validation,
 * error handling, and performance monitoring.
 */
export async function advancedWalletCreation(): Promise<void> {
  console.log('🔐 Advanced Wallet Creation Example');
  console.log('=====================================');

  try {
    // Set environment for development
    setEnvironment('development');
    const config = getConfig();
    console.log('Configuration:', config.environment);

    // Generate a secure mnemonic phrase
    const mnemonic = generateMnemonicPhrase(24); // 24-word mnemonic for maximum security
    console.log('Generated mnemonic:', mnemonic);

    // Validate mnemonic before use
    const mnemonicValidation = validateMnemonic(mnemonic);
    if (!mnemonicValidation.isValid) {
      throw createValidationError(
        `Invalid mnemonic: ${mnemonicValidation.error}`,
        walletErrorContext('advancedWalletCreation', { mnemonic: mnemonic.substring(0, 20) + '...' })
      );
    }

    // Create wallet with Ed25519 and multiple hash types
    const wallet = await createWallet({
      keyType: KEY_TYPE.ED25519,
      hashTypes: [HASH_TYPE.SHA3_256, HASH_TYPE.BLAKE3],
      mnemonic: mnemonicValidation.value!,
      passphrase: 'secure-passphrase',
      hdOptions: {
        accountIndex: 0,
        changeIndex: 0,
        addressIndex: 0
      }
    });

    console.log('✅ Wallet created successfully:');
    console.log('  Address:', wallet.address);
    console.log('  Public Key:', wallet.publicKey);
    console.log('  Derivation Path:', wallet.derivationPath);
    console.log('  Key Type:', wallet.keyType);
    console.log('  Hash Types:', wallet.hashTypes);

    // Validate wallet components
    const addressValidation = validateBase58Address(wallet.address);
    const keyValidation = validateBase58Key(wallet.privateKey);
    
    if (!addressValidation.isValid) {
      throw createValidationError('Invalid wallet address', walletErrorContext('advancedWalletCreation'));
    }
    
    if (!keyValidation.isValid) {
      throw createValidationError('Invalid private key', walletErrorContext('advancedWalletCreation'));
    }

    console.log('✅ All wallet components validated successfully');

    // Clean up sensitive data
    wallet.secureClear();
    console.log('✅ Sensitive data cleared from memory');

  } catch (error) {
    console.error('❌ Wallet creation failed:', ErrorHandler.formatError(error as Error));
    throw error;
  }
}

/**
 * Example 2: Multiple Wallet Derivation
 * 
 * Demonstrates deriving multiple wallets from a single mnemonic
 * with different derivation paths.
 */
export async function multipleWalletDerivation(): Promise<void> {
  console.log('\n🔑 Multiple Wallet Derivation Example');
  console.log('=====================================');

  try {
    // Generate mnemonic
    const mnemonic = generateMnemonicPhrase(12);
    console.log('Base mnemonic:', mnemonic);

    // Derive 5 wallets with different address indices
    const wallets = await deriveMultipleWallets({
      keyType: KEY_TYPE.ED25519,
      hashTypes: [HASH_TYPE.SHA3_256],
      mnemonic,
      count: 5,
      hdOptions: {
        accountIndex: 0,
        changeIndex: 0,
        addressIndex: 0 // Will be incremented for each wallet
      }
    });

    console.log(`✅ Derived ${wallets.length} wallets:`);
    
    wallets.forEach((wallet, index) => {
      console.log(`  Wallet ${index + 1}:`);
      console.log(`    Address: ${wallet.address}`);
      console.log(`    Derivation Path: ${wallet.derivationPath}`);
      console.log(`    Address Index: ${wallet.index}`);
    });

    // Validate all wallets
    const validationResults = wallets.map((wallet, index) => {
      const addressValidation = validateBase58Address(wallet.address);
      const keyValidation = validateBase58Key(wallet.privateKey);
      
      return {
        index,
        addressValid: addressValidation.isValid,
        keyValid: keyValidation.isValid,
        wallet
      };
    });

    const invalidWallets = validationResults.filter(result => !result.addressValid || !result.keyValid);
    
    if (invalidWallets.length > 0) {
      throw createValidationError(
        `Invalid wallets found: ${invalidWallets.map(w => w.index).join(', ')}`,
        walletErrorContext('multipleWalletDerivation')
      );
    }

    console.log('✅ All derived wallets validated successfully');

    // Clean up all wallets
    wallets.forEach(wallet => wallet.secureClear());
    console.log('✅ All wallet data cleared from memory');

  } catch (error) {
    console.error('❌ Multiple wallet derivation failed:', ErrorHandler.formatError(error as Error));
    throw error;
  }
}

/**
 * Example 3: Performance Benchmarking
 * 
 * Demonstrates performance benchmarking of wallet creation operations.
 */
export async function walletPerformanceBenchmark(): Promise<void> {
  console.log('\n⚡ Wallet Performance Benchmark Example');
  console.log('======================================');

  try {
    const benchmark = new PerformanceBenchmark();

    // Benchmark single wallet creation
    const singleWalletResult = await benchmark.benchmark(
      'Single Wallet Creation',
      async () => {
        const mnemonic = generateMnemonicPhrase(12);
        const wallet = await createWallet({
          keyType: KEY_TYPE.ED25519,
          hashTypes: [HASH_TYPE.SHA3_256],
          mnemonic
        });
        wallet.secureClear();
        return wallet;
      },
      {
        iterations: 100,
        warmupIterations: 5,
        measureMemory: true
      }
    );

    console.log('Single Wallet Creation Results:');
    console.log(`  Average Time: ${singleWalletResult.averageTime.toFixed(4)}ms`);
    console.log(`  Min Time: ${singleWalletResult.minTime.toFixed(4)}ms`);
    console.log(`  Max Time: ${singleWalletResult.maxTime.toFixed(4)}ms`);
    console.log(`  Std Dev: ${singleWalletResult.standardDeviation.toFixed(4)}ms`);

    if (singleWalletResult.memoryUsage) {
      console.log(`  Memory Delta: ${singleWalletResult.memoryUsage.delta} bytes`);
    }

    // Benchmark multiple wallet derivation
    const multipleWalletResult = await benchmark.benchmark(
      'Multiple Wallet Derivation',
      async () => {
        const mnemonic = generateMnemonicPhrase(12);
        const wallets = await deriveMultipleWallets({
          keyType: KEY_TYPE.ED25519,
          hashTypes: [HASH_TYPE.SHA3_256],
          mnemonic,
          count: 10
        });
        wallets.forEach(wallet => wallet.secureClear());
        return wallets;
      },
      {
        iterations: 50,
        warmupIterations: 3,
        measureMemory: true
      }
    );

    console.log('\nMultiple Wallet Derivation Results:');
    console.log(`  Average Time: ${multipleWalletResult.averageTime.toFixed(4)}ms`);
    console.log(`  Min Time: ${multipleWalletResult.minTime.toFixed(4)}ms`);
    console.log(`  Max Time: ${multipleWalletResult.maxTime.toFixed(4)}ms`);
    console.log(`  Std Dev: ${multipleWalletResult.standardDeviation.toFixed(4)}ms`);

    if (multipleWalletResult.memoryUsage) {
      console.log(`  Memory Delta: ${multipleWalletResult.memoryUsage.delta} bytes`);
    }

    // Generate performance report
    console.log('\n📊 Performance Report:');
    console.log(benchmark.generateReport());

  } catch (error) {
    console.error('❌ Performance benchmark failed:', ErrorHandler.formatError(error as Error));
    throw error;
  }
}

/**
 * Example 4: Advanced Transaction Creation
 * 
 * Demonstrates advanced transaction creation with comprehensive validation
 * and error handling.
 */
export async function advancedTransactionCreation(): Promise<void> {
  console.log('\n💸 Advanced Transaction Creation Example');
  console.log('========================================');

  try {
    // Create sender wallet
    const senderMnemonic = generateMnemonicPhrase(12);
    const senderWallet = await createWallet({
      keyType: KEY_TYPE.ED25519,
      hashTypes: [HASH_TYPE.SHA3_256],
      mnemonic: senderMnemonic
    });

    // Create recipient wallet
    const recipientMnemonic = generateMnemonicPhrase(12);
    const recipientWallet = await createWallet({
      keyType: KEY_TYPE.ED25519,
      hashTypes: [HASH_TYPE.SHA3_256],
      mnemonic: recipientMnemonic
    });

    console.log('Sender Address:', senderWallet.address);
    console.log('Recipient Address:', recipientWallet.address);

    // Validate contract ID
    const contractId = '$ZRA+0000';
    const contractValidation = validateContractId(contractId);
    if (!contractValidation.isValid) {
      throw createValidationError(
        `Invalid contract ID: ${contractValidation.error}`,
        walletErrorContext('advancedTransactionCreation')
      );
    }

    // Validate amounts
    const sendAmount = '10.5';
    const amountValidation = validateAmount(sendAmount, {
      minAmount: '0.001',
      maxAmount: '1000000',
      allowZero: false
    });

    if (!amountValidation.isValid) {
      throw createValidationError(
        `Invalid amount: ${amountValidation.error}`,
        walletErrorContext('advancedTransactionCreation')
      );
    }

    // Create transaction inputs
    const inputs: CoinTXNInput[] = [{
      privateKey: senderWallet.privateKey,
      publicKey: senderWallet.publicKey,
      amount: sendAmount,
      feePercent: '100'
    }];

    // Create transaction outputs
    const outputs: CoinTXNOutput[] = [{
      to: recipientWallet.address,
      amount: '10.0',
      memo: 'Advanced transaction example'
    }];

    // Configure fees
    const feeConfig: FeeConfig = {
      baseFeeId: '$ZRA+0000',
      overestimatePercent: 5.0
    };

    console.log('Creating transaction...');
    
    // Create transaction with benchmarking
    const transactionResult = await benchmark(
      'Transaction Creation',
      async () => {
        return await createCoinTXN(
          inputs,
          outputs,
          contractId,
          feeConfig,
          'Advanced transaction example'
        );
      },
      {
        iterations: 1,
        measureMemory: true
      }
    );

    console.log('✅ Transaction created successfully');
    console.log(`  Creation Time: ${transactionResult.averageTime.toFixed(4)}ms`);
    console.log(`  Transaction Hash: ${transactionResult.metadata?.transaction?.base?.hash || 'N/A'}`);

    // Clean up wallets
    senderWallet.secureClear();
    recipientWallet.secureClear();
    console.log('✅ Wallet data cleared from memory');

  } catch (error) {
    console.error('❌ Advanced transaction creation failed:', ErrorHandler.formatError(error as Error));
    throw error;
  }
}

/**
 * Example 5: Error Handling and Recovery
 * 
 * Demonstrates comprehensive error handling and recovery strategies.
 */
export async function errorHandlingExample(): Promise<void> {
  console.log('\n🛡️ Error Handling and Recovery Example');
  console.log('=====================================');

  try {
    // Example 1: Invalid mnemonic handling
    console.log('Testing invalid mnemonic handling...');
    
    try {
      const invalidMnemonic = 'invalid mnemonic phrase';
      const wallet = await createWallet({
        keyType: KEY_TYPE.ED25519,
        hashTypes: [HASH_TYPE.SHA3_256],
        mnemonic: invalidMnemonic
      });
      console.log('❌ Should have failed with invalid mnemonic');
    } catch (error) {
      console.log('✅ Caught invalid mnemonic error:', ErrorHandler.formatError(error as Error));
      console.log('  Error severity:', ErrorHandler.getErrorSeverity(error as Error));
      console.log('  Is retryable:', ErrorHandler.isRetryableError(error as Error));
    }

    // Example 2: Invalid key type handling
    console.log('\nTesting invalid key type handling...');
    
    try {
      const mnemonic = generateMnemonicPhrase(12);
      const wallet = await createWallet({
        keyType: 'invalid-key-type' as any,
        hashTypes: [HASH_TYPE.SHA3_256],
        mnemonic
      });
      console.log('❌ Should have failed with invalid key type');
    } catch (error) {
      console.log('✅ Caught invalid key type error:', ErrorHandler.formatError(error as Error));
      console.log('  Error severity:', ErrorHandler.getErrorSeverity(error as Error));
    }

    // Example 3: Invalid hash types handling
    console.log('\nTesting invalid hash types handling...');
    
    try {
      const mnemonic = generateMnemonicPhrase(12);
      const wallet = await createWallet({
        keyType: KEY_TYPE.ED25519,
        hashTypes: ['invalid-hash-type' as any],
        mnemonic
      });
      console.log('❌ Should have failed with invalid hash types');
    } catch (error) {
      console.log('✅ Caught invalid hash types error:', ErrorHandler.formatError(error as Error));
      console.log('  Error severity:', ErrorHandler.getErrorSeverity(error as Error));
    }

    // Example 4: Recovery strategy
    console.log('\nTesting recovery strategy...');
    
    let wallet;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const mnemonic = generateMnemonicPhrase(12);
        wallet = await createWallet({
          keyType: KEY_TYPE.ED25519,
          hashTypes: [HASH_TYPE.SHA3_256],
          mnemonic
        });
        console.log('✅ Wallet created successfully on attempt', attempts + 1);
        break;
      } catch (error) {
        attempts++;
        console.log(`❌ Attempt ${attempts} failed:`, ErrorHandler.formatError(error as Error));
        
        if (attempts >= maxAttempts) {
          throw error;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (wallet) {
      console.log('  Final wallet address:', wallet.address);
      wallet.secureClear();
      console.log('✅ Recovery successful');
    }

  } catch (error) {
    console.error('❌ Error handling example failed:', ErrorHandler.formatError(error as Error));
    throw error;
  }
}

/**
 * Run all advanced examples
 */
export async function runAllAdvancedExamples(): Promise<void> {
  console.log('🚀 Running All Advanced Examples');
  console.log('================================');

  try {
    await advancedWalletCreation();
    await multipleWalletDerivation();
    await walletPerformanceBenchmark();
    await advancedTransactionCreation();
    await errorHandlingExample();

    console.log('\n🎉 All advanced examples completed successfully!');
  } catch (error) {
    console.error('\n💥 Advanced examples failed:', ErrorHandler.formatError(error as Error));
    throw error;
  }
}

// Export individual examples for selective execution
export {
  advancedWalletCreation,
  multipleWalletDerivation,
  walletPerformanceBenchmark,
  advancedTransactionCreation,
  errorHandlingExample
};
