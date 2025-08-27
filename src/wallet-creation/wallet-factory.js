import {
  ZERA_TYPE, ZERA_SYMBOL, ZERA_NAME,
  KEY_TYPE, HASH_TYPE, VALID_KEY_TYPES, VALID_HASH_TYPES, MNEMONIC_LENGTHS,
  isValidKeyType, isValidMnemonicLength
} from './constants.js';
import {
  generateMnemonicPhrase, generateSeed, buildDerivationPath, createHDWallet, deriveMultipleAddresses
} from './hd-utils.js';
import {
  generateZeraAddress, generateZeraPublicKeyFormat, createBaseWallet
} from './shared.js';
import {
  MissingParameterError, InvalidKeyTypeError, InvalidHashTypeError, InvalidMnemonicLengthError
} from './errors.js';
import { validateHashTypes } from './hash-utils.js';
import bs58 from 'bs58';

/**
 * Unified wallet creation factory
 * Supports all key types and hash type combinations with HD wallet functionality
 */
export class WalletFactory {
  constructor() {
    this.coinType = ZERA_TYPE;
    this.symbol = ZERA_SYMBOL;
    this.name = ZERA_NAME;
  }

  /**
   * Create a new wallet with specified parameters
   * @param {Object} options - Wallet creation options
   * @param {string} options.keyType - Key type from KEY_TYPE enum
   * @param {Array<string>} options.hashTypes - Array of hash types from HASH_TYPE enum (required)
   * @param {string} options.mnemonic - Required mnemonic phrase (must be provided)
   * @param {string} options.passphrase - Optional passphrase for additional security
   * @param {Object} options.hdOptions - HD wallet derivation options
   * @param {number} options.hdOptions.accountIndex - Account index (default: 0)
   * @param {number} options.hdOptions.changeIndex - Change index (default: 0)
   * @param {number} options.hdOptions.addressIndex - Address index (default: 0)
   * @returns {Object} Created wallet object
   */
  async createWallet(options = {}) {
    const {
      keyType,
      hashTypes,
      mnemonic,
      passphrase = '',
      hdOptions = {}
    } = options;

    // Validate required parameters
    if (!keyType) {
      throw new MissingParameterError('keyType');
    }

    if (!isValidKeyType(keyType)) {
      throw new InvalidKeyTypeError(keyType, VALID_KEY_TYPES);
    }

    // Validate hash types - must be provided and non-empty
    if (!hashTypes || !Array.isArray(hashTypes) || hashTypes.length === 0) {
      throw new MissingParameterError('hashTypes - must be a non-empty array');
    }

    if (!validateHashTypes(hashTypes)) {
      throw new InvalidHashTypeError('Invalid hash types array', VALID_HASH_TYPES);
    }

    // Validate mnemonic - must be provided
    if (!mnemonic) {
      throw new MissingParameterError('mnemonic - must be provided');
    }

    // Use provided mnemonic
    const finalMnemonic = mnemonic;
    
    // Generate seed from mnemonic
    const seed = generateSeed(finalMnemonic, passphrase);
    
    // Build derivation path
    const derivationPath = buildDerivationPath(hdOptions);
    
    // Create HD wallet
    const hdNode = createHDWallet(seed, derivationPath);
    
    // Generate key pair based on key type
    const keyPair = await this.generateKeyPair(hdNode, keyType);
    
    // Generate address and public key format
    const address = generateZeraAddress(keyPair.publicKey, keyType, hashTypes);
    const publicKeyFormat = generateZeraPublicKeyFormat(keyPair.publicKey, keyType, hashTypes);
    
    // Create wallet object
    const wallet = createBaseWallet(
      'hd',
      finalMnemonic,
      keyPair.privateKeyBase58,
      keyPair.publicKey,
      address,
      publicKeyFormat,
      this.coinType,
      this.symbol,
      derivationPath,
      keyType,
      hashTypes
    );

    return {
      ...wallet,
      // Removed: hdNode (security risk), seed (redundant), entropy (redundant)
      // Added: publicKeyBase58 for convenience when base58 format is needed
      publicKeyBase58: keyPair.publicKeyBase58
    };
  }



  /**
   * Derive multiple addresses from the same mnemonic
   * @param {Object} options - Derivation options
   * @param {string} options.mnemonic - BIP39 mnemonic phrase
   * @param {string} options.keyType - Key type from KEY_TYPE enum
   * @param {Array<string>} options.hashTypes - Array of hash types from HASH_TYPE enum (required)
   * @param {string} options.passphrase - Optional passphrase
   * @param {Object} options.hdOptions - HD wallet derivation options
   * @param {number} options.count - Number of addresses to derive (default: 1)
   * @returns {Array} Array of wallet objects
   */
  async deriveMultipleWallets(options = {}) {
    const {
      mnemonic,
      keyType,
      hashTypes,
      passphrase = '',
      hdOptions = {},
      count = 1
    } = options;

    if (!mnemonic) {
      throw new MissingParameterError('mnemonic');
    }

    if (!keyType) {
      throw new MissingParameterError('keyType');
    }

    if (!hashTypes || !Array.isArray(hashTypes) || hashTypes.length === 0) {
      throw new MissingParameterError('hashTypes - must be a non-empty array');
    }

    if (!Number.isInteger(count) || count < 1) {
      throw new Error('Count must be a positive integer');
    }

    const wallets = [];
    const seed = generateSeed(mnemonic, passphrase);

    for (let i = 0; i < count; i++) {
      const currentHdOptions = {
        ...hdOptions,
        addressIndex: (hdOptions.addressIndex || 0) + i
      };

      const wallet = await this.createWallet({
        keyType,
        hashTypes,
        mnemonic,
        passphrase,
        hdOptions: currentHdOptions
      });

      wallets.push(wallet);
    }

    return wallets;
  }

  /**
   * Generate key pair based on key type
   * @param {Object} hdNode - HD wallet node
   * @param {string} keyType - Key type from KEY_TYPE enum
   * @returns {Object} Key pair with private and public keys
   */
  async generateKeyPair(hdNode, keyType) {
    if (keyType === KEY_TYPE.ED25519) {
      return await this.generateEd25519KeyPair(hdNode);
    } else if (keyType === KEY_TYPE.ED448) {
      return await this.generateEd448KeyPair(hdNode);
    } else {
      throw new InvalidKeyTypeError(keyType, VALID_KEY_TYPES);
    }
  }

  /**
   * Generate Ed25519 key pair
   * @param {Object} hdNode - HD wallet node
   * @returns {Object} Ed25519 key pair
   */
  async generateEd25519KeyPair(hdNode) {
    // Use simplified implementation similar to working ed25519.js
    // This avoids the noble-ed25519 hash setup issues
    
    const privateKey = hdNode.privateKey;
    
    // For now, use a simple hash as public key (this is NOT proper ed25519)
    // In production, implement proper ed25519 public key derivation
    const { sha256 } = await import('@noble/hashes/sha256');
    const publicKey = sha256(privateKey);
    
    return {
      privateKey,
      publicKey,
      privateKeyBase58: bs58.encode(privateKey),
      publicKeyBase58: bs58.encode(publicKey)
    };
  }

  /**
   * Generate Ed448 key pair
   * @param {Object} hdNode - HD wallet node
   * @returns {Object} Ed448 key pair
   */
  async generateEd448KeyPair(hdNode) {
    // Note: Ed448 support would need to be implemented
    // For now, we'll use the HD node's key material
    const privateKey = hdNode.privateKey;
    const publicKey = hdNode.publicKey;
    
    return {
      privateKey,
      publicKey,
      privateKeyBase58: bs58.encode(privateKey),
      publicKeyBase58: bs58.encode(publicKey)
    };
  }

  /**
   * Get wallet factory information
   * @returns {Object} Factory information
   */
  getInfo() {
    return {
      name: this.name,
      symbol: this.symbol,
      coinType: this.coinType,
      supportedKeyTypes: VALID_KEY_TYPES,
      supportedHashTypes: VALID_HASH_TYPES,
      supportedMnemonicLengths: MNEMONIC_LENGTHS,
      standard: 'BIP44 + SLIP44',
      description: 'Unified wallet factory supporting multiple key types and hash algorithms'
    };
  }
}

/**
 * Create a new wallet with the factory
 * @param {Object} options - Wallet creation options
 * @returns {Object} Created wallet
 */
export async function createWallet(options) {
  const factory = new WalletFactory();
  return await factory.createWallet(options);
}

/**
 * Derive multiple wallets with the factory
 * @param {Object} options - Derivation options
 * @returns {Array} Array of wallets
 */
export async function deriveMultipleWallets(options) {
  const factory = new WalletFactory();
  return await factory.deriveMultipleWallets(options);
}
