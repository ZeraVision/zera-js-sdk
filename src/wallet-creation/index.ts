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

export default WalletFactory;
