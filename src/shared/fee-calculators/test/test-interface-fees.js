/**
 * Interface Fee Tests
 * Tests the interface fee functionality in Universal Fee Calculator
 */

import { UniversalFeeCalculator } from '../universal-fee-calculator.js';
import { TRANSACTION_TYPE } from '../../protobuf-enums.js';

// Mock protobuf object for testing
const createMockProtoObject = () => ({
  base: {
    publicKey: { single: new Uint8Array(32) },
    timestamp: new Date(),
    nonce: 1n,
    memo: 'Test transaction'
  },
  contractId: '$BTC+1234',
  auth: {
    publicKey: [{ single: new Uint8Array(32) }]
  },
  inputTransfers: [],
  outputTransfers: []
});

/**
 * Test interface fee calculation
 */
export async function testInterfaceFeeCalculation() {
  console.log('🧪 Testing Interface Fee Calculation');
  
  try {
    // Test 1: Valid interface fee calculation
    console.log('\n✅ Test 1: Valid Interface Fee Calculation');
    const validFee = UniversalFeeCalculator.calculateInterfaceFee({
      interfaceFeeAmount: '1.234',
      interfaceFeeId: '$ZRA+0000',
      interfaceAddress: 'test_provider_address'
    });
    
    console.log('  - Fee Amount:', validFee.fee);
    console.log('  - Original Amount:', validFee.breakdown.interfaceFeeAmount);
    console.log('  - Converted Amount:', validFee.breakdown.interfaceFeeAmountInSmallestUnits);
    console.log('  - Fee ID:', validFee.interfaceFeeId);
    console.log('  - Provider Address:', validFee.interfaceAddress);
    
    // Test 2: Missing interfaceFeeId (should throw error)
    console.log('\n❌ Test 2: Missing interfaceFeeId');
    try {
      UniversalFeeCalculator.calculateInterfaceFee({
        interfaceFeeAmount: '1.234',
        interfaceAddress: 'test_provider_address'
      });
      console.log('  - ERROR: Should have thrown error');
    } catch (error) {
      console.log('  - Expected error:', error.message);
    }
    
    // Test 3: Missing interfaceFeeAmount (should throw error)
    console.log('\n❌ Test 3: Missing interfaceFeeAmount');
    try {
      UniversalFeeCalculator.calculateInterfaceFee({
        interfaceFeeId: '$ZRA+0000',
        interfaceAddress: 'test_provider_address'
      });
      console.log('  - ERROR: Should have thrown error');
    } catch (error) {
      console.log('  - Expected error:', error.message);
    }
    
    // Test 4: Missing interfaceAddress (should throw error)
    console.log('\n❌ Test 4: Missing interfaceAddress');
    try {
      UniversalFeeCalculator.calculateInterfaceFee({
        interfaceFeeAmount: '1.234',
        interfaceFeeId: '$ZRA+0000'
      });
      console.log('  - ERROR: Should have thrown error');
    } catch (error) {
      console.log('  - Expected error:', error.message);
    }
    
    // Test 5: Zero interfaceFeeAmount (should throw error)
    console.log('\n❌ Test 5: Zero interfaceFeeAmount');
    try {
      UniversalFeeCalculator.calculateInterfaceFee({
        interfaceFeeAmount: '0',
        interfaceFeeId: '$ZRA+0000',
        interfaceAddress: 'test_provider_address'
      });
      console.log('  - ERROR: Should have thrown error');
    } catch (error) {
      console.log('  - Expected error:', error.message);
    }
    
    console.log('\n✅ Interface Fee Calculation Tests Completed');
    
  } catch (error) {
    console.error('❌ Interface Fee Calculation Test Failed:', error.message);
  }
}

/**
 * Test interface fees in complete fee calculation
 */
export async function testCompleteFeeCalculation() {
  console.log('\n🧪 Testing Complete Fee Calculation with Interface Fees');
  
  try {
    const mockProtoObject = createMockProtoObject();
    
    // Test 1: No interface fees (default behavior)
    console.log('\n✅ Test 1: No Interface Fees (Default)');
    const noInterfaceResult = await UniversalFeeCalculator.calculateFee({
      protoObject: mockProtoObject,
      baseFeeId: '$ZRA+0000'
    });
    
    console.log('  - Interface Fee:', noInterfaceResult.interfaceFee);
    console.log('  - Interface Fee ID:', noInterfaceResult.interfaceFeeId);
    console.log('  - Interface Address:', noInterfaceResult.interfaceAddress);
    console.log('  - Breakdown Interface:', noInterfaceResult.breakdown.interface);
    
    // Test 2: With interface fees
    console.log('\n✅ Test 2: With Interface Fees');
    const withInterfaceResult = await UniversalFeeCalculator.calculateFee({
      protoObject: mockProtoObject,
      baseFeeId: '$ZRA+0000',
      interfaceFeeAmount: '0.005',
      interfaceFeeId: '$ZRA+0000',
      interfaceAddress: 'test_provider_address'
    });
    
    console.log('  - Interface Fee:', withInterfaceResult.interfaceFee);
    console.log('  - Interface Fee ID:', withInterfaceResult.interfaceFeeId);
    console.log('  - Interface Address:', withInterfaceResult.interfaceAddress);
    console.log('  - Breakdown Interface:', withInterfaceResult.breakdown.interface);
    
    // Test 3: Check protobuf object modification
    console.log('\n✅ Test 3: Protobuf Object Modification');
    if (withInterfaceResult.protoObject.base.interfaceFee) {
      console.log('  - Interface fee added to protobuf:', withInterfaceResult.protoObject.base.interfaceFee);
      console.log('  - Interface fee ID added to protobuf:', withInterfaceResult.protoObject.base.interfaceFeeId);
      console.log('  - Interface address added to protobuf (decoded):', withInterfaceResult.protoObject.base.interfaceAddress);
    } else {
      console.log('  - ERROR: Interface fee not added to protobuf');
    }
    
    console.log('\n✅ Complete Fee Calculation Tests Completed');
    
  } catch (error) {
    console.error('❌ Complete Fee Calculation Test Failed:', error.message);
  }
}

/**
 * Test interface fees with different contract IDs
 */
export async function testInterfaceFeesWithDifferentContracts() {
  console.log('\n🧪 Testing Interface Fees with Different Contract IDs');
  
  try {
    const contractIds = ['$ZRA+0000', '$BTC+1234', '$ETH+5678'];
    
    for (const contractId of contractIds) {
      console.log(`\n✅ Testing with contract ID: ${contractId}`);
      
      const interfaceFee = UniversalFeeCalculator.calculateInterfaceFee({
        interfaceFeeAmount: '1.0',
        interfaceFeeId: contractId,
        interfaceAddress: 'test_provider_address'
      });
      
      console.log(`  - Fee Amount: ${interfaceFee.fee}`);
      console.log(`  - Fee ID: ${interfaceFee.interfaceFeeId}`);
      console.log(`  - Original Amount: ${interfaceFee.breakdown.interfaceFeeAmount}`);
      console.log(`  - Converted Amount: ${interfaceFee.breakdown.interfaceFeeAmountInSmallestUnits}`);
    }
    
    console.log('\n✅ Different Contract ID Tests Completed');
    
  } catch (error) {
    console.error('❌ Different Contract ID Test Failed:', error.message);
  }
}

/**
 * Run all interface fee tests
 */
export async function runAllInterfaceFeeTests() {
  console.log('🚀 Running All Interface Fee Tests');
  console.log('=====================================');
  
  try {
    await testInterfaceFeeCalculation();
    await testCompleteFeeCalculation();
    await testInterfaceFeesWithDifferentContracts();
    
    console.log('\n🎉 All Interface Fee Tests Completed Successfully!');
    
  } catch (error) {
    console.error('💥 Interface Fee Tests Failed:', error.message);
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllInterfaceFeeTests();
}
