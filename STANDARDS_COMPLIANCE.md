# ZERA JS SDK Standards Compliance

## Overview

The ZERA JS SDK implements a hybrid approach that combines multiple cryptographic standards to provide secure, compatible, and production-ready wallet functionality.

## Standards Implementation

### 🔐 SLIP-0010 (Primary Standard)

**What we implement**: Full SLIP-0010 compliance with hardened derivation paths

**Why SLIP-0010**: Ed25519 and Ed448 curves require hardened derivation for security reasons. SLIP-0010 mandates that all path components be hardened (end with `'`).

**Our paths**: `m/44'/1110'/0'/0'/0'` (all components hardened)

**Benefits**:
- ✅ Secure for Ed25519/Ed448 curves
- ✅ Prevents public key derivation attacks
- ✅ Industry standard for these curves
- ✅ Compatible with major wallets

### 📚 BIP44 (Structure Reference)

**What we reference**: BIP44 path structure and purpose

**What we DON'T implement**: BIP44's mixed hardened/normal derivation

**BIP44 paths**: `m/44/1110/0/0/0` (mixed hardened/normal)

**Why the distinction matters**:
- BIP44 allows both hardened (`'`) and normal derivation
- SLIP-0010 requires ALL components to be hardened
- Ed25519/Ed448 security requires hardened paths
- Our implementation follows SLIP-0010, not BIP44

### 🔑 BIP32 (HD Wallet Foundation)

**What we implement**: Full BIP32 HD wallet functionality

**Features**:
- ✅ Hierarchical key derivation
- ✅ Extended public/private keys (xpub/xpriv)
- ✅ Deterministic key generation
- ✅ Secure key management

### 📝 BIP39 (Mnemonic Generation)

**What we implement**: Full BIP39 mnemonic support

**Features**:
- ✅ 12, 15, 18, 21, 24 word phrases
- ✅ Entropy validation
- ✅ Seed generation
- ✅ Passphrase support

### 🪙 SLIP44 (Coin Type)

**What we implement**: ZERA coin type 1110

**Standard**: `m/44'/1110'/...` where 1110 is the ZERA coin type

## Path Structure Breakdown

```
m/44'/1110'/0'/0'/0'
│ │   │     │ │ │ │
│ │   │     │ │ │ └── Address Index (hardened)
│ │   │     │ │ └──── Change Index (hardened)
│ │   │     │ └────── Account Index (hardened)
│ │   │     └──────── Coin Type 1110 (ZERA, hardened)
│ │   └────────────── Purpose 44 (SLIP-0010 hardened)
│ └────────────────── Master Node
```

## Security Considerations

### Why Hardened Derivation?

1. **Ed25519/Ed448 Requirement**: These curves require hardened derivation for security
2. **Public Key Attack Prevention**: Hardened paths prevent public key derivation attacks
3. **Industry Standard**: SLIP-0010 is the accepted standard for these curves
4. **Wallet Compatibility**: Major wallets expect hardened paths for these curves

### What This Means for Users

- ✅ **Secure**: All keys are properly hardened
- ✅ **Compatible**: Works with standard wallets
- ✅ **Standard**: Follows industry best practices
- ✅ **Future-proof**: Aligns with cryptographic standards

## Migration Notes

### From BIP44-Only Implementations

If you're migrating from a BIP44-only implementation:

1. **Path Format**: All paths now end with `'` (hardened)
2. **Security**: Improved security for Ed25519/Ed448
3. **Compatibility**: Better wallet compatibility
4. **Standards**: Aligns with SLIP-0010 requirements

### Backward Compatibility

- ✅ Existing mnemonic phrases work unchanged
- ✅ Same seed generation process
- ✅ Compatible with BIP39 standards
- ✅ Extended keys follow BIP32 format

## Testing Compliance

Our test suite verifies:

- ✅ SLIP-0010 hardened path validation
- ✅ All path components properly hardened
- ✅ Ed25519/Ed448 key derivation
- ✅ Extended key generation
- ✅ Cross-wallet compatibility

## References

- [SLIP-0010](https://github.com/satoshilabs/slips/blob/master/slip-0010.md) - Ed25519/Ed448 HD wallet standard
- [BIP32](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki) - HD wallet foundation
- [BIP39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki) - Mnemonic generation
- [BIP44](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki) - Multi-account structure
- [SLIP44](https://github.com/satoshilabs/slips/blob/master/slip-0044.md) - Coin type registry

## Summary

The ZERA JS SDK implements **SLIP-0010 hardened derivation paths** (not BIP44) because:

1. **Security**: Ed25519/Ed448 require hardened paths
2. **Standards**: SLIP-0010 is the correct standard for these curves
3. **Compatibility**: Works with major wallets and tools
4. **Future-proof**: Aligns with cryptographic best practices

While we reference BIP44 structure and purpose, our actual implementation follows SLIP-0010 for security and compatibility reasons.
