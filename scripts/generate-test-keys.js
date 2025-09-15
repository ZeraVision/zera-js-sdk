#!/usr/bin/env node

/**
 * Generate Real Test Keys
 * 
 * This script generates real ED25519 and ED448 key pairs using the wallet creation module
 * and updates the test-keys.js file with the generated data.
 */

import { createWallet, generateMnemonicPhrase } from '../src/wallet-creation/index.js';
import { getAddressFromPublicKey } from '../src/shared/address-utils.js';
import { KEY_TYPE, HASH_TYPE } from '../src/wallet-creation/constants.js';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Generate a wallet and extract key data
 */
async function generateWalletData(keyType, person) {
  console.log(`🔑 Generating ${keyType} wallet for ${person}...`);
  
  // Generate a proper BIP39 mnemonic
  const mnemonic = generateMnemonicPhrase(12); // 12-word mnemonic
  
  // Use different hash types for each person
  let hashType;
  switch (person) {
    case 'alice':
      hashType = [HASH_TYPE.BLAKE3]; // Hash type 'c'
      break;
    case 'bob':
      hashType = [HASH_TYPE.SHA3_256, HASH_TYPE.SHA3_512]; // Hash types 'b_a'
      break;
    case 'charlie':
      hashType = [HASH_TYPE.SHA3_512, HASH_TYPE.SHA3_256]; // Hash types 'a_b'
      break;
    default:
      hashType = [HASH_TYPE.SHA3_256]; // Default fallback
  }
  
  console.log(`   📋 Using hash types: ${hashType.join(', ')} for ${person}`);
  
  const wallet = await createWallet({
    keyType: keyType,
    hashTypes: hashType,
    mnemonic: mnemonic
  });
  
  // Use the address directly from the wallet
  return {
    privateKey: wallet.privateKey,
    publicKey: wallet.publicKey, // Use publicKey field
    address: wallet.address
  };
}

/**
 * Generate all test keys
 */
async function generateAllTestKeys() {
  console.log('🚀 Generating real test keys...\n');
  
  const ed25519Keys = {};
  const ed448Keys = {};
  
  // Generate ED25519 keys
  console.log('📋 Generating ED25519 keys:');
  for (const person of ['alice', 'bob', 'charlie']) {
    ed25519Keys[person] = await generateWalletData(KEY_TYPE.ED25519, person);
    console.log(`  ✅ ${person}: ${ed25519Keys[person].address}`);
  }
  
  console.log('\n📋 Generating ED448 keys:');
  // Generate ED448 keys
  for (const person of ['alice', 'bob', 'charlie']) {
    ed448Keys[person] = await generateWalletData(KEY_TYPE.ED448, person);
    console.log(`  ✅ ${person}: ${ed448Keys[person].address}`);
  }
  
  // Use provided address for Jesse (output-only recipient)
  console.log('\n📋 Using provided address for Jesse (output-only recipient):');
  const jesseAddress = 'WYEKj2jB1exPn7BStQ7WBkr8WpST9x3iT7gvoPjyZcYAP';
  console.log(`  ✅ jesse: ${jesseAddress}`);
  
  return { ed25519Keys, ed448Keys, jesseAddress };
}

/**
 * Generate the updated test-keys.js content
 */
function generateTestKeysContent(ed25519Keys, ed448Keys, jesseAddress) {
  const formatKeyData = (keys) => {
    return Object.entries(keys).map(([person, data]) => {
      return `  ${person}: {
    privateKey: '${data.privateKey}',
    publicKey: '${data.publicKey}',
    address: '${data.address}'
  }`;
    }).join(',\n');
  };

  return `/**
 * Universal Test Keys for ZERA SDK Testing
 * 
 * This module provides standardized test key pairs for consistent testing across all modules.
 * These keys are specifically designed for testing purposes and should not be used in production.
 * 
 * Generated on: ${new Date().toISOString()}
 */

/**
 * Test Key Pairs for ED25519 with different hash types:
 * - Alice: BLAKE3 (A_c_ prefix)
 * - Bob: SHA3_256 + SHA3_512 (A_b_a_ prefix) 
 * - Charlie: SHA3_512 + SHA3_256 (A_a_b_ prefix)
 */
export const ED25519_TEST_KEYS = {
${formatKeyData(ed25519Keys)}
};

/**
 * Test Key Pairs for ED448 with different hash types:
 * - Alice: BLAKE3 (B_c_ prefix)
 * - Bob: SHA3_256 + SHA3_512 (B_b_a_ prefix)
 * - Charlie: SHA3_512 + SHA3_256 (B_a_b_ prefix)
 */
export const ED448_TEST_KEYS = {
${formatKeyData(ed448Keys)}
};

/**
 * Test Wallet Addresses (derived from public keys)
 */
export const TEST_WALLET_ADDRESSES = {
  alice: '${ed25519Keys.alice.address}',
  bob: '${ed25519Keys.bob.address}',
  charlie: '${ed25519Keys.charlie.address}',
  jesse: '${jesseAddress}'
};

/**
 * Get complete test key data (private key, public key, and address)
 * @param {string} keyType - 'ed25519' or 'ed448'
 * @param {string} person - 'alice', 'bob', or 'charlie'
 * @returns {Object} Complete key data with privateKey, publicKey, and address
 */
export function getTestKeyData(keyType, person) {
  const keys = keyType === 'ed448' ? ED448_TEST_KEYS : ED25519_TEST_KEYS;
  const keyPair = keys[person];
  
  if (!keyPair) {
    throw new Error(\`No test keys found for \${keyType} \${person}\`);
  }
  
  return {
    privateKey: keyPair.privateKey,
    publicKey: keyPair.publicKey,
    address: keyPair.address
  };
}

/**
 * Get a test input object with both private and public keys
 * @param {string} keyType - 'ed25519' or 'ed448'
 * @param {string} person - 'alice', 'bob', or 'charlie'
 * @param {string|number|Decimal} amount - Amount to transfer
 * @param {string} feePercent - Fee percentage (default: '100')
 * @returns {Object} Input object with privateKey, publicKey, address, amount, and feePercent
 */
export function getTestInput(keyType, person, amount, feePercent = '100') {
  const keys = keyType === 'ed448' ? ED448_TEST_KEYS : ED25519_TEST_KEYS;
  const keyPair = keys[person];
  
  if (!keyPair) {
    throw new Error(\`No test keys found for \${keyType} \${person}\`);
  }
  
  return {
    privateKey: keyPair.privateKey,
    publicKey: keyPair.publicKey,
    address: keyPair.address,
    amount,
    feePercent
  };
}

/**
 * Get a test output object
 * @param {string} person - 'alice', 'bob', 'charlie', or 'jesse'
 * @param {string|number|Decimal} amount - Amount to receive
 * @param {string} memo - Optional memo
 * @returns {Object} Output object with to, amount, and optional memo
 */
export function getTestOutput(person, amount, memo = '') {
  const address = TEST_WALLET_ADDRESSES[person];
  
  if (!address) {
    throw new Error(\`No test address found for \${person}\`);
  }
  
  const output = {
    to: address,
    amount
  };
  
  if (memo) {
    output.memo = memo;
  }
  
  return output;
}

/**
 * Create a simple test transaction with one input and one output
 * @param {string} keyType - 'ed25519' or 'ed448'
 * @param {string} fromPerson - Person sending (alice, bob, charlie)
 * @param {string} toPerson - Person receiving (alice, bob, charlie, jesse)
 * @param {string|number|Decimal} amount - Amount to transfer
 * @param {string} memo - Optional memo
 * @returns {Object} Object with inputs and outputs arrays
 */
export function createTestTransaction(keyType, fromPerson, toPerson, amount, memo = '') {
  return {
    inputs: [getTestInput(keyType, fromPerson, amount)],
    outputs: [getTestOutput(toPerson, amount, memo)]
  };
}

/**
 * Create a multi-input/output test transaction
 * @param {Array} inputSpecs - Array of {keyType, person, amount, feePercent}
 * @param {Array} outputSpecs - Array of {person, amount, memo}
 * @returns {Object} Object with inputs and outputs arrays
 */
export function createMultiTestTransaction(inputSpecs, outputSpecs) {
  const inputs = inputSpecs.map(spec => 
    getTestInput(spec.keyType, spec.person, spec.amount, spec.feePercent)
  );
  
  const outputs = outputSpecs.map(spec => 
    getTestOutput(spec.person, spec.amount, spec.memo)
  );
  
  return { inputs, outputs };
}

/**
 * Default fee configuration for tests
 */
export const DEFAULT_TEST_FEE_CONFIG = {
  baseFeeId: '$ZRA+0000',
  baseFee: '0.001',
  contractFeeId: '$ZRA+0000',
  contractFee: '0.0005'
};

/**
 * Minimal fee configuration for tests
 */
export const MINIMAL_TEST_FEE_CONFIG = {
  baseFeeId: '$ZRA+0000'
};

/**
 * Example usage:
 * 
 * // Get complete key data
 * const aliceKeys = getTestKeyData('ed25519', 'alice');
 * console.log(aliceKeys);
 * // Output: { privateKey: '...', publicKey: '...', address: '...' }
 * 
 * // Get test input for transaction
 * const input = getTestInput('ed25519', 'alice', '1.5', '100');
 * console.log(input);
 * // Output: { privateKey: '...', publicKey: '...', address: '...', amount: '1.5', feePercent: '100' }
 * 
 * // Get test output for transaction
 * const output = getTestOutput('bob', '1.5', 'Payment to Bob');
 * console.log(output);
 * // Output: { to: '...', amount: '1.5', memo: 'Payment to Bob' }
 * 
 * // Create multi-input/output transaction
 * const { inputs, outputs } = createMultiTestTransaction(
 *   [
 *     { keyType: 'ed25519', person: 'alice', amount: '1.0', feePercent: '60' },
 *     { keyType: 'ed448', person: 'bob', amount: '2.0', feePercent: '40' }
 *   ],
 *   [
 *     { person: 'charlie', amount: '2.5', memo: 'Payment to Charlie' },
 *     { person: 'jesse', amount: '0.5', memo: 'Payment to Jesse' }
 *   ]
 * );
 */
`;
}

/**
 * Main execution
 */
async function main() {
  try {
    const { ed25519Keys, ed448Keys, jesseAddress } = await generateAllTestKeys();
    
    console.log('\n📝 Generating test-keys.js content...');
    const content = generateTestKeysContent(ed25519Keys, ed448Keys, jesseAddress);
    
    const outputPath = join(__dirname, '../src/test-utils/test-keys.js');
    writeFileSync(outputPath, content, 'utf8');
    
    console.log('✅ Successfully generated and updated test-keys.js');
    console.log(`📁 File saved to: ${outputPath}`);
    
    console.log('\n🔍 Generated Keys Summary:');
    console.log('\nED25519 Keys:');
    Object.entries(ed25519Keys).forEach(([person, data]) => {
      console.log(`  ${person}: ${data.address}`);
    });
    
    console.log('\nED448 Keys:');
    Object.entries(ed448Keys).forEach(([person, data]) => {
      console.log(`  ${person}: ${data.address}`);
    });
    
    console.log('\nJesse Address:');
    console.log(`  jesse: ${jesseAddress}`);
    
  } catch (error) {
    console.error('❌ Error generating test keys:', error);
    process.exit(1);
  }
}

main();
