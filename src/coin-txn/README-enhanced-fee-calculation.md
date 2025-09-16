# Enhanced Fee Calculation System

## Problem Solved: The Catch-22 of Transaction Fee Calculation

The original problem was a classic catch-22 situation:

1. **Base fee** needs to be calculated based on transaction size (cost per key type + cost per hash + cost per byte)
2. **Transaction size** includes the fee amount itself
3. **Fee amount** depends on the transaction size

This created an impossible circular dependency where you couldn't calculate the fee without knowing the size, but you couldn't know the size without knowing the fee.

## Solution: Iterative Size-Based Fee Calculation

The solution breaks this cycle using an iterative approach:

### 1. Transaction Size Calculator (`transaction-size-calculator.js`)

This module calculates the byte size of transactions **without including fees**, solving the first part of the catch-22:

- **Component-based sizing**: Calculates size based on actual protobuf components
- **Key type awareness**: Different key types (Ed25519, Ed448) have different sizes
- **Accurate protobuf overhead**: Includes field tags, length prefixes, and repeated field overhead
- **Fee-free calculation**: Calculates size excluding fee fields

### 2. Proper Fee Calculator (`proper-fee-calculator.js`) - CORRECT IMPLEMENTATION

This module implements the **proper fee calculation** using actual protobuf object size:

- **USD-based fee constants**: Matches networkfees package exactly
- **Actual protobuf object size**: Uses `protoObject.toBinary().length` for accurate size
- **Known signature sizes**: Adds signature sizes based on key types (Ed25519: 64 bytes, Ed448: 114 bytes)
- **Known hash size**: Adds transaction hash size (32 bytes for SHA-256)
- **Per-byte fees**: Different transaction types have different USD costs per byte
- **Per-key fees**: Fixed USD costs for different key types (Ed25519, Ed448)
- **Per-hash fees**: Fixed USD costs for hash operations
- **Iterative convergence**: Repeatedly calculates size → fee → size until convergence
- **ACE exchange rate integration**: Converts USD fees to target currency

### 3. Fee Calculator (`fee-calculator.js`) - LEGACY IMPLEMENTATION

This module uses manual size calculation instead of actual protobuf object size:

- **USD-based fee constants**: Matches networkfees package exactly
- **Manual size calculation**: Estimates size using component-based calculations
- **Less accurate**: May not match actual protobuf serialization exactly
- **Iterative convergence**: Repeatedly calculates size → fee → size until convergence
- **ACE exchange rate integration**: Converts USD fees to target currency

### 4. Universal Fee Calculator (`universal-fee-calculator.js`) - CORRECT IMPLEMENTATION

This module now uses the **proper USD-based, size-dependent calculation**:

- **USD-based fee constants**: Matches networkfees package exactly
- **Actual protobuf object size**: Uses `protoObject.toBinary().length` for accurate size
- **Known signature sizes**: Adds signature sizes based on key types (Ed25519: 64 bytes, Ed448: 114 bytes)
- **Known hash size**: Adds transaction hash size (32 bytes for SHA-256)
- **Per-byte fees**: Different transaction types have different USD costs per byte
- **Per-key fees**: Fixed USD costs for different key types (Ed25519, Ed448)
- **Per-hash fees**: Fixed USD costs for hash operations
- **Contract fee support**: Handles both network fees and contract-specific fees
- **ACE exchange rate integration**: Converts USD fees to target currency
- **Iterative CoinTXN calculation**: Includes `calculateCoinTXNFee` method for backward compatibility

### 5. Enhanced Transaction Creation (`transaction-enhanced.js`)

This module integrates the solution into the transaction creation flow:

- **Automatic fee calculation**: Option to automatically calculate fees based on size
- **Manual override**: Still allows manual fee specification if needed
- **Detailed fee information**: Returns comprehensive fee calculation details
- **Backward compatibility**: Maintains compatibility with existing code

## How It Works

### Step 1: Calculate Initial Size (Without Fees)
```javascript
const sizeWithoutFees = calculateCoinTXNSize({
  inputs,
  outputs,
  contractId,
  baseFeeId
});
```

### Step 2: Calculate Initial Fee Based on Size
```javascript
const initialFee = UniversalFeeCalculator.calculateSizeBasedFee({
  transactionSize: sizeWithoutFees,
  transactionType: TRANSACTION_TYPE.COIN_TYPE,
  inputs,
  outputs,
  baseFeeId
});
```

### Step 3: Iterative Refinement
```javascript
// Repeat until convergence:
// 1. Calculate fee based on current size
// 2. Calculate size including the fee
// 3. Check if size difference is within tolerance
// 4. If not, repeat with new size
```

### Step 4: Final Result
The process converges to a stable fee and size where:
- The fee accurately reflects the final transaction size
- The size includes the fee amount
- Both values are consistent with each other

## Usage Examples

### Basic Usage with Automatic Fee Calculation
```javascript
import { createCoinTXNWithAutoFee } from './transaction-enhanced.js';

const result = await createCoinTXNWithAutoFee(inputs, outputs, contractId, {
  autoCalculateFee: true,
  baseFeeId: '$ZRA+0000'
});

console.log('Transaction:', result.transaction);
console.log('Fee:', result.feeInfo.baseFee);
console.log('Size:', result.feeInfo.calculationInfo.size);
```

### Manual Fee Calculation
```javascript
import { UniversalFeeCalculator } from '../shared/fee-calculators/universal-fee-calculator.js';

const feeResult = await UniversalFeeCalculator.calculateCoinTXNFee({
  inputs,
  outputs,
  contractId,
  baseFeeId: '$ZRA+0000',
  transactionType: TRANSACTION_TYPE.COIN_TYPE
});

console.log('Fee:', feeResult.fee);
console.log('Size:', feeResult.size);
console.log('Iterations:', feeResult.iterations);
console.log('Converged:', feeResult.converged);
```

### Size-Only Calculation
```javascript
import { calculateCoinTXNSize } from '../shared/utils/transaction-size-calculator.js';

const size = calculateCoinTXNSize({
  inputs,
  outputs,
  contractId,
  baseFeeId
});

console.log('Transaction size:', size, 'bytes');
```

## Configuration

### Fee Calculation Constants
```javascript
const FEE_CALCULATION_CONSTANTS = {
  // Multiplier for restricted keys
  RESTRICTED_KEY_FEE: 3.0,          // 3x multiplier on key/hash fees
  
  // Key fees (Fixed Cost in USD)
  A_KEY_FEE: 0.02,                  // 2 cents
  B_KEY_FEE: 0.05,                  // 5 cents
  
  // Hash fees (Fixed Cost in USD)
  a_HASH_FEE: 0.02,                 // 2 cents
  b_HASH_FEE: 0.05,                 // 5 cents
  c_HASH_FEE: 0.01,                 // 1 cent
  d_hash_fee: 0.50,                 // 50 cents
  e_hash_fee: 1.00,                 // $1.00
  f_hash_fee: 2.00,                 // $2.00
  g_hash_fee: 4.00,                 // $4.00
  dbz_hash_fee: 9.01,               // $9.01
  h_hash_fee: 2.00,                 // $2.00
  i_hash_fee: 4.00,                 // $4.00
  j_hash_fee: 8.00,                 // $8.00
  
  // Transaction type fees (Cost Per Byte in USD)
  COIN_TXN_FEE: 0.00015,                    // 0.015 cents per byte
  MINT_TXN_FEE: 0.001,                      // 0.1 cents per byte
  CONTRACT_TXN_FEE: 0.075,                  // 7.5 cents per byte
  SMART_CONTRACT_TYPE: 0.0004,              // 0.04 cents per byte
  
  // Minimum and maximum fees (in USD)
  MINIMUM_FEE_USD: 0.000001,                // 0.0001 cents minimum
  MAXIMUM_FEE_USD: 1.00,                    // $1.00 maximum
};
```

### Iteration Parameters
```javascript
const result = await FeeCalculator.calculateCoinTXNFee({
  inputs,
  outputs,
  contractId,
  baseFeeId: '$ZRA+0000',
  maxIterations: 10,    // Maximum iterations
  tolerance: 1          // Tolerance in bytes for convergence
});
```

## Benefits

### 1. **Solves the Catch-22**
- No more circular dependency between fee and size
- Automatic convergence to accurate fee calculation

### 2. **Accurate Fee Calculation**
- Fees reflect actual transaction size
- Different key types and transaction types have appropriate costs
- Protobuf overhead is properly accounted for

### 3. **Flexible Configuration**
- Configurable cost parameters
- Support for different transaction types
- Adjustable iteration parameters

### 4. **Backward Compatibility**
- Existing code continues to work
- Optional automatic fee calculation
- Manual fee override still available

### 5. **Comprehensive Information**
- Detailed fee breakdown
- Size calculation details
- Convergence information
- Iteration count

## Testing

The fee calculation system is thoroughly tested in `src/coin-txn/tests/test-fee-system.js`, which includes:

- **Main FeeCalculator tests**: Go-style fee calculation with USD-based constants
- **UniversalFeeCalculator tests**: ZERA-based fee calculation  
- **Transaction size calculator tests**: Size calculation without fees
- **ACE exchange rate service tests**: Currency conversion functionality
- **Catch-22 solution tests**: Iterative fee calculation validation
- **Edge cases and error handling**: Comprehensive error scenarios

Run the tests with:
```bash
node src/coin-txn/tests/test-fee-system.js
```

```javascript
import { feeSystemTests } from './test-fee-system.js';

// Run all tests
const result = await feeSystemTests.runAll();

// Run individual tests
await feeSystemTests.mainCalculator();
await feeSystemTests.catch22Solution();
await feeSystemTests.sizeCalculator();
```

## Files Created

1. **`src/shared/utils/transaction-size-calculator.js`** - Calculates transaction sizes without fees
2. **`src/shared/fee-calculators/universal-fee-calculator.js`** - Correct fee calculation with USD-based, size-dependent calculation (CORRECT IMPLEMENTATION)
3. **`src/shared/fee-calculators/ace-exchange-rate-service.js`** - ACE exchange rate service for currency conversion
4. **`src/coin-txn/transaction-enhanced.js`** - Enhanced transaction creation with auto-fee
5. **`src/coin-txn/tests/test-fee-system.js`** - Comprehensive test suite

**Note**: `proper-fee-calculator.js` and `fee-calculator.js` were removed as they were redundant - their functionality is now integrated into `universal-fee-calculator.js`.

**Organization**: The shared folder is now organized into subdirectories:
- **`fee-calculators/`** - Fee calculation related modules
- **`crypto/`** - Cryptographic utilities (signatures, addresses)
- **`utils/`** - General utility modules (amount handling, transaction utilities, etc.)

## Integration

To integrate this into your existing codebase:

1. **Replace manual fee calculation** with automatic calculation:
   ```javascript
   // Old way
   const feeConfig = { baseFee: '0.001' };
   
   // New way
   const feeConfig = { autoCalculateFee: true };
   ```

2. **Use the enhanced transaction creation**:
   ```javascript
   // Old way
   const transaction = await createCoinTXN(inputs, outputs, contractId, feeConfig);
   
   // New way
   const result = await createCoinTXNWithAutoFee(inputs, outputs, contractId, feeConfig);
   const transaction = result.transaction;
   ```

3. **Access fee information**:
   ```javascript
   console.log('Fee:', result.feeInfo.baseFee);
   console.log('Size:', result.feeInfo.calculationInfo.size);
   console.log('Converged:', result.feeInfo.calculationInfo.converged);
   ```

This solution provides a robust, accurate, and flexible way to calculate transaction fees that properly accounts for the circular dependency between fee and transaction size.
