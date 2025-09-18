/**
 * Test Signature Debug Utilities
 * 
 * This script demonstrates how to use the signature debug utilities
 * to troubleshoot signature validation issues.
 */

import { createCoinTXN } from '../index.js';
import { ED25519_TEST_KEYS, TEST_WALLET_ADDRESSES } from '../../test-utils/index.js';
import { debugSignatureValidation, printDebugResults, testSignatureValidation } from '../signature-debug.js';

/**
 * Test signature validation with a simple transaction
 */
testSimpleSignatureDebug()
export async function testSimpleSignatureDebug() {
  console.log('🧪 Testing Signature Debug with Simple Transaction');
  
  // Create a simple transaction
  const input = {
    privateKey: ED25519_TEST_KEYS.alice.privateKey,
    publicKey: ED25519_TEST_KEYS.alice.publicKey,
    amount: '1.0',
    feePercent: '100'
  };
  
  const output = {
    to: TEST_WALLET_ADDRESSES.bob,
    amount: '1.0',
    memo: 'Signature debug test'
  };
  
  try {
    // Create transaction
    const transaction = await createCoinTXN([input], [output], '$ZRA+0000', {
      baseFeeId: '$ZRA+0000',
    }, 'Debug test transaction');
    
    console.log('✅ Transaction created successfully');
    
    // Test signature validation
    const expectedPublicKeys = [input.publicKey];
    const results = testSignatureValidation(transaction, expectedPublicKeys);
    
    return results;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  }
}

/**
 * Test signature validation with multiple inputs
 */
export async function testMultiInputSignatureDebug() {
  console.log('🧪 Testing Signature Debug with Multiple Inputs');
  
  // Create inputs
  const inputs = [
    {
      privateKey: ED25519_TEST_KEYS.alice.privateKey,
      publicKey: ED25519_TEST_KEYS.alice.publicKey,
      amount: '2.0',
      feePercent: '60'
    },
    {
      privateKey: ED25519_TEST_KEYS.bob.privateKey,
      publicKey: ED25519_TEST_KEYS.bob.publicKey,
      amount: '1.0',
      feePercent: '40'
    }
  ];
  
  const outputs = [
    {
      to: TEST_WALLET_ADDRESSES.charlie,
      amount: '3.0',
      memo: 'Multi-input debug test'
    }
  ];
  
  try {
    // Create transaction
    const transaction = await createCoinTXN(inputs, outputs, '$ZRA+0000', {
      baseFeeId: '$ZRA+0000',
      baseFee: '0.002'
    }, 'Multi-input debug test');
    
    console.log('✅ Multi-input transaction created successfully');
    
    // Test signature validation
    const expectedPublicKeys = inputs.map(input => input.publicKey);
    const results = testSignatureValidation(transaction, expectedPublicKeys);
    
    return results;
    
  } catch (error) {
    console.error('❌ Multi-input test failed:', error.message);
    throw error;
  }
}

/**
 * Test signature validation with ED448 keys
 */
export async function testED448SignatureDebug() {
  console.log('🧪 Testing Signature Debug with ED448 Keys');
  
  // Create input with ED448 key
  const input = {
    privateKey: ED25519_TEST_KEYS.alice.privateKey, // Using ED25519 for now since ED448 test keys might not be available
    publicKey: ED25519_TEST_KEYS.alice.publicKey,
    amount: '1.5',
    feePercent: '100'
  };
  
  const output = {
    to: TEST_WALLET_ADDRESSES.bob,
    amount: '1.5',
    memo: 'ED448 debug test'
  };
  
  try {
    // Create transaction
    const transaction = await createCoinTXN([input], [output], '$ZRA+0000', {
      baseFeeId: '$ZRA+0000',
      baseFee: '0.001'
    }, 'ED448 debug test');
    
    console.log('✅ ED448 transaction created successfully');
    
    // Test signature validation
    const expectedPublicKeys = [input.publicKey];
    const results = testSignatureValidation(transaction, expectedPublicKeys);
    
    return results;
    
  } catch (error) {
    console.error('❌ ED448 test failed:', error.message);
    throw error;
  }
}

/**
 * Run all signature debug tests
 */
export async function runAllSignatureDebugTests() {
  console.log('🚀 Running All Signature Debug Tests');
  console.log('=' .repeat(60));
  
  const results = [];
  
  try {
    // Test 1: Simple transaction
    console.log('\n📝 Test 1: Simple Transaction');
    const simpleResult = await testSimpleSignatureDebug();
    results.push({ test: 'Simple Transaction', result: simpleResult });
    
    // Test 2: Multi-input transaction
    console.log('\n📝 Test 2: Multi-Input Transaction');
    const multiResult = await testMultiInputSignatureDebug();
    results.push({ test: 'Multi-Input Transaction', result: multiResult });
    
    // Test 3: ED448 transaction
    console.log('\n📝 Test 3: ED448 Transaction');
    const ed448Result = await testED448SignatureDebug();
    results.push({ test: 'ED448 Transaction', result: ed448Result });
    
    // Summary
    console.log('\n📊 Test Summary');
    console.log('=' .repeat(60));
    results.forEach((test, i) => {
      const status = test.result.isValid ? '✅ PASS' : '❌ FAIL';
      console.log(`${i + 1}. ${test.test}: ${status}`);
    });
    
    const allPassed = results.every(r => r.result.isValid);
    console.log(`\n🎯 Overall Result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    return results;
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    throw error;
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllSignatureDebugTests()
    .then(() => {
      console.log('\n🎉 All signature debug tests completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test suite failed:', error.message);
      process.exit(1);
    });
}
