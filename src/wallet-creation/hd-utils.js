import { generateMnemonic, validateMnemonic, mnemonicToSeedSync } from 'bip39';
import { 
  ZERA_TYPE, 
  MNEMONIC_LENGTHS, 
  DEFAULT_HD_SETTINGS
} from './constants.js';
import {
  InvalidMnemonicLengthError,
  InvalidMnemonicError,
  InvalidHDParameterError,
  InvalidDerivationPathError
} from './errors.js';

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
 * Build BIP44 derivation path for ZERA
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
  
  return `m/44'/${ZERA_TYPE}'/${accountIndex}'/${changeIndex}/${addressIndex}`;
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
    throw new InvalidDerivationPathError(path, 'invalid BIP44 path format');
  }
  
  try {
    const purpose = parseInt(parts[1].replace("'", ""));
    const coinType = parseInt(parts[2].replace("'", ""));
    const accountIndex = parseInt(parts[3].replace("'", ""));
    const changeIndex = parseInt(parts[4]);
    const addressIndex = parseInt(parts[5]);
    
    if (purpose !== 44) {
      throw new InvalidDerivationPathError(path, 'purpose must be 44 for BIP44');
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
 * Create a simple HD wallet node (simplified version)
 * @param {Buffer} seed - Seed bytes
 * @param {string} path - Derivation path
 * @returns {Object} HD wallet node
 */
export function createHDWallet(seed, path) {
  try {
    // For now, create a simple node structure
    // In a full implementation, this would use BIP32 derivation
    const privateKey = seed.slice(0, 32);
    const publicKey = Buffer.alloc(33); // Placeholder
    
    return {
      privateKey,
      publicKey,
      derivePath: (path) => {
        // Simple path derivation - in real implementation this would be more complex
        return {
          privateKey: privateKey,
          publicKey: publicKey
        };
      }
    };
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
    standard: 'BIP44',
    purpose: 44,
    coinType: ZERA_TYPE,
    coinTypeHex: `0x${ZERA_TYPE.toString(16).padStart(8, '0')}`,
    supportedMnemonicLengths: MNEMONIC_LENGTHS,
    defaultDerivationPath: buildDerivationPath(),
    description: 'Hierarchical Deterministic wallet following BIP44 standard for ZERA Network (simplified implementation)'
  };
}
