import {
  ZERA_TYPE, ZERA_TYPE_HEX, ZERA_SYMBOL, ZERA_NAME, SLIP0010_DERIVATION_PATH,
  SUPPORTED_KEY_TYPES, KEY_TYPE, HASH_TYPE, VALID_KEY_TYPES, VALID_HASH_TYPES, MNEMONIC_LENGTHS
} from './constants.js';

// Import the new unified wallet factory system
import {
  WalletFactory, createWallet, deriveMultipleWallets
} from './wallet-factory.js';

// Import HD wallet utilities
import {
  generateMnemonicPhrase, buildDerivationPath, getHDWalletInfo
} from './hd-utils.js';

// Import hash utilities
import {
  getAllHashInfo, getSupportedHashTypes
} from './hash-utils.js';

/**
 * Main ZeraWallet class - provides a clean interface to the wallet creation system
 */
export class ZeraWallet {
  constructor() {
    this.factory = new WalletFactory();
  }

  /**
   * Create a new wallet with specified parameters
   * @param {Object} options - Wallet creation options
   * @param {string} options.keyType - Key type from KEY_TYPE enum
   * @param {Array<string>} options.hashTypes - Array of hash types from HASH_TYPE enum (required)
   * @param {string} options.mnemonic - Required mnemonic phrase (must be provided)
   * @param {string} options.passphrase - Optional passphrase for additional security
   * @param {Object} options.hdOptions - HD wallet derivation options
   * @returns {Object} Created wallet object
   */
  async createWallet(options) {
    return await this.factory.createWallet(options);
  }



  /**
   * Derive multiple addresses from the same mnemonic
   * @param {Object} options - Derivation options
   * @param {string} options.mnemonic - BIP39 mnemonic phrase
   * @param {string} options.keyType - Key type from KEY_TYPE enum
   * @param {Array<string>} options.hashTypes - Array of hash types from HASH_TYPE enum (required)
   * @param {string} options.passphrase - Optional passphrase
   * @param {Object} options.hdOptions - HD wallet derivation options
   * @param {number} options.count - Number of addresses to derive (default: 1)
   * @returns {Array} Array of wallet objects
   */
  async deriveMultipleWallets(options) {
    return await this.factory.deriveMultipleWallets(options);
  }

  /**
   * Generate a new BIP39 mnemonic phrase
   * @param {number} length - Length of mnemonic (12, 15, 18, 21, or 24)
   * @returns {string} Generated mnemonic phrase
   */
  generateMnemonic(length = 24) {
    return generateMnemonicPhrase(length);
  }

  /**
   * Generate words for wallet creation
   * @param {number} length - Length of mnemonic (12, 15, 18, 21, or 24)
   * @returns {string} Generated mnemonic phrase
   */
  generateWords(length = 24) {
    return generateMnemonicPhrase(length);
  }

  /**
   * Build SLIP-0010 hardened derivation path for ZERA
   * @param {Object} options - Derivation options
   * @param {number} options.accountIndex - Account index (default: 0)
   * @param {number} options.changeIndex - Change index (0 for external, 1 for internal) (default: 0)
   * @param {number} options.addressIndex - Address index (default: 0)
   * @returns {string} SLIP-0010 hardened derivation path
   */
  buildDerivationPath(options = {}) {
    return buildDerivationPath(options);
  }

  /**
   * Get wallet factory information
   * @returns {Object} Factory information
   */
  getFactoryInfo() {
    return this.factory.getInfo();
  }

  /**
   * Get HD wallet information
   * @returns {Object} HD wallet information
   */
  getHDWalletInfo() {
    return getHDWalletInfo();
  }

  /**
   * Get hash algorithm information
   * @returns {Object} Hash algorithm information
   */
  getHashInfo() {
    return getAllHashInfo();
  }

  /**
   * Get supported key types
   * @returns {Array} Array of supported key types
   */
  getSupportedKeyTypes() {
    return VALID_KEY_TYPES;
  }

  /**
   * Get supported hash types
   * @returns {Array} Array of supported hash types
   */
  getSupportedHashTypes() {
    return VALID_HASH_TYPES;
  }

  /**
   * Get supported mnemonic lengths
   * @returns {Array} Array of supported mnemonic lengths
   */
  getSupportedMnemonicLengths() {
    return MNEMONIC_LENGTHS;
  }
}

// Re-export the new unified factory functions and utilities
export {
  WalletFactory, createWallet, deriveMultipleWallets
} from './wallet-factory.js';

export {
  generateMnemonicPhrase, buildDerivationPath, getHDWalletInfo
} from './hd-utils.js';

// Re-export the generateWords function for convenience
export { generateMnemonicPhrase as generateWords } from './hd-utils.js';

export {
  getAllHashInfo, getSupportedHashTypes
} from './hash-utils.js';

// Re-export shared utilities
export {
  generateZeraAddress, generateZeraPublicKeyIdentifier, createBaseWallet
} from './shared.js';

// Re-export crypto utilities
export { CryptoUtils } from './crypto-core.js';

// Re-export constants and enums
export {
  ZERA_TYPE, ZERA_TYPE_HEX, ZERA_SYMBOL, ZERA_NAME, SLIP0010_DERIVATION_PATH,
  SUPPORTED_KEY_TYPES, KEY_TYPE, HASH_TYPE, VALID_KEY_TYPES, VALID_HASH_TYPES, MNEMONIC_LENGTHS
} from './constants.js';

// Re-export error classes
export * from './errors.js';

export default ZeraWallet;
