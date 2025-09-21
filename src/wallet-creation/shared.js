import { 
  KEY_TYPE, 
  HASH_TYPE, 
  KEY_TYPE_PREFIXES, 
  HASH_TYPE_PREFIXES,
  isValidKeyType,
  isValidHashType
} from './constants.js';
import { CryptoUtils } from './crypto-core.js';
import bs58 from 'bs58';


/**
 * Generate ZERA public key identifier (human-readable format with type prefixes)
 * 
 * This creates a human-readable identifier that includes:
 * - Key type prefix (A_ for Ed25519, B_ for Ed448)
 * - Hash type prefix(es) (a_ for SHA3-256, b_ for SHA3-512, c_ for Blake3)
 * - Base58-encoded public key
 * 
 * Format: KeyPrefix_HashPrefix_PublicKeyBase58
 * Example: "A_c_5KJvsngHeMby884zrh6A5u6b4SqzZzAb"
 * 
 * @param {Uint8Array} publicKey - Public key bytes
 * @param {string} keyType - Key type from KEY_TYPE enum
 * @param {Array<string>} hashTypes - Array of hash types from HASH_TYPE enum
 * @returns {string} Generated public key identifier
 */
export function generateZeraPublicKeyIdentifier(publicKey, keyType, hashTypes = []) {
  if (!publicKey || !(publicKey instanceof Uint8Array)) {
    throw new Error('Public key must be a Uint8Array');
  }

  if (!isValidKeyType(keyType)) {
    throw new Error(`Invalid key type: ${keyType}`);
  }

  if (!Array.isArray(hashTypes) || hashTypes.length === 0) {
    throw new Error('Hash types must be a non-empty array');
  }

  // Validate all hash types
  for (const hashType of hashTypes) {
    if (!isValidHashType(hashType)) {
      throw new Error(`Invalid hash type: ${hashType}`);
    }
  }

  // Get key type prefix
  const keyPrefix = KEY_TYPE_PREFIXES[keyType];
  
  // Get hash chain prefix
  const hashPrefix = hashTypes.map(hashType => HASH_TYPE_PREFIXES[hashType]).join('');
  
  // Get base58 encoded public key
  const publicKeyBase58 = bs58.encode(publicKey);
  
  // Combine: KeyPrefix_HashPrefix_PublicKeyBase58
  return `${keyPrefix}${hashPrefix}${publicKeyBase58}`;
}

/**
 * Create base wallet object
 * @param {string} type - Wallet type
 * @param {string} mnemonic - BIP39 mnemonic phrase
 * @param {string} privateKey - Private key in base58 format (raw 32-byte key encoded as base58)
 * @param {string} address - ZERA address (base58-encoded hashed public key)
 * @param {string} publicKey - ZERA public key identifier (human-readable with type prefixes) - THIS IS WHAT'S SENT TO THE NETWORK
 * @param {number} coinType - Coin type (SLIP44)
 * @param {string} symbol - Coin symbol
 * @param {string} derivationPath - SLIP-0010 hardened derivation path
 * @param {string} keyType - Key type used
 * @param {Array<string>} hashTypes - Hash types used
 * @returns {Object} Base wallet object
 */
export function createBaseWallet(
  type,
  mnemonic,
  privateKey,
  address,
  publicKey,
  coinType,
  symbol,
  derivationPath,
  keyType,
  hashTypes
) {
  return {
    type,
    mnemonic,
    privateKey, // Raw 32-byte private key encoded as base58 (e.g., "5KJvsngHeMby884zrh6A5u6b4SqzZzAb")
    address, // ZERA Network address (base58-encoded hashed public key)
    publicKey, // Human-readable identifier with type prefixes (e.g., "A_c_5KJvsngHeMby884zrh6A5u6b4SqzZzAb") - THIS IS WHAT'S SENT TO THE NETWORK
    coinType,
    symbol,
    derivationPath,
    keyType,
    hashTypes,
    createdAt: new Date().toISOString(),
    version: '1.0.0',
    standard: 'BIP32 + BIP39 + SLIP-0010 + SLIP44'
  };
}


/**
 * Validate BIP39 mnemonic phrase
 * @param {string} mnemonic - Mnemonic phrase to validate
 * @returns {boolean} True if valid
 */
export function validateMnemonic(mnemonic) {
  if (!mnemonic || typeof mnemonic !== 'string') {
    return false;
  }

  const words = mnemonic.trim().split(/\s+/);
  return words.length >= 12 && words.length <= 24 && words.length % 3 === 0;
}

/**
 * Validate key type
 * @param {string} keyType - Key type to validate
 * @returns {boolean} True if valid
 */
export function validateKeyType(keyType) {
  return isValidKeyType(keyType);
}

/**
 * Validate hash types array
 * @param {Array<string>} hashTypes - Hash types array to validate
 * @returns {boolean} True if valid
 */
export function validateHashTypesArray(hashTypes) {
  if (!Array.isArray(hashTypes) || hashTypes.length === 0) {
    return false;
  }

  return hashTypes.every(hashType => isValidHashType(hashType));
}

/**
 * Get wallet information summary
 * @param {Object} wallet - Wallet object
 * @returns {Object} Wallet information
 */
export function getWalletInfo(wallet) {
  return {
    type: wallet.type,
    keyType: wallet.keyType,
    hashTypes: wallet.hashTypes,
    address: wallet.address,
    publicKey: wallet.publicKey,
    symbol: wallet.symbol,
    coinType: wallet.coinType,
    derivationPath: wallet.derivationPath,
    createdAt: wallet.createdAt,
    version: wallet.version,
    standard: wallet.standard
  };
}

/**
 * Export wallet in specified format
 * @param {Object} wallet - Wallet object
 * @param {string} format - Export format ('json', 'text')
 * @returns {string} Exported wallet data
 */
export function exportWallet(wallet, format = 'json') {
  switch (format.toLowerCase()) {
    case 'json':
      return JSON.stringify(wallet, null, 2);
    case 'text':
      return `Wallet Type: ${wallet.type}
Key Type: ${wallet.keyType}
Hash Types: ${wallet.hashTypes.join(', ')}
Address: ${wallet.address}
Public Key: ${wallet.publicKey}
Symbol: ${wallet.symbol}
Coin Type: ${wallet.coinType}
Derivation Path: ${wallet.derivationPath}
Created: ${wallet.createdAt}
Version: ${wallet.version}
Standard: ${wallet.standard}`;
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}
