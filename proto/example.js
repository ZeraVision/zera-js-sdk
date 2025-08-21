// Example usage of generated Protocol Buffer classes
// This file demonstrates how to work with the Zera transaction protobufs

// Import the generated protobuf classes (after building)
const { 
  CoinTXN, 
  BaseTXN, 
  PublicKey, 
  Transfer,
  TXN_STATUS,
  TRANSACTION_TYPE 
} = require('./generated');

// Example 1: Create a simple transaction
function createSimpleTransaction() {
  console.log('Creating simple transaction...');
  
  // Create base transaction
  const baseTxn = new BaseTXN();
  baseTxn.setFeeAmount("1000000"); // 1 ZERA in smallest unit
  baseTxn.setFeeId("ZERA");
  baseTxn.setNonce(1);
  
  // Create public key
  const publicKey = new PublicKey();
  publicKey.setSingle(new Uint8Array([1, 2, 3, 4, 5])); // Example key
  
  baseTxn.setPublicKey(publicKey);
  
  // Create coin transaction
  const coinTxn = new CoinTXN();
  coinTxn.setBase(baseTxn);
  coinTxn.setContractId("ZERA_CONTRACT");
  
  console.log('Transaction created successfully!');
  return coinTxn;
}

// Example 2: Serialize and deserialize
function serializeExample(coinTxn) {
  console.log('\nSerializing transaction...');
  
  // Serialize to binary
  const binary = coinTxn.serializeBinary();
  console.log(`Serialized size: ${binary.length} bytes`);
  
  // Deserialize from binary
  const deserialized = CoinTXN.deserializeBinary(binary);
  console.log('Transaction deserialized successfully!');
  
  return deserialized;
}

// Example 3: Working with enums
function enumExample() {
  console.log('\nWorking with enums...');
  
  console.log('TXN_STATUS.OK:', TXN_STATUS.OK);
  console.log('TRANSACTION_TYPE.COIN_TYPE:', TRANSACTION_TYPE.COIN_TYPE);
  
  // Check transaction status
  const status = TXN_STATUS.OK;
  if (status === TXN_STATUS.OK) {
    console.log('Transaction status is OK');
  }
}

// Example 4: Create a transfer
function createTransfer() {
  console.log('\nCreating transfer...');
  
  const transfer = new Transfer();
  transfer.setRecipientAddress(new Uint8Array([10, 20, 30, 40, 50]));
  transfer.setAmount("500000"); // 0.5 ZERA
  transfer.setContractId("ZERA_CONTRACT");
  transfer.setBaseFeeAmount("1000");
  transfer.setBaseFeeId("ZERA");
  
  console.log('Transfer created successfully!');
  return transfer;
}

// Main execution
function main() {
  try {
    console.log('=== Zera Protocol Buffer Examples ===\n');
    
    // Create transaction
    const coinTxn = createSimpleTransaction();
    
    // Serialize/deserialize
    const deserialized = serializeExample(coinTxn);
    
    // Work with enums
    enumExample();
    
    // Create transfer
    const transfer = createTransfer();
    
    console.log('\n=== All examples completed successfully! ===');
    
  } catch (error) {
    console.error('Error running examples:', error.message);
    console.log('\nMake sure you have built the protobufs first:');
    console.log('cd proto && npm run build');
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = {
  createSimpleTransaction,
  serializeExample,
  enumExample,
  createTransfer
};
