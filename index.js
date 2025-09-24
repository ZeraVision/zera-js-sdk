/**
 * ZERA JavaScript SDK - Main Entry Point
 * 
 * A modern, ESM-compatible JavaScript SDK for the ZERA Network with support for:
 * - HD wallet creation with BIP32/BIP39/SLIP-0010 compliance
 * - Multiple key types (Ed25519, Ed448) and hash algorithms
 * - CoinTXN creation and submission
 * - API services for nonce and exchange rate management
 * 
 * @version 1.0.0
 * @author ZERA Vision
 * @license Custom
 */

// Import wallet creation functionality
import { 
  createWallet, 
  generateMnemonicPhrase, 
  deriveMultipleWallets,
  KEY_TYPE,
  HASH_TYPE
} from './src/wallet-creation/index.js';

// Import CoinTXN functionality
import { createCoinTXN, sendCoinTXN } from './src/coin-txn/index.js';

// Import API services
import { getExchangeRate } from './src/api/zv-indexer/rate/index.js';

/**
 * Create a new HD wallet with specified parameters
 * @param {Object} options - Wallet creation options
 * @param {string} options.keyType - Key type from KEY_TYPE enum
 * @param {Array<string>} options.hashTypes - Array of hash types from HASH_TYPE enum
 * @param {string} options.mnemonic - BIP39 mnemonic phrase
 * @param {string} [options.passphrase] - Optional passphrase for additional security
 * @param {Object} [options.hdOptions] - HD wallet derivation options
 * @returns {Promise<Object>} Created wallet object with address, keys, and metadata
 * @example
 * const wallet = await createWallet({
 *   keyType: KEY_TYPE.ED25519,
 *   hashTypes: [HASH_TYPE.SHA3_256],
 *   mnemonic: 'word1 word2...'
 * });
 */
export { createWallet };

/**
 * Generate a new BIP39 mnemonic phrase
 * @param {number} [length=24] - Length of mnemonic (12, 15, 18, 21, or 24)
 * @returns {string} Generated mnemonic phrase
 * @example
 * const mnemonic = generateMnemonicPhrase(12);
 */
export { generateMnemonicPhrase };

/**
 * Derive multiple HD wallets from the same mnemonic
 * @param {Object} options - Derivation options
 * @param {string} options.mnemonic - BIP39 mnemonic phrase
 * @param {string} options.keyType - Key type from KEY_TYPE enum
 * @param {Array<string>} options.hashTypes - Array of hash types from HASH_TYPE enum
 * @param {number} [options.count=1] - Number of wallets to derive
 * @param {Object} [options.hdOptions] - HD wallet derivation options
 * @returns {Promise<Array>} Array of wallet objects
 * @example
 * const wallets = await deriveMultipleWallets({
 *   mnemonic: 'word1 word2...',
 *   keyType: KEY_TYPE.ED25519,
 *   hashTypes: [HASH_TYPE.SHA3_256],
 *   count: 3
 * });
 */
export { deriveMultipleWallets };

/**
 * Enum for supported key types
 * @readonly
 * @enum {string}
 */
export { KEY_TYPE };

/**
 * Enum for supported hash algorithms
 * @readonly
 * @enum {string}
 */
export { HASH_TYPE };

/**
 * Create a CoinTXN transaction
 * @param {Array} inputs - Transaction inputs
 * @param {Array} outputs - Transaction outputs
 * @param {string} contractId - Contract identifier
 * @param {Object} [feeConfig] - Fee configuration options
 * @param {string} [memo] - Optional transaction memo
 * @returns {Object} CoinTXN protobuf object
 */
export { createCoinTXN };

/**
 * Send a CoinTXN transaction to the network
 * @param {Object} coinTxn - CoinTXN object from createCoinTXN
 * @param {Object} [options] - Send options
 * @returns {Promise<Object>} Transaction result
 */
export { sendCoinTXN };

/**
 * Get current exchange rate for a currency
 * @param {string} currencyId - Currency identifier (e.g., '$ZRA+0000')
 * @returns {Promise<number>} Exchange rate in USD
 */
export { getExchangeRate };

/**
 * SDK version
 * @constant {string}
 */
export const VERSION = '1.0.0';

/**
 * SDK description
 * @constant {string}
 */
export const DESCRIPTION = 'ZERA JavaScript SDK';