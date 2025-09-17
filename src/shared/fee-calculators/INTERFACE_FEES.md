# Interface Fee Support in Universal Fee Calculator

## Overview

The Universal Fee Calculator now supports **interface fees**, which can be applied to any transaction type. Interface fees are designed for third-party services, APIs, or interface providers that need to charge fees for their services.

## Key Behavior Changes

### Null by Default
- **Interface fees are null by default** - no interface fees are calculated unless explicitly requested
- **Only `interfaceFeeId` triggers interface fee calculation** - if this parameter is not provided, interface fees remain null
- **When `interfaceFeeId` is specified**: `interfaceFeeAmount` must be > 0 and `interfaceAddress` must not be null

### Amount Conversion
- **Human-readable amounts are converted to smallest units** (like other fee calculations)
- **Example**: `interfaceFeeAmount: '1.234'` with `interfaceFeeId: '$ZRA+0000'` converts to smallest units
- **Both original and converted amounts** are provided in the breakdown for transparency

## Interface Fee Fields in Protobuf

Interface fees are defined in the protobuf schema in two locations:

### BaseTXN Message (lines 293-295)
```protobuf
message BaseTXN {
    // ... other fields ...
    optional string interface_fee = 11;
    optional string interface_fee_id = 12;
    optional bytes interface_address = 13;
}
```

### TXNStatusFees Message (lines 640-641)
```protobuf
message TXNStatusFees {
    // ... other fields ...
    optional string interface_fee = 15;
    optional string interface_fee_id = 16;
}
```

## Key Features

### 1. Universal Application
- Interface fees can be applied to **any transaction type**
- Not limited to CoinTXN transactions like contract fees
- Can be used for NFT transactions, smart contracts, governance, etc.

### 2. Flexible Fee Structure
- **Fixed amount fees**: Specify exact fee amount
- **Multiple currencies**: Pay interface fees in any supported contract ID
- **Provider addressing**: Optional interface provider address for fee routing

### 3. Integration with Existing Fee System
- Interface fees are calculated alongside network and contract fees
- Total fee calculation includes all three fee types
- Proper Decimal arithmetic for exact calculations

## API Reference

### `calculateInterfaceFee(params)`

Calculates interface-specific fees using Decimal arithmetic.

**Parameters:**
- `interfaceFeeAmount` (string|number|Decimal): Fee amount
- `interfaceFeeId` (string): Contract ID to pay the fee in (default: '$ZRA+0000')
- `interfaceAddress` (string, optional): Interface provider address

**Returns:**
```javascript
{
  fee: "0.001",                    // Fee amount as string
  feeDecimal: Decimal,             // Fee amount as Decimal
  interfaceFeeId: "$ZRA+0000",     // Fee contract ID
  interfaceAddress: "provider_addr", // Provider address
  breakdown: { ... }               // Detailed breakdown
}
```

### `calculateFee(params)` (Updated)

The main fee calculation method now supports interface fees.

**New Parameters:**
- `interfaceFeeAmount` (string|number|Decimal, optional): Interface fee amount
- `interfaceFeeId` (string, optional): Interface fee contract ID
- `interfaceAddress` (string, optional): Interface provider address

**Updated Returns:**
```javascript
{
  protoObject: modifiedProtoObject, // Proto object with all fees added
  totalFee: "0.006",               // Total of all fees
  networkFee: "0.001",             // Network fee
  contractFee: "0.002",            // Contract fee
  interfaceFee: "0.003",            // Interface fee
  interfaceFeeId: "$ZRA+0000",     // Interface fee contract ID
  interfaceAddress: "provider_addr", // Interface provider address
  breakdown: {
    network: { ... },
    contract: { ... },
    interface: { ... },
    total: "0.006"
  }
}
```

### `calculateTotalFees(params)` (Updated)

Calculates total fees including interface fees.

**New Parameters:**
- `interfaceFeeAmount` (string|number|Decimal, optional): Interface fee amount
- `interfaceFeeId` (string, optional): Interface fee contract ID
- `interfaceAddress` (string, optional): Interface provider address

## Usage Examples

### Default Behavior (No Interface Fees)

```javascript
import { UniversalFeeCalculator } from './universal-fee-calculator.js';

// Calculate fees WITHOUT interfaceFeeId - interface fees will be null
const feeResult = await UniversalFeeCalculator.calculateFee({
  protoObject: transactionProtoObject,
  baseFeeId: '$ZRA+0000'
  // No interfaceFeeId specified - interface fees remain null
});

console.log('Interface Fee:', feeResult.interfaceFee); // '0'
console.log('Interface Fee ID:', feeResult.interfaceFeeId); // null
console.log('Interface Address:', feeResult.interfaceAddress); // null
console.log('Breakdown Interface:', feeResult.breakdown.interface); // null
```

### Basic Interface Fee Calculation

```javascript
// Calculate interface fee for API service
// Note: interfaceFeeId triggers the calculation, all parameters are required
const interfaceFee = UniversalFeeCalculator.calculateInterfaceFee({
  interfaceFeeAmount: '1.234', // Human-readable amount (1.234 ZRA)
  interfaceFeeId: '$ZRA+0000', // This triggers interface fee calculation
  interfaceAddress: 'api_service_provider_address' // Required when interfaceFeeId is specified
});

console.log('Interface Fee (smallest units):', interfaceFee.fee);
console.log('Original Amount:', interfaceFee.breakdown.interfaceFeeAmount);
console.log('Converted Amount:', interfaceFee.breakdown.interfaceFeeAmountInSmallestUnits);
console.log('Fee Contract ID:', interfaceFee.interfaceFeeId);
```

### Complete Fee Calculation with Interface Fees

```javascript
// Calculate all fees including interface fee
// Note: interfaceFeeId triggers interface fee calculation
const feeResult = await UniversalFeeCalculator.calculateFee({
  protoObject: transactionProtoObject,
  baseFeeId: '$ZRA+0000',
  contractFeeId: '$BTC+1234',
  transactionAmount: '1.0',
  interfaceFeeAmount: '0.005',     // Interface fee for API service (human-readable)
  interfaceFeeId: '$ZRA+0000',     // This triggers interface fee calculation
  interfaceAddress: 'api_service_provider_address' // Required when interfaceFeeId is specified
});

console.log('Total Fee:', feeResult.totalFee);
console.log('Interface Fee:', feeResult.interfaceFee);
console.log('Interface Address:', feeResult.interfaceAddress);
```

### Interface Fees for Different Transaction Types

```javascript
// Interface fees work with any transaction type
const nftTransactionWithInterfaceFee = await UniversalFeeCalculator.calculateFee({
  protoObject: nftProtoObject,
  baseFeeId: '$ZRA+0000',
  interfaceFeeAmount: '0.002',    // Fee for NFT marketplace service
  interfaceFeeId: '$ZRA+0000',
  interfaceAddress: 'nft_marketplace_provider'
});

const smartContractWithInterfaceFee = await UniversalFeeCalculator.calculateFee({
  protoObject: smartContractProtoObject,
  baseFeeId: '$ZRA+0000',
  interfaceFeeAmount: '0.010',    // Fee for smart contract deployment service
  interfaceFeeId: '$ZRA+0000',
  interfaceAddress: 'deployment_service_provider'
});
```

## Use Cases

### 1. API Service Fees
```javascript
// Fee for using a third-party API service
const apiFee = UniversalFeeCalculator.calculateInterfaceFee({
  interfaceFeeAmount: '0.001',
  interfaceFeeId: '$ZRA+0000',
  interfaceAddress: 'api_service_provider_address'
});
```

### 2. Marketplace Fees
```javascript
// Fee for NFT marketplace listing
const marketplaceFee = UniversalFeeCalculator.calculateInterfaceFee({
  interfaceFeeAmount: '0.005',
  interfaceFeeId: '$ZRA+0000',
  interfaceAddress: 'nft_marketplace_address'
});
```

### 3. Smart Contract Deployment Services
```javascript
// Fee for smart contract deployment service
const deploymentFee = UniversalFeeCalculator.calculateInterfaceFee({
  interfaceFeeAmount: '0.010',
  interfaceFeeId: '$ZRA+0000',
  interfaceAddress: 'deployment_service_address'
});
```

### 4. Governance Interface Fees
```javascript
// Fee for governance proposal submission service
const governanceFee = UniversalFeeCalculator.calculateInterfaceFee({
  interfaceFeeAmount: '0.002',
  interfaceFeeId: '$ZRA+0000',
  interfaceAddress: 'governance_service_address'
});
```

## Implementation Details

### Fee Calculation Order
1. **Contract Fees** (if applicable for CoinTXN)
2. **Interface Fees** (if provided)
3. **Network Fees** (calculated last, includes size impact of other fees)

### Protobuf Object Modification
Interface fees are automatically added to the protobuf object:
- `base.interfaceFee`: Fee amount
- `base.interfaceFeeId`: Fee contract ID
- `base.interfaceAddress`: Provider address (if provided)

### Error Handling
- Invalid fee amounts are handled gracefully
- Missing parameters use sensible defaults
- Comprehensive error messages for debugging

## Migration Guide

### From Previous Version
If you were using the previous version without interface fees:

```javascript
// Old way (still works)
const feeResult = await UniversalFeeCalculator.calculateFee({
  protoObject: transactionProtoObject,
  baseFeeId: '$ZRA+0000',
  contractFeeId: '$BTC+1234',
  transactionAmount: '1.0'
});

// New way with interface fees
const feeResult = await UniversalFeeCalculator.calculateFee({
  protoObject: transactionProtoObject,
  baseFeeId: '$ZRA+0000',
  contractFeeId: '$BTC+1234',
  transactionAmount: '1.0',
  interfaceFeeAmount: '0.005',     // New: Interface fee
  interfaceFeeId: '$ZRA+0000',     // New: Interface fee contract ID
  interfaceAddress: 'provider_addr' // New: Interface provider address
});
```

## Best Practices

1. **Use appropriate fee amounts**: Consider the value of the service provided
2. **Specify interface addresses**: Helps with fee routing and transparency
3. **Validate fee contract IDs**: Ensure the contract ID is valid and supported
4. **Handle errors gracefully**: Always wrap fee calculations in try-catch blocks
5. **Test with different transaction types**: Interface fees work with all transaction types

## Testing

Run the interface fee examples:

```bash
node src/shared/fee-calculators/examples/interface-fee-example.js
```

This will demonstrate all the interface fee functionality with various transaction types and scenarios.
