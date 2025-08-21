import { 
  ZERA_TYPE, 
  ZERA_TYPE_HEX, 
  ZERA_SYMBOL, 
  ZERA_NAME, 
  DERIVATION_PATH, 
  SUPPORTED_KEY_TYPES 
} from './constants.js';

import { 
  validateMnemonicPhrase, 
  validateZeraAddress 
} from './shared.js';

import { 
  createEd25519Wallet, 
  getEd25519WalletInfo,
  importEd25519WalletFromSeed,
  importEd25519WalletFromPrivateKey,
  importEd25519WalletFromPublicKey
} from './ed25519.js';

import { 
  createEd448Wallet, 
  getEd448WalletInfo,
  importEd448WalletFromSeed,
  importEd448WalletFromPrivateKey,
  importEd448WalletFromPublicKey
} from './ed448.js';

/**
 * ZERA Network Wallet Creation Class
 * Main interface for wallet creation operations
 */
export class ZeraWallet {
  constructor() {
    this.coinType = ZERA_TYPE;
    this.coinTypeHex = ZERA_TYPE_HEX;
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
   * Import ed25519 wallet from seed phrase (supports HD wallets)
   * @param {string} mnemonic - BIP39 mnemonic phrase
   * @param {string} passphrase - Optional passphrase for additional security
   * @param {string} derivationPath - Optional custom derivation path
   * @returns {Object} Wallet object with keys and addresses
   */
  async importEd25519WalletFromSeed(mnemonic, passphrase = '', derivationPath = DERIVATION_PATH) {
    return await importEd25519WalletFromSeed(mnemonic, passphrase, derivationPath);
  }

  /**
   * Import ed25519 wallet from private key
   * @param {string} privateKeyHex - Private key in hexadecimal format
   * @returns {Object} Wallet object with keys and addresses
   */
  async importEd25519WalletFromPrivateKey(privateKeyHex) {
    return await importEd25519WalletFromPrivateKey(privateKeyHex);
  }

  /**
   * Import ed25519 wallet from public key
   * @param {string} publicKeyHex - Public key in hexadecimal format
   * @returns {Object} Wallet object with public key and address (read-only)
   */
  async importEd25519WalletFromPublicKey(publicKeyHex) {
    return await importEd25519WalletFromPublicKey(publicKeyHex);
  }

  /**
   * Import ed448 wallet from seed phrase (supports HD wallets)
   * @param {string} mnemonic - BIP39 mnemonic phrase
   * @param {string} passphrase - Optional passphrase for additional security
   * @param {string} derivationPath - Optional custom derivation path
   * @returns {Object} Wallet object with keys and addresses
   */
  async importEd448WalletFromSeed(mnemonic, passphrase = '', derivationPath = DERIVATION_PATH) {
    return await importEd448WalletFromSeed(mnemonic, passphrase, derivationPath);
  }

  /**
   * Import ed448 wallet from private key
   * @param {string} privateKeyHex - Private key in hexadecimal format
   * @returns {Object} Wallet object with keys and addresses
   */
  async importEd448WalletFromPrivateKey(privateKeyHex) {
    return await importEd448WalletFromPrivateKey(privateKeyHex);
  }

  /**
   * Import ed448 wallet from public key
   * @param {string} publicKeyHex - Public key in hexadecimal format
   * @returns {Object} Wallet object with public key and address (read-only)
   */
  async importEd448WalletFromPublicKey(publicKeyHex) {
    return await importEd448WalletFromPublicKey(publicKeyHex);
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
export { 
  createEd25519Wallet,
  importEd25519WalletFromSeed,
  importEd25519WalletFromPrivateKey,
  importEd25519WalletFromPublicKey
} from './ed25519.js';

export { 
  createEd448Wallet,
  importEd448WalletFromSeed,
  importEd448WalletFromPrivateKey,
  importEd448WalletFromPublicKey
} from './ed448.js';

// Re-export constants
export { 
  ZERA_TYPE, 
  ZERA_TYPE_HEX, 
  ZERA_SYMBOL, 
  ZERA_NAME, 
  DERIVATION_PATH, 
  SUPPORTED_KEY_TYPES 
} from './constants.js';

export default ZeraWallet;
