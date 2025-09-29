/**
 * Real-World SDK Usage Examples
 * 
 * This file demonstrates how to use the ZERA SDK in real scenarios,
 * showing how users would construct transactions by pulling wallet data
 * from their own data sources and building inputs/outputs manually.
 * 
 * Memo's optional. Base memo more typically used. Transfer memo for multi-output if required.
 */

import { createCoinTXN, sendCoinTXN } from '../index.js';
import {
  ED25519_TEST_KEYS,
  ED448_TEST_KEYS,
  TEST_WALLET_ADDRESSES
} from '../../test-utils/index.js';
import type { CoinTXNInput, CoinTXNOutput, FeeConfig} from '../../types/index.js';
import { TESTING_GRPC_OVERRIDE_CONFIG } from '../../shared/utils/testing-defaults/index.js';

/**
 * Example 1: Simple Transfer
 * Alice sends 1.5 ZRA to Bob
 * 
 * This shows how users would construct a transaction by pulling wallet data
 * from their own data sources (database, config files, etc.)
 */
export async function exampleSimpleTransfer(): Promise<void> {
  console.log('💸 Example 1: Simple Transfer');
  
  // Start timer for end-to-end measurement
  const startTime = Date.now();
  
  // In a real application, you would pull this data from your storage
  var aliceWallet = ED25519_TEST_KEYS.alice;
  //aliceWallet = ED448_TEST_KEYS.alice;
  const bobAddress = TEST_WALLET_ADDRESSES.bob;
  
  console.log('📋 Wallet data pulled from data source:');
  console.log('  Alice private key:', aliceWallet.privateKey.substring(0, 20) + '...');
  console.log('  Alice public key:', aliceWallet.publicKey);
  console.log('  Bob address:', bobAddress);
  
  // Construct input manually (as users would do)
  const input: CoinTXNInput[] = [
    {
      privateKey: aliceWallet.privateKey,
      publicKey: aliceWallet.publicKey,
      amount: '1.5',
      feePercent: '100'
    }
  ];
  
  // Construct output manually (as users would do)
  const output: CoinTXNOutput[] = [
    {
      to: bobAddress,
      amount: '1.5',
      memo: 'Transfer to Bob'
    }
  ];
  
  // This can be left empty to default to ZERA, shown for example
  const feeConfig: FeeConfig = {
    baseFeeId: '$ZRA+0000',
    // overestimatePercent: 2.5 // default 5% if not specified
  };
  
  try {
    console.log('🔨 Creating transaction...');
    const coinTxn = await createCoinTXN(input, output, '$ZRA+0000', feeConfig, '', TESTING_GRPC_OVERRIDE_CONFIG);
    
    console.log('✅ Transaction created successfully!');
    console.log('  Transaction ID:', coinTxn.base?.hash ? 'Generated' : 'Not generated');
    console.log('  Input count:', input.length);
    console.log('  Output count:', output.length);
    
    // In a real application, you would send this to the network
    console.log('📡 Sending transaction to network...');
    const result = await sendCoinTXN(coinTxn);
    
    console.log('🎉 Transaction sent successfully!');
    console.log('  Result:', result);
    
    // Calculate and display end-to-end time
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    console.log(`⏱️  End-to-end time: ${totalTime}ms`);

    console.log(`Done Example`);
    
  } catch (error) {
    // Calculate and display time even on failure
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    console.log(`⏱️  Time to failure: ${totalTime}ms`);
    
    console.error('❌ Transaction failed:', (error as Error).message);
    throw error;
  }
}

/**
 * Example 2: Multi-Input Transfer
 * Alice and Bob both send money to Charlie
 * 
 * This demonstrates how to handle multiple inputs from different wallets
 */
//exampleMultiInputTransfer();
export async function exampleMultiInputTransfer(): Promise<void> {
  console.log('💸 Example 2: Multi-Input Transfer');
  
  // Pull wallet data from different sources
  //const aliceWallet = ED25519_TEST_KEYS.bob;
  const aliceWallet = ED448_TEST_KEYS.alice;
  const bobWallet = ED448_TEST_KEYS.bob;
  const charlieWallet = ED25519_TEST_KEYS.charlie;
  const charlieAddress = TEST_WALLET_ADDRESSES.charlie;
  
  console.log('📋 Multi-wallet data:');
  console.log('  Alice (ED448):', aliceWallet.address);
  console.log('  Bob (ED448):', bobWallet.address);
  console.log('  Charlie (ED25519):', charlieWallet.address);
  console.log('  Charlie (recipient):', charlieAddress);
  
  // Multiple inputs from different wallets
  const inputs: CoinTXNInput[] = [
    {
      privateKey: charlieWallet.privateKey,
      publicKey: charlieWallet.publicKey,
      amount: '1.5',
      feePercent: '60' // Alice pays 60% of fees
    },
    {
      privateKey: bobWallet.privateKey,
      publicKey: bobWallet.publicKey,
      amount: '2.5',
      feePercent: '40' // Bob pays 40% of fees
    },
    {
      privateKey: charlieWallet.privateKey,
      publicKey: charlieWallet.publicKey,
      amount: '1.5',
      feePercent: '0'
    }
  ];
  
  // Single output to Charlie
  const outputs: CoinTXNOutput[] = [
    {
      to: charlieAddress,
      amount: '5.5', // Total amount
      memo: 'Joint transfer from Alice and Bob'
    }
  ];
  
  // This can be left empty to default to ZERA, shown for example
  const feeConfig: FeeConfig = {
    baseFeeId: '$ZRA+0000',
    
  };
  
  try {
    console.log('🔨 Creating multi-input transaction...');
    // Use testing gRPC configuration inline

    const coinTxn = await createCoinTXN(inputs, outputs, '$ZRA+0000', feeConfig, '', TESTING_GRPC_OVERRIDE_CONFIG);
    
    console.log('✅ Multi-input transaction created!');
    console.log('  Inputs:', inputs.length);
    console.log('  Outputs:', outputs.length);
    console.log('  Total amount:', '3.5 ZRA');
    
    const result = await sendCoinTXN(coinTxn);
    console.log('🎉 Multi-input transaction sent!');
    console.log('  Result:', result);
        
  } catch (error) {
    console.error('❌ Multi-input transaction failed:', (error as Error).message);
    throw error;
  }
}

/**
 * Example 3: Multi-Output Transfer
 * Alice sends money to multiple recipients
 * 
 * This shows how to handle multiple outputs (splitting transfers)
 */
export async function exampleMultiOutputTransfer(): Promise<void> {
  console.log('💸 Example 3: Multi-Output Transfer');
  
  const aliceWallet = ED25519_TEST_KEYS.alice;
  const bobAddress = TEST_WALLET_ADDRESSES.bob;
  const charlieAddress = TEST_WALLET_ADDRESSES.charlie;
  const jesseAddress = TEST_WALLET_ADDRESSES.jesse;
  
  console.log('📋 Transfer splitting:');
  console.log('  From Alice to Bob, Charlie, and Jesse');
  
  // Single input from Alice
  const inputs: CoinTXNInput[] = [
    {
      privateKey: aliceWallet.privateKey,
      publicKey: aliceWallet.publicKey,
      amount: '5.0', // Alice sends 5 ZRA total
      feePercent: '100'
    }
  ];
  
  // Multiple outputs to different recipients
  const outputs: CoinTXNOutput[] = [
    {
      to: bobAddress,
      amount: '2.0',
      memo: 'Transfer to Bob'
    },
    {
      to: charlieAddress,
      amount: '1.5',
      memo: 'Transfer to Charlie'
    },
    {
      to: jesseAddress,
      amount: '1.5',
      memo: 'Transfer to Jesse'
    }
  ];
  
  // This can be left empty to default to ZERA, shown for example
  const feeConfig: FeeConfig = {
    baseFeeId: '$ZRA+0000',
    
  };
  
  try {
    console.log('🔨 Creating multi-output transaction...');
    const coinTxn = await createCoinTXN(inputs, outputs, '$ZRA+0000', feeConfig, '', TESTING_GRPC_OVERRIDE_CONFIG);
    
    console.log('✅ Multi-output transaction created!');
    console.log('  Recipients:', outputs.length);
    console.log('  Total distributed:', '5.0 ZRA');
    
    const result = await sendCoinTXN(coinTxn);
    console.log('🎉 Multi-output transaction sent!');
    console.log('  Result:', result);
    
  } catch (error) {
    console.error('❌ Multi-output transaction failed:', (error as Error).message);
    throw error;
  }
}

/**
 * Example 4: Complex Multi-Input/Multi-Output Transfer
 * Alice and Bob send money to Charlie and Jesse
 * 
 * This demonstrates the most complex scenario with multiple inputs and outputs
 */
export async function exampleComplexTransfer(): Promise<void> {
  console.log('💸 Example 4: Complex Multi-Input/Multi-Output Transfer');
  
  const aliceWallet = ED25519_TEST_KEYS.alice;
  const bobWallet = ED448_TEST_KEYS.bob;
  const charlieAddress = TEST_WALLET_ADDRESSES.charlie;
  const jesseAddress = TEST_WALLET_ADDRESSES.jesse;
  
  console.log('📋 Complex transfer scenario:');
  console.log('  Alice + Bob → Charlie + Jesse');
  
  // Multiple inputs
  const inputs: CoinTXNInput[] = [
    {
      privateKey: aliceWallet.privateKey,
      publicKey: aliceWallet.publicKey,
      amount: '3.0',
      feePercent: '70' // Alice pays 70% of fees
    },
    {
      privateKey: bobWallet.privateKey,
      publicKey: bobWallet.publicKey,
      amount: '2.0',
      feePercent: '30' // Bob pays 30% of fees
    }
  ];
  
  // Multiple outputs
  const outputs: CoinTXNOutput[] = [
    {
      to: charlieAddress,
      amount: '3.5',
      memo: 'Transfer to Charlie'
    },
    {
      to: jesseAddress,
      amount: '1.5',
      memo: 'Transfer to Jesse'
    }
  ];
  
  // This can be left empty to default to ZERA, shown for example
  const feeConfig: FeeConfig = {
    baseFeeId: '$ZRA+0000',
    baseFee: '0.005', // Higher fee for complex transaction
    contractFeeId: '$ZRA+0000',
    contractFee: '0.002'
  };
  
  try {
    console.log('🔨 Creating complex transaction...');
    const coinTxn = await createCoinTXN(inputs, outputs, '$ZRA+0000', feeConfig, '', TESTING_GRPC_OVERRIDE_CONFIG);
    
    console.log('✅ Complex transaction created!');
    console.log('  Inputs:', inputs.length);
    console.log('  Outputs:', outputs.length);
    console.log('  Total sent:', '5.0 ZRA');
    console.log('  Total received:', '5.0 ZRA');
    
    const result = await sendCoinTXN(coinTxn);
    console.log('🎉 Complex transaction sent!');
    console.log('  Result:', result);
    
  } catch (error) {
    console.error('❌ Complex transaction failed:', (error as Error).message);
    throw error;
  }
}

/**
 * Example 5: Custom Fee Configuration
 * Using different fee settings for specific use cases
 */
export async function exampleCustomFees(): Promise<void> {
  console.log('💸 Example 5: Custom Fee Configuration');
  
  const aliceWallet = ED25519_TEST_KEYS.alice;
  const bobAddress = TEST_WALLET_ADDRESSES.bob;
  
  const input: CoinTXNInput[] = [
    {
      privateKey: aliceWallet.privateKey,
      publicKey: aliceWallet.publicKey,
      amount: '1.0',
      feePercent: '100'
    }
  ];
  
  const output: CoinTXNOutput[] = [
    {
      to: bobAddress,
      amount: '1.0',
      memo: 'Custom fee transfer'
    }
  ];
  
  // Custom fee configuration for high-priority transaction
  const customFeeConfig: FeeConfig = {
    baseFeeId: '$ZRA+0000',
    baseFee: '0.01', // Higher base fee for priority
    contractFeeId: '$ZRA+0000',
    contractFee: '0.005' // Higher contract fee
  };
  
  try {
    console.log('🔨 Creating transaction with custom fees...');
    console.log('  Base fee:', customFeeConfig.baseFee);
    console.log('  Contract fee:', customFeeConfig.contractFee);
    
    const coinTxn = await createCoinTXN(input, output, '$ZRA+0000', customFeeConfig, '', TESTING_GRPC_OVERRIDE_CONFIG);
    
    console.log('✅ Custom fee transaction created!');
    
    const result = await sendCoinTXN(coinTxn);
    console.log('🎉 Custom fee transaction sent!');
    console.log('  Result:', result);
    
  } catch (error) {
    console.error('❌ Custom fee transaction failed:', (error as Error).message);
    throw error;
  }
}

/**
 * Example 6: Error Handling
 * Demonstrating proper error handling in real applications
 */
export async function exampleErrorHandling(): Promise<void> {
  console.log('💸 Example 6: Error Handling');
  
  try {
    // This will fail because we're using invalid data
    const invalidInput: CoinTXNInput[] = [
      {
        privateKey: 'invalid-key',
        publicKey: 'invalid-public-key',
        amount: '0', // Invalid amount
        feePercent: '100'
      }
    ];
    
    const invalidOutput: CoinTXNOutput[] = [
      {
        to: 'invalid-address',
        amount: '0',
        memo: 'This will fail'
      }
    ];
    
    // This can be left empty to default to ZERA, shown for example
  const feeConfig: FeeConfig = {
      baseFeeId: '$ZRA+0000',
      baseFee: '0.001',
      contractFeeId: '$ZRA+0000',
      contractFee: '0.0005'
    };
    
    console.log('🔨 Attempting transaction with invalid data...');
    await createCoinTXN(invalidInput, invalidOutput, '$ZRA+0000', feeConfig, '', TESTING_GRPC_OVERRIDE_CONFIG);
    
    console.log('❌ This should not have succeeded!');
    
  } catch (error) {
    console.log('✅ Error caught successfully!');
    console.log('  Error type:', (error as Error).constructor.name);
    console.log('  Error message:', (error as Error).message);
    
    // In a real application, you would handle this error appropriately
    // - Log it for debugging
    // - Show user-friendly message
    // - Retry with corrected data
    // - etc.
  }
}