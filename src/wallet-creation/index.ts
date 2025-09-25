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

// Import types
import type { 
  WalletOptions, 
  Wallet, 
  HDOptions, 
  MultipleWalletOptions, 
  KeyType, 
  HashType,
  MnemonicLength
} from '../types/index.js';

/**
 * Main ZeraWallet class - provides a clean interface to the wallet creation system
 */
export class ZeraWallet {
  private readonly factory: WalletFactory;

  constructor() {
    this.factory = new WalletFactory();
  }

  /**
   * Create a new wallet with specified parameters
   */
  async createWallet(options: WalletOptions): Promise<Wallet> {
    return await this.factory.createWallet(options);
  }

  /**
   * Derive multiple addresses from the same mnemonic
   */
  async deriveMultipleWallets(options: MultipleWalletOptions): Promise<Wallet[]> {
    return await this.factory.deriveMultipleWallets(options);
  }

  /**
   * Generate a new BIP39 mnemonic phrase
   */
  generateMnemonic(length: MnemonicLength = 24): string {
    return generateMnemonicPhrase(length);
  }

  /**
   * Generate words for wallet creation
   */
  generateWords(length: MnemonicLength = 24): string {
    return generateMnemonicPhrase(length);
  }

  /**
   * Build SLIP-0010 hardened derivation path for ZERA
   */
  buildDerivationPath(options: HDOptions = {}): string {
    return buildDerivationPath(options);
  }

  /**
   * Get wallet factory information
   */
  getFactoryInfo(): ReturnType<WalletFactory['getInfo']> {
    return this.factory.getInfo();
  }

  /**
   * Get HD wallet information
   */
  getHDWalletInfo(): ReturnType<typeof getHDWalletInfo> {
    return getHDWalletInfo();
  }

  /**
   * Get hash algorithm information
   */
  getHashInfo(): ReturnType<typeof getAllHashInfo> {
    return getAllHashInfo();
  }

  /**
   * Get supported key types
   */
  getSupportedKeyTypes(): readonly KeyType[] {
    return VALID_KEY_TYPES;
  }

  /**
   * Get supported hash types
   */
  getSupportedHashTypes(): readonly HashType[] {
    return VALID_HASH_TYPES;
  }

  /**
   * Get supported mnemonic lengths
   */
  getSupportedMnemonicLengths(): readonly number[] {
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
  generateZeraPublicKeyIdentifier, createBaseWallet
} from './shared.js';

// Re-export address utilities
export { generateZeraAddress } from '../shared/crypto/address-utils.js';

// Re-export crypto utilities
export { CryptoUtils } from './crypto-core.js';

// Re-export constants and enums
export {
  ZERA_TYPE, ZERA_TYPE_HEX, ZERA_SYMBOL, ZERA_NAME, SLIP0010_DERIVATION_PATH,
  SUPPORTED_KEY_TYPES, KEY_TYPE, HASH_TYPE, VALID_KEY_TYPES, VALID_HASH_TYPES, MNEMONIC_LENGTHS
} from './constants.js';

// Re-export error classes
export * from './errors.js';

// Re-export types
export type {
  WalletOptions,
  Wallet,
  HDOptions,
  MultipleWalletOptions,
  KeyType,
  HashType,
  MnemonicLength
} from '../types/index.js';

export default ZeraWallet;
