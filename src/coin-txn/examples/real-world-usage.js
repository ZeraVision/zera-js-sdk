/**
 * Real-World SDK Usage Examples
 * 
 * This file demonstrates how to use the ZERA SDK in real scenarios,
 * showing how users would construct transactions by pulling wallet data
 * from their own data sources and building inputs/outputs manually.
 * 
 * Memo's optional. Base memo more typically used. Transfer memo for multi-output if required.
 */

import { createCoinTXN, sendCoinTXN} from '../index.js';
import { 
  ED25519_TEST_KEYS,
  ED448_TEST_KEYS,
  TEST_WALLET_ADDRESSES,
} from '../../test-utils/index.js';

/**
 * Example 1: Simple Payment
 * Alice sends 1.5 ZRA to Bob
 * 
 * This shows how users would construct a transaction by pulling wallet data
 * from their own data sources (database, config files, etc.)
 */
export async function exampleSimplePayment() {
  console.log('💸 Example 1: Simple Payment');
  
  // In a real application, you would pull this data from your storage
  const aliceWallet = ED25519_TEST_KEYS.alice;
  //const aliceWallet = ED448_TEST_KEYS.alice;
  const bobAddress = TEST_WALLET_ADDRESSES.bob;
  
  console.log('📋 Wallet data pulled from data source:');
  console.log('  Alice private key:', aliceWallet.privateKey.substring(0, 20) + '...');
  console.log('  Alice public key:', aliceWallet.publicKey);
  console.log('  Bob address:', bobAddress);
  
  // Construct input manually (as users would do)
  const input = [
    {
      privateKey: aliceWallet.privateKey,
      publicKey: aliceWallet.publicKey,
      amount: '1.5',
      feePercent: '100'
    }
  ];
  
  // Construct output manually (as users would do)
  const output = [
    {
      to: bobAddress,
      amount: '1.5',
      memo: '(optional) Transfer Memo'
    }
  ];
  
  // Create transaction (fully automatic fee calculation with default instruments)
  const transaction = await createCoinTXN(input, output, '$ZRA+0000', {}, '(optional) Base Memo', {
    host: '146.190.114.124',
  });
  
  console.log('✅ Transaction created:', transaction.$typeName);

  var hash = await sendCoinTXN(transaction, {
    host: '146.190.114.124',
    port: 50052,
  });

  console.log(hash);
  
  return transaction;
}

/**
 * Example 2: Multi-Party Transaction
 * Alice and Bob split a payment to Charlie and Jesse
 * 
 * This demonstrates how users would handle multiple wallets and recipients
 * by pulling data from different sources and constructing complex transactions.
 */
//exampleMultiPartyTransaction();
export async function exampleMultiPartyTransaction() {
  console.log('👥 Example 2: Multi-Party Transaction');
  
  // In a real application, you would pull these from different data sources
  const aliceWallet = ED25519_TEST_KEYS.bob;
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
  
  const transaction = await createCoinTXN(inputs, outputs, '$ZRA+0000', {}, '(optional) Base Memo', {
    host: '146.190.114.124',
  });
  
  console.log('✅ Multi-party transaction created');
  console.log('📤 Total input:', '3.5 ZRA');
  console.log('📥 Total output:', '3.5 ZRA');
  console.log('👤 Alice fee share:', inputs[0].feePercent + '%');
  console.log('👤 Bob fee share:', inputs[1].feePercent + '%');

  var hash = await sendCoinTXN(transaction, {
    host: '146.190.114.124',
    port: 50052,
  });
  
  return transaction;
}

/**
 * Example 3: Complex Transaction with Custom Fees
 * Charlie sends money to multiple recipients with custom fee structure
 * 
 * This shows how users would handle custom fee configurations and
 * complex payment distributions in real applications.
 */
export async function exampleComplexTransaction() {
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
  const input = [
    {
      privateKey: charlieWallet.privateKey,
      publicKey: charlieWallet.publicKey,
      amount: '5.0',
      feePercent: '100'
    }
  ];
  
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
  
  // Custom fee configuration (as users would define) - explicitly specifying fees
  const customFeeConfig = {
    baseFeeId: '$ZRA+0000',
    baseFee: '0.05',      // 0.05 ZRA base fee - explicitly specified
    contractFeeId: '$ZRA+0000',
    contractFee: '0.02'   // 0.02 ZRA contract fee
  };
  
  const transaction = await createCoinTXN(input, outputs, '$ZRA+0000', customFeeConfig, '(optional) Complex payment distribution');
  
  console.log('✅ Complex transaction created');
  console.log('📤 Input amount:', input.amount, 'ZRA');
  console.log('📥 Outputs:', outputs.length, 'recipients');
  console.log('💰 Total distributed:', '4.5 ZRA');
  console.log('💸 Custom fees applied');
  
  return transaction;
}


/**
 * Example 4: Mixed Manual and Automatic Fees
 * Charlie sends money to multiple recipients with different fee strategies
 * 
 * This shows how users can choose between manual and automatic fee calculation
 * based on their specific needs and use cases.
 */
export async function exampleMixedFeeStrategies() {
  console.log('🔄 Example 4: Mixed Fee Strategies');
  
  // Pull wallet data from your data source
  const charlieWallet = ED25519_TEST_KEYS.charlie;
  const aliceAddress = TEST_WALLET_ADDRESSES.alice;
  const bobAddress = TEST_WALLET_ADDRESSES.bob;
  
  console.log('📋 Mixed fee strategy data:');
  console.log('  Charlie wallet:', charlieWallet.address);
  console.log('  Recipients:', [aliceAddress, bobAddress].length);
  
  // Strategy 1: Manual fee calculation (for predictable costs)
  console.log('\n📝 Strategy 1: Manual Fee Calculation');
  const manualInput = {
    privateKey: charlieWallet.privateKey,
    publicKey: charlieWallet.publicKey,
    amount: '3.0',
    feePercent: '100'
  };
  
  const manualOutput = {
    to: aliceAddress,
    amount: '3.0',
    memo: 'Manual fee - predictable cost'
  };
  
  const manualResult = await createCoinTXN([manualInput], [manualOutput], '$ZRA+0000', {
    baseFeeId: '$ZRA+0000',
    baseFee: '0.002', // Fixed manual fee - explicitly specified
    contractFeeId: '$ZRA+0000',
    contractFee: '0.001'
  }, 'Manual fee strategy');
  
  console.log('✅ Manual fee transaction created');
  console.log('💰 Fixed base fee: 0.002 ZRA');
  console.log('💰 Fixed contract fee: 0.001 ZRA');
  
  // Strategy 2: Automatic fee calculation (for optimal costs)
  console.log('\n🤖 Strategy 2: Automatic Fee Calculation');
  const autoInput = {
    privateKey: charlieWallet.privateKey,
    publicKey: charlieWallet.publicKey,
    amount: '2.0',
    feePercent: '100'
  };
  
  const autoOutput = {
    to: bobAddress,
    amount: '2.0',
    memo: 'Auto fee - optimal cost'
  };
  
  const autoResult = await createCoinTXN([autoInput], [autoOutput], '$ZRA+0000', {
    baseFeeId: '$ZRA+0000',
    // No baseFee specified - uses automatic calculation by default
    contractFeeId: '$ZRA+0000',
    contractFee: '0.0005' // Lower contract fee
  }, 'Automatic fee strategy');
  
  console.log('✅ Automatic fee transaction created');
  console.log('💰 Base fee: Automatically calculated');
  console.log('💰 Contract fee: 0.0005 ZRA');
  console.log('📊 Transaction created with optimal fees');
  
  console.log('\n🎯 Fee Strategy Comparison:');
  console.log('  Manual: Fixed costs, predictable');
  console.log('  Automatic: Dynamic costs, optimized for current conditions');
  
  return { manual: manualResult, automatic: autoResult };
}

/**
 * Example 5: Flexible Fee Instruments
 * Alice sends money using different fee instruments with automatic calculation
 * 
 * This demonstrates how users can specify fee instruments and let the system
 * automatically calculate the optimal amounts in those currencies.
 */
export async function exampleFlexibleFeeInstruments() {
  console.log('🎯 Example 5: Flexible Fee Instruments');
  
  // Pull wallet data from your data source
  const aliceWallet = ED25519_TEST_KEYS.alice;
  const bobAddress = TEST_WALLET_ADDRESSES.bob;
  
  console.log('📋 Flexible fee instrument data:');
  console.log('  Alice wallet:', aliceWallet.address);
  console.log('  Bob address:', bobAddress);
  
  // Construct input manually
  const input = [
    {
      privateKey: aliceWallet.privateKey,
      publicKey: aliceWallet.publicKey,
      amount: '3.0',
      feePercent: '100'
    }
  ];
  
  // Construct output manually
  const output = [
    {
      to: bobAddress,
      amount: '3.0',
      memo: 'Flexible fee instruments demo'
    }
  ];
  
  // Example 1: Specify fee instruments, auto-calculate amounts
  console.log('\n🎯 Strategy 1: Custom Fee Instruments (Auto Amounts)');
  const customInstrumentsResult = await createCoinTXN(input, output, '$ZRA+0000', {
    baseFeeId: '$BTC+1234',    // Use BTC for base fees (auto-calculated amount)
    contractFeeId: '$ETH+5678' // Use ETH for contract fees (auto-calculated amount)
  }, 'Custom fee instruments');
  
  console.log('✅ Transaction created with custom fee instruments');
  console.log('💰 Base fee: Auto-calculated in BTC');
  console.log('💰 Contract fee: Auto-calculated in ETH');
  
  // Example 2: Mix manual and automatic fees
  console.log('\n🎯 Strategy 2: Mixed Manual/Auto Fees');
  const mixedFeesResult = await createCoinTXN(input, output, '$ZRA+0000', {
    baseFeeId: '$ZRA+0000',
    baseFee: '0.002',          // Manual base fee amount in ZRA
    contractFeeId: '$BTC+1234' // Auto-calculated contract fee in BTC
  }, 'Mixed fee strategy');
  
  console.log('✅ Transaction created with mixed fee strategy');
  console.log('💰 Base fee: Manual 0.002 ZRA');
  console.log('💰 Contract fee: Auto-calculated in BTC');
  
  // Example 3: Manual contract fee, auto base fee
  console.log('\n🎯 Strategy 3: Auto Base, Manual Contract');
  const autoBaseManualContractResult = await createCoinTXN(input, output, '$ZRA+0000', {
    baseFeeId: '$ZRA+0000',    // Auto-calculated base fee in ZRA
    contractFeeId: '$ETH+5678',
    contractFee: '0.001'       // Manual contract fee amount in ETH
  }, 'Auto base, manual contract');
  
  console.log('✅ Transaction created with auto base, manual contract');
  console.log('💰 Base fee: Auto-calculated in ZRA');
  console.log('💰 Contract fee: Manual 0.001 ETH');
  
  console.log('\n🎯 Flexible Fee Strategy Summary:');
  console.log('  Custom Instruments: Specify currencies, auto-calculate amounts');
  console.log('  Mixed Strategy: Manual for one, auto for another');
  console.log('  Full Control: Manual amounts when you need exact control');
  
  return { 
    customInstruments: customInstrumentsResult, 
    mixedFees: mixedFeesResult,
    autoBaseManualContract: autoBaseManualContractResult
  };
}

/**
 * Example 6: Interface Fees for Third-Party Services
 * Alice sends money to Bob with interface fees for API service
 * 
 * This demonstrates how users can include interface fees for third-party services
 * like payment processors, API gateways, or marketplace fees.
 */
export async function exampleInterfaceFees() {
  console.log('🔌 Example 6: Interface Fees for Third-Party Services');
  
  // Pull wallet data from your data source
  const aliceWallet = ED25519_TEST_KEYS.alice;
  const bobAddress = TEST_WALLET_ADDRESSES.bob;
  
  console.log('📋 Interface fee transaction data:');
  console.log('  Alice wallet:', aliceWallet.address);
  console.log('  Bob address:', bobAddress);
  
  // Construct input manually
  const input = [
    {
      privateKey: aliceWallet.privateKey,
      publicKey: aliceWallet.publicKey,
      amount: '2.0',
      feePercent: '100'
    }
  ];
  
  // Construct output manually
  const output = [
    {
      to: bobAddress,
      amount: '2.0',
      memo: 'Payment with interface fees'
    }
  ];
  
  // Example 1: Payment with API service interface fee
  console.log('\n🔌 Strategy 1: API Service Interface Fee');
  const apiServiceResult = await createCoinTXN(input, output, '$ZRA+0000', {
    baseFeeId: '$ZRA+0000',
    contractFeeId: '$ZRA+0000',
    contractFee: '0.001',
    interfaceFeeAmount: '0.005',
    interfaceFeeId: '$ZRA+0000',
    interfaceAddress: 'interface_provider_base58_address' // Required when interfaceFeeId is specified
  }, 'API service payment');
  
  console.log('✅ Transaction created with API service interface fee');
  console.log('💰 Base fee: Auto-calculated');
  console.log('💰 Contract fee: 0.001 ZRA');
  console.log('🔌 Interface fee: 0.005 ZRA (API service)');
  console.log('📍 Interface provider:', 'interface_provider_base58_address');
  
  // Example 2: Payment with marketplace interface fee
  console.log('\n🔌 Strategy 2: Marketplace Interface Fee');
  const marketplaceResult = await createCoinTXN(input, output, '$ZRA+0000', {
    baseFeeId: '$ZRA+0000',
    // contractFeeId: '$ZRA+0000', // if the contract has a contract feeID
    // contractFee: '0.002',
    interfaceFeeAmount: '0.01', // 0.01 ZRA for marketplace
    interfaceFeeId: '$ZRA+0000',
    interfaceAddress: 'interface_provider_base58_address' // Required when interfaceFeeId is specified
  }, 'Marketplace payment');
  
  console.log('✅ Transaction created with marketplace interface fee');
  console.log('💰 Base fee: Auto-calculated');
  console.log('💰 Contract fee: 0.002 ZRA');
  console.log('🔌 Interface fee: 0.01 ZRA');
  console.log('📍 Interface provider:', 'interface_provider_base58_address');
  
  // Example 3: Payment without interface fees (default behavior)
  console.log('\n🔌 Strategy 3: No Interface Fees (Default)');
  const noInterfaceResult = await createCoinTXN(input, output, '$ZRA+0000', {
    baseFeeId: '$ZRA+0000',
    contractFeeId: '$ZRA+0000',
    contractFee: '0.001'
    // No interfaceFeeId specified - interface fees remain null
  }, 'Standard payment');
  
  console.log('✅ Transaction created without interface fees');
  console.log('💰 Base fee: Auto-calculated');
  console.log('💰 Contract fee: 0.001 ZRA');
  console.log('🔌 Interface fee: null (default behavior)');
  
  console.log('\n🔌 Interface Fee Strategy Summary:');
  console.log('  API Service: Small fee for API access');
  console.log('  Marketplace: Higher fee for marketplace services');
  console.log('  No Interface: Standard payment without third-party fees');
  console.log('  Note: interfaceFeeId triggers calculation, all parameters required when specified');
  
  return { 
    apiService: apiServiceResult, 
    marketplace: marketplaceResult,
    noInterface: noInterfaceResult
  };
}

/**
 * Example 7: Simple Allowance
 * Alice sends 1.5 ZRA to Bob from Charlie (assuming alice has permission)
 */

export async function exampleAllowancePayment() {
  console.log('💸 Example 7: Simple Allowance');
  
  // In a real application, you would pull this data from your storage
  const aliceWallet = ED25519_TEST_KEYS.alice;
  const bobAddress = TEST_WALLET_ADDRESSES.bob;
  
  console.log('📋 Wallet data pulled from data source:');
  console.log('  Alice private key:', aliceWallet.privateKey.substring(0, 20) + '...');
  console.log('  Alice public key:', aliceWallet.publicKey);
  console.log('  Bob address:', bobAddress);
  
  const inputs = [
    {
      privateKey: aliceWallet.privateKey,
      publicKey: aliceWallet.publicKey,
      feePercent: '100'  // Authorizee ALWAYS pays 100% of fees for allowance() (shown in example for clarity)
    },
    //allowance starts at index [1]
    {
      allowanceAddress: bobAddress,
      amount: '2.5',
    }
  ];
  
  // Construct multiple outputs manually
  const outputs = [
    {
      to: charlieAddress,
      amount: '2.5',
    }
  ];
  
  // Create transaction (fully automatic fee calculation with default instruments)
  const transaction = await createCoinTXN(inputs, outputs, '$ZRA+0000', {}, 'ROL', {
    host: '146.190.114.124',
  });
  
  console.log('✅ Transaction created:', transaction.$typeName);

  var hash = await sendCoinTXN(transaction, {
    host: '146.190.114.124',
    port: 50052,
  });

  console.log(hash);
  
  return transaction;
}