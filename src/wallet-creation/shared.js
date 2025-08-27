import { sha256 } from '@noble/hashes/sha256';
import { ripemd160 } from '@noble/hashes/ripemd160';
import bs58 from 'bs58';
import { validateMnemonic } from 'bip39';
import { 
  ADDRESS_VERSIONS, 
  MIN_ADDRESS_LENGTH,
  KEY_TYPE,
  KEY_TYPE_PREFIXES,
  isValidKeyType,
  getKeyTypePrefix
} from './constants.js';
import { generateHashPrefix, applyHashChain } from './hash-utils.js';
import { MissingParameterError } from './errors.js';

/**
 * Validate a BIP39 mnemonic phrase
 * @param {string} mnemonic - Mnemonic phrase to validate
 * @returns {boolean} True if valid
 */
export function validateMnemonicPhrase(mnemonic) {
  return validateMnemonic(mnemonic);
}

/**
 * Generate ZERA Network address from public key with key type and hash type prefixes
 * @param {Buffer|Uint8Array} publicKey - Public key bytes
 * @param {string} keyType - Key type from KEY_TYPE enum
 * @param {Array<string>} hashTypes - Array of hash types from HASH_TYPE enum
 * @returns {string} ZERA address (final hash encoded to base58)
 */
export function generateZeraAddress(publicKey, keyType, hashTypes = []) {
  if (!publicKey) {
    throw new MissingParameterError('publicKey');
  }
  
  if (!keyType) {
    throw new MissingParameterError('keyType');
  }
  
  if (!isValidKeyType(keyType)) {
    throw new Error(`Invalid key type: ${keyType}`);
  }
  
  // Apply hash chain if hash types are provided
  let finalHash;
  if (hashTypes && hashTypes.length > 0) {
    finalHash = applyHashChain(publicKey, hashTypes);
  } else {
    // Default to SHA256 if no hash types specified
    finalHash = sha256(publicKey);
  }
  
  // Encode the final hash to base58 - this is the address
  return bs58.encode(finalHash);
}

/**
 * Generate ZERA public key display format: KeyType_HashTypes_base58publickey
 * @param {Buffer|Uint8Array} publicKey - Public key bytes
 * @param {string} keyType - Key type from KEY_TYPE enum
 * @param {Array<string>} hashTypes - Array of hash types from HASH_TYPE enum
 * @returns {string} Public key display format
 */
export function generateZeraPublicKeyFormat(publicKey, keyType, hashTypes = []) {
  if (!publicKey) {
    throw new MissingParameterError('publicKey');
  }
  
  if (!keyType) {
    throw new MissingParameterError('keyType');
  }
  
  if (!isValidKeyType(keyType)) {
    throw new Error(`Invalid key type: ${keyType}`);
  }
  
  // Get key type prefix
  const keyPrefix = getKeyTypePrefix(keyType);
  
  // Get hash type prefix
  const hashPrefix = generateHashPrefix(hashTypes);
  
  // Encode public key to base58
  const publicKeyBase58 = bs58.encode(publicKey);
  
  // Combine: KeyType_HashTypes_base58publickey
  return `${keyPrefix}${hashPrefix}${publicKeyBase58}`;
}

/**
 * Validate ZERA address format
 * @param {string} address - Address to validate
 * @returns {boolean} True if valid
 */
export function validateZeraAddress(address) {
  try {
    const decoded = bs58.decode(address);
    return decoded.length >= MIN_ADDRESS_LENGTH;
  } catch {
    return false;
  }
}

/**
 * Create base wallet object with common properties
 * @param {string} type - Wallet type
 * @param {string} mnemonic - BIP39 mnemonic phrase
 * @param {string} privateKey - Private key in base58 format
 * @param {Uint8Array} publicKey - Public key in bytes (Uint8Array)
 * @param {string} address - ZERA address
 * @param {string} publicKeyFormat - Public key display format
 * @param {number} coinType - Coin type
 * @param {string} symbol - Symbol
 * @param {string} derivationPath - Derivation path
 * @param {string} keyType - Key type used (from KEY_TYPE enum)
 * @param {Array<string>} hashTypes - Hash types used (from HASH_TYPE enum)
 * @returns {Object} Base wallet object
 */
export function createBaseWallet(type, mnemonic, privateKey, publicKey, address, publicKeyFormat, coinType, symbol, derivationPath, keyType, hashTypes) {
  return {
    type,
    mnemonic,
    privateKey,
    publicKey,
    address,
    publicKeyFormat,
    derivationPath,
    coinType,
    symbol,
    keyType,
    hashTypes,
    createdAt: new Date().toISOString()
  };
}

/**
 * Validate key type parameter
 * @param {string} keyType - Key type to validate
 * @returns {boolean} True if valid
 */
export function validateKeyType(keyType) {
  return isValidKeyType(keyType);
}

/**
 * Validate required parameters
 * @param {string} mnemonic - Mnemonic to validate
 * @param {string} keyType - Key type to validate
 */
export function validateWalletParams(mnemonic, keyType) {
  if (!mnemonic) {
    throw new MissingParameterError('mnemonic');
  }
  
  if (!validateMnemonicPhrase(mnemonic)) {
    throw new Error('Invalid BIP39 mnemonic phrase');
  }
  
  if (!validateKeyType(keyType)) {
    throw new Error(`Unsupported key type. Use one of: ${Object.values(KEY_TYPE).join(', ')}`);
  }
}
