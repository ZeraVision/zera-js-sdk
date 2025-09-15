/**
 * Real-World SDK Usage Examples
 * 
 * This file demonstrates how to use the ZERA SDK in real scenarios,
 * showing how users would construct transactions by pulling wallet data
 * from their own data sources and building inputs/outputs manually.
 * 
 * Memo's optional. Base memo more typically used. Transfer memo for multi-output if required.
 */

exampleSimplePayment();

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
    memo: '(optional) Transfer Memo'
  };
  
  // Create transaction
  const transaction = createCoinTXN([input], [output], '$ZRA+0000', MINIMAL_TEST_FEE_CONFIG, '(optional) Base Memo');
  
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
      memo: '(optional) Main payment'
    },
    {
      to: jesseAddress,
      amount: '1.0',
      memo: '(optional) Secondary payment'
    }
  ];
  
  const transaction = createCoinTXN(inputs, outputs, '$ZRA+0000', DEFAULT_TEST_FEE_CONFIG, '(optional) Base Memo');
  
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
      memo: '(optional) Salary payment'
    },
    {
      to: bobAddress,
      amount: '1.5',
      memo: '(optional) Bonus payment'
    },
    {
      to: jesseAddress,
      amount: '1.0',
      memo: '(optional) Chill guy fee'
    }
  ];
  
  // Custom fee configuration (as users would define)
  const customFeeConfig = {
    baseFeeId: '$ZRA+0000',
    baseFee: '0.05',      // 0.05 ZRA base fee
    contractFeeId: '$ZRA+0000',
    contractFee: '0.02'   // 0.02 ZRA contract fee
  };
  
  const transaction = createCoinTXN([input], outputs, '$ZRA+0000', customFeeConfig, '(optional) Complex payment distribution');
  
  console.log('✅ Complex transaction created');
  console.log('📤 Input amount:', input.amount, 'ZRA');
  console.log('📥 Outputs:', outputs.length, 'recipients');
  console.log('💰 Total distributed:', '4.5 ZRA');
  console.log('💸 Custom fees applied');
  
  return transaction;
}