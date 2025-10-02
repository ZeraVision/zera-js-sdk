/**
 * ZERA JavaScript SDK - Main Entry Point
 * 
 * A modern, ESM-compatible TypeScript SDK for the ZERA Network with support for:
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
export { 
  WalletFactory,
  generateZeraPublicKeyIdentifier,
  createBaseWallet,
  generateZeraAddress,
  CryptoUtils,
  KEY_TYPE,
  HASH_TYPE,
  VALID_KEY_TYPES,
  VALID_HASH_TYPES,
  KEY_TYPE_PREFIXES,
  HASH_TYPE_PREFIXES,
  isValidKeyType,
  isValidHashType,
  ZERA_TYPE,
  ZERA_TYPE_HEX,
  ZERA_SYMBOL,
  ZERA_NAME,
  SLIP0010_DERIVATION_PATH,
  MNEMONIC_LENGTHS,
  type WalletOptions,
  type Wallet,
  type HDOptions,
  type MultipleWalletOptions,
  type KeyType,
  type HashType,
  type MnemonicLength
} from './src/wallet-creation/index.js';

// Import CoinTXN functionality
export { 
  createCoinTXN, 
  sendCoinTXN,
  type CoinTXNInput,
  type CoinTXNOutput,
  type FeeConfig,
  type GRPCConfig
} from './src/coin-txn/index.js';





// Import error classes
export {
  WalletCreationError,
  InvalidKeyTypeError,
  InvalidHashTypeError,
  InvalidMnemonicLengthError,
  InvalidMnemonicError,
  InvalidDerivationPathError,
  InvalidHDParameterError,
  MissingParameterError,
  CryptographicError
} from './src/wallet-creation/errors.js';

/**
 * SDK version
 */
export const VERSION = '1.0.0' as const;

/**
 * SDK description
 */
export const DESCRIPTION = 'ZERA JavaScript SDK' as const;
