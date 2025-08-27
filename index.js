// Zera JavaScript SDK - Main Entry Point
// This file demonstrates how to use the generated Protocol Buffer classes

// Import the generated protobuf classes
import { 
  CoinTXN, 
  BaseTXN, 
  PublicKey, 
  TXN_STATUS,
  TRANSACTION_TYPE 
} from './proto/generated/index.js';

// Import wallet creation functionality
import { 
  ZeraWallet, 
  createWallet, 
  generateMnemonicPhrase, 
  generateZeraAddress 
} from './src/wallet-creation/index.js';

// Export all protobuf classes for easy importing
export {
  // Protocol Buffer Classes
  CoinTXN,
  BaseTXN,
  PublicKey,
  TXN_STATUS,
  TRANSACTION_TYPE,
  
  // Wallet Creation Classes and Functions
  ZeraWallet,
  createWallet,
  generateMnemonicPhrase,
  generateZeraAddress,
  
  // Version info
  version: '1.0.0',
  description: 'Zera JavaScript SDK with Protocol Buffers and Wallet Creation'
};

// Utility function for creating transactions
export function createTransaction(feeAmount, feeId, contractId) {
  const baseTxn = new BaseTXN();
  baseTxn.setFeeAmount(feeAmount);
  baseTxn.setFeeId(feeId);
  baseTxn.setNonce(Date.now());
  
  const publicKey = new PublicKey();
  publicKey.setSingle(new Uint8Array([1, 2, 3, 4, 5])); // Example key
  
  baseTxn.setPublicKey(publicKey);
  
  const coinTxn = new CoinTXN();
  coinTxn.setBase(baseTxn);
  coinTxn.setContractId(contractId);
  
  return coinTxn;
}

// Example usage (when run directly)
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('=== Zera JavaScript SDK ===');
  console.log('Version:', '1.0.0');
  console.log('Description:', 'Zera JavaScript SDK with Protocol Buffers and Wallet Creation');
  
  try {
    // Create a sample transaction
    const txn = createTransaction("1000000", "ZERA", "SAMPLE_CONTRACT");
    console.log('\n✅ Sample transaction created successfully!');
    console.log('Transaction size:', txn.serializeBinary().length, 'bytes');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\nMake sure you have built the protobufs first:');
    console.log('npm run build:proto');
  }
}
