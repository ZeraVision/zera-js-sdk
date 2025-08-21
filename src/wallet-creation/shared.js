import { sha256 } from '@noble/hashes/sha256';
import { ripemd160 } from '@noble/hashes/ripemd160';
import bs58 from 'bs58';
import { validateMnemonic } from 'bip39';
import { ADDRESS_VERSIONS, MIN_ADDRESS_LENGTH } from './constants.js';

/**
 * Validate a BIP39 mnemonic phrase
 * @param {string} mnemonic - Mnemonic phrase to validate
 * @returns {boolean} True if valid
 */
export function validateMnemonicPhrase(mnemonic) {
  return validateMnemonic(mnemonic);
}

/**
 * Generate ZERA Network address from public key
 * @param {Buffer} publicKey - Public key bytes
 * @param {string} keyType - Key type: 'ed25519' or 'ed448'
 * @returns {string} ZERA address
 */
export function generateZeraAddress(publicKey, keyType) {
  // ZERA Network specific address generation
  // This is a placeholder - you'll need to implement the actual ZERA address format
  
  // For now, we'll use a simple hash-based approach
  const hash = sha256(publicKey);
  const ripemd = ripemd160(hash);
  
  // Add version byte for ZERA
  const version = ADDRESS_VERSIONS[keyType];
  if (version === undefined) {
    throw new Error(`Unsupported key type: ${keyType}`);
  }
  
  const payload = Buffer.concat([Buffer.from([version]), ripemd]);
  
  // Double SHA256 for checksum
  const checksum = sha256(sha256(payload)).slice(0, 4);
  const addressBytes = Buffer.concat([payload, checksum]);
  
  // Base58Check encoding
  return bs58.encode(addressBytes);
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
 * @param {string} privateKey - Private key in hex
 * @param {string} publicKey - Public key in hex
 * @param {string} address - ZERA address
 * @param {number} coinType - Coin type
 * @param {string} symbol - Symbol
 * @param {string} derivationPath - Derivation path
 * @returns {Object} Base wallet object
 */
export function createBaseWallet(type, mnemonic, privateKey, publicKey, address, coinType, symbol, derivationPath) {
  return {
    type,
    mnemonic,
    privateKey,
    publicKey,
    address,
    derivationPath,
    coinType,
    symbol
  };
}

/**
 * Validate key type parameter
 * @param {string} keyType - Key type to validate
 * @returns {boolean} True if valid
 */
export function validateKeyType(keyType) {
  return ['ed25519', 'ed448'].includes(keyType);
}

/**
 * Validate required parameters
 * @param {string} mnemonic - Mnemonic to validate
 * @param {string} keyType - Key type to validate
 */
export function validateWalletParams(mnemonic, keyType) {
  if (!mnemonic) {
    throw new Error('Mnemonic phrase is required');
  }
  
  if (!validateMnemonicPhrase(mnemonic)) {
    throw new Error('Invalid BIP39 mnemonic phrase');
  }
  
  if (!validateKeyType(keyType)) {
    throw new Error('Unsupported key type. Use "ed25519" or "ed448"');
  }
}
