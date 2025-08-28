// ZERA Network constants
export const ZERA_TYPE = 1110; // SLIP44 coin type for ZRA
export const ZERA_TYPE_HEX = '0x80000456';
export const ZERA_SYMBOL = 'ZRA';
export const ZERA_NAME = 'ZERA';

// SLIP-0010 derivation path for Ed25519/Ed448 (fully hardened)
export const DERIVATION_PATH = `m/44'/${ZERA_TYPE}'/0'/0'/0'`;

// Legacy name for backward compatibility
export const SLIP0010_DERIVATION_PATH = DERIVATION_PATH;

// Only valid derivation scheme for Ed25519/Ed448
export const DERIVATION_SCHEME = 'slip0010'; // SLIP-0010 (fully hardened for Ed25519/Ed448)

// Key type enums - these are the only valid key types
export const KEY_TYPE = {
  ED25519: 'ed25519',
  ED448: 'ed448'
};

// Hash type enums - these are the only valid hash types
export const HASH_TYPE = {
  SHA3_256: 'sha3-256',
  SHA3_512: 'sha3-512',
  BLAKE3: 'blake3'
};

// Key type prefixes for display
export const KEY_TYPE_PREFIXES = {
  [KEY_TYPE.ED25519]: 'A_',
  [KEY_TYPE.ED448]: 'B_'
};

// Hash type prefixes for display
export const HASH_TYPE_PREFIXES = {
  [HASH_TYPE.SHA3_256]: 'a_',
  [HASH_TYPE.SHA3_512]: 'b_',
  [HASH_TYPE.BLAKE3]: 'c_'
};

// Type arrays for validation
export const VALID_KEY_TYPES = Object.values(KEY_TYPE);
export const VALID_HASH_TYPES = Object.values(HASH_TYPE);

// Legacy support - keep existing constants
export const SUPPORTED_KEY_TYPES = VALID_KEY_TYPES;
export const KEY_TYPES = KEY_TYPE_PREFIXES; // For backward compatibility

// Address version bytes (placeholder - adjust for actual ZERA implementation)
export const ADDRESS_VERSIONS = {
  [KEY_TYPE.ED25519]: 0x1a,
  [KEY_TYPE.ED448]: 0x1b
};

// ZERA extended key version bytes (custom to prevent cross-chain confusion)
export const EXTENDED_KEY_VERSIONS = {
  PRIVATE: 0x04b2430c, // ZERA private key version
  PUBLIC: 0x04b2430d   // ZERA public key version
};

// Minimum address length for validation
export const MIN_ADDRESS_LENGTH = 25;

// BIP39 supported mnemonic lengths
export const MNEMONIC_LENGTHS = [12, 15, 18, 21, 24];

// Default HD wallet settings
export const DEFAULT_HD_SETTINGS = {
  accountIndex: 0,
  changeIndex: 0,
  addressIndex: 0
};

// Error messages
export const ERROR_MESSAGES = {
  INVALID_KEY_TYPE: `Invalid key type. Must be one of: ${VALID_KEY_TYPES.join(', ')}`,
  INVALID_HASH_TYPE: `Invalid hash type. Must be one of: ${VALID_HASH_TYPES.join(', ')}`,
  INVALID_MNEMONIC_LENGTH: `Invalid mnemonic length. Must be one of: ${MNEMONIC_LENGTHS.join(', ')}`,
  INVALID_MNEMONIC: 'Invalid BIP39 mnemonic phrase',
  INVALID_DERIVATION_PATH: 'Invalid derivation path format',
  INVALID_ACCOUNT_INDEX: 'Account index must be a non-negative integer',
  INVALID_CHANGE_INDEX: 'Change index must be 0 or 1',
  INVALID_ADDRESS_INDEX: 'Address index must be a non-negative integer',
  MNEMONIC_REQUIRED: 'Mnemonic phrase is required',
  KEY_TYPE_REQUIRED: 'Key type is required',
  HASH_TYPES_REQUIRED: 'Hash types array is required'
};

// Type guards and validation functions
export function isValidKeyType(keyType) {
  return VALID_KEY_TYPES.includes(keyType);
}

export function isValidHashType(hashType) {
  return VALID_HASH_TYPES.includes(hashType);
}

export function isValidMnemonicLength(length) {
  return MNEMONIC_LENGTHS.includes(length);
}



export function validateSLIP0010Path(path) {
  if (!path || typeof path !== 'string') return false;
  if (!path.startsWith('m/')) return false;
  
  const parts = path.split('/');
  if (parts.length !== 6) return false;
  
  try {
    // All components must be hardened
    for (let i = 1; i < parts.length; i++) {
      if (!parts[i].endsWith("'")) return false;
    }
    
    // Purpose must be 44
    if (parseInt(parts[1].slice(0, -1)) !== 44) return false;
    
    return true;
  } catch (error) {
    return false;
  }
}

// Get key type prefix
export function getKeyTypePrefix(keyType) {
  return KEY_TYPE_PREFIXES[keyType];
}

// Get hash type prefix
export function getHashTypePrefix(hashType) {
  return HASH_TYPE_PREFIXES[hashType];
}
