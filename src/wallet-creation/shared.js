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
 * Generate ZERA public key identifier (human-readable with type prefixes)
 * 
 * This creates a self-describing public key format that includes:
 * - Key type prefix (A_ for Ed25519, B_ for Ed448)
 * - Hash type prefix(es) (a_ for SHA3-256, b_ for SHA3-512, c_ for Blake3)
 * - Base58 encoded public key
 * 
 * Format: KeyType_HashTypes_PublicKeyBase58
 * Example: A_c_5KJvsngHeMby884zrh6A5u6b4SqzZzAb (Ed25519 + Blake3)
 * 
 * This format is perfect for:
 * - Displaying keys with type information
 * - Feeding into functions that need to parse key/hash types
 * - Human-readable identification of key characteristics
 * 
 * @param {Uint8Array} publicKey - Public key bytes
 * @param {string} keyType - Key type from KEY_TYPE enum
 * @param {Array<string>} hashTypes - Array of hash types from HASH_TYPE enum
 * @returns {string} Generated ZERA public key identifier
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
 * Generate ZERA public key package (comprehensive binary format with validation)
 * 
 * This creates a self-contained binary package that includes:
 * - Network version byte (0x1a for Ed25519, 0x1b for Ed448)
 * - Key type prefix (A_ for Ed25519, B_ for Ed448) 
 * - Hash type prefix(es) (a_ for SHA3-256, b_ for SHA3-512, c_ for Blake3)
 * - Raw public key bytes (32 bytes for Ed25519, 57 bytes for Ed448)
 * - 4-byte checksum (double SHA256) for integrity validation
 * 
 * Binary Structure:
 * [Version(1)][KeyPrefix(2)][HashPrefix(2+)][PublicKey(32/57)][Checksum(4)]
 * 
 * Example for Ed25519 + Blake3:
 * - Version: 0x1a
 * - KeyPrefix: "A_" (0x41, 0x5f)
 * - HashPrefix: "c_" (0x63, 0x5f) 
 * - PublicKey: 32 bytes
 * - Checksum: 4 bytes (double SHA256)
 * 
 * This format is perfect for:
 * - Network transmission with integrity validation
 * - Storage with built-in corruption detection
 * - Cross-platform compatibility
 * - Cryptographic verification
 * 
 * @param {Uint8Array} publicKey - Public key bytes
 * @param {string} keyType - Key type from KEY_TYPE enum
 * @param {Array<string>} hashTypes - Array of hash types from HASH_TYPE enum
 * @returns {string} Generated ZERA public key package (base58 encoded)
 */
export function generateZeraPublicKeyPackage(publicKey, keyType, hashTypes = []) {
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
 * @param {string} privateKey - Private key in base58 format (raw 32-byte key encoded as base58)
 * @param {string} address - ZERA address
 * @param {string} publicKeyPackage - ZERA public key package (comprehensive binary format with validation)
 * @param {string} publicKey - ZERA public key identifier (human-readable with type prefixes)
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
  publicKeyPackage,
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
    address,
    publicKeyPackage, // Comprehensive binary format with version byte and checksum
    publicKey, // Human-readable identifier with type prefixes (e.g., "A_c_5KJvsngHeMby884zrh6A5u6b4SqzZzAb")
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
 * Parse ZERA public key package and extract all components
 * 
 * This function breaks down a public key package into its constituent parts:
 * - Network version byte
 * - Key type prefix
 * - Hash type prefix(es)
 * - Raw public key bytes
 * - Validates checksum for integrity
 * 
 * @param {string} publicKeyPackage - Base58 encoded public key package
 * @returns {Object} Parsed package components
 * @returns {number} returns.version - Network version byte
 * @returns {string} returns.keyTypePrefix - Key type prefix (A_, B_)
 * @returns {string} returns.hashTypePrefix - Hash type prefix(es) (a_, b_, c_)
 * @returns {Uint8Array} returns.publicKey - Raw public key bytes
 * @returns {Uint8Array} returns.checksum - 4-byte checksum
 * @returns {boolean} returns.isValid - Whether checksum validation passed
 * @returns {string} returns.keyType - Detected key type (ed25519, ed448)
 * @returns {Array<string>} returns.hashTypes - Detected hash types
 * @throws {Error} If package format is invalid or checksum validation fails
 */
export function parseZeraPublicKeyPackage(publicKeyPackage) {
  if (!publicKeyPackage || typeof publicKeyPackage !== 'string') {
    throw new Error('Public key package must be a non-empty string');
  }

  try {
    // Decode base58
    const decoded = bs58.decode(publicKeyPackage);
    
    // Minimum length: version(1) + keyPrefix(2) + hashPrefix(2) + publicKey(32) + checksum(4) = 41 bytes
    if (decoded.length < 41) {
      throw new Error(`Invalid package length: ${decoded.length} bytes (minimum: 41)`);
    }
    
    // Extract checksum (last 4 bytes)
    const checksum = decoded.slice(-4);
    const dataWithoutChecksum = decoded.slice(0, -4);
    
    // Verify checksum
    const expectedChecksum = sha256(sha256(dataWithoutChecksum)).slice(0, 4);
    const isValidChecksum = checksum.every((byte, i) => byte === expectedChecksum[i]);
    
    // Extract version byte
    const version = dataWithoutChecksum[0];
    
    // Extract key type prefix (2 bytes)
    const keyPrefixBytes = dataWithoutChecksum.slice(1, 3);
    const keyTypePrefix = new TextDecoder().decode(keyPrefixBytes);
    
    // Determine key type from prefix
    let keyType;
    if (keyTypePrefix === 'A_') {
      keyType = 'ed25519';
    } else if (keyTypePrefix === 'B_') {
      keyType = 'ed448';
    } else {
      throw new Error(`Unknown key type prefix: ${keyTypePrefix}`);
    }
    
    // Calculate expected public key length
    const expectedKeyLength = keyType === 'ed25519' ? 32 : 57;
    
    // Calculate hash prefix length: total - version - keyPrefix - publicKey
    const totalDataLength = dataWithoutChecksum.length;
    const versionLength = 1;
    const keyPrefixLength = 2;
    const hashPrefixLength = totalDataLength - versionLength - keyPrefixLength - expectedKeyLength;
    
    if (hashPrefixLength < 0) {
      throw new Error(`Invalid data structure: negative hash prefix length`);
    }
    
    // Extract hash type prefix
    const hashPrefixStart = 3; // After version + keyPrefix
    const hashPrefixEnd = hashPrefixStart + hashPrefixLength;
    const hashPrefixBytes = dataWithoutChecksum.slice(hashPrefixStart, hashPrefixEnd);
    const hashTypePrefix = new TextDecoder().decode(hashPrefixBytes);
    
    // Parse hash types from prefix
    const hashTypes = [];
    for (let i = 0; i < hashTypePrefix.length; i += 2) {
      if (i + 1 >= hashTypePrefix.length) {
        throw new Error(`Invalid hash prefix format: ${hashTypePrefix}`);
      }
      const singleHashPrefix = hashTypePrefix[i] + hashTypePrefix[i + 1];
      
      // Map prefix to hash type
      switch (singleHashPrefix) {
        case 'a_':
          hashTypes.push('sha3-256');
          break;
        case 'b_':
          hashTypes.push('sha3-512');
          break;
        case 'c_':
          hashTypes.push('blake3');
          break;
        default:
          throw new Error(`Unknown hash type prefix: ${singleHashPrefix}`);
      }
    }
    
    // Extract public key
    const publicKeyStart = hashPrefixEnd;
    const publicKey = dataWithoutChecksum.slice(publicKeyStart);
    
    // Validate public key length
    if (publicKey.length !== expectedKeyLength) {
      throw new Error(`Invalid public key length: ${publicKey.length} bytes (expected: ${expectedKeyLength})`);
    }
    
    return {
      version,
      keyTypePrefix,
      hashTypePrefix,
      publicKey,
      checksum,
      isValid: isValidChecksum,
      keyType,
      hashTypes,
      packageLength: decoded.length,
      dataLength: dataWithoutChecksum.length
    };
    
  } catch (error) {
    throw new Error(`Failed to parse public key package: ${error.message}`);
  }
}

/**
 * Validate public key package with checksum verification
 * @param {string} publicKeyPackage - Public key package to validate
 * @returns {boolean} True if valid
 */
export function validatePublicKeyPackage(publicKeyPackage) {
  if (!publicKeyPackage || typeof publicKeyPackage !== 'string') {
    return false;
  }

  try {
    // Use the parser function to validate
    const parsed = parseZeraPublicKeyPackage(publicKeyPackage);
    return parsed.isValid;
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
