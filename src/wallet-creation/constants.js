// ZERA Network constants
export const ZERA_COIN_TYPE = 1110; // SLIP44 coin type for ZRA
export const ZERA_COIN_TYPE_HEX = '0x80000456';
export const ZERA_SYMBOL = 'ZRA';
export const ZERA_NAME = 'ZERA';

// BIP44 derivation path: m/44'/1110'/0'/0/0
export const DERIVATION_PATH = `m/44'/${ZERA_COIN_TYPE}'/0'/0/0`;

// Supported key types
export const SUPPORTED_KEY_TYPES = ['ed25519', 'ed448'];

// Address version bytes (placeholder - adjust for actual ZERA implementation)
export const ADDRESS_VERSIONS = {
  ed25519: 0x1a,
  ed448: 0x1b
};

// Minimum address length for validation
export const MIN_ADDRESS_LENGTH = 25;
