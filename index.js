// Zera JavaScript SDK - Main Entry Point
// This file demonstrates how to use the generated Protocol Buffer classes

// Import wallet creation functionality
import { 
  ZeraWallet, 
  createWallet, 
  generateMnemonicPhrase, 
  generateZeraAddress 
} from './src/wallet-creation/index.js';

// Import transfer functionality
import { transfer } from './src/transfer/index.js';

// Import shared transaction utilities
import {
  TransactionValidator,
  TransactionFormatter,
  FeeCalculator,
  TransactionBuilder,
  TransactionSerializer,
  TXN_STATUS,
  TRANSACTION_TYPE,
  CONTRACT_FEE_TYPE
} from './src/shared/transaction-utils.js';

// Import universal fee calculator
import { UniversalFeeCalculator } from './src/shared/universal-fee-calculator.js';

// Export all wallet creation classes and functions
export {
  ZeraWallet,
  createWallet,
  generateMnemonicPhrase,
  generateZeraAddress
};

// Export transfer functionality
export { transfer };

// Export shared transaction utilities
export {
  TransactionValidator,
  TransactionFormatter,
  FeeCalculator,
  TransactionBuilder,
  TransactionSerializer,
  TXN_STATUS,
  TRANSACTION_TYPE,
  CONTRACT_FEE_TYPE
};

// Export universal fee calculator
export { UniversalFeeCalculator };

// Export version info as constants
export const VERSION = '1.0.0';
export const DESCRIPTION = 'Zera JavaScript SDK with Modern ESM and Wallet Creation';

// Utility function for creating transactions (placeholder for now)
export function createTransaction(feeAmount, feeId, contractId) {
  // This will be implemented once protobufs are properly generated
  console.log('Creating transaction with:', { feeAmount, feeId, contractId });
  
  // Return a simple transaction object for now
  return {
    feeAmount,
    feeId,
    contractId,
    nonce: Date.now(),
    timestamp: new Date().toISOString()
  };
}

// Example usage (when run directly)
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('=== Zera JavaScript SDK ===');
  console.log('Version:', VERSION);
  console.log('Description:', DESCRIPTION);
  
  try {
    // Create a sample transaction
    const txn = createTransaction("1000000", "ZERA", "SAMPLE_CONTRACT");
    console.log('\n✅ Sample transaction created successfully!');
    console.log('Transaction:', txn);
    
    // Generate a sample mnemonic
    const mnemonic = generateMnemonicPhrase();
    console.log('\n✅ Sample mnemonic generated:', mnemonic);
    
    // Create a sample transfer using the modern approach
    const transferTxn = transfer('zera1234567890abcdef', 'zera0987654321fedcba', 100, 'USDC', 'base memo', 'transfer memo');
    console.log('\n✅ Sample transfer created successfully!');
    console.log('Transfer Type:', transferTxn.constructor.name);
    console.log('Transfer Data:', transferTxn);
    console.log('Serialized:', transferTxn.toBinary());
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\nMake sure you have built the protobufs first:');
    console.log('npm run build:proto');
  }
}
