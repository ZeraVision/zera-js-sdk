/**
 * Real-World SDK Usage Examples
 * 
 * This file demonstrates how to use the ZERA SDK in real scenarios,
 * showing how users would construct transactions by pulling wallet data
 * from their own data sources and building inputs/outputs manually.
 */

import { createCoinTXN } from '../transaction.js';
import { 
  ED25519_TEST_KEYS,
  ED448_TEST_KEYS,
  TEST_WALLET_ADDRESSES,
  DEFAULT_TEST_FEE_CONFIG,
  MINIMAL_TEST_FEE_CONFIG 
} from '../../test-utils/index.js';

/**
 * Example 1: Simple Payment
 * Alice sends 1.5 ZRA to Bob
 * 
 * This shows how users would construct a transaction by pulling wallet data
 * from their own data sources (database, config files, etc.)
 */
export function exampleSimplePayment() {
  console.log('💸 Example 1: Simple Payment');
  
  // In a real application, you would pull this data from your database/config
  const aliceWallet = ED25519_TEST_KEYS.alice;
  const bobAddress = TEST_WALLET_ADDRESSES.bob;
  
  console.log('📋 Wallet data pulled from data source:');
  console.log('  Alice private key:', aliceWallet.privateKey.substring(0, 20) + '...');
  console.log('  Alice public key:', aliceWallet.publicKey);
  console.log('  Bob address:', bobAddress);
  
  // Construct input manually (as users would do)
  const input = {
    privateKey: aliceWallet.privateKey,
    publicKey: aliceWallet.publicKey,
    amount: '1.5',
    feePercent: '100'
  };
  
  // Construct output manually (as users would do)
  const output = {
    to: bobAddress,
    amount: '1.5',
    memo: 'Payment from Alice'
  };
  
  // Create transaction
  const transaction = createCoinTXN([input], [output], MINIMAL_TEST_FEE_CONFIG, 'Simple payment');
  
  console.log('✅ Transaction created:', transaction.$typeName);
  console.log('📤 Input amount:', input.amount, 'ZRA');
  console.log('📥 Output amount:', output.amount, 'ZRA');
  console.log('💳 Fee percentage:', input.feePercent + '%');
  
  return transaction;
}

/**
 * Example 2: Multi-Party Transaction
 * Alice and Bob split a payment to Charlie and Jesse
 * 
 * This demonstrates how users would handle multiple wallets and recipients
 * by pulling data from different sources and constructing complex transactions.
 */
export function exampleMultiPartyTransaction() {
  console.log('👥 Example 2: Multi-Party Transaction');
  
  // In a real application, you would pull these from different data sources
  const aliceWallet = ED25519_TEST_KEYS.alice;
  const bobWallet = ED448_TEST_KEYS.bob;
  const charlieAddress = TEST_WALLET_ADDRESSES.charlie;
  const jesseAddress = TEST_WALLET_ADDRESSES.jesse;
  
  console.log('📋 Multi-party wallet data:');
  console.log('  Alice (ED25519):', aliceWallet.address);
  console.log('  Bob (ED448):', bobWallet.address);
  console.log('  Charlie address:', charlieAddress);
  console.log('  Jesse address:', jesseAddress);
  
  // Construct multiple inputs manually
  const inputs = [
    {
      privateKey: aliceWallet.privateKey,
      publicKey: aliceWallet.publicKey,
      amount: '2.0',
      feePercent: '60'  // Alice pays 60% of fees
    },
    {
      privateKey: bobWallet.privateKey,
      publicKey: bobWallet.publicKey,
      amount: '1.5',
      feePercent: '40'  // Bob pays 40% of fees
    }
  ];
  
  // Construct multiple outputs manually
  const outputs = [
    {
      to: charlieAddress,
      amount: '2.5',
      memo: 'Main payment'
    },
    {
      to: jesseAddress,
      amount: '1.0',
      memo: 'Secondary payment'
    }
  ];
  
  const transaction = createCoinTXN(inputs, outputs, DEFAULT_TEST_FEE_CONFIG, 'Base Memo');
  
  console.log('✅ Multi-party transaction created');
  console.log('📤 Total input:', '3.5 ZRA');
  console.log('📥 Total output:', '3.5 ZRA');
  console.log('👤 Alice fee share:', inputs[0].feePercent + '%');
  console.log('👤 Bob fee share:', inputs[1].feePercent + '%');
  
  return transaction;
}

/**
 * Example 3: Complex Transaction with Custom Fees
 * Charlie sends money to multiple recipients with custom fee structure
 * 
 * This shows how users would handle custom fee configurations and
 * complex payment distributions in real applications.
 */
export function exampleComplexTransaction() {
  console.log('🏦 Example 3: Complex Transaction');
  
  // Pull wallet data from your data source
  const charlieWallet = ED25519_TEST_KEYS.charlie;
  const aliceAddress = TEST_WALLET_ADDRESSES.alice;
  const bobAddress = TEST_WALLET_ADDRESSES.bob;
  const jesseAddress = TEST_WALLET_ADDRESSES.jesse;
  
  console.log('📋 Complex transaction data:');
  console.log('  Charlie wallet:', charlieWallet.address);
  console.log('  Recipients:', [aliceAddress, bobAddress, jesseAddress].length);
  
  // Construct single input manually
  const input = {
    privateKey: charlieWallet.privateKey,
    publicKey: charlieWallet.publicKey,
    amount: '5.0',
    feePercent: '100'
  };
  
  // Construct multiple outputs manually
  const outputs = [
    {
      to: aliceAddress,
      amount: '2.0',
      memo: 'Salary payment'
    },
    {
      to: bobAddress,
      amount: '1.5',
      memo: 'Bonus payment'
    },
    {
      to: jesseAddress,
      amount: '1.0',
      memo: 'Contractor fee'
    }
  ];
  
  // Custom fee configuration (as users would define)
  const customFeeConfig = {
    baseFeeId: '$ZRA+0000',
    baseFee: '0.005',      // 0.005 ZRA base fee
    contractFeeId: '$ZRA+0000',
    contractFee: '0.002'   // 0.002 ZRA contract fee
  };
  
  const transaction = createCoinTXN([input], outputs, customFeeConfig, 'Complex payment distribution');
  
  console.log('✅ Complex transaction created');
  console.log('📤 Input amount:', input.amount, 'ZRA');
  console.log('📥 Outputs:', outputs.length, 'recipients');
  console.log('💰 Total distributed:', '4.5 ZRA');
  console.log('💸 Custom fees applied');
  
  return transaction;
}

/**
 * Example 4: Batch Processing
 * Process multiple transactions in a batch
 * 
 * This demonstrates how users would handle batch processing by
 * pulling wallet data and constructing multiple transactions programmatically.
 */
export function exampleBatchProcessing() {
  console.log('📦 Example 4: Batch Processing');
  
  // Pull all wallet data from your data sources
  const aliceWallet = ED25519_TEST_KEYS.alice;
  const bobWallet = ED448_TEST_KEYS.bob;
  const charlieWallet = ED25519_TEST_KEYS.charlie;
  const bobAddress = TEST_WALLET_ADDRESSES.bob;
  const charlieAddress = TEST_WALLET_ADDRESSES.charlie;
  const jesseAddress = TEST_WALLET_ADDRESSES.jesse;
  
  console.log('📋 Batch processing wallet data:');
  console.log('  Alice:', aliceWallet.address);
  console.log('  Bob:', bobWallet.address);
  console.log('  Charlie:', charlieWallet.address);
  
  const transactions = [];
  
  // Transaction 1: Alice to Bob
  const tx1Input = {
    privateKey: aliceWallet.privateKey,
    publicKey: aliceWallet.publicKey,
    amount: '1.0',
    feePercent: '100'
  };
  const tx1Output = {
    to: bobAddress,
    amount: '1.0',
    memo: 'Batch payment 1'
  };
  transactions.push(createCoinTXN([tx1Input], [tx1Output], MINIMAL_TEST_FEE_CONFIG, 'Batch transaction 1'));
  
  // Transaction 2: Bob to Charlie
  const tx2Input = {
    privateKey: bobWallet.privateKey,
    publicKey: bobWallet.publicKey,
    amount: '0.5',
    feePercent: '100'
  };
  const tx2Output = {
    to: charlieAddress,
    amount: '0.5',
    memo: 'Batch payment 2'
  };
  transactions.push(createCoinTXN([tx2Input], [tx2Output], MINIMAL_TEST_FEE_CONFIG, 'Batch transaction 2'));
  
  // Transaction 3: Charlie to Jesse
  const tx3Input = {
    privateKey: charlieWallet.privateKey,
    publicKey: charlieWallet.publicKey,
    amount: '0.25',
    feePercent: '100'
  };
  const tx3Output = {
    to: jesseAddress,
    amount: '0.25',
    memo: 'Batch payment 3'
  };
  transactions.push(createCoinTXN([tx3Input], [tx3Output], MINIMAL_TEST_FEE_CONFIG, 'Batch transaction 3'));
  
  console.log('✅ Batch processing complete');
  console.log('📦 Transactions created:', transactions.length);
  console.log('🔄 Chain: Alice → Bob → Charlie → Jesse');
  
  return transactions;
}

/**
 * Example 5: Error Handling and Validation
 * Demonstrates proper error handling patterns
 * 
 * This shows how users would implement proper error handling
 * when constructing transactions with real wallet data.
 */
export function exampleErrorHandling() {
  console.log('⚠️ Example 5: Error Handling');
  
  try {
    // Pull wallet data from your data source
    const aliceWallet = ED25519_TEST_KEYS.alice;
    const bobAddress = TEST_WALLET_ADDRESSES.bob;
    
    console.log('📋 Error handling with wallet data:');
    console.log('  Alice wallet:', aliceWallet.address);
    console.log('  Bob address:', bobAddress);
    
    // This should work - valid transaction
    const validInput = {
      privateKey: aliceWallet.privateKey,
      publicKey: aliceWallet.publicKey,
      amount: '1.0',
      feePercent: '100'
    };
    const validOutput = {
      to: bobAddress,
      amount: '1.0',
      memo: 'Valid payment'
    };
    
    const validTransaction = createCoinTXN([validInput], [validOutput], MINIMAL_TEST_FEE_CONFIG);
    console.log('✅ Valid transaction created successfully');
    
    // This should fail - insufficient balance (more output than input)
    try {
      const invalidInput = {
        privateKey: aliceWallet.privateKey,
        publicKey: aliceWallet.publicKey,
        amount: '1.0',  // Only 1.0 ZRA available
        feePercent: '100'
      };
      const invalidOutput = {
        to: bobAddress,
        amount: '2.0',  // Trying to send 2.0 ZRA
        memo: 'Invalid payment'
      };
      
      const invalidTransaction = createCoinTXN([invalidInput], [invalidOutput], MINIMAL_TEST_FEE_CONFIG);
      console.log('❌ This should not execute');
    } catch (error) {
      console.log('✅ Caught expected error:', error.message);
    }
    
  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }
}

/**
 * Example 6: Real Application Integration
 * Shows how users would integrate transaction creation into their own applications
 * 
 * This demonstrates a realistic application pattern where wallet data comes from
 * a database or configuration, and transactions are constructed programmatically.
 */
export function exampleRealApplicationIntegration() {
  console.log('🏗️ Example 6: Real Application Integration');
  
  // Simulate pulling wallet data from your application's data sources
  const userWallets = {
    'user_001': {
      keyType: 'ed25519',
      wallet: ED25519_TEST_KEYS.alice,
      balance: '10.5'
    },
    'user_002': {
      keyType: 'ed448', 
      wallet: ED448_TEST_KEYS.bob,
      balance: '5.25'
    },
    'user_003': {
      keyType: 'ed25519',
      wallet: ED25519_TEST_KEYS.charlie,
      balance: '2.0'
    }
  };
  
  const recipientAddresses = {
    'vendor_001': TEST_WALLET_ADDRESSES.jesse,
    'contractor_001': TEST_WALLET_ADDRESSES.alice
  };
  
  console.log('📋 Application data sources:');
  console.log('  User wallets:', Object.keys(userWallets).length);
  console.log('  Recipient addresses:', Object.keys(recipientAddresses).length);
  
  // Function to create a payment transaction (as users would implement)
  function createPaymentTransaction(fromUserId, toRecipientId, amount, memo) {
    const sender = userWallets[fromUserId];
    const recipientAddress = recipientAddresses[toRecipientId];
    
    if (!sender) {
      throw new Error(`User ${fromUserId} not found`);
    }
    if (!recipientAddress) {
      throw new Error(`Recipient ${toRecipientId} not found`);
    }
    
    // Check balance
    if (parseFloat(sender.balance) < parseFloat(amount)) {
      throw new Error(`Insufficient balance: ${sender.balance} < ${amount}`);
    }
    
    // Construct input from user's wallet data
    const input = {
      privateKey: sender.wallet.privateKey,
      publicKey: sender.wallet.publicKey,
      amount: amount,
      feePercent: '100'
    };
    
    // Construct output to recipient
    const output = {
      to: recipientAddress,
      amount: amount,
      memo: memo
    };
    
    return createCoinTXN([input], [output], MINIMAL_TEST_FEE_CONFIG, `Payment from ${fromUserId}`);
  }
  
  // Function to create a batch payment (as users would implement)
  function createBatchPayment(payments) {
    const inputs = [];
    const outputs = [];
    
    for (const payment of payments) {
      const sender = userWallets[payment.fromUserId];
      const recipientAddress = recipientAddresses[payment.toRecipientId];
      
      // Add input
      inputs.push({
        privateKey: sender.wallet.privateKey,
        publicKey: sender.wallet.publicKey,
        amount: payment.amount,
        feePercent: payment.feePercent || '100'
      });
      
      // Add output
      outputs.push({
        to: recipientAddress,
        amount: payment.amount,
        memo: payment.memo
      });
    }
    
    return createCoinTXN(inputs, outputs, DEFAULT_TEST_FEE_CONFIG, 'Batch payment');
  }
  
  // Example usage in application
  try {
    // Single payment
    const singlePayment = createPaymentTransaction('user_001', 'vendor_001', '1.5', 'Product purchase');
    console.log('✅ Single payment created:', singlePayment.$typeName);
    
    // Batch payment
    const batchPayments = [
      {
        fromUserId: 'user_001',
        toRecipientId: 'vendor_001',
        amount: '2.0',
        feePercent: '60',
        memo: 'Vendor payment'
      },
      {
        fromUserId: 'user_002', 
        toRecipientId: 'contractor_001',
        amount: '1.5',
        feePercent: '40',
        memo: 'Contractor payment'
      }
    ];
    
    const batchPayment = createBatchPayment(batchPayments);
    console.log('✅ Batch payment created:', batchPayment.$typeName);
    console.log('📤 Inputs:', batchPayment.inputTransfers.length);
    console.log('📥 Outputs:', batchPayment.outputTransfers.length);
    
  } catch (error) {
    console.log('❌ Application error:', error.message);
  }
  
  return { userWallets, recipientAddresses };
}

/**
 * Run all examples
 */
export function runAllExamples() {
  console.log('🚀 Running ZERA SDK Real-World Examples\n');
  
  exampleSimplePayment();
  console.log('');
  
  exampleMultiPartyTransaction();
  console.log('');
  
  exampleComplexTransaction();
  console.log('');
  
  exampleBatchProcessing();
  console.log('');
  
  exampleErrorHandling();
  console.log('');
  
  exampleRealApplicationIntegration();
  console.log('');
  
  console.log('🎉 All examples completed successfully!');
}
