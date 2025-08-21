import { getPublicKey, sign, verify } from '@noble/ed25519';
import { BIP32Factory } from 'bip32';
import { mnemonicToSeedSync } from 'bip39';
import { 
  validateWalletParams, 
  generateZeraAddress, 
  createBaseWallet 
} from './shared.js';
import { 
  ZERA_COIN_TYPE, 
  ZERA_SYMBOL, 
  DERIVATION_PATH 
} from './constants.js';

/**
 * Create ed25519 wallet from mnemonic
 * @param {string} mnemonic - BIP39 mnemonic phrase
 * @param {string} passphrase - Optional passphrase for additional security
 * @returns {Object} Wallet object with keys and addresses
 */
export async function createEd25519Wallet(mnemonic, passphrase = '') {
  try {
    // Validate parameters
    validateWalletParams(mnemonic, 'ed25519');
    
    // Generate seed from mnemonic
    const seed = mnemonicToSeedSync(mnemonic, passphrase);
    
    // For now, we'll create a simplified wallet without BIP32 derivation
    // This is a placeholder implementation
    const privateKey = Buffer.from(seed.slice(0, 32));
    const publicKey = getPublicKey(privateKey);
    
    // Generate ZERA address from public key
    const address = generateZeraAddress(publicKey, 'ed25519');
    
    // Create and return wallet object
    return createBaseWallet(
      'ed25519',
      mnemonic,
      privateKey.toString('hex'),
      publicKey.toString('hex'),
      address,
      ZERA_COIN_TYPE,
      ZERA_SYMBOL,
      DERIVATION_PATH
    );
  } catch (error) {
    throw new Error(`Failed to create ed25519 wallet: ${error.message}`);
  }
}

/**
 * Get ed25519 wallet information
 * @returns {Object} Wallet information
 */
export function getEd25519WalletInfo() {
  return {
    type: 'ed25519',
    keySize: '32 bytes',
    securityLevel: '128-bit equivalent',
    performance: 'Fast',
    compatibility: 'Widely supported'
  };
}
