/**
 * Universal Test Keys for ZERA SDK Testing
 * 
 * This module provides standardized test key pairs for consistent testing across all modules.
 * These keys are specifically designed for testing purposes and should not be used in production.
 * 
 * Generated on: 2025-09-15T16:51:19.680Z
 */

/**
 * Test Key Pairs for ED25519 with different hash types:
 * - Alice: BLAKE3 (A_c_ prefix)
 * - Bob: SHA3_256 + SHA3_512 (A_a_b_ prefix) 
 * - Charlie: SHA3_512 + SHA3_256 (A_b_a_ prefix)
 */
export const ED25519_TEST_KEYS = {
  alice: {
    privateKey: 'Akyo231kUTYfC9AXokfUVhq7XoL6gri7zVfFi8WSG5Kt',
    publicKey: 'A_c_AKpo7NMd3JhGAonxXJXuG8XgDXA8jZGikK6UaHDYxksU',
    address: '7AC43j5mVxGZDZraaDN3Guz68rRoh2S7P6VXcS8GGJ8b'
  },
  bob: {
    privateKey: '7ES16G6gu4YKsNyhRsvX4hznhgWLHaVcpcWJtUQyqodJ',
    publicKey: 'A_a_b_8ffgHJD1aNbiYn5r8oP6bJtKW6vFcXFUizRJLCRQVX6H',
    address: 'G5F1NDFmpLsym7TvAt67Ju1jzRL2mPLxev25JFi7ZSWt'
  },
  charlie: {
    privateKey: 'BmKNB363Sppn8twb6cUntLKsuFDpBrhGQLxkfFCS9R5K',
    publicKey: 'A_b_a_6Tn7ZEW3fep5PJnENTmJzGd1NTsML4WbmKFmJB8VoND',
    address: 'AMdCPzvcLFyPBBebsfBfXdzsaGCKrENq76fa4xLNFoJqR8Bfvgedi3D8GTNTw77Unw1meKR297z2263ooLX5kYi'
  }
};

/**
 * Test Key Pairs for ED448 with different hash types:
 * - Alice: BLAKE3 (B_c_ prefix)
 * - Bob: SHA3_256 + SHA3_512 (B_a_b_ prefix)
 * - Charlie: SHA3_512 + SHA3_256 (B_b_a_ prefix)
 */
export const ED448_TEST_KEYS = {
  alice: {
    privateKey: '8CL2rdGSJWgj5ghe1Fg39UeNtWHhVGu6yoU8W7Ac57x2',
    publicKey: 'B_c_BTDwQNwypMZUDdJkY9jyTS4DPtVS91EqeAdZdnHNijUFoEWGxoA6nXdB4TJHGuXjVHq37VsznXHuXd',
    address: '53kh7iUoNcczgcBjEQuo3CmPqPtYnWGLVCfeZSZtjuxB'
  },
  bob: {
    privateKey: '5NGTFZfS9TE12SKLceUhAhUnRTixJmpD4imcjbsHnExa',
    publicKey: 'B_a_b_VU7J4BNRYk1M6WYcNrDyGjoFU8onVryZPNhZ7tuhQAD8fCizJPZMJEeBSMJkLF3YKrs95TcmxDbH4b',
    address: 'GMMgTQJnMEa3vHhvPF2JtmxLEGST1SevQNNfULbcN2Rv'
  },
  charlie: {
    privateKey: 'A47VfEGGQYDAEtibZCBNtJ7dTARVZfHQKRiQxqbVz5P3',
    publicKey: 'B_b_a_AupmN6d1KLntoXVcodk8cQTNq8tvAsi1vNW8MiBQmBvwuVmh7rzgHLbSsxc6iKK8fBZ462Dczi3nDu',
    address: '5WpSC8PtVPLneG1TppxmCx9ng4bwdTatQKNFoiiLHmVt9ihJ6coRveCCKKoHwP8rJSCyLg3GLpFJ6WYyh9pE7eQC'
  }
};

/**
 * Test Wallet Addresses (derived from public keys)
 */
export const TEST_WALLET_ADDRESSES = {
  alice: '7AC43j5mVxGZDZraaDN3Guz68rRoh2S7P6VXcS8GGJ8b',
  bob: 'G5F1NDFmpLsym7TvAt67Ju1jzRL2mPLxev25JFi7ZSWt',
  charlie: 'AMdCPzvcLFyPBBebsfBfXdzsaGCKrENq76fa4xLNFoJqR8Bfvgedi3D8GTNTw77Unw1meKR297z2263ooLX5kYi',
  jesse: 'WYEKj2jB1exPn7BStQ7WBkr8WpST9x3iT7gvoPjyZcYAP'
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
    throw new Error(`No test keys found for ${keyType} ${person}`);
  }
  
  return {
    privateKey: keyPair.privateKey,
    publicKey: keyPair.publicKey,
    address: keyPair.address
  };
}

/**
 * Get a test input object with private and public keys only
 * @param {string} keyType - 'ed25519' or 'ed448'
 * @param {string} person - 'alice', 'bob', or 'charlie'
 * @returns {Object} Input object with privateKey and publicKey only
 */
export function getTestInput(keyType, person) {
  const keys = keyType === 'ed448' ? ED448_TEST_KEYS : ED25519_TEST_KEYS;
  const keyPair = keys[person];
  
  if (!keyPair) {
    throw new Error(`No test keys found for ${keyType} ${person}`);
  }
  
  return {
    privateKey: keyPair.privateKey,
    publicKey: keyPair.publicKey
  };
}

/**
 * Create a complete input for a transaction (user-friendly)
 * @param {string} keyType - 'ed25519' or 'ed448'
 * @param {string} person - 'alice', 'bob', or 'charlie'
 * @param {string|number|Decimal} amount - Amount to transfer
 * @param {string|number} feePercent - Fee percentage (default: '100')
 * @returns {Object} Complete input object ready for createCoinTXN
 */
export function createTestInput(keyType, person, amount, feePercent = '100') {
  const input = getTestInput(keyType, person);
  input.amount = amount;
  input.feePercent = feePercent;
  return input;
}

/**
 * Create multiple inputs for a transaction (user-friendly)
 * @param {Array<Object>} inputSpecs - Array of {keyType, person, amount, feePercent}
 * @returns {Array<Object>} Array of complete input objects
 */
export function createTestInputs(inputSpecs) {
  return inputSpecs.map(spec => 
    createTestInput(spec.keyType, spec.person, spec.amount, spec.feePercent)
  );
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
    throw new Error(`No test address found for ${person}`);
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
  const inputs = inputSpecs.map(spec => {
    const input = getTestInput(spec.keyType, spec.person);
    input.amount = spec.amount;
    input.feePercent = spec.feePercent;
    return input;
  });
  
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
 * // Basic usage - get keys only
 * const keys = getTestInput('ed25519', 'alice');
 * keys.amount = '1.0';
 * keys.feePercent = '100';
 * 
 * // User-friendly usage - complete input
 * const input = createTestInput('ed25519', 'alice', '1.0', '100');
 * 
 * // Multiple inputs
 * const inputs = createTestInputs([
 *   { keyType: 'ed25519', person: 'alice', amount: '1.0', feePercent: '60' },
 *   { keyType: 'ed448', person: 'bob', amount: '2.0', feePercent: '40' }
 * ]);
 * 
 * // Output
 * const output = getTestOutput('charlie', '3.0', 'Payment to Charlie');
 * 
 * // Complete transaction
 * const coinTxn = createCoinTXN(inputs, output, DEFAULT_TEST_FEE_CONFIG);
 */
