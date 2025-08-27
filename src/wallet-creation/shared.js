import { 
  KEY_TYPE, 
  HASH_TYPE, 
  KEY_TYPE_PREFIXES, 
  HASH_TYPE_PREFIXES,
  isValidKeyType,
  isValidHashType
} from './constants.js';
import { createHashChain } from './hash-utils.js';
import { CryptoUtils } from './crypto-core.js';
import bs58 from 'bs58';

/**
 * Generate ZERA address from public key and hash types
 * @param {Uint8Array} publicKey - Public key bytes
 * @param {string} keyType - Key type from KEY_TYPE enum
 * @param {Array<string>} hashTypes - Array of hash types from HASH_TYPE enum
 * @returns {string} Generated ZERA address
 */
export function generateZeraAddress(publicKey, keyType, hashTypes = []) {
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

  // Apply hash chain to public key ONLY
  const hashedPublicKey = createHashChain(hashTypes, publicKey);
  
  // The address is ONLY the hashed public key - no prefixes
  // Prefixes are for display/identification, not part of the actual address
  return bs58.encode(hashedPublicKey);
}

/**
 * Generate ZERA public key format
 * @param {Uint8Array} publicKey - Public key bytes
 * @param {string} keyType - Key type from KEY_TYPE enum
 * @param {Array<string>} hashTypes - Array of hash types from HASH_TYPE enum
 * @returns {string} Generated ZERA public key format
 */
export function generateZeraPublicKeyFormat(publicKey, keyType, hashTypes = []) {
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

  // Add key type prefix
  const keyPrefix = KEY_TYPE_PREFIXES[keyType];
  
  // Add hash chain prefix
  const hashPrefix = hashTypes.map(hashType => HASH_TYPE_PREFIXES[hashType]).join('');
  
  // Combine prefixes with public key
  const formatData = new Uint8Array(keyPrefix.length + hashPrefix.length + publicKey.length);
  let offset = 0;
  
  // Add key type prefix
  formatData.set(new TextEncoder().encode(keyPrefix), offset);
  offset += keyPrefix.length;
  
  // Add hash chain prefix
  formatData.set(new TextEncoder().encode(hashPrefix), offset);
  offset += hashPrefix.length;
  
  // Add public key
  formatData.set(publicKey, offset);
  
  // Encode to base58
  return bs58.encode(formatData);
}

/**
 * Create base wallet object
 * @param {string} type - Wallet type
 * @param {string} mnemonic - BIP39 mnemonic phrase
 * @param {string} privateKeyBase58 - Private key in base58 format
 * @param {Uint8Array} publicKey - Public key bytes
 * @param {string} address - ZERA address
 * @param {string} publicKeyFormat - ZERA public key format
 * @param {number} coinType - Coin type (SLIP44)
 * @param {string} symbol - Coin symbol
 * @param {string} derivationPath - BIP44 derivation path
 * @param {string} keyType - Key type used
 * @param {Array<string>} hashTypes - Hash types used
 * @returns {Object} Base wallet object
 */
export function createBaseWallet(
  type,
  mnemonic,
  privateKeyBase58,
  publicKeyBase58,
  address,
  publicKeyFormat,
  coinType,
  symbol,
  derivationPath,
  keyType,
  hashTypes
) {
  return {
    type,
    mnemonic,
    privateKeyBase58,
    publicKeyBase58,
    address,
    publicKeyFormat,
    coinType,
    symbol,
    derivationPath,
    keyType,
    hashTypes,
    createdAt: new Date().toISOString(),
    version: '1.0.0',
    standard: 'BIP32 + BIP39 + BIP44 + SLIP44'
  };
}

/**
 * Validate address format
 * @param {string} address - Address to validate
 * @returns {boolean} True if valid
 */
export function validateAddress(address) {
  if (!address || typeof address !== 'string') {
    return false;
  }

  try {
    // Decode base58
    const decoded = bs58.decode(address);
    
    // Check minimum length
    if (decoded.length < 10) {
      return false;
    }

    // Check if it starts with a valid key type prefix
    const keyPrefixes = Object.values(KEY_TYPE_PREFIXES);
    const addressStr = address;
    
    return keyPrefixes.some(prefix => addressStr.startsWith(prefix));
  } catch (error) {
    return false;
  }
}

/**
 * Validate public key format
 * @param {string} publicKeyFormat - Public key format to validate
 * @returns {boolean} True if valid
 */
export function validatePublicKeyFormat(publicKeyFormat) {
  if (!publicKeyFormat || typeof publicKeyFormat !== 'string') {
    return false;
  }

  try {
    // Decode base58
    const decoded = bs58.decode(publicKeyFormat);
    
    // Check minimum length
    if (decoded.length < 10) {
      return false;
    }

    // Check if it starts with a valid key type prefix
    const keyPrefixes = Object.values(KEY_TYPE_PREFIXES);
    const formatStr = publicKeyFormat;
    
    return keyPrefixes.some(prefix => formatStr.startsWith(prefix));
  } catch (error) {
    return false;
  }
}

/**
 * Validate mnemonic phrase
 * @param {string} mnemonic - Mnemonic phrase to validate
 * @returns {boolean} True if valid
 */
export function validateMnemonic(mnemonic) {
  if (!mnemonic || typeof mnemonic !== 'string') {
    return false;
  }

  const words = mnemonic.trim().split(/\s+/);
  const validLengths = [12, 15, 18, 21, 24];
  
  if (!validLengths.includes(words.length)) {
    return false;
  }

  // Basic word validation (in production, use proper BIP39 wordlist validation)
  return words.every(word => /^[a-z]+$/.test(word));
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
 * Get wallet information
 * @param {Object} wallet - Wallet object
 * @returns {Object} Wallet information
 */
export function getWalletInfo(wallet) {
  if (!wallet || typeof wallet !== 'object') {
    throw new Error('Invalid wallet object');
  }

  return {
    type: wallet.type,
    coinType: wallet.coinType,
    symbol: wallet.symbol,
    keyType: wallet.keyType,
    hashTypes: wallet.hashTypes,
    derivationPath: wallet.derivationPath,
    address: wallet.address,
    publicKeyFormat: wallet.publicKeyFormat,
    createdAt: wallet.createdAt,
    version: wallet.version,
    standard: wallet.standard,
    // Extended key information if available
    extendedPrivateKey: wallet.extendedPrivateKey,
    extendedPublicKey: wallet.extendedPublicKey,
    fingerprint: wallet.fingerprint,
    depth: wallet.depth,
    index: wallet.index
  };
}

/**
 * Export wallet to different formats
 * @param {Object} wallet - Wallet object
 * @param {string} format - Export format ('json', 'base58', 'hex')
 * @returns {string} Exported wallet data
 */
export function exportWallet(wallet, format = 'json') {
  if (!wallet || typeof wallet !== 'object') {
    throw new Error('Invalid wallet object');
  }

  switch (format.toLowerCase()) {
    case 'json':
      return JSON.stringify(wallet, null, 2);
    
    case 'base58':
      // Export as base58 encoded string
      const exportData = {
        type: wallet.type,
        coinType: wallet.coinType,
        symbol: wallet.symbol,
        keyType: wallet.keyType,
        hashTypes: wallet.hashTypes,
        derivationPath: wallet.derivationPath,
        address: wallet.address,
        publicKeyFormat: wallet.publicKeyFormat
      };
      return bs58.encode(new TextEncoder().encode(JSON.stringify(exportData)));
    
    case 'hex':
      // Export as hex string
      const hexData = {
        type: wallet.type,
        coinType: wallet.coinType,
        symbol: wallet.symbol,
        keyType: wallet.keyType,
        hashTypes: wallet.hashTypes,
        derivationPath: wallet.derivationPath,
        address: wallet.address,
        publicKeyFormat: wallet.publicKeyFormat
      };
      return Buffer.from(JSON.stringify(hexData)).toString('hex');
    
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}
