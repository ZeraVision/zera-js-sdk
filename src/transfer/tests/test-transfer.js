/**
 * Tests for Go-like Protobuf Transfer Implementation
 * Demonstrates proper use of generated protobuf classes
 */

import { assert } from '../../test-utils/index.js';
import { 
  transfer, 
  createCoinTXN, 
  serializeTransfer, 
  deserializeTransfer 
} from '../transfer.js';
import { 
  TransferSchema as Transfer, 
  CoinTXNSchema as CoinTXN, 
  OutputTransfersSchema as OutputTransfers 
} from '../../../proto/generated/txn_pb.js';
import { toJson } from '@bufbuild/protobuf';

export async function testSingleTransfer() {
  console.log('🧪 Testing Single Transfer with Real Protobuf');
  
  const transferInstance = transfer('alice', 'bob', 100, '$ZRA+0000', '', 'payment');
  
  // Test that we get a real protobuf instance
  assert.ok(transferInstance.$typeName === 'zera_txn.Transfer', 'Should be a real protobuf Transfer instance');
  
  // Test protobuf properties work correctly
  assert.ok(transferInstance.amount === '100', 'Amount should be 100');
  assert.ok(transferInstance.contractId === '$ZRA+0000', 'Contract ID should be $ZRA+0000');
  assert.ok(transferInstance.memo === 'payment', 'Memo should be payment');
  
  // Test that recipient address is properly converted to bytes
  const recipientBytes = transferInstance.recipientAddress;
  assert.ok(recipientBytes instanceof Uint8Array, 'Recipient address should be Uint8Array');
  
  console.log('✅ Single transfer protobuf test passed');
}

export async function testMultipleOutputs() {
  console.log('🧪 Testing Multiple Transfers with Real Protobuf');
  
  const transfers = transfer('alice', ['bob', 'charlie'], [50, 30], '$ZRA+0000', '', ['payment1', 'payment2']);
  
  assert.ok(Array.isArray(transfers), 'Should return array for multiple transfers');
  assert.ok(transfers.length === 2, 'Should have 2 transfers');
  
  // Test each transfer is a real protobuf instance
  transfers.forEach((transfer, index) => {
    assert.ok(transfer.$typeName === 'zera_txn.Transfer', `Transfer ${index} should be protobuf instance`);
    assert.ok(transfer.amount === [50, 30][index].toString(), `Transfer ${index} amount should match`);
    assert.ok(transfer.memo === ['payment1', 'payment2'][index], `Transfer ${index} memo should match`);
  });
  
  console.log('✅ Multiple transfers protobuf test passed');
}

export async function testBinarySerialization() {
  console.log('🧪 Testing Binary Serialization');
  
  const transferInstance = transfer('alice', 'bob', 100);
  
  // Serialize to binary
  const binary = serializeTransfer(transferInstance);
  assert.ok(binary instanceof Uint8Array, 'Serialized data should be Uint8Array');
  
  // Deserialize back
  const deserialized = deserializeTransfer(binary);
  assert.ok(deserialized.$typeName === 'zera_txn.Transfer', 'Deserialized should be protobuf instance');
  
  // Test data integrity
  assert.ok(deserialized.amount === transferInstance.amount, 'Amount should match after deserialization');
  assert.ok(deserialized.contractId === transferInstance.contractId, 'Contract ID should match');
  
  console.log('✅ Binary serialization test passed');
}


testCoinTXNStructure();

export async function testCoinTXNStructure() {
  console.log('🧪 Testing Complete CoinTXN Structure');
  
  const coinTxn = createCoinTXN('alice', 'bob', 100, '$ZRA+0000', '', 'payment');
  
  assert.ok(coinTxn.$typeName === 'zera_txn.CoinTXN', 'Should be a real CoinTXN instance');
  assert.ok(coinTxn.contractId === '$ZRA+0000', 'Contract ID should be set');
  assert.ok(coinTxn.inputTransfers.length === 1, 'Should have 1 input transfer');
  assert.ok(coinTxn.outputTransfers.length === 1, 'Should have 1 output transfer');
  
  const outputTransfer = coinTxn.outputTransfers[0];
  assert.ok(outputTransfer.$typeName === 'zera_txn.OutputTransfers', 'Output should be OutputTransfers instance');
  assert.ok(outputTransfer.amount === '100', 'Output amount should be 100');
  
  console.log('✅ CoinTXN structure test passed');
}

export async function testProtobufMethods() {
  console.log('🧪 Testing Protobuf Methods');
  
  const transferInstance = transfer('alice', 'bob', 100);
  
  // Test property access
  assert.ok(typeof transferInstance.amount === 'string', 'amount should be string');
  assert.ok(typeof transferInstance.contractId === 'string', 'contractId should be string');
  assert.ok(transferInstance.recipientAddress instanceof Uint8Array, 'recipientAddress should be Uint8Array');
  
  // Test toJson method (like Go's json.Marshal)
  const obj = toJson(Transfer, transferInstance);
  assert.ok(typeof obj === 'object', 'toJson() should return object');
  assert.ok(obj.amount === '100', 'Object amount should match');
  
  // Test binary serialization using our serializeTransfer function
  const binary = serializeTransfer(transferInstance);
  assert.ok(binary instanceof Uint8Array, 'serializeTransfer() should return Uint8Array');
  
  console.log('✅ Protobuf methods test passed');
}
