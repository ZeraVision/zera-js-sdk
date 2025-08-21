import { 
  ZERA_COIN_TYPE, 
  ZERA_COIN_TYPE_HEX, 
  ZERA_SYMBOL, 
  ZERA_NAME, 
  DERIVATION_PATH, 
  SUPPORTED_KEY_TYPES 
} from './constants.js';

import { 
  validateMnemonicPhrase, 
  validateZeraAddress 
} from './shared.js';

import { createEd25519Wallet, getEd25519WalletInfo } from './ed25519.js';
import { createEd448Wallet, getEd448WalletInfo } from './ed448.js';

/**
 * ZERA Network Wallet Creation Class
 * Main interface for wallet creation operations
 */
export class ZeraWallet {
  constructor() {
    this.coinType = ZERA_COIN_TYPE;
    this.coinTypeHex = ZERA_COIN_TYPE_HEX;
    this.symbol = ZERA_SYMBOL;
    this.name = ZERA_NAME;
  }

  /**
   * Create ed25519 wallet from mnemonic
   * @param {string} mnemonic - BIP39 mnemonic phrase
   * @param {string} passphrase - Optional passphrase for additional security
   * @returns {Object} Wallet object with keys and addresses
   */
  async createEd25519Wallet(mnemonic, passphrase = '') {
    return await createEd25519Wallet(mnemonic, passphrase);
  }

  /**
   * Create ed448 wallet from mnemonic
   * @param {string} mnemonic - BIP39 mnemonic phrase
   * @param {string} passphrase - Optional passphrase for additional security
   * @returns {Object} Wallet object with keys and addresses
   */
  async createEd448Wallet(mnemonic, passphrase = '') {
    return await createEd448Wallet(mnemonic, passphrase);
  }

  /**
   * Validate ZERA address format
   * @param {string} address - Address to validate
   * @returns {boolean} True if valid
   */
  validateAddress(address) {
    return validateZeraAddress(address);
  }

  /**
   * Get wallet information
   * @returns {Object} Wallet information
   */
  getWalletInfo() {
    return {
      network: this.name,
      symbol: this.symbol,
      coinType: this.coinType,
      coinTypeHex: this.coinTypeHex,
      derivationPath: DERIVATION_PATH,
      supportedKeyTypes: SUPPORTED_KEY_TYPES,
      standard: 'BIP44 + SLIP44'
    };
  }

  /**
   * Get detailed information about supported key types
   * @returns {Object} Key type information
   */
  getKeyTypeInfo() {
    return {
      ed25519: getEd25519WalletInfo(),
      ed448: getEd448WalletInfo()
    };
  }
}

/**
 * Create a new ZERA wallet with specified key type
 * @param {string} keyType - 'ed25519' or 'ed448'
 * @param {string} mnemonic - BIP39 mnemonic phrase (required)
 * @param {string} passphrase - Optional passphrase
 * @returns {Object} Wallet object
 */
export async function createZeraWallet(keyType, mnemonic, passphrase = '') {
  if (!mnemonic) {
    throw new Error('Mnemonic phrase is required');
  }

  if (keyType === 'ed25519') {
    return await createEd25519Wallet(mnemonic, passphrase);
  } else if (keyType === 'ed448') {
    return await createEd448Wallet(mnemonic, passphrase);
  } else {
    throw new Error('Unsupported key type. Use "ed25519" or "ed448"');
  }
}

// Re-export shared functions for convenience
export { validateMnemonicPhrase, validateZeraAddress } from './shared.js';

// Re-export specific wallet creation functions
export { createEd25519Wallet } from './ed25519.js';
export { createEd448Wallet } from './ed448.js';

// Re-export constants
export { 
  ZERA_COIN_TYPE, 
  ZERA_COIN_TYPE_HEX, 
  ZERA_SYMBOL, 
  ZERA_NAME, 
  DERIVATION_PATH, 
  SUPPORTED_KEY_TYPES 
} from './constants.js';

export default ZeraWallet;
