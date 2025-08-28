import { 
  KEY_TYPE, 
  HASH_TYPE, 
  KEY_TYPE_PREFIXES, 
  HASH_TYPE_PREFIXES,
  ADDRESS_VERSIONS,
  isValidKeyType,
  isValidHashType
} from './constants.js';
import { createHashChain } from './hash-utils.js';
import { CryptoUtils } from './crypto-core.js';
import { sha256 } from '@noble/hashes/sha2';
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

  // Apply hash chain to public key
  const hashedPublicKey = createHashChain(hashTypes, publicKey);
  
  // Get network version byte for this key type to prevent cross-chain collisions
  const versionByte = ADDRESS_VERSIONS[keyType];
  if (versionByte === undefined) {
    throw new Error(`No address version defined for key type: ${keyType}`);
  }
  
  // Create address with version byte and checksum: [version][hashed_public_key][checksum]
  const dataWithoutChecksum = new Uint8Array(1 + hashedPublicKey.length);
  dataWithoutChecksum[0] = versionByte;
  dataWithoutChecksum.set(hashedPublicKey, 1);
  
  // Calculate checksum (first 4 bytes of double SHA256)
  const checksum = sha256(sha256(dataWithoutChecksum)).slice(0, 4);
  
  // Combine: [version][hashed_public_key][checksum]
  const addressBytes = new Uint8Array(1 + hashedPublicKey.length + 4);
  addressBytes.set(dataWithoutChecksum, 0);
  addressBytes.set(checksum, dataWithoutChecksum.length);
  
  // Encode to base58 with version byte and checksum included
  return bs58.encode(addressBytes);
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

  // Get network version byte for this key type
  const versionByte = ADDRESS_VERSIONS[keyType];
  if (versionByte === undefined) {
    throw new Error(`No address version defined for key type: ${keyType}`);
  }
  
  // Add key type prefix
  const keyPrefix = KEY_TYPE_PREFIXES[keyType];
  
  // Add hash chain prefix
  const hashPrefix = hashTypes.map(hashType => HASH_TYPE_PREFIXES[hashType]).join('');
  
  // Combine version byte, prefixes, and public key
  const formatData = new Uint8Array(1 + keyPrefix.length + hashPrefix.length + publicKey.length);
  let offset = 0;
  
  // Add version byte first
  formatData[offset] = versionByte;
  offset += 1;
  
  // Add key type prefix
  formatData.set(new TextEncoder().encode(keyPrefix), offset);
  offset += keyPrefix.length;
  
  // Add hash chain prefix
  formatData.set(new TextEncoder().encode(hashPrefix), offset);
  offset += hashPrefix.length;
  
  // Add public key
  formatData.set(publicKey, offset);
  
  // Calculate checksum (first 4 bytes of double SHA256)
  const checksum = sha256(sha256(formatData)).slice(0, 4);
  
  // Combine format data with checksum
  const dataWithChecksum = new Uint8Array(formatData.length + 4);
  dataWithChecksum.set(formatData, 0);
  dataWithChecksum.set(checksum, formatData.length);
  
  // Encode to base58 with checksum included
  return bs58.encode(dataWithChecksum);
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
 * Validate address format with checksum verification
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
    
    // Check minimum length (version + hash + checksum)
    if (decoded.length < 37) { // 1 + 32 + 4 = 37 bytes minimum
      return false;
    }

    // Extract components: [version][hash][checksum]
    const versionByte = decoded[0];
    const hashedData = decoded.slice(1, -4);
    const providedChecksum = decoded.slice(-4);
    
    // Verify checksum
    const dataWithoutChecksum = decoded.slice(0, -4);
    const calculatedChecksum = sha256(sha256(dataWithoutChecksum)).slice(0, 4);
    
    if (!calculatedChecksum.every((byte, index) => byte === providedChecksum[index])) {
      return false;
    }
    
    // Check if version byte is valid
    const validVersions = Object.values(ADDRESS_VERSIONS);
    if (!validVersions.includes(versionByte)) {
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Validate public key format with checksum verification
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
    
    // Minimum length: version(1) + keyPrefix(2) + hashPrefix(1) + publicKey(32) + checksum(4) = 40 bytes
    if (decoded.length < 40) {
      return false;
    }
    
    // Extract checksum (last 4 bytes)
    const checksum = decoded.slice(-4);
    const dataWithoutChecksum = decoded.slice(0, -4);
    
    // Verify checksum
    const expectedChecksum = sha256(sha256(dataWithoutChecksum)).slice(0, 4);
    if (!checksum.every((byte, i) => byte === expectedChecksum[i])) {
      return false;
    }
    
      // Verify version byte is valid
  const versionByte = dataWithoutChecksum[0];
  const validVersions = Object.values(ADDRESS_VERSIONS);
  if (!validVersions.includes(versionByte)) {
    return false;
  }
  
  // Extract and validate key-type and hash-type prefixes
  // Format: [version][keyPrefix][hashPrefix][publicKey]
  // Note: hashPrefix can be multiple characters when multiple hash types are used
  const keyPrefixStart = 1;
  const keyPrefixEnd = keyPrefixStart + 2; // Key prefixes are 2 characters (A_, B_)
  
  // Extract key prefix first
  const keyPrefixBytes = dataWithoutChecksum.slice(keyPrefixStart, keyPrefixEnd);
  const keyPrefix = new TextDecoder().decode(keyPrefixBytes);
  
  // Validate key-type prefix
  const validKeyPrefixes = Object.values(KEY_TYPE_PREFIXES);
  if (!validKeyPrefixes.includes(keyPrefix)) {
    return false;
  }
  
  // For hash prefixes, we need to find where the public key starts
  // We know the total data length and can calculate the hash prefix length
  const totalDataLength = dataWithoutChecksum.length;
  const versionLength = 1;
  const keyPrefixLength = 2;
  
  // Calculate expected public key length based on key type
  const expectedKeyLength = keyPrefix === KEY_TYPE_PREFIXES[KEY_TYPE.ED25519] ? 32 : 57;
  
  // Calculate hash prefix length: total - version - keyPrefix - publicKey
  const hashPrefixLength = totalDataLength - versionLength - keyPrefixLength - expectedKeyLength;
  
  if (hashPrefixLength < 0) {
    return false; // Invalid data structure
  }
  
  const hashPrefixStart = keyPrefixEnd;
  const hashPrefixEnd = hashPrefixStart + hashPrefixLength;
  const publicKeyStart = hashPrefixEnd;
  
  // Extract hash prefix
  const hashPrefixBytes = dataWithoutChecksum.slice(hashPrefixStart, hashPrefixEnd);
  const hashPrefix = new TextDecoder().decode(hashPrefixBytes);
  
  // Validate hash-type prefix by checking if it's composed of valid hash prefixes
  // Multiple hash types can be concatenated (e.g., "ba" for SHA3-512 + SHA3-256)
  const validHashPrefixes = Object.values(HASH_TYPE_PREFIXES);
  let isValidHashPrefix = true;
  
  // Check if the hash prefix is composed of valid single-character prefixes
  // Note: Each hash prefix is 2 characters (e.g., "a_", "b_", "c_")
  for (let i = 0; i < hashPrefix.length; i += 2) {
    if (i + 1 >= hashPrefix.length) {
      isValidHashPrefix = false;
      break;
    }
    const singleHashPrefix = hashPrefix[i] + hashPrefix[i + 1];
    if (!validHashPrefixes.includes(singleHashPrefix)) {
      isValidHashPrefix = false;
      break;
    }
  }
  
  if (!isValidHashPrefix) {
    return false;
  }
  
  // Validate public key length
  const publicKey = dataWithoutChecksum.slice(publicKeyStart);
  if (publicKey.length !== expectedKeyLength) {
    return false;
  }
  
  return true;
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
