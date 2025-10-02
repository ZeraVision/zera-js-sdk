import { generateZeraAddress } from '../shared/crypto/address-utils.js';
import type { 
  WalletOptions, 
  Wallet, 
  HDOptions, 
  MultipleWalletOptions, 
  KeyType, 
  HashType
} from '../types/index.js';

import {
  ZERA_TYPE, ZERA_SYMBOL, ZERA_NAME,
  VALID_KEY_TYPES, VALID_HASH_TYPES, MNEMONIC_LENGTHS,
  isValidKeyType, KEY_TYPE
} from './constants.js';
import { Ed25519KeyPair, Ed448KeyPair, CryptoUtils, SLIP0010HDWallet } from './crypto-core.js';
import {
  MissingParameterError, InvalidKeyTypeError, InvalidHashTypeError
} from './errors.js';
import { validateHashTypes } from './hash-utils.js';
import {
  generateSeed, buildDerivationPath, 
  createHDWallet
} from './hd-utils.js';
import { 
  generateZeraPublicKeyIdentifier, createBaseWallet
} from './shared.js';



/**
 * Unified wallet creation factory for the ZERA Network.
 * 
 * This factory provides comprehensive wallet creation functionality with support for:
 * - Multiple key types (Ed25519, Ed448)
 * - Multiple hash algorithms (SHA3-256, SHA3-512, BLAKE3)
 * - HD wallet derivation with SLIP-0010 compliance
 * - BIP39 mnemonic phrase generation
 * - Secure memory management
 * 
 * @class WalletFactory
 * @version 1.0.0
 * @author ZERA Vision
 * @since 1.0.0
 * 
 * @example
 * ```typescript
 * const factory = new WalletFactory();
 * const wallet = await factory.createWallet({
 *   keyType: 'ed25519',
 *   hashTypes: ['sha3_256'],
 *   mnemonic: 'your mnemonic phrase here'
 * });
 * ```
 */
export class WalletFactory {
  private readonly coinType: number;
  private readonly symbol: string;
  private readonly name: string;

  constructor() {
    this.coinType = ZERA_TYPE;
    this.symbol = ZERA_SYMBOL;
    this.name = ZERA_NAME;
  }

  /**
   * Creates a new wallet with the specified parameters.
   * 
   * This method generates a complete wallet including:
   * - HD wallet derivation using SLIP-0010
   * - Key pair generation using @noble libraries
   * - Address generation with specified hash types
   * - Extended key information for HD wallet functionality
   * - Secure memory management
   * 
   * @param options - Wallet creation options including key type, hash types, and mnemonic
   * @returns Promise that resolves to a complete Wallet object
   * 
   * @example
   * ```typescript
   * const wallet = await factory.createWallet({
   *   keyType: 'ed25519',
   *   hashTypes: ['sha3_256', 'blake3'],
   *   mnemonic: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
   *   passphrase: 'optional-passphrase',
   *   hdOptions: {
   *     accountIndex: 0,
   *     changeIndex: 0,
   *     addressIndex: 0
   *   }
   * });
   * ```
   * 
   * @throws {MissingParameterError} When required parameters are missing
   * @throws {InvalidKeyTypeError} When key type is not supported
   * @throws {InvalidHashTypeError} When hash types are not supported
   * @throws {InvalidMnemonicError} When mnemonic phrase is invalid
   * @throws {CryptographicError} When cryptographic operations fail
   * 
   * @since 1.0.0
   */
  async createWallet(options: WalletOptions): Promise<Wallet> {
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
    
    try {
      // Generate address and public key formats
      const address = generateZeraAddress(keyPair.publicKey, keyType, hashTypes);
      const publicKey = generateZeraPublicKeyIdentifier(keyPair.publicKey, keyType, hashTypes);
      
      // Create wallet object
      const wallet = createBaseWallet(
        'hd' as const,
        finalMnemonic,
        keyPair.getPrivateKeyBase58(),
        address,
        publicKey,
        this.coinType,
        this.symbol,
        derivationPath,
        keyType,
        hashTypes
      );

      return {
        ...wallet,
        type: 'hd' as const,
        // Add extended key information for SLIP-0010 compliance
        extendedPrivateKey: hdNode.getExtendedPrivateKey(),
        extendedPublicKey: hdNode.getExtendedPublicKey(),
        fingerprint: hdNode.getFingerprint(keyType),
        depth: hdNode.depth,
        index: hdNode.index,
        // Only expose base58-encoded private key for security
        privateKey: keyPair.getPrivateKeyBase58(), // Raw 32-byte private key encoded as base58
        // Add missing properties
        publicKeyPackage: keyPair.getPublicKeyBase58(),
        name: this.name,
        // Add memory safety method
        secureClear: () => {
          keyPair.secureClear();
          hdNode.secureClear();
        }
      };
    } catch (error) {
      // Ensure cleanup on error
      keyPair.secureClear();
      hdNode.secureClear();
      throw error;
    }
  }

  /**
   * Derive multiple addresses from the same mnemonic
   */
  async deriveMultipleWallets(options: MultipleWalletOptions): Promise<Wallet[]> {
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

    const wallets: Wallet[] = [];
    const seed = generateSeed(mnemonic, passphrase);

    try {
      for (let i = 0; i < count; i++) {
        const currentHdOptions: HDOptions = {
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
    } catch (error) {
      // Clean up any partially created wallets
      wallets.forEach(wallet => {
        if (wallet.secureClear) {
          wallet.secureClear();
        }
      });
      throw error;
    } finally {
      // Clear seed from memory
      CryptoUtils.secureClear(seed);
    }
  }

  /**
   * Generate key pair based on key type using @noble libraries
   */
  private async generateKeyPair(hdNode: SLIP0010HDWallet, keyType: KeyType): Promise<Ed25519KeyPair | Ed448KeyPair> {
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
   */
  getInfo(): {
    name: string;
    symbol: string;
    coinType: number;
    supportedKeyTypes: readonly KeyType[];
    supportedHashTypes: readonly HashType[];
    supportedMnemonicLengths: readonly number[];
    standard: string;
    description: string;
    cryptographicLibraries: string[];
    securityFeatures: string[];
    } {
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
        'Extended key support (xpub/xpriv)',
        'Secure memory clearing for sensitive data',
        'Automatic cleanup on error conditions'
      ]
    };
  }
}

/**
 * Create a new wallet with the factory
 */
export async function createWallet(options: WalletOptions): Promise<Wallet> {
  const factory = new WalletFactory();
  return factory.createWallet(options);
}

/**
 * Derive multiple wallets with the factory
 */
export async function deriveMultipleWallets(options: MultipleWalletOptions): Promise<Wallet[]> {
  const factory = new WalletFactory();
  return factory.deriveMultipleWallets(options);
}
