import { ERROR_MESSAGES } from './constants.js';

/**
 * Base error class for wallet creation operations
 */
export class WalletCreationError extends Error {
  constructor(message, code, details = null) {
    super(message);
    this.name = 'WalletCreationError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Error for invalid key types
 */
export class InvalidKeyTypeError extends WalletCreationError {
  constructor(keyType, supportedTypes = ['ed25519', 'ed448']) {
    super(
      `${ERROR_MESSAGES.INVALID_KEY_TYPE} (received: ${keyType})`,
      'INVALID_KEY_TYPE',
      { received: keyType, supported: supportedTypes }
    );
    this.name = 'InvalidKeyTypeError';
  }
}

/**
 * Error for invalid hash types
 */
export class InvalidHashTypeError extends WalletCreationError {
  constructor(hashType, supportedTypes = ['sha3-256', 'sha3-512', 'blake3']) {
    super(
      `${ERROR_MESSAGES.INVALID_HASH_TYPE} (received: ${hashType})`,
      'INVALID_HASH_TYPE',
      { received: hashType, supported: supportedTypes }
    );
    this.name = 'InvalidHashTypeError';
  }
}

/**
 * Error for invalid mnemonic lengths
 */
export class InvalidMnemonicLengthError extends WalletCreationError {
  constructor(length, supportedLengths = [12, 15, 18, 21, 24]) {
    super(
      `${ERROR_MESSAGES.INVALID_MNEMONIC_LENGTH} (received: ${length})`,
      'INVALID_MNEMONIC_LENGTH',
      { received: length, supported: supportedLengths }
    );
    this.name = 'InvalidMnemonicLengthError';
  }
}

/**
 * Error for invalid mnemonic phrases
 */
export class InvalidMnemonicError extends WalletCreationError {
  constructor(mnemonic, reason = 'Invalid BIP39 format') {
    super(
      `${ERROR_MESSAGES.INVALID_MNEMONIC}: ${reason}`,
      'INVALID_MNEMONIC',
      { mnemonic: mnemonic ? `${mnemonic.substring(0, 20)}...` : 'undefined', reason }
    );
    this.name = 'InvalidMnemonicError';
  }
}

/**
 * Error for invalid derivation paths
 */
export class InvalidDerivationPathError extends WalletCreationError {
  constructor(path, reason = 'Invalid format') {
    super(
      `${ERROR_MESSAGES.INVALID_DERIVATION_PATH}: ${reason}`,
      'INVALID_DERIVATION_PATH',
      { path, reason }
    );
    this.name = 'InvalidDerivationPathError';
  }
}

/**
 * Error for invalid HD wallet parameters
 */
export class InvalidHDParameterError extends WalletCreationError {
  constructor(parameter, value, reason) {
    super(
      `Invalid HD parameter '${parameter}': ${reason}`,
      'INVALID_HD_PARAMETER',
      { parameter, value, reason }
    );
    this.name = 'InvalidHDParameterError';
  }
}

/**
 * Error for missing required parameters
 */
export class MissingParameterError extends WalletCreationError {
  constructor(parameter, context = '') {
    const message = context 
      ? `${ERROR_MESSAGES[`${parameter.toUpperCase()}_REQUIRED`]} in ${context}`
      : ERROR_MESSAGES[`${parameter.toUpperCase()}_REQUIRED`];
    
    super(message, 'MISSING_PARAMETER', { parameter, context });
    this.name = 'MissingParameterError';
  }
}

/**
 * Error for cryptographic operations
 */
export class CryptographicError extends WalletCreationError {
  constructor(operation, reason) {
    super(
      `Cryptographic operation '${operation}' failed: ${reason}`,
      'CRYPTOGRAPHIC_ERROR',
      { operation, reason }
    );
    this.name = 'CryptographicError';
  }
}
