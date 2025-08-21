// Zera JavaScript SDK - Main Entry Point
// This file demonstrates how to use the generated Protocol Buffer classes

// Import the generated protobuf classes
const { 
  CoinTXN, 
  BaseTXN, 
  PublicKey, 
  TXN_STATUS,
  TRANSACTION_TYPE 
} = require('./proto/generated');

// Import wallet creation functionality
const { 
  ZeraWallet, 
  createZeraWallet, 
  generateMnemonic, 
  validateZeraAddress 
} = require('./src/wallet-creation');

// Export all protobuf classes for easy importing
module.exports = {
  // Protocol Buffer Classes
  CoinTXN,
  BaseTXN,
  PublicKey,
  TXN_STATUS,
  TRANSACTION_TYPE,
  
  // Wallet Creation Classes and Functions
  ZeraWallet,
  createZeraWallet,
  generateMnemonic,
  validateZeraAddress,
  
  // Utility functions
  createTransaction: (feeAmount, feeId, contractId) => {
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
  },
  
  // Version info
  version: '1.0.0',
  description: 'Zera JavaScript SDK with Protocol Buffers and Wallet Creation'
};

// Example usage (when run directly)
if (require.main === module) {
  console.log('=== Zera JavaScript SDK ===');
  console.log('Version:', module.exports.version);
  console.log('Description:', module.exports.description);
  
  try {
    // Create a sample transaction
    const txn = module.exports.createTransaction("1000000", "ZERA", "SAMPLE_CONTRACT");
    console.log('\n✅ Sample transaction created successfully!');
    console.log('Transaction size:', txn.serializeBinary().length, 'bytes');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\nMake sure you have built the protobufs first:');
    console.log('npm run build:proto');
  }
}
