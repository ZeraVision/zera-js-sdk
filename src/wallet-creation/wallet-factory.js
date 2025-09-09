import {
  ZERA_TYPE, ZERA_SYMBOL, ZERA_NAME,
  KEY_TYPE, HASH_TYPE, VALID_KEY_TYPES, VALID_HASH_TYPES, MNEMONIC_LENGTHS,
  isValidKeyType, isValidMnemonicLength
} from './constants.js';
import {
  generateMnemonicPhrase, generateSeed, buildDerivationPath, 
  createHDWallet, deriveMultipleAddresses
} from './hd-utils.js';
import {
  generateZeraAddress, generateZeraPublicKeyPackage, generateZeraPublicKeyIdentifier, createBaseWallet
} from './shared.js';
import {
  MissingParameterError, InvalidKeyTypeError, InvalidHashTypeError, InvalidMnemonicLengthError
} from './errors.js';
import { validateHashTypes } from './hash-utils.js';
import { Ed25519KeyPair, Ed448KeyPair } from './crypto-core.js';
import bs58 from 'bs58';

/**
 * Unified wallet creation factory
 * Supports all key types and hash type combinations with HD wallet functionality
 * Full SLIP-0010 compliance using @noble libraries
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
    
    // Build derivation path (SLIP-0010 for Ed25519/Ed448)
    const derivationPath = buildDerivationPath(hdOptions);
    
    // Create HD wallet using SLIP-0010 with the specified key type
    const hdNode = createHDWallet(seed, derivationPath, keyType);
    
    // Generate key pair based on key type using @noble libraries
    const keyPair = await this.generateKeyPair(hdNode, keyType);
    
    // Generate address and public key formats
    const address = generateZeraAddress(keyPair.publicKey, keyType, hashTypes);
    const publicKeyPackage = generateZeraPublicKeyPackage(keyPair.publicKey, keyType, hashTypes);
    const publicKey = generateZeraPublicKeyIdentifier(keyPair.publicKey, keyType, hashTypes);
    
    // Create wallet object
    const wallet = createBaseWallet(
      'hd',
      finalMnemonic,
      keyPair.getPrivateKeyBase58(),
      address,
      publicKeyPackage,
      publicKey,
      this.coinType,
      this.symbol,
      derivationPath,
      keyType,
      hashTypes
    );

    return {
      ...wallet,
      // Add extended key information for SLIP-0010 compliance
      extendedPrivateKey: hdNode.getExtendedPrivateKey(),
      extendedPublicKey: hdNode.getExtendedPublicKey(),
      fingerprint: hdNode.getFingerprint(keyType),
      depth: hdNode.depth,
      index: hdNode.index,
      // Only expose base58-encoded private key for security
      privateKey: keyPair.getPrivateKeyBase58(), // Raw 32-byte private key encoded as base58
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
   * Generate key pair based on key type using @noble libraries
   * @param {Object} hdNode - HD wallet node
   * @param {string} keyType - Key type from KEY_TYPE enum
   * @returns {Object} Key pair with private and public keys
   */
  async generateKeyPair(hdNode, keyType) {
    if (keyType === KEY_TYPE.ED25519) {
      return Ed25519KeyPair.fromHDNode(hdNode);
    } else if (keyType === KEY_TYPE.ED448) {
      return Ed448KeyPair.fromHDNode(hdNode);
    } else {
      throw new InvalidKeyTypeError(keyType, VALID_KEY_TYPES);
    }
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
      standard: 'BIP32 + BIP39 + SLIP-0010',
      description: 'Unified wallet factory supporting multiple key types and hash algorithms with full SLIP-0010 compliance',
      cryptographicLibraries: [
        '@noble/curves - Full Ed25519 and Ed448 implementation',
        '@noble/hashes - SHA256, SHA512, RIPEMD160',
        '@noble/hashes/hmac - HMAC-SHA512 for SLIP-0010',
        'bip39 - BIP39 mnemonic generation',
        'bs58 - Base58 encoding'
      ],
      securityFeatures: [
        'Cryptographically secure random generation',
        'Proper SLIP-0010 chain code handling',
        'Fully hardened derivation support',
        'Overflow protection',
        'Fingerprint validation',
        'Extended key support (xpub/xpriv)'
      ]
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
