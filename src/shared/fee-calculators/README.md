# Auto-Detection Test Suite

## Overview

The Universal Fee Calculator now includes comprehensive auto-detection features that automatically determine transaction types, key types, and fee types from protobuf objects. This eliminates the need for manual parameter specification in most cases.

## Quick Start

### Basic Auto-Detection
```javascript
import { UniversalFeeCalculator } from './universal-fee-calculator.js';

// Minimal parameters - everything is auto-detected
const result = await UniversalFeeCalculator.autoCalculateNetworkFee({
  protoObject: yourProtoObject,
  baseFeeId: '$ZRA+0000' // Optional, defaults to '$ZRA+0000'
});

console.log('Auto-detected transaction type:', result.transactionType);
console.log('Auto-detected fee types:', result.breakdown.feeTypes);
console.log('Calculated fee:', result.fee);
```

### Manual Override with Auto-Detection Fallback
```javascript
// Manual transaction type override
const result = await UniversalFeeCalculator.calculateNetworkFee({
  protoObject: yourProtoObject,
  transactionType: TRANSACTION_TYPE.MINT_TYPE, // Manual override
  baseFeeId: '$USDC+0000', // Custom base fee ID
  // feeTypes not provided - will be auto-detected
});
```

## Key Features

### 1. Transaction Type Auto-Detection
Automatically detects transaction type by examining protoObject structure:
- `coinTxn` → `TRANSACTION_TYPE.COIN_TYPE`
- `mintTxn` → `TRANSACTION_TYPE.MINT_TYPE`
- `nftTxn` → `TRANSACTION_TYPE.NFT_TYPE`
- And 21 more transaction types...

### 2. Key Type Auto-Detection
Automatically detects key types from public key bytes:
- 32 bytes → `KEY_TYPE.ED25519` → `A_KEY_FEE`
- 57 bytes → `KEY_TYPE.ED448` → `B_KEY_FEE`

### 3. Fee Type Auto-Detection
Automatically determines appropriate fee types:
- Key fees based on detected key types
- Hash fees (always includes `a_HASH_FEE`)
- Transaction type fees based on detected transaction type

### 4. Flexible Base Fee ID
All methods now accept `baseFeeId` parameter:
- Default: `'$ZRA+0000'`
- Custom: `'$USDC+0000'`, `'$ETH+0000'`, etc.

## Testing

### Run Auto-Detection Tests
```bash
# Run all auto-detection tests
node src/shared/fee-calculators/test/run-tests.js

# Or run specific test functions
node src/shared/fee-calculators/test/test-auto-detection.js
```

### Test Coverage
- ✅ Transaction Type Auto-Detection (24 transaction types)
- ✅ Key Type Auto-Detection (ED25519, ED448)
- ✅ Base Fee ID Parameter (multiple currencies)
- ✅ Fee Type Auto-Detection (all fee combinations)
- ✅ Error Handling (invalid inputs)
- ✅ Backward Compatibility (existing API)
- ✅ Performance Testing (batch processing)

## API Changes

### New Methods
- `autoCalculateNetworkFee(params)` - Fully automatic fee calculation

### Enhanced Methods
- `calculateNetworkFee(params)` - `transactionType` and `feeTypes` now optional
- `calculateTotalFees(params)` - `transactionType` now optional
- `calculateCoinTXNFee(params)` - `transactionType` now optional

### New Parameters
- `baseFeeId` - Available in all fee calculation methods

## Backward Compatibility

All existing code continues to work without changes. New parameters are optional:

```javascript
// Existing code (still works)
const result = await UniversalFeeCalculator.calculateNetworkFee({
  protoObject: yourProtoObject,
  transactionType: TRANSACTION_TYPE.COIN_TYPE
});

// Enhanced existing code (add baseFeeId)
const result = await UniversalFeeCalculator.calculateNetworkFee({
  protoObject: yourProtoObject,
  transactionType: TRANSACTION_TYPE.COIN_TYPE,
  baseFeeId: '$USDC+0000' // New optional parameter
});
```

## Error Handling

The system provides clear error messages when auto-detection fails:

```javascript
try {
  const result = await UniversalFeeCalculator.autoCalculateNetworkFee({
    protoObject: invalidProtoObject
  });
} catch (error) {
  console.error('Auto-detection failed:', error.message);
  // Example: "Failed to extract transaction type from protoObject: Unable to determine transaction type from protoObject structure"
}
```

## Examples

See `src/shared/fee-calculators/example-auto-detection.js` for comprehensive usage examples.

## Documentation

- **Main Documentation**: `src/shared/fee-calculators/README-enhanced-fee-calculation.md`
- **Test Documentation**: `src/shared/fee-calculators/test/README.md`
- **API Reference**: See method JSDoc comments in `universal-fee-calculator.js`
