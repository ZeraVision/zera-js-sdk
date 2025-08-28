import { generateMnemonic, validateMnemonic, mnemonicToSeedSync } from 'bip39';
import { 
  ZERA_TYPE, 
  MNEMONIC_LENGTHS, 
  DEFAULT_HD_SETTINGS,
  validateSLIP0010Path
} from './constants.js';
import {
  InvalidMnemonicLengthError,
  InvalidMnemonicError,
  InvalidHDParameterError,
  InvalidDerivationPathError
} from './errors.js';
import { SLIP0010HDWallet } from './crypto-core.js';

/**
 * Generate a new BIP39 mnemonic phrase
 * @param {number} length - Length of mnemonic (12, 15, 18, 21, or 24)
 * @returns {string} Generated mnemonic phrase
 */
export function generateMnemonicPhrase(length = 24) {
  if (!MNEMONIC_LENGTHS.includes(length)) {
    throw new InvalidMnemonicLengthError(length);
  }
  
  // BIP39 entropy mapping: 12 words = 128 bits, 15 words = 160 bits, 18 words = 192 bits, 21 words = 224 bits, 24 words = 256 bits
  const entropyMap = {
    12: 128,
    15: 160,
    18: 192,
    21: 224,
    24: 256
  };
  
  const entropyBits = entropyMap[length];
  return generateMnemonic(entropyBits);
}

/**
 * Validate mnemonic phrase
 * @param {string} mnemonic - Mnemonic phrase to validate
 * @returns {boolean} True if valid
 */
export function validateMnemonicPhrase(mnemonic) {
  if (!mnemonic || typeof mnemonic !== 'string') {
    return false;
  }
  
  const words = mnemonic.trim().split(/\s+/);
  if (!MNEMONIC_LENGTHS.includes(words.length)) {
    return false;
  }
  
  return validateMnemonic(mnemonic);
}

/**
 * Generate seed from mnemonic
 * @param {string} mnemonic - BIP39 mnemonic phrase
 * @param {string} passphrase - Optional passphrase
 * @returns {Buffer} Seed bytes
 */
export function generateSeed(mnemonic, passphrase = '') {
  if (!validateMnemonicPhrase(mnemonic)) {
    throw new InvalidMnemonicError(mnemonic);
  }
  
  return mnemonicToSeedSync(mnemonic, passphrase);
}



/**
 * Build derivation path for ZERA (SLIP-0010 - fully hardened)
 * @param {Object} options - Derivation options
 * @param {number} options.accountIndex - Account index (default: 0)
 * @param {number} options.changeIndex - Change index (0 for external, 1 for internal) (default: 0)
 * @param {number} options.addressIndex - Address index (default: 0)
 * @returns {string} Derivation path
 */
export function buildDerivationPath(options = {}) {
  const {
    accountIndex = DEFAULT_HD_SETTINGS.accountIndex,
    changeIndex = DEFAULT_HD_SETTINGS.changeIndex,
    addressIndex = DEFAULT_HD_SETTINGS.addressIndex
  } = options;
  
  // Validate parameters
  if (!Number.isInteger(accountIndex) || accountIndex < 0) {
    throw new InvalidHDParameterError('accountIndex', accountIndex, 'must be a non-negative integer');
  }
  
  if (![0, 1].includes(changeIndex)) {
    throw new InvalidHDParameterError('changeIndex', changeIndex, 'must be 0 or 1');
  }
  
  if (!Number.isInteger(addressIndex) || addressIndex < 0) {
    throw new InvalidHDParameterError('addressIndex', addressIndex, 'must be a non-negative integer');
  }
  
  // SLIP-0010: all components are hardened for Ed25519/Ed448
  return `m/44'/${ZERA_TYPE}'/${accountIndex}'/${changeIndex}'/${addressIndex}'`;
}

/**
 * Parse derivation path and extract components
 * @param {string} path - Derivation path to parse
 * @returns {Object} Parsed path components
 */
export function parseDerivationPath(path) {
  if (!path || typeof path !== 'string') {
    throw new InvalidDerivationPathError(path, 'path must be a non-empty string');
  }
  
  const parts = path.split('/');
  if (parts.length !== 6 || parts[0] !== 'm') {
    throw new InvalidDerivationPathError(path, 'invalid SLIP-0010 path format');
  }
  
  try {
    // Enforce hardened paths - all components must end with '
    for (let i = 1; i < parts.length; i++) {
      if (!parts[i].endsWith("'")) {
        throw new InvalidDerivationPathError(path, `component ${i} must be hardened (end with ')`);
      }
    }
    
    const purpose = parseInt(parts[1].slice(0, -1));
    const coinType = parseInt(parts[2].slice(0, -1));
    const accountIndex = parseInt(parts[3].slice(0, -1));
    const changeIndex = parseInt(parts[4].slice(0, -1));
    const addressIndex = parseInt(parts[5].slice(0, -1));
    
    if (purpose !== 44) {
      throw new InvalidDerivationPathError(path, 'purpose must be 44 for SLIP-0010');
    }
    
    if (coinType !== ZERA_TYPE) {
      throw new InvalidDerivationPathError(path, `coin type must be ${ZERA_TYPE} for ZERA`);
    }
    
    return {
      purpose,
      coinType,
      accountIndex,
      changeIndex,
      addressIndex
    };
  } catch (error) {
    throw new InvalidDerivationPathError(path, 'failed to parse path components');
  }
}

/**
 * Create HD wallet using SLIP-0010 (correct for Ed25519/Ed448)
 * @param {Buffer|Uint8Array} seed - Seed bytes
 * @param {string} path - Derivation path
 * @param {string} curve - Curve type ('ed25519' or 'ed448')
 * @returns {SLIP0010HDWallet} HD wallet node
 */
export function createHDWallet(seed, path, curve = 'ed25519') {
  try {
    // Convert Buffer to Uint8Array if needed
    const seedArray = seed instanceof Buffer ? new Uint8Array(seed) : seed;
    
    // Validate SLIP-0010 path (all hardened)
    const isValidPath = validateSLIP0010Path(path);
    if (!isValidPath) {
      throw new InvalidDerivationPathError(path, 'invalid path - all components must be hardened for Ed25519/Ed448');
    }
    
    // Create master node using SLIP-0010 with specified curve
    const masterNode = SLIP0010HDWallet.fromSeed(seedArray, curve);
    
    // Derive to the specified path
    if (path && path !== 'm') {
      return masterNode.derivePath(path);
    }
    
    return masterNode;
  } catch (error) {
    throw new InvalidDerivationPathError(path, `derivation failed: ${error.message}`);
  }
}

/**
 * Derive multiple addresses from the same mnemonic
 * @param {string} mnemonic - BIP39 mnemonic phrase
 * @param {string} passphrase - Optional passphrase
 * @param {Object} options - Derivation options
 * @param {number} options.accountIndex - Account index (default: 0)
 * @param {number} options.changeIndex - Change index (default: 0)
 * @param {number} options.startIndex - Starting address index (default: 0)
 * @param {number} options.count - Number of addresses to derive (default: 1)
 * @returns {Array} Array of derivation paths
 */
export function deriveMultipleAddresses(mnemonic, passphrase = '', options = {}) {
  const {
    accountIndex = DEFAULT_HD_SETTINGS.accountIndex,
    changeIndex = DEFAULT_HD_SETTINGS.changeIndex,
    startIndex = DEFAULT_HD_SETTINGS.addressIndex,
    count = 1
  } = options;
  
  if (!Number.isInteger(count) || count < 1) {
    throw new InvalidHDParameterError('count', count, 'must be a positive integer');
  }
  
  const paths = [];
  for (let i = 0; i < count; i++) {
    const addressIndex = startIndex + i;
    const path = buildDerivationPath({ accountIndex, changeIndex, addressIndex });
    paths.push(path);
  }
  
  return paths;
}

/**
 * Get HD wallet information
 * @returns {Object} HD wallet information
 */
export function getHDWalletInfo() {
  return {
    standard: 'BIP32 + BIP39 + SLIP-0010',
    purpose: 44,
    coinType: ZERA_TYPE,
    coinName: 'ZERA',
    derivationPath: `m/44'/${ZERA_TYPE}'/0'/0'/0'`,
    supportedFeatures: [
      'Hierarchical Deterministic Wallets',
      'BIP39 Mnemonics',
      'SLIP-0010 Key Derivation',
      'SLIP-0010 Multi-Account Structure',
      'Fully Hardened Derivation',
      'Extended Keys (xpub/xpriv)',
      'Ed25519 Support',
      'Ed448 Support'
    ],
    securityFeatures: [
      'Cryptographically Secure Random Generation',
      'HMAC-SHA512 for Key Derivation',
      'Proper SLIP-0010 Chain Code Handling',
      'Overflow Protection',
      'Fingerprint Validation'
    ]
  };
}

/**
 * Validate HD wallet parameters
 * @param {Object} options - HD wallet options
 * @returns {boolean} True if valid
 */
export function validateHDWalletOptions(options) {
  const { accountIndex, changeIndex, addressIndex } = options;
  
  if (accountIndex !== undefined && (!Number.isInteger(accountIndex) || accountIndex < 0)) {
    return false;
  }
  
  if (changeIndex !== undefined && ![0, 1].includes(changeIndex)) {
    return false;
  }
  
  if (addressIndex !== undefined && (!Number.isInteger(addressIndex) || addressIndex < 0)) {
    return false;
  }
  
  return true;
}

/**
 * Get extended key information
 * @param {SLIP0010HDWallet} hdNode - HD wallet node
 * @returns {Object} Extended key information
 */
export function getExtendedKeyInfo(hdNode) {
  if (!(hdNode instanceof SLIP0010HDWallet)) {
    throw new Error('Invalid HD wallet node');
  }
  
  return {
    depth: hdNode.depth,
    index: hdNode.index,
    parentFingerprint: hdNode.parentFingerprint,
    fingerprint: hdNode.getFingerprint(hdNode.curve),
    extendedPrivateKey: hdNode.getExtendedPrivateKey(),
    extendedPublicKey: hdNode.getExtendedPublicKey(),
    derivationPath: hdNode.derivationPath, // Use the tracked derivation path
    rawIndex: hdNode.getRawIndex(),
    isHardened: hdNode.isHardened()
  };
}
