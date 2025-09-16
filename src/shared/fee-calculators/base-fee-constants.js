/**
 * Base Fee Constants
 * Network fee calculation constants for different transaction types, key types, and hash operations
 * These are fallback values for when remote data is not available
 */

/**
 * Signature sizes for different key types
 */
export const SIGNATURE_SIZES = {
  ED25519: 64,  // Ed25519 signature size in bytes
  ED448: 114     // Ed448 signature size in bytes
};

/**
 * Hash sizes for different hash types
 */
export const HASH_SIZES = {
  SHA3_256: 32,  // SHA3-256 hash size in bytes
  SHA3_512: 64,  // SHA3-512 hash size in bytes  
  BLAKE3: 32     // BLAKE3 hash size in bytes (typically 32 bytes)
};

/**
 * Default hash size (for backward compatibility)
 */
export const HASH_SIZE = HASH_SIZES.SHA3_256; // SHA3-256 hash size in bytes

/**
 * Fee calculation constants
 * These are a fallback for when remote data is not available
 */
export const FEE_CALCULATION_CONSTANTS = {
  // Multiplier for restricted keys
  RESTRICTED_KEY_FEE: 3.0,          // 3x multiplier on key/hash fees
  
  // Key fees (Fixed Cost)
  A_KEY_FEE: 0.02,                  // 2 cents
  B_KEY_FEE: 0.05,                  // 5 cents
  
  // Hash fees (Fixed Cost in)
  a_HASH_FEE: 0.02,                 // 2 cents
  b_HASH_FEE: 0.05,                 // 5 cents
  c_HASH_FEE: 0.01,                 // 1 cent
  d_hash_fee: 0.50,                 // 50 cents
  e_hash_fee: 1.00,                 // $1.00
  f_hash_fee: 2.00,                 // $2.00
  g_hash_fee: 4.00,                 // $4.00
  dbz_hash_fee: 9.01,               // $9.01
  h_hash_fee: 2.00,                 // $2.00
  i_hash_fee: 4.00,                 // $4.00
  j_hash_fee: 8.00,                 // $8.00
  
  // Transaction type fees (Cost Per Byte)
  DELEGATED_VOTING_TXN_FEE: 0.05,           // 5 cents per byte
  COIN_TXN_FEE: 0.00015,                    // 0.015 cents per byte
  SAFE_SEND_FEE: 0.0001,                    // 0.01 cents per byte
  CONTRACT_TXN_FEE: 0.075,                  // 7.5 cents per byte
  EXPENSE_RATIO_TXN_FEE: 0.10,              // 10 cents per byte
  ITEM_MINT_TXN_FEE: 0.001,                 // 0.1 cents per byte
  MINT_TXN_FEE: 0.001,                      // 0.1 cents per byte
  NFT_TXN_FEE: 0.0003,                      // 0.03 cents per byte
  PROPOSAL_RESULT_TXN_FEE: 0.01,            // 1 cent per byte
  PROPOSAL_TXN_FEE: 0.005,                  // 0.5 cents per byte
  SELF_CURRENCY_EQUIV_TXN_FEE: 0.0005,      // 0.05 cents per byte
  AUTHORIZED_CURRENCY_EQUIV_TXN_FEE: 0.0005, // 0.05 cents per byte
  SMART_CONTRACT_EXECUTE_TXN_FEE: 0.0015,   // 0.15 cents per byte
  SMART_CONTRACT_DEPLOYMENT_TXN_FEE: 0.0004, // 0.04 cents per byte
  SMART_CONTRACT_INSTANTIATE_TXN_FEE: 0.02,  // 2 cents per byte
  UPDATE_CONTRACT_TXN_FEE: 0.075,           // 7.5 cents per byte
  VOTE_TXN_FEE: 0.0001,                     // 0.01 cents per byte
  VALIDATOR_REGISTRATION_TXN_FEE: 0.01,     // 1 cent per byte
  VALIDATOR_HEARTBEAT_TXN_FEE: 0.00005,     // 0.005 cents per byte
  FAST_QUORUM_TXN_FEE: 0.04,                // 4 cents per byte
  QUASH_TXN_FEE: 0.001,                     // 0.1 cents per byte
  REVOKE_TXN_FEE: 0.001,                    // 0.1 cents per byte
};

/**
 * Get fee calculation constants for external use
 * @returns {Object} Fee calculation constants
 */
export function getFeeConstants() {
  return { ...FEE_CALCULATION_CONSTANTS };
}

/**
 * Update fee calculation constants
 * @param {Object} newConstants - New constants to merge
 */
export function updateFeeConstants(newConstants) {
  Object.assign(FEE_CALCULATION_CONSTANTS, newConstants);
}

/**
 * Get signature size for a key type
 * @param {string} keyType - Key type
 * @returns {number} Signature size in bytes
 */
export function getSignatureSize(keyType) {
  return SIGNATURE_SIZES[keyType] || SIGNATURE_SIZES.ED25519;
}

export default {
  SIGNATURE_SIZES,
  HASH_SIZES,
  HASH_SIZE,
  FEE_CALCULATION_CONSTANTS,
  getFeeConstants,
  updateFeeConstants,
  getSignatureSize
};
